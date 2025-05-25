import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LABELS = {
  '1': { text: '진행중', color: '#4caf50' },
  '0': { text: '모집완료', color: '#f44336' },
};

const TAG_COLORS = ['#1976d2', '#ff9800', '#8e24aa']; // 지역, 연령대, 실력

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
  if (memberCount >= 8) return '#4caf50'; // 초록
  if (memberCount >= 5) return '#ff9800'; // 주황
  return '#f44336'; // 빨강
}

function getTagColor(tag, idx) {
  if (idx === 0) return REGION_COLORS[tag] || '#607d8b';
  if (idx === 1) return AGE_COLORS[tag] || '#607d8b';
  if (idx === 2) return SKILL_COLORS[tag] || '#607d8b';
  return '#607d8b';
}

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [showRecruiting, setShowRecruiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/posts${showRecruiting ? '?recruiting=true' : ''}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, [showRecruiting]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #43a047 80%, #fff 100%)',
      paddingTop: 60,
      paddingBottom: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <label style={{ color: '#fff', fontWeight: 600, fontSize: 15, background: 'rgba(0,0,0,0.08)', borderRadius: 8, padding: '4px 12px' }}>
            <input type="checkbox" checked={showRecruiting} onChange={e => setShowRecruiting(e.target.checked)} style={{ marginRight: 6 }} />
            진행중만 표시
          </label>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 14,
          boxShadow: '0 1px 4px #b0c4de',
          marginBottom: 18,
          padding: '12px 24px',
          fontWeight: 700,
          fontSize: 16,
          color: '#388e3c',
          gap: 18,
        }}>
          <span style={{ minWidth: 70, textAlign: 'center', flex: 0.8 }}>상태</span>
          <span style={{ minWidth: 90, textAlign: 'center', flex: 1 }}>모집인원</span>
          <div style={{ display: 'flex', alignItems: 'center', flex: 2.5, minWidth: 0 }}>
            <span style={{ textAlign: 'center', width: '100%' }}>제목</span>
          </div>
          <span style={{ flex: 1, minWidth: 90, textAlign: 'center' }}>작성자</span>
          <span style={{ flex: 1, minWidth: 110, textAlign: 'center' }}>작성일</span>
          <span style={{ flex: 0.7, minWidth: 60, textAlign: 'right' }}>조회수</span>
        </div>
        {posts.map(post => {
          const memberTagColor = getMemberTagColor(post.member_count);
          const tags = [post.region, post.age_group, post.skill_level].filter(Boolean);
          return (
            <div
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                borderRadius: 18,
                boxShadow: '0 2px 8px #b0c4de33',
                marginBottom: 18,
                padding: '16px 24px',
                fontSize: 17,
                color: '#333',
                gap: 18,
              }}
            >
              <span style={{ minWidth: 70, textAlign: 'center', flex: 0.8 }}>
                <span style={{
                  display: 'inline-block',
                  minWidth: 70,
                  textAlign: 'center',
                  padding: '4px 0',
                  borderRadius: 12,
                  background: LABELS[String(post.is_recruiting)]?.color,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  marginRight: 6,
                  flexShrink: 0,
                }}>{LABELS[String(post.is_recruiting)]?.text}</span>
              </span>
              <span style={{ minWidth: 90, textAlign: 'center', flex: 1 }}>
                <span style={{
                  display: 'inline-block',
                  minWidth: 70,
                  textAlign: 'center',
                  padding: '4px 0',
                  borderRadius: 12,
                  background: memberTagColor,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  marginRight: 10,
                  flexShrink: 0,
                }}>{post.member_count}명</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', flex: 2.5, minWidth: 0 }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#222',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  maxWidth: 220,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}>{post.title}</span>
                {tags.length > 0 && (
                  <span style={{ display: 'inline-flex', gap: 4, marginLeft: 10, flexShrink: 0, verticalAlign: 'middle' }}>
                    {tags.map((tag, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        background: getTagColor(tag, i),
                        color: '#fff',
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 14,
                        fontWeight: 600,
                        marginLeft: 0,
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                      }}>{tag}</span>
                    ))}
                  </span>
                )}
              </div>
              <span style={{ flex: 1, minWidth: 90, textAlign: 'center', color: '#388e3c', fontWeight: 600, fontSize: 15 }}>{post.author}</span>
              <span style={{ flex: 1, minWidth: 110, textAlign: 'center', color: '#888', fontSize: 14 }}>{new Date(post.created_at).toLocaleDateString()}</span>
              <span style={{ flex: 0.7, minWidth: 60, textAlign: 'right', color: '#607d8b', fontWeight: 700, fontSize: 15 }}>{post.views}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PostsList; 