import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PostsList from './pages/PostsList';
import PostDetail from './pages/PostDetail';
import PostForm from './pages/PostForm';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    alert('로그인 기능은 추후 지원 예정입니다.');
    // setUser('홍길동'); // 실제 로그인 시 사용
  };
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to="/posts" />} />
        <Route path="/posts" element={<PostsList />} />
        <Route path="/posts/new" element={<PostForm />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostForm />} />
      </Routes>
    </Router>
  );
}

export default App;