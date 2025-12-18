-- STROKE CARE Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS atira_db;
USE atira_db;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

-- Materials table
CREATE TABLE materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url VARCHAR(500),
  description TEXT,
  type ENUM('article', 'video', 'podcast') NOT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(100) NOT NULL,
  sender_id INT NULL, -- NULL for anonymous users
  sender_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat rooms table (optional, for better room management)
CREATE TABLE chat_rooms (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (name, email, password, role) VALUES 
('Admin STROKE CARE', 'admin@atira.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Password: password

-- Insert sample materials
INSERT INTO materials (title, content, description, type, status, author_id) VALUES
('Mengenal Kesehatan Mental', '<p>Kesehatan mental adalah bagian penting dari kesehatan secara keseluruhan. Artikel ini membahas dasar-dasar kesehatan mental dan pentingnya menjaga kesejahteraan psikologis.</p>', 'Panduan dasar tentang kesehatan mental', 'article', 'published', 1),
('Tips Mengatasi Stress', '<p>Stress adalah bagian normal dari kehidupan, namun jika tidak dikelola dengan baik dapat berdampak negatif. Berikut adalah beberapa tips untuk mengatasi stress.</p>', 'Cara praktis mengelola stress sehari-hari', 'article', 'published', 1),
('Meditasi untuk Pemula', 'https://www.youtube.com/embed/ZToicYcHIOU', 'Video pembelajaran meditasi dasar untuk pemula', 'video', 'published', 1),
('Podcast: Berbicara tentang Anxiety', 'https://www.youtube.com/embed/jPpUNAFHgxM', 'Diskusi mendalam tentang anxiety dan cara mengatasinya', 'podcast', 'published', 1);

-- Insert default chat room
INSERT INTO chat_rooms (id, name) VALUES ('general', 'General Chat');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_materials_author ON materials(author_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);

-- Views for common queries
CREATE VIEW published_materials AS
SELECT m.*, u.name as author_name 
FROM materials m 
JOIN users u ON m.author_id = u.id 
WHERE m.status = 'published';

CREATE VIEW recent_chat_activity AS
SELECT room_id, 
       COUNT(*) as message_count,
       MAX(created_at) as last_message,
       COUNT(DISTINCT sender_id) as unique_participants
FROM chat_messages 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY room_id;

-- Stored procedures for common operations
DELIMITER //

-- Procedure to get user statistics
CREATE PROCEDURE GetUserStats()
BEGIN
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users
  FROM users;
END //

-- Procedure to get material statistics
CREATE PROCEDURE GetMaterialStats()
BEGIN
  SELECT 
    type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
  FROM materials 
  GROUP BY type;
END //

DELIMITER ;

-- Triggers for audit logging (optional)
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  record_id INT NOT NULL,
  user_id INT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sample trigger for materials table
DELIMITER //

CREATE TRIGGER materials_audit_insert
AFTER INSERT ON materials
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, operation, record_id, new_values)
  VALUES ('materials', 'INSERT', NEW.id, JSON_OBJECT(
    'title', NEW.title,
    'type', NEW.type,
    'status', NEW.status,
    'author_id', NEW.author_id
  ));
END //

CREATE TRIGGER materials_audit_update
AFTER UPDATE ON materials
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
  VALUES ('materials', 'UPDATE', NEW.id, 
    JSON_OBJECT(
      'title', OLD.title,
      'type', OLD.type,
      'status', OLD.status
    ),
    JSON_OBJECT(
      'title', NEW.title,
      'type', NEW.type,
      'status', NEW.status
    )
  );
END //

DELIMITER ;