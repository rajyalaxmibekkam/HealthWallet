import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/users', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active, u.created_at,
              COALESCE(pp.full_name, dp.full_name) as full_name
       FROM users u
       LEFT JOIN patient_profiles pp ON u.id = pp.user_id AND u.role = 'patient'
       LEFT JOIN doctor_profiles dp ON u.id = dp.user_id AND u.role = 'doctor'
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// Get stats
router.get('/stats', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const [users, appointments, records, prescriptions] = await Promise.all([
      pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      pool.query('SELECT status, COUNT(*) as count FROM appointments GROUP BY status'),
      pool.query('SELECT COUNT(*) as count FROM medical_records'),
      pool.query('SELECT COUNT(*) as count FROM prescriptions'),
    ]);

    res.json({
      users: users.rows,
      appointments: appointments.rows,
      totalRecords: records.rows[0]?.count || 0,
      totalPrescriptions: prescriptions.rows[0]?.count || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
