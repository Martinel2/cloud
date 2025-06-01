import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PostsList from './pages/PostsList';
import PostDetail from './pages/PostDetail';
import PostForm from './pages/PostForm';
import Header from './components/Header';
import Login from './pages/Login';

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 페이지 로드 시 로컬 스토리지에서 사용자 정보 가져오기
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 로그인 함수
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 로그아웃 함수
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/posts');
  };

  return (
    <>
      <Header user={user} onLogin={() => navigate('/login')} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to="/posts" />} />
        <Route path="/posts" element={<PostsList user={user} />} />
        <Route path="/posts/new" element={
          user ? <PostForm user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/posts/:id" element={<PostDetail user={user} />} />
        <Route path="/posts/:id/edit" element={
          user ? <PostForm user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;