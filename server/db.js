const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/app/.env' }); // 기존 config() → 명시적으로 경로 지정

// 데이터베이스 연결 정보 로깅
console.log('데이터베이스 연결 정보:', { 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME 
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('데이터베이스 연결 성공!');
    connection.release();
    return true;
  } catch (err) {
    console.error('데이터베이스 연결 실패:', err);
    return false;
  }
}

// 초기 연결 테스트 실행
testConnection();

module.exports = pool; 