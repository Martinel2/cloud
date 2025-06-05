const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;
const pool = require('./db');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const chatRouter = require('./routes/chat');
const loginRouter = require('./routes/login')
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

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

function isoToMysqlDatetime(isoString) {
  // 1. 'Z' 제거
  let s = isoString.replace('Z', '');
  // 2. 'T'를 공백으로 변환
  s = s.replace('T', ' ');
  // 3. 소수점 이하 3자리로 자르기 (MySQL에서 milli까지 지원)
  s = s.replace(/(\.\d{3})\d*/, '$1');
  return s;
}

io.on('connection', (socket) => {
  // 채팅방 입장
  socket.on('joinRoom', async ({ chatId, userId }) => {
    console.log("joined room");
    //console.log(chatId);
    socket.join(chatId);
    await pool.query(
      'UPDATE message_table SET message_read = 1 WHERE chat_id = ? AND writer_id <> ?',
      [chatId, userId]
    );
    // 이전 메시지 불러오기
    const [rows] = await pool.query(
      'SELECT writer_id AS sender, message_text AS text, message_time AS time FROM message_table WHERE chat_id = ? ORDER BY message_time ASC',
      [chatId]
    );
    //console.log(rows);
    socket.emit('previousMessages', rows);
  });

  socket.on('joinChatList', async ({ userId }) => {
    console.log('joinChatList')
    // 이전 메시지 불러오기
    const [rows] = await pool.query(
      'SELECT chat_id FROM chat_table WHERE chat_user_1 = ? OR chat_user_2 = ?',
      [userId, userId]
    );
    for (const chat of rows) {
      socket.join(chat.chat_id);
    }
  });

  // 메시지 전송
  socket.on('sendMessage', async (msg) => {

    // DB 저장
    await pool.query(
      'INSERT INTO message_table (writer_id, reciever_id, message_time, message_text, message_read, chat_id) VALUES (?, ?, ?, ?, ?, ?)',
      [msg.sender, '', isoToMysqlDatetime(msg.time), msg.text, 0, msg.chatId]
    );
    // 같은 방의 모든 클라이언트에 메시지 전송
    io.to(msg.chatId).emit('receiveMessage', msg);
  });

  socket.on('leftRoom', async ({ chatId, userId }) => {
    console.log("lefted room");
    //console.log(chatId);
    await pool.query(
      'UPDATE message_table SET message_read = 1 WHERE chat_id = ? AND writer_id <> ?',
      [chatId, userId]
    );
    socket.leave(chatId);
  });

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
});

app.use(cors());
app.use(express.json());

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

// Express 라우트는 여기에 작성
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api', loginRouter);
// 수정 후
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});