-- Create screenings table for stroke risk screening
CREATE TABLE IF NOT EXISTS screenings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  answers JSON NOT NULL,
  score INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  risk_level ENUM('low', 'medium', 'high') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_risk_level (risk_level)
);










