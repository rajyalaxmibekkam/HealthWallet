import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all doctors (for booking)
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT dp.id, dp.full_name, dp.specialization, dp.hospital_name,
              dp.experience_years, dp.consultation_fee, dp.available_days
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE u.is_active = true
       ORDER BY dp.full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get own doctor profile
router.get('/profile', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM doctor_profiles WHERE user_id = $1',
      [req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update own doctor profile
router.put('/profile', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  const { fullName, specialization, licenseNumber, hospitalName, phone,
    experienceYears, consultationFee, availableDays } = req.body;
  try {
    const result = await pool.query(
      `UPDATE doctor_profiles SET
        full_name = COALESCE($1, full_name),
        specialization = COALESCE($2, specialization),
        license_number = COALESCE($3, license_number),
        hospital_name = COALESCE($4, hospital_name),
        phone = COALESCE($5, phone),
        experience_years = COALESCE($6, experience_years),
        consultation_fee = COALESCE($7, consultation_fee),
        available_days = COALESCE($8, available_days)
      WHERE user_id = $9 RETURNING *`,
      [fullName, specialization, licenseNumber, hospitalName, phone,
        experienceYears, consultationFee, availableDays, req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get doctor's appointments
router.get('/appointments', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, pp.full_name as patient_name, pp.blood_group, pp.date_of_birth
       FROM appointments a
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN patient_profiles pp ON a.patient_id = pp.id
       WHERE dp.user_id = $1
       ORDER BY a.appointment_date DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
router.patch('/appointments/:id', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = $1
       WHERE id = $2
       AND doctor_id = (SELECT id FROM doctor_profiles WHERE user_id = $3)
       RETURNING *`,
      [status, req.params.id, req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Get doctor's patients
router.get('/patients', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT pp.id, pp.full_name, pp.date_of_birth, pp.gender, pp.blood_group,
              pp.phone, pp.chronic_conditions, pp.allergies,
              MAX(a.appointment_date) as last_visit
       FROM appointments a
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN patient_profiles pp ON a.patient_id = pp.id
       WHERE dp.user_id = $1
       GROUP BY pp.id, pp.full_name, pp.date_of_birth, pp.gender, pp.blood_group,
                pp.phone, pp.chronic_conditions, pp.allergies
       ORDER BY last_visit DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Add medical record
router.post('/records', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  const { patientId, appointmentId, diagnosis, symptoms, treatment, notes } = req.body;
  try {
    const dp = await pool.query('SELECT id FROM doctor_profiles WHERE user_id = $1', [req.user!.id]);
    if (!dp.rows.length) return res.status(404).json({ error: 'Doctor profile not found' });
    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patientId, dp.rows[0].id, appointmentId || null, diagnosis, symptoms, treatment, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Add prescription
router.post('/prescriptions', authenticate, authorize('doctor'), async (req: AuthRequest, res: Response) => {
  const { patientId, medicalRecordId, medicines, instructions, validUntil } = req.body;
  try {
    const dp = await pool.query('SELECT id FROM doctor_profiles WHERE user_id = $1', [req.user!.id]);
    if (!dp.rows.length) return res.status(404).json({ error: 'Doctor profile not found' });
    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, medical_record_id, medicines, instructions, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patientId, dp.rows[0].id, medicalRecordId || null, JSON.stringify(medicines || []), instructions, validUntil || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

export default router;
