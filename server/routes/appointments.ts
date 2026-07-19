import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Book an appointment (patient)
router.post('/', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  const { doctorId, appointmentDate, type, notes } = req.body;
  if (!doctorId || !appointmentDate) {
    return res.status(400).json({ error: 'Doctor and appointment date are required' });
  }
  try {
    const pp = await pool.query('SELECT id FROM patient_profiles WHERE user_id = $1', [req.user!.id]);
    if (!pp.rows.length) return res.status(404).json({ error: 'Patient profile not found' });

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, type, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [pp.rows[0].id, doctorId, appointmentDate, type || 'in-person', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Cancel appointment (patient)
router.patch('/:id/cancel', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled'
       WHERE id = $1
       AND patient_id = (SELECT id FROM patient_profiles WHERE user_id = $2)
       AND status = 'scheduled'
       RETURNING *`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found or cannot be cancelled' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;
