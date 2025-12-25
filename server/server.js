const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: '/api/atira/socket.io',
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atira_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Dashboard Routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [materialCount] = await pool.execute('SELECT COUNT(*) as count FROM materials');
    const [chatCount] = await pool.execute('SELECT COUNT(*) as count FROM chat_messages');
    
    res.json({
      totalUsers: userCount[0].count,
      totalMaterials: materialCount[0].count,
      totalChats: chatCount[0].count,
      onlineUsers: connectedUsers.size
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

app.get('/api/dashboard/activities', authenticateToken, async (req, res) => {
  try {
    const [activities] = await pool.execute(`
      SELECT 'User registered' as description, created_at FROM users 
      UNION ALL 
      SELECT CONCAT('Material "', title, '" created') as description, created_at FROM materials
      UNION ALL
      SELECT 'Chat message sent' as description, created_at FROM chat_messages
      ORDER BY created_at DESC LIMIT 10
    `);
    
    res.json(activities);
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// Materials Routes
app.get('/api/materials', authenticateToken, async (req, res) => {
  try {
    const [materials] = await pool.execute(`
      SELECT m.*, u.name as author_name 
      FROM materials m 
      JOIN users u ON m.author_id = u.id 
      ORDER BY m.sort_order ASC, m.created_at DESC
    `);
    res.json(materials);
  } catch (error) {
    console.error('Fetch materials error:', error);
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
});

app.post('/api/materials', authenticateToken, async (req, res) => {
  try {
    const { title, content, video_url, description, type, status = 'draft', sort_order } = req.body;
    
    // Get max sort_order if not provided
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const [maxResult] = await pool.execute(
        'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM materials'
      );
      finalSortOrder = (maxResult[0].max_order || 0) + 1;
    }
    
    const [result] = await pool.execute(
      'INSERT INTO materials (title, content, video_url, description, type, status, author_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, video_url, description, type, status, req.user.id, finalSortOrder]
    );

    res.status(201).json({ 
      message: 'Material created successfully',
      materialId: result.insertId 
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ message: 'Failed to create material' });
  }
});

app.put('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, video_url, description, type, status, sort_order } = req.body;

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (video_url !== undefined) {
      updateFields.push('video_url = ?');
      updateValues.push(video_url);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sort_order);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await pool.execute(
      `UPDATE materials SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Material updated successfully' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Failed to update material' });
  }
});

// Update materials order (bulk update)
app.put('/api/materials/order', authenticateToken, async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, sort_order }

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'Invalid orders data' });
    }

    // Update all materials in a transaction
    await pool.execute('START TRANSACTION');
    
    try {
      for (const { id, sort_order } of orders) {
        await pool.execute(
          'UPDATE materials SET sort_order = ? WHERE id = ?',
          [sort_order, id]
        );
      }
      
      await pool.execute('COMMIT');
      res.json({ message: 'Materials order updated successfully' });
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update materials order error:', error);
    res.status(500).json({ message: 'Failed to update materials order' });
  }
});

app.delete('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM materials WHERE id = ?', [id]);

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ message: 'Failed to delete material' });
  }
});

// Users Routes (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    let query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
    let params = [name, email, role, id];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?';
      params = [name, email, hashedPassword, role, id];
    }

    await pool.execute(query, params);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Chat History Routes (Admin only)
app.get('/api/chat-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rooms] = await pool.execute(`
      SELECT 
        room_id as id,
        MIN(sender_name) as user_name,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at,
        MIN(created_at) as first_message_at
      FROM chat_messages 
      WHERE room_id != 'admin' AND room_id LIKE 'user_%'
      GROUP BY room_id 
      ORDER BY last_message_at DESC
    `);
    res.json(rooms);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

app.get('/api/chat-history/:roomId/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const [messages] = await pool.execute(`
      SELECT cm.*, u.name as sender_name, u.role as sender_role
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
      ORDER BY cm.created_at ASC
    `, [roomId]);
    
    res.json(messages);
  } catch (error) {
    console.error('Fetch room messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

app.delete('/api/chat-history/:roomId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await pool.execute('DELETE FROM chat_messages WHERE room_id = ?', [roomId]);
    
    res.json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Delete chat room error:', error);
    res.status(500).json({ message: 'Failed to delete chat room' });
  }
});

// Get active chat users for admin (including anonymous)
app.get('/api/chat-active-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [activeUsers] = await pool.execute(`
      SELECT DISTINCT 
        cm.room_id,
        cm.sender_name,
        cm.sender_id,
        MAX(cm.created_at) as last_activity,
        CASE 
          WHEN cm.room_id LIKE 'anon_%' THEN 1
          WHEN cm.sender_id IS NULL THEN 1
          ELSE 0
        END as is_anonymous,
        u.role as sender_role
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id != 'admin_global' 
        AND (cm.room_id LIKE 'user_%' OR cm.room_id LIKE 'anon_%')
        AND (u.role != 'admin' OR u.role IS NULL)
      GROUP BY cm.room_id, cm.sender_name, cm.sender_id
      ORDER BY last_activity DESC
    `);
    res.json(activeUsers);
  } catch (error) {
    console.error('Fetch active users error:', error);
    res.status(500).json({ message: 'Failed to fetch active users' });
  }
});

// Get user's chat history
app.get('/api/chat-history/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's chat rooms
    const [rooms] = await pool.execute(`
      SELECT DISTINCT 
        room_id,
        MAX(created_at) as last_message_at,
        COUNT(*) as message_count
      FROM chat_messages 
      WHERE room_id = ?
      GROUP BY room_id 
      ORDER BY last_message_at DESC
    `, [`user_${userId}`]);
    
    // Get messages for each room
    const chatHistory = [];
    for (const room of rooms) {
      const [messages] = await pool.execute(`
        SELECT cm.*, u.name as sender_name, u.role as sender_role
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id
        WHERE cm.room_id = ?
        ORDER BY cm.created_at ASC
      `, [room.room_id]);
      
      chatHistory.push({
        roomId: room.room_id,
        lastMessageAt: room.last_message_at,
        messageCount: room.message_count,
        messages: messages
      });
    }
    
    res.json(chatHistory);
  } catch (error) {
    console.error('Fetch user chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Get user's recent messages (for quick preview)
app.get('/api/chat-history/user/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const [messages] = await pool.execute(`
      SELECT cm.*, u.name as sender_name, u.role as sender_role
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
      ORDER BY cm.created_at DESC
      LIMIT ?
    `, [`user_${userId}`, limit]);
    
    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Fetch recent messages error:', error);
    res.status(500).json({ message: 'Failed to fetch recent messages' });
  }
});

// Get user's chat history by user ID (for admin)
app.get('/api/chat-history/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [rooms] = await pool.execute(`
      SELECT DISTINCT 
        room_id,
        MAX(created_at) as last_message_at,
        COUNT(*) as message_count
      FROM chat_messages 
      WHERE room_id = ?
      GROUP BY room_id 
      ORDER BY last_message_at DESC
    `, [`user_${userId}`]);
    
    res.json(rooms);
  } catch (error) {
    console.error('Fetch user chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch user chat history' });
  }
});

// Get available users for admin chat selection
app.get('/api/chat/available-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, name, email, role, created_at, last_login
      FROM users 
      WHERE role != 'admin' 
      ORDER BY last_login DESC, created_at DESC
    `);
    
    // Get chat activity for each user
    const usersWithActivity = await Promise.all(users.map(async (user) => {
      const [messages] = await pool.execute(
        'SELECT COUNT(*) as message_count, MAX(created_at) as last_chat FROM chat_messages WHERE sender_id = ?',
        [user.id]
      );
      
      return {
        ...user,
        message_count: messages[0].message_count,
        last_chat: messages[0].last_chat
      };
    }));
    
    res.json(usersWithActivity);
  } catch (error) {
    console.error('Fetch available users error:', error);
    res.status(500).json({ message: 'Failed to fetch available users' });
  }
});

// Stroke Risk Screening Routes
app.post('/api/screening', authenticateToken, async (req, res) => {
  try {
    const { answers, score, category, riskLevel } = req.body;
    const userId = req.user.id;

    // Create screenings table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS screenings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        answers JSON NOT NULL,
        score INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        risk_level ENUM('low', 'medium', 'high') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Insert screening result
    const [result] = await pool.execute(
      'INSERT INTO screenings (user_id, answers, score, category, risk_level) VALUES (?, ?, ?, ?, ?)',
      [userId, JSON.stringify(answers), score, category, riskLevel]
    );

    res.status(201).json({
      message: 'Screening submitted successfully',
      screeningId: result.insertId,
    });
  } catch (error) {
    console.error('Submit screening error:', error);
    res.status(500).json({ message: 'Failed to submit screening' });
  }
});

// Health Notes Routes
// Create health notes table if it doesn't exist
pool.execute(`
  CREATE TABLE IF NOT EXISTS health_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    note_date DATE NOT NULL,
    blood_sugar DECIMAL(5,1) NULL,
    blood_sugar_status ENUM('low', 'normal', 'high') NULL,
    cholesterol DECIMAL(5,1) NULL,
    cholesterol_status ENUM('low', 'normal', 'high') NULL,
    blood_pressure_systolic INT NULL,
    blood_pressure_diastolic INT NULL,
    blood_pressure_status ENUM('low', 'normal', 'high') NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, note_date)
  )
`).catch(err => console.log('Health notes table already exists or error:', err.message));

// Get all health notes for current user
app.get('/api/health-notes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [notes] = await pool.execute(
      'SELECT * FROM health_notes WHERE user_id = ? ORDER BY note_date DESC',
      [userId]
    );
    
    res.json(notes);
  } catch (error) {
    console.error('Fetch health notes error:', error);
    res.status(500).json({ message: 'Failed to fetch health notes' });
  }
});

