import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import doctorRoutes from './routes/doctors';
import appointmentRoutes from './routes/appointments';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'lab', 'pharmacy', 'hospital', 'admin')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      date_of_birth DATE,
      gender VARCHAR(20),
      blood_group VARCHAR(10),
      abha_id VARCHAR(50) UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      allergies TEXT,
      chronic_conditions TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS doctor_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      specialization VARCHAR(255),
      license_number VARCHAR(100),
      hospital_name VARCHAR(255),
      phone VARCHAR(20),
      experience_years INTEGER,
      consultation_fee DECIMAL(10,2),
      available_days VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patient_profiles(id),
      doctor_id INTEGER REFERENCES doctor_profiles(id),
      appointment_date TIMESTAMP NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      type VARCHAR(50) DEFAULT 'in-person',
      status VARCHAR(50) DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patient_profiles(id),
      doctor_id INTEGER REFERENCES doctor_profiles(id),
      appointment_id INTEGER REFERENCES appointments(id),
      diagnosis TEXT,
      symptoms TEXT,
      treatment TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY,
      medical_record_id INTEGER REFERENCES medical_records(id),
      patient_id INTEGER REFERENCES patient_profiles(id),
      doctor_id INTEGER REFERENCES doctor_profiles(id),
      medicines JSONB NOT NULL DEFAULT '[]',
      instructions TEXT,
      valid_until DATE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS health_vitals (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patient_profiles(id),
      recorded_at TIMESTAMP DEFAULT NOW(),
      blood_pressure_systolic INTEGER,
      blood_pressure_diastolic INTEGER,
      heart_rate INTEGER,
      temperature DECIMAL(4,1),
      weight DECIMAL(5,2),
      height DECIMAL(5,2),
      blood_sugar DECIMAL(6,2),
      notes TEXT
    );
  `);
  console.log('✅ Database schema initialized');
}

initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏥 HealthWallet API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
