-- Create health_notes table for daily health monitoring
CREATE TABLE IF NOT EXISTS health_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  note_date DATE NOT NULL,
  
  -- Blood Sugar (Gula Darah Sewaktu)
  blood_sugar DECIMAL(5,1) NULL COMMENT 'Blood sugar level in mg/dL',
  blood_sugar_status ENUM('low', 'normal', 'high') NULL,
  
  -- Cholesterol (Kolesterol Total)
  cholesterol DECIMAL(5,1) NULL COMMENT 'Total cholesterol in mg/dL',
  cholesterol_status ENUM('low', 'normal', 'high') NULL,
  
  -- Blood Pressure (Tekanan Darah)
  blood_pressure_systolic INT NULL COMMENT 'Systolic pressure in mmHg',
  blood_pressure_diastolic INT NULL COMMENT 'Diastolic pressure in mmHg',
  blood_pressure_status ENUM('low', 'normal', 'high') NULL,
  
  -- Additional notes
  notes TEXT NULL COMMENT 'Additional notes or symptoms',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_note_date (note_date),
  INDEX idx_created_at (created_at),
  
  -- Ensure one entry per user per date
  UNIQUE KEY unique_user_date (user_id, note_date)
);










