import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppContext } from '../context/userContext'
const getLabel = (is_recruiting) => {
  if (is_recruiting === true || is_recruiting === 1 || is_recruiting === '1') {
    return { text: '진행중', color: '#4caf50' };
  } else {
    return { text: '모집완료', color: '#f44336' };
  }
};

const REGION_COLORS = {
  '서울': '#1976d2', '경기': '#388e3c', '인천': '#0288d1', '부산': '#ff7043', '대구': '#8d6e63', '기타': '#607d8b'
};
const AGE_COLORS = {
  '10대': '#ffd600', '20대': '#ffb300', '30대': '#ff7043', '40대': '#8e24aa', '50대 이상': '#455a64', '자유': '#90caf9'
};
const SKILL_COLORS = {
  '초보': '#81c784', '중급': '#1976d2', '고수': '#d32f2f', '자유': '#bdbdbd'
};

function getMemberTagColor(memberCount) {
  if (memberCount >= 8) return '#4caf50';
  if (memberCount >= 5) return '#ff9800';
  return '#f44336';
}

function getTagColor(tag, idx) {
  if (idx === 0) return REGION_COLORS[tag] || '#607d8b';
  if (idx === 1) return AGE_COLORS[tag] || '#607d8b';
  if (idx === 2) return SKILL_COLORS[tag] || '#607d8b';
  return '#607d8b';
}

function PostsList({ user }) {
  const [posts, setPosts] = useState([]);
  const [showRecruiting, setShowRecruiting] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetch(`http://20.5.129.23:5000/api/posts${showRecruiting ? '?recruiting=true' : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setPosts(data.posts || []);
        }
      })
      .catch(err => console.error('게시글 목록 조회 오류:', err));
  }, [showRecruiting]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 100%)',
      paddingTop: 60,
      paddingBottom: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18, alignItems: 'center' }}>
          <label style={{ color: '#444', fontWeight: 600, fontSize: 14, background: '#e0e0e0', borderRadius: 8, padding: '4px 12px' }}>
            <input type="checkbox" checked={showRecruiting} onChange={e => setShowRecruiting(e.target.checked)} style={{ marginRight: 6 }} />
            진행중만 표시
          </label>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          marginBottom: 24,
          padding: '20px 24px',
          fontWeight: 700,
          fontSize: 16,
          color: '#333',
          gap: 18,
        }}>
          <span style={{ flex: 0.8, textAlign: 'center' }}>상태</span>
          <span style={{ flex: 1, textAlign: 'center' }}>모집인원</span>
          <span style={{ flex: 2.5 }}>제목</span>
          <span style={{ flex: 1, textAlign: 'center' }}>작성자</span>
          <span style={{ flex: 1, textAlign: 'center' }}>작성일</span>
          <span style={{ flex: 0.7, textAlign: 'right' }}>조회수</span>
        </div>

        {posts.map(post => {
          const memberTagColor = getMemberTagColor(post.member_count);
          const tags = [post.region, post.age_group, post.skill_level].filter(Boolean);
          const { text, color } = getLabel(post.is_recruiting);

          return (
            <div
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                marginBottom: 16,
                padding: '16px 24px',
                fontSize: 15,
                color: '#333',
                gap: 18,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <span style={{ flex: 0.8, textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  minWidth: 64,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: color,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}>{text}</span>
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  minWidth: 64,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: memberTagColor,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}>{post.member_count}명</span>
              </span>
              <div style={{ flex: 2.5, overflow: 'hidden' }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#222',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{post.title}</span>
                <span style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
                  {tags.map((tag, i) => (
                    <span key={i} style={{
                      background: getTagColor(tag, i),
                      color: '#fff',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>{tag}</span>
                  ))}
                </span>
              </div>
              <span style={{ flex: 1, textAlign: 'center', color: '#388e3c', fontWeight: 600 }}>{post.author}</span>
              <span style={{ flex: 1, textAlign: 'center', color: '#777' }}>{new Date(post.created_at).toLocaleDateString()}</span>
              <span style={{ flex: 0.7, textAlign: 'right', color: '#999', fontWeight: 700 }}>{post.views}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PostsList;
