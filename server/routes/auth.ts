import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, role, fullName, phone } = req.body;

  // 'admin' is excluded from self-registration; admin accounts are created via seeding only
  const validRoles = ['patient', 'doctor', 'lab', 'pharmacy', 'hospital'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role]
    );
    const user = result.rows[0];

    // Create role-specific profile
    if (role === 'patient') {
      await pool.query(
        'INSERT INTO patient_profiles (user_id, full_name, phone) VALUES ($1, $2, $3)',
        [user.id, fullName, phone || null]
      );
    } else if (role === 'doctor') {
      await pool.query(
        'INSERT INTO doctor_profiles (user_id, full_name, phone) VALUES ($1, $2, $3)',
        [user.id, fullName, phone || null]
      );
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Fetch profile name
    let fullName = email;
    if (user.role === 'patient') {
      const p = await pool.query('SELECT full_name FROM patient_profiles WHERE user_id = $1', [user.id]);
      if (p.rows.length) fullName = p.rows[0].full_name;
    } else if (user.role === 'doctor') {
      const p = await pool.query('SELECT full_name FROM doctor_profiles WHERE user_id = $1', [user.id]);
      if (p.rows.length) fullName = p.rows[0].full_name;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [req.user!.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    let fullName = user.email;
    let profileId = null;
    if (user.role === 'patient') {
      const p = await pool.query('SELECT id, full_name FROM patient_profiles WHERE user_id = $1', [user.id]);
      if (p.rows.length) { fullName = p.rows[0].full_name; profileId = p.rows[0].id; }
    } else if (user.role === 'doctor') {
      const p = await pool.query('SELECT id, full_name FROM doctor_profiles WHERE user_id = $1', [user.id]);
      if (p.rows.length) { fullName = p.rows[0].full_name; profileId = p.rows[0].id; }
    }

    res.json({ ...user, fullName, profileId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