// Get health note for specific date
app.get('/api/health-notes/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    
    const [notes] = await pool.execute(
      'SELECT * FROM health_notes WHERE user_id = ? AND note_date = ?',
      [userId, date]
    );
    
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(notes[0]);
  } catch (error) {
    console.error('Fetch health note error:', error);
    res.status(500).json({ message: 'Failed to fetch health note' });
  }
});

// Create or update health note
app.post('/api/health-notes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      note_date,
      blood_sugar,
      blood_sugar_status,
      cholesterol,
      cholesterol_status,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      blood_pressure_status,
      notes
    } = req.body;

    // Check if note exists for this date
    const [existing] = await pool.execute(
      'SELECT id FROM health_notes WHERE user_id = ? AND note_date = ?',
      [userId, note_date]
    );

    if (existing.length > 0) {
      // Update existing note
      await pool.execute(
        `UPDATE health_notes SET 
          blood_sugar = ?,
          blood_sugar_status = ?,
          cholesterol = ?,
          cholesterol_status = ?,
          blood_pressure_systolic = ?,
          blood_pressure_diastolic = ?,
          blood_pressure_status = ?,
          notes = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          blood_sugar || null,
          blood_sugar_status || null,
          cholesterol || null,
          cholesterol_status || null,
          blood_pressure_systolic || null,
          blood_pressure_diastolic || null,
          blood_pressure_status || null,
          notes || null,
          existing[0].id
        ]
      );

      res.json({ 
        message: 'Health note updated successfully',
        noteId: existing[0].id 
      });
    } else {
      // Create new note
      const [result] = await pool.execute(
        `INSERT INTO health_notes (
          user_id,
          note_date,
          blood_sugar,
          blood_sugar_status,
          cholesterol,
          cholesterol_status,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          blood_pressure_status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          note_date,
          blood_sugar || null,
          blood_sugar_status || null,
          cholesterol || null,
          cholesterol_status || null,
          blood_pressure_systolic || null,
          blood_pressure_diastolic || null,
          blood_pressure_status || null,
          notes || null
        ]
      );

      res.status(201).json({ 
        message: 'Health note created successfully',
        noteId: result.insertId 
      });
    }
  } catch (error) {
    console.error('Save health note error:', error);
    res.status(500).json({ message: 'Failed to save health note' });
  }
});

