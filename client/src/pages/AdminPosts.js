import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 사용자 정보 및 권한 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.ok) {
          setUser(res.data.user);
          // 일반 사용자는 관리자 페이지 접근 불가
          if (res.data.user.role !== 'admin') {
            navigate('/');
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('인증 오류:', err);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // 게시글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/posts`);
        if (res.data.ok) {
          setPosts(res.data.posts);
        } else {
          setError('게시글을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('게시글 로드 오류:', err);
        setError('게시글을 불러오는데 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPosts();
    }
  }, [user]);

  // 게시글 상태 변경
  const updatePostStatus = async (postId, isRecruiting) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/posts/${postId}/update-status`,
        { is_recruiting: isRecruiting },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.ok) {
        // 게시글 목록 업데이트
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, is_recruiting: isRecruiting } 
            : post
        ));
        setUpdateMessage(`게시글 #${postId} 상태가 '${isRecruiting ? '진행중' : '모집완료'}'로 변경되었습니다.`);
        
        // 3초 후 메시지 제거
        setTimeout(() => {
          setUpdateMessage(null);
        }, 3000);
      } else {
        setError(res.data.error || '상태 변경 실패');
      }
    } catch (err) {
      console.error('상태 변경 오류:', err);
      setError('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 게시글 상세 페이지로 이동
  const goToPostDetail = (postId) => {
    navigate(`/posts/${postId}`);
  };

  if (!user) {
    return <Container className="mt-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="mt-5">
      <h2 className="mb-4">게시글 관리</h2>
      
      {updateMessage && (
        <Alert variant="success" onClose={() => setUpdateMessage(null)} dismissible>
          {updateMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>게시글을 불러오는 중...</p>
        </div>
      ) : (
        <>
          <p>총 {posts.length}개의 게시글이 있습니다.</p>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>작성자</th>
                <th>모집 인원</th>
                <th>모집 상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>
                    <a href="#" onClick={(e) => { e.preventDefault(); goToPostDetail(post.id); }}>
                      {post.title}
                    </a>
                  </td>
                  <td>{post.username}</td>
                  <td>{post.member_count}</td>
                  <td>
                    <span className={`badge ${post.is_recruiting ? 'bg-success' : 'bg-secondary'}`}>
                      {post.is_recruiting ? '진행중' : '모집완료'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        size="sm" 
                        variant={post.is_recruiting ? "secondary" : "success"}
                        onClick={() => updatePostStatus(post.id, !post.is_recruiting)}
                      >
                        {post.is_recruiting ? '모집완료로 변경' : '진행중으로 변경'}
                      </Button>
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => goToPostDetail(post.id)}
                      >
                        보기
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <div className="mt-4">
            <h4>도구</h4>
            <Button 
              variant="warning" 
              onClick={() => navigate('/')}
              className="me-2"
            >
              메인으로 돌아가기
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPosts([]);
                setLoading(true);
                setTimeout(() => {
                  // 게시글 새로고침
                  axios.get(`${API_URL}/posts`)
                    .then(res => {
                      if (res.data.ok) {
                        setPosts(res.data.posts);
                      }
                    })
                    .catch(err => console.error('새로고침 오류:', err))
                    .finally(() => setLoading(false));
                }, 500);
              }}
            >
              게시글 새로고침
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default AdminPosts; 