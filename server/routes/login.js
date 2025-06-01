const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2');
const router = express.Router();
const pool = require('../db');

const app = express();
//const port = 5000;

// 미들웨어 설정
app.use(express.json());
app.use(cors());

// MySQL 연결 풀 생성
/*const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// users 테이블 생성 쿼리
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('테이블 생성 중 오류 발생:', err);
    }
});
*/

// 회원가입 API
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 유효성 검사
        if (!username || !email || !password) {
            return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
        }

        // 이메일 중복 확인
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 정보 저장
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.json({ message: '회원가입 성공!' });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 요청 정보 로깅
        console.log('로그인 시도:', { email });

        // 유효성 검사
        if (!email || !password) {
            console.log('유효성 검사 실패: 이메일 또는 비밀번호 누락');
            return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
        }

        try {
            // 사용자 조회
            const [users] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            console.log('사용자 조회 결과:', { found: users.length > 0 });

            if (users.length === 0) {
                return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
            }

            // 비밀번호 확인
            const isValidPassword = await bcrypt.compare(password, users[0].password);
            console.log('비밀번호 확인:', { isValid: isValidPassword });

            if (!isValidPassword) {
                return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
            }

            // 비밀번호는 제외하고 사용자 정보 반환
            const user = { 
                id: users[0].id,
                username: users[0].username,
                email: users[0].email
            };

            console.log('로그인 성공:', { username: users[0].username });
            res.json({ message: '로그인 성공!', user });
        } catch (dbError) {
            console.error('데이터베이스 조회 오류:', dbError);
            res.status(500).json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' });
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

//app.listen(port, () => {
//    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
//});

module.exports = router;
