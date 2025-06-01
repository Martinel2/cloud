const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;
const pool = require('./db');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const loginRouter = require('./routes/login');

app.use(cors());
app.use(express.json());

// 데이터베이스 테이블 초기화
async function initDatabase() {
  try {
    // users 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // posts 테이블 생성 (없는 경우)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        author VARCHAR(255) NOT NULL,
        meeting_time VARCHAR(255),
        meeting_place VARCHAR(255),
        member_count INT DEFAULT 1,
        region VARCHAR(100),
        age_group VARCHAR(100),
        skill_level VARCHAR(100),
        extra_tags VARCHAR(255),
        is_recruiting BOOLEAN DEFAULT TRUE,
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // post_applicants 테이블 생성 (없는 경우)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_applicants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_application (post_id, user_name),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);

    // comments 테이블 생성 (없는 경우)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        parent_id INT,
        content TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
      )
    `);

    console.log('데이터베이스 테이블 초기화 완료');
  } catch (err) {
    console.error('데이터베이스 초기화 오류:', err);
  }
}

// 서버 시작 시 데이터베이스 초기화
initDatabase();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ ok: true, result: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api', loginRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});