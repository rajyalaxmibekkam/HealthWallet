import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get own patient profile
router.get('/profile', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patient_profiles WHERE user_id = $1',
      [req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update own patient profile
router.put('/profile', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  const { fullName, dateOfBirth, gender, bloodGroup, abhaId, phone, address,
    emergencyContactName, emergencyContactPhone, allergies, chronicConditions } = req.body;
  try {
    const result = await pool.query(
      `UPDATE patient_profiles SET
        full_name = COALESCE($1, full_name),
        date_of_birth = COALESCE($2, date_of_birth),
        gender = COALESCE($3, gender),
        blood_group = COALESCE($4, blood_group),
        abha_id = COALESCE($5, abha_id),
        phone = COALESCE($6, phone),
        address = COALESCE($7, address),
        emergency_contact_name = COALESCE($8, emergency_contact_name),
        emergency_contact_phone = COALESCE($9, emergency_contact_phone),
        allergies = COALESCE($10, allergies),
        chronic_conditions = COALESCE($11, chronic_conditions)
      WHERE user_id = $12
      RETURNING *`,
      [fullName, dateOfBirth, gender, bloodGroup, abhaId, phone, address,
        emergencyContactName, emergencyContactPhone, allergies, chronicConditions,
        req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get own appointments
router.get('/appointments', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, dp.full_name as doctor_name, dp.specialization
       FROM appointments a
       JOIN patient_profiles pp ON a.patient_id = pp.id
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       WHERE pp.user_id = $1
       ORDER BY a.appointment_date DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get own medical records
router.get('/records', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, dp.full_name as doctor_name, dp.specialization
       FROM medical_records mr
       JOIN patient_profiles pp ON mr.patient_id = pp.id
       JOIN doctor_profiles dp ON mr.doctor_id = dp.id
       WHERE pp.user_id = $1
       ORDER BY mr.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Get own prescriptions
router.get('/prescriptions', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*, dp.full_name as doctor_name
       FROM prescriptions p
       JOIN patient_profiles pp ON p.patient_id = pp.id
       JOIN doctor_profiles dp ON p.doctor_id = dp.id
       WHERE pp.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get own vitals
router.get('/vitals', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT hv.* FROM health_vitals hv
       JOIN patient_profiles pp ON hv.patient_id = pp.id
       WHERE pp.user_id = $1
       ORDER BY hv.recorded_at DESC LIMIT 30`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

// Add vitals
router.post('/vitals', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  const { bpSystolic, bpDiastolic, heartRate, temperature, weight, height, bloodSugar, notes } = req.body;
  try {
    const pp = await pool.query('SELECT id FROM patient_profiles WHERE user_id = $1', [req.user!.id]);
    if (!pp.rows.length) return res.status(404).json({ error: 'Patient profile not found' });
    const result = await pool.query(
      `INSERT INTO health_vitals (patient_id, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature, weight, height, blood_sugar, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [pp.rows[0].id, bpSystolic, bpDiastolic, heartRate, temperature, weight, height, bloodSugar, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add vitals' });
  }
});

export default router;
