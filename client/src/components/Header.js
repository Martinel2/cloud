import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Header({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isWritePage = location.pathname.startsWith('/posts/new') || location.pathname.endsWith('/edit');
  return (
    <header style={{
      width: '100%',
      background: 'linear-gradient(90deg, #388e3c 80%, #fff 100%)',
      borderBottom: '4px solid #fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0 0 0',
      minHeight: 72,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px #b0c4de',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 36, cursor: 'pointer' }} onClick={() => navigate('/posts')}>
        <img src="https://cdn-icons-png.flaticon.com/512/861/861512.png" alt="축구공" style={{ width: 38, marginRight: 10, filter: 'drop-shadow(0 2px 4px #2222)' }} />
        <span style={{
          fontFamily: 'GmarketSansBold, sans-serif',
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: 2,
          textShadow: '0 2px 8px #388e3c',
          userSelect: 'none',
        }}>축 <span style={{ color: '#ffd600' }}>구</span>하자</span>
      </div>
      <div style={{ marginRight: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
        {!isWritePage && (
          <button onClick={() => navigate('/posts/new')} style={writeBtnStyle}>글 작성</button>
        )}
        {user ? (
          <>
            <span style={{ color: '#fff', fontWeight: 600, marginRight: 16 }}>{user}</span>
            <button onClick={onLogout} style={loginBtnStyle}>로그아웃</button>
          </>
        ) : (
          <button onClick={onLogin} style={loginBtnStyle}>로그인</button>
        )}
      </div>
    </header>
  );
}

const loginBtnStyle = {
  background: '#fff',
  color: '#388e3c',
  border: 'none',
  borderRadius: 8,
  padding: '8px 22px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #a5d6a7',
};

const writeBtnStyle = {
  background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 22px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #a5d6a7',
  letterSpacing: 1,
};

export default Header;
