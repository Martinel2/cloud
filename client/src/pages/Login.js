import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ setUser }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // true: 로그인 폼, false: 회원가입 폼
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('환영합니다!');
        setUser(data.user.username); // 서버에서 받은 username으로 설정
        navigate('/posts');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('서버 오류가 발생했습니다.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 비밀번호 일치 여부 확인
    if (password !== password2) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('회원가입이 완료되었습니다!');
        setIsLogin(true); // 회원가입 성공 시 로그인 폼으로 전환
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container">
      {isLogin ? (
        <div className="form-container">
          <h2>로그인</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>이메일:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>비밀번호:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">로그인</button>
          </form>
          <button 
            onClick={() => setIsLogin(false)} 
            className="switch-btn"
          >
            회원가입하기
          </button>
        </div>
      ) : (
        <div className="form-container">
          <h2>회원가입</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>이름:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>이메일:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>비밀번호:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>비밀번호 확인:</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">회원가입</button>
          </form>
          <button 
            onClick={() => setIsLogin(true)} 
            className="switch-btn"
          >
            로그인하기
          </button>
        </div>
      )}
      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default Login;