// Delete health note
app.delete('/api/health-notes/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await pool.execute(
      'DELETE FROM health_notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json({ message: 'Health note deleted successfully' });
  } catch (error) {
    console.error('Delete health note error:', error);
    res.status(500).json({ message: 'Failed to delete health note' });
  }
});

app.get('/api/screening/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [screenings] = await pool.execute(
      'SELECT * FROM screenings WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Parse JSON answers
    const screeningsWithParsedAnswers = screenings.map(screening => ({
      ...screening,
      answers: typeof screening.answers === 'string' 
        ? JSON.parse(screening.answers) 
        : screening.answers,
    }));

    res.json(screeningsWithParsedAnswers);
  } catch (error) {
    console.error('Fetch screening history error:', error);
    res.status(500).json({ message: 'Failed to fetch screening history' });
  }
});

app.get('/api/screening/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [screenings] = await pool.execute(
      'SELECT * FROM screenings WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (screenings.length === 0) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    const screening = screenings[0];
    screening.answers = typeof screening.answers === 'string' 
      ? JSON.parse(screening.answers) 
      : screening.answers;

    res.json(screening);
  } catch (error) {
    console.error('Fetch screening error:', error);
    res.status(500).json({ message: 'Failed to fetch screening' });
  }
});

// Admin: Get all screening results with pagination
app.get('/api/admin/screenings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM screenings s
      JOIN users u ON s.user_id = u.id
    `);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated screenings
    const [screenings] = await pool.execute(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM screenings s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Parse JSON answers
    const screeningsWithParsedAnswers = screenings.map(screening => ({
      ...screening,
      answers: typeof screening.answers === 'string' 
        ? JSON.parse(screening.answers) 
        : screening.answers,
    }));

    res.json({
      data: screeningsWithParsedAnswers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Fetch all screenings error:', error);
    res.status(500).json({ message: 'Failed to fetch screenings' });
  }
});

// Admin: Get all health notes with pagination
app.get('/api/admin/health-notes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM health_notes hn
      JOIN users u ON hn.user_id = u.id
    `);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated health notes
    const [notes] = await pool.execute(`
      SELECT hn.*, u.name as user_name, u.email as user_email
      FROM health_notes hn
      JOIN users u ON hn.user_id = u.id
      ORDER BY hn.note_date DESC, hn.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    res.json({
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Fetch all health notes error:', error);
    res.status(500).json({ message: 'Failed to fetch health notes' });
  }
});

// Admin: Get health notes by user
app.get('/api/admin/health-notes/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [notes] = await pool.execute(`
      SELECT hn.*, u.name as user_name, u.email as user_email
      FROM health_notes hn
      JOIN users u ON hn.user_id = u.id
      WHERE hn.user_id = ?
      ORDER BY hn.note_date DESC
    `, [userId]);
    
    res.json(notes);
  } catch (error) {
    console.error('Fetch user health notes error:', error);
    res.status(500).json({ message: 'Failed to fetch user health notes' });
  }
});

// Admin: Get screenings by user
app.get('/api/admin/screenings/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [screenings] = await pool.execute(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM screenings s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    // Parse JSON answers
    const screeningsWithParsedAnswers = screenings.map(screening => ({
      ...screening,
      answers: typeof screening.answers === 'string' 
        ? JSON.parse(screening.answers) 
        : screening.answers,
    }));

    res.json(screeningsWithParsedAnswers);
  } catch (error) {
    console.error('Fetch user screenings error:', error);
    res.status(500).json({ message: 'Failed to fetch user screenings' });
  }
});

// Socket.IO for real-time chat
const connectedUsers = new Map(); // socketId -> user
const userRooms = new Map(); // userId -> roomId
const roomUsers = new Map(); // roomId -> Set of socketIds
const adminSockets = new Set(); // Set of admin socket IDs
const anonymousRooms = new Map(); // anonId -> roomId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle admin chat connection
  socket.on('joinAdminChat', async (data) => {
    const { user } = data;
    if (user.role === 'admin') {
      connectedUsers.set(socket.id, user);
      adminSockets.add(socket.id);
      socket.join('admin_global');
      console.log('Admin joined chat:', user.name);
    }
  });

  // Handle anonymous user chat
  socket.on('joinAnonymousChat', async (data) => {
    const { user } = data;
    connectedUsers.set(socket.id, user);
    
    // Create unique room for anonymous user
    const roomId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    anonymousRooms.set(user.id, roomId);
    userRooms.set(user.id, roomId);
    
    socket.join(roomId);
    
    // Store room information
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(socket.id);
    
    // Notify all admins about new anonymous user
    socket.to('admin_global').emit('newAnonymousUser', {
      user: user,
      roomId: roomId
    });
    
    console.log('Anonymous user joined:', user.name, 'Room:', roomId);
  });

  // Handle registered user chat
  socket.on('joinChat', async (data) => {
    const { user } = data;
    connectedUsers.set(socket.id, user);
    
    // Create unique room ID for user-admin chat
    let roomId;
    if (user.role === 'admin') {
      // Admin joins global admin room
      adminSockets.add(socket.id);
      roomId = 'admin_global';
      socket.join(roomId);
    } else {
      // For authenticated users, use consistent room ID format
      if (user.id) {
        // Use simple, consistent room ID for registered users
        roomId = `user_${user.id}`;
      }
      
      userRooms.set(user.id, roomId);
      socket.join(roomId);
      
      // Notify admin about new user
      socket.to('admin_global').emit('newUserChat', {
        user: user,
        roomId: roomId
      });
    }
    
    // Store room information
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(socket.id);
    
    // Send current users in the room
    const roomUserList = Array.from(roomUsers.get(roomId)).map(sid => connectedUsers.get(sid)).filter(Boolean);
    socket.emit('connectedUsers', roomUserList);
    
    // Load previous messages for this room
    try {
      const [messages] = await pool.execute(
        'SELECT cm.*, u.name as sender_name, u.role as sender_role FROM chat_messages cm LEFT JOIN users u ON cm.sender_id = u.id WHERE cm.room_id = ? ORDER BY cm.created_at ASC',
        [roomId]
      );
      
      // Normalize message format to match real-time messages
      const normalizedMessages = messages.map(msg => ({
        ...msg,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name || 'Anonymous',
          role: msg.sender_role || 'user'
        },
        timestamp: msg.created_at
      }));
      
      socket.emit('loadMessages', normalizedMessages);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  });

  // Handle admin joining specific chat room
  socket.on('joinChatRoom', async (data) => {
    const { roomId, user } = data;
    if (user.role === 'admin') {
      socket.join(roomId);
      
      // Load messages for this specific room
      try {
        const [messages] = await pool.execute(
          'SELECT cm.*, u.name as sender_name, u.role as sender_role FROM chat_messages cm LEFT JOIN users u ON cm.sender_id = u.id WHERE cm.room_id = ? ORDER BY cm.created_at ASC',
          [roomId]
        );
        
        // Normalize message format to match real-time messages
        const normalizedMessages = messages.map(msg => ({
          ...msg,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name || msg.sender_name,
            role: msg.sender_role || 'user'
          },
          timestamp: msg.created_at
        }));
        
        socket.emit('loadMessages', normalizedMessages);
      } catch (error) {
        console.error('Load room messages error:', error);
      }
    }
  });

  // Handle regular user messages
  socket.on('sendMessage', async (messageData) => {
    try {
      const { content, sender, roomId } = messageData;
      
      // Determine room ID if not provided
      let targetRoomId = roomId;
      if (!targetRoomId) {
        if (sender.role === 'admin') {
          // Admin needs to specify which user to send to
          return;
        } else {
          // User sends to their own room
          targetRoomId = userRooms.get(sender.id);
        }
      }

      // Save message to database
      const [result] = await pool.execute(
        'INSERT INTO chat_messages (room_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?)',
        [targetRoomId, sender.id || null, sender.name, content]
      );

      const message = {
        id: result.insertId,
        content,
        sender,
        timestamp: new Date(),
        room_id: targetRoomId
      };

      // Send message to users in the specific room
      io.to(targetRoomId).emit('message', message);
      
      // Only send to admin global room if sender is not admin and the target room is not admin_global
      if (sender.role !== 'admin' && targetRoomId !== 'admin_global') {
        io.to('admin_global').emit('message', message);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Handle anonymous user messages
  socket.on('sendAnonymousMessage', async (messageData) => {
    try {
      const { content, sender } = messageData;
      
      const targetRoomId = anonymousRooms.get(sender.id) || userRooms.get(sender.id);
      if (!targetRoomId) {
        console.error('No room found for anonymous user:', sender.id);
        return;
      }

      // Save message to database
      const [result] = await pool.execute(
        'INSERT INTO chat_messages (room_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?)',
        [targetRoomId, null, sender.name, content]
      );

      const message = {
        id: result.insertId,
        content,
        sender: {
          ...sender,
          role: 'anonymous'
        },
        timestamp: new Date(),
        room_id: targetRoomId
      };

      // Send message to the specific room
      io.to(targetRoomId).emit('message', message);
      
      // Only send to admin global room if sender is not admin and the target room is not admin_global
      if (sender.role !== 'admin' && targetRoomId !== 'admin_global') {
        io.to('admin_global').emit('message', message);
      }
    } catch (error) {
      console.error('Send anonymous message error:', error);
    }
  });

  socket.on('adminSendToUser', async (data) => {
    try {
      const { content, targetRoomId, sender, targetUserId } = data;
      
      // Save message to database
      const [result] = await pool.execute(
        'INSERT INTO chat_messages (room_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?)',
        [targetRoomId, sender.id, sender.name, content]
      );

      const message = {
        id: result.insertId,
        content,
        sender,
        timestamp: new Date(),
        room_id: targetRoomId
      };

      // Send message to specific user room (this will include the admin who is in this room)
      io.to(targetRoomId).emit('message', message);
      
      // If this is a new conversation, notify the target user to join the room
      if (targetUserId) {
        // Find target user's socket and notify them about new admin message
        for (const [socketId, connectedUser] of connectedUsers.entries()) {
          if (connectedUser.id === targetUserId && connectedUser.role !== 'admin') {
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
              // Make the user join the room if they haven't already
              if (!targetSocket.rooms.has(targetRoomId)) {
                targetSocket.join(targetRoomId);
                userRooms.set(targetUserId, targetRoomId);
                
                // Store room information
                if (!roomUsers.has(targetRoomId)) {
                  roomUsers.set(targetRoomId, new Set());
                }
                roomUsers.get(targetRoomId).add(socketId);
              }
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Admin send message error:', error);
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    adminSockets.delete(socket.id);
    
    // Remove from room tracking
    for (const [roomId, socketSet] of roomUsers.entries()) {
      if (socketSet.has(socket.id)) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          roomUsers.delete(roomId);
        }
      }
    }
    
    // Clean up anonymous rooms if user disconnects
    if (user && user.role === 'anonymous') {
      anonymousRooms.delete(user.id);
      userRooms.delete(user.id);
    }
    
    console.log('User disconnected:', socket.id, user?.name || 'Unknown');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});