import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PostsList from './pages/PostsList';
import PostDetail from './pages/PostDetail';
import PostForm from './pages/PostForm';
import Header from './components/Header';
import Login from './pages/Login';

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to="/posts" />} />
        <Route path="/posts" element={<PostsList />} />
        <Route path="/posts/new" element={<PostForm />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostForm />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
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