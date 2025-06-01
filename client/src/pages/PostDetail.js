import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// 라벨 처리 함수 추가
const getLabel = (is_recruiting) => {
  // 불리언이나 숫자를 문자열로 변환
  if (is_recruiting === true || is_recruiting === 1 || is_recruiting === '1') {
    return { text: '진행중', color: '#4caf50' };
  } else {
    return { text: '모집완료', color: '#bdbdbd' };
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

function getMemberTagColor(memberCount, totalCount) {
  if (!totalCount || totalCount === 0) return '#4caf50';
  const ratio = memberCount / totalCount;
  if (ratio <= 0.3) return '#f44336'; // 30% 이하 빨강
  if (ratio <= 0.5) return '#ff9800'; // 50% 이하 주황
  return '#4caf50'; // 기본 녹색
}

function getTagColor(tag, idx) {
  if (idx === 0) return REGION_COLORS[tag] || '#607d8b';
  if (idx === 1) return AGE_COLORS[tag] || '#607d8b';
  if (idx === 2) return SKILL_COLORS[tag] || '#607d8b';
  return '#607d8b';
}

function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isApplicant, setIsApplicant] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const commentsPerPage = 5;

  useEffect(() => {
    fetch(`http://localhost:5000/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setPost(data.post);
          setIsAuthor(user && data.post.author === user.username);
          setLoading(false);
          
          // 모집 신청 여부를 함께 확인
          if (user) {
            fetch(`http://localhost:5000/api/posts/${id}/applicants?user_name=${encodeURIComponent(user.username)}`)
              .then(res => res.json())
              .then(applicantData => {
                if (applicantData.ok) {
                  console.log('모집 신청 상태:', applicantData);
                  setIsApplicant(applicantData.applied);
                }
              })
              .catch(err => console.error('모집 신청 정보 조회 오류:', err));
          }
        }
      });
      
    fetch(`http://localhost:5000/api/comments/post/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setComments(data.comments || []);
        }
      });
  }, [id, user]);

  const handleComment = async () => {
    if (!commentText || !user) {
      if (!user) alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }
    
    await fetch('http://localhost:5000/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id, content: commentText, author: user.username })
    });
    setCommentText('');
    fetch(`http://localhost:5000/api/comments/post/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setComments(data.comments || []);
        }
      });
  };

  const handleApply = async () => {
    if (!user) {
      alert('모집 신청을 하려면 로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('모집에 신청하시겠습니까?')) return;
    const res = await fetch(`http://localhost:5000/api/posts/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: user.username })
    });
    const data = await res.json();
    if (!data.ok) return alert(data.error);
    setIsApplicant(true);
    // 멤버 수 업데이트 (-1) 및 상태 자동 계산
    const newMemberCount = post.member_count - 1;
    setPost({ 
      ...post, 
      member_count: newMemberCount, 
      is_recruiting: newMemberCount > 0 // 멤버 수로 모집 상태 결정
    });
    alert('신청이 완료되었습니다.');
  };

  const handleCancel = async () => {
    if (!user) {
      alert('모집 취소를 하려면 로그인이 필요합니다.');
      return;
    }
    
    if (!window.confirm('신청을 취소하시겠습니까?')) return;
    const res = await fetch(`http://localhost:5000/api/posts/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: user.username })
    });
    const data = await res.json();
    if (!data.ok) return alert(data.error);
    setIsApplicant(false);
    // 멤버 수 업데이트 (+1) 및 상태 자동 계산
    const newMemberCount = post.member_count + 1;
    setPost({ 
      ...post, 
      member_count: newMemberCount, 
      is_recruiting: newMemberCount > 0  // 멤버 수로 모집 상태 결정
    });
    alert('신청이 취소되었습니다.');
  };

  // 댓글 수정 함수
  const handleEditComment = (commentId, content) => {
    setEditCommentId(commentId);
    setEditCommentText(content);
  };

  // 댓글 수정 저장 함수
  const saveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentText })
      });
      const data = await response.json();
      if (data.ok) {
        // 댓글 목록 다시 불러오기
        fetch(`http://localhost:5000/api/comments/post/${id}`)
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              setComments(data.comments || []);
            }
          });
        setEditCommentId(null);
        setEditCommentText('');
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error);
    }
  };

  // 댓글 삭제 함수
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.ok) {
        // 댓글 목록 다시 불러오기
        fetch(`http://localhost:5000/api/comments/post/${id}`)
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              setComments(data.comments || []);
            }
          });
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
    }
  };

  // 페이지 변경 함수
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading || !post) return <div>로딩중...</div>;

  let meetingTime = '-';
  let place = '-';
  let extra = '-';
  let contentLines = (post.content || '').split('\n');
  contentLines.forEach(line => {
    if (line.startsWith('모임 시간:')) meetingTime = line.replace('모임 시간:', '').trim();
    else if (line.startsWith('장소:')) place = line.replace('장소:', '').trim();
    else if (line.startsWith('추가사항:')) extra = line.replace('추가사항:', '').trim();
  });
  const totalCount = post.total_member_count || post.member_count + (post.applicant_count || 0);
  const memberTagColor = getMemberTagColor(post.member_count, totalCount);

  return (
    <div style={{
      maxWidth: 900,
      margin: '40px auto',
      background: 'linear-gradient(135deg, #43a047 80%, #fff 100%)',
      borderRadius: 24,
      boxShadow: '0 4px 16px #a5d6a7',
      padding: 36,
      border: '4px solid #fff',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 600,
    }}>
      <img src="https://cdn-icons-png.flaticon.com/512/861/861512.png" alt="축구공" style={{ width: 60, position: 'absolute', right: 32, top: 32, opacity: 0.13 }} />
      {/* 제목+라벨+수정/삭제 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 16 }}>
        <span style={{
          display: 'inline-block',
          minWidth: 80,
          textAlign: 'center',
          padding: '6px 0',
          borderRadius: 14,
          background: getLabel(post.is_recruiting).color,
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          marginRight: 6,
          flexShrink: 0,
        }}>{getLabel(post.is_recruiting).text}</span>
        <span style={{
          display: 'inline-block',
          minWidth: 80,
          textAlign: 'center',
          padding: '6px 0',
          borderRadius: 14,
          background: memberTagColor,
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          marginRight: 12,
          flexShrink: 0,
        }}>{post.member_count}명</span>
        <h2 style={{ margin: 0, fontSize: 30, color: '#fff', textShadow: '0 2px 8px #388e3c', fontWeight: 900, letterSpacing: 2, flex: 1 }}>{post.title}</h2>
        {isAuthor && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/posts/${id}/edit`)} style={editBtnStyle}>수정</button>
            <button style={deleteBtnStyle}>삭제</button>
          </div>
        )}
      </div>
      <div style={{ marginBottom: 12, color: '#fff', fontWeight: 600, textShadow: '0 1px 4px #388e3c' }}>
        <span>작성자: {post.author}</span> | <span>작성일: {new Date(post.created_at).toLocaleString()}</span>
        {post.updated_at && post.updated_at !== post.created_at && (
          <> | <span>수정일: {new Date(post.updated_at).toLocaleString()}</span></>
        )}
        | <span>조회수: {post.views}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        {[post.region, post.age_group, post.skill_level]
          .filter(Boolean)
          .map((tag, i) => (
            <span key={i} style={{
              display: 'inline-block',
              background: getTagColor(tag, i),
              color: '#fff',
              borderRadius: 8,
              padding: '2px 10px',
              marginRight: 4,
              fontSize: 15,
              fontWeight: 600,
            }}>{tag}</span>
          ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, minHeight: 120, fontSize: 18, boxShadow: '0 1px 4px #eee', borderLeft: '8px solid #4caf50', position: 'relative', color: '#333', fontWeight: 500 }}>
        <div style={{ marginBottom: 12 }}>
          <b>모임 시간:</b> {meetingTime}<br />
          <b>장소:</b> {place}
        </div>
        <div style={{ marginBottom: 12 }}>
          <b>추가사항:</b> {extra}
        </div>
        <div style={{ marginTop: 18, color: '#444', fontSize: 16 }}>
          <b>모집 인원:</b> {totalCount} 명<br />
          <b>남은 인원:</b> {post.member_count} 명
        </div>
      </div>
      {/* 댓글 입력 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 12, width: '100%' }}>
        {user ? (
          <>
            <div style={{ width: 160, fontSize: 16, padding: 10, borderRadius: 8, border: '2px solid #fff', background: '#e8f5e9', fontWeight: 600, marginRight: 12 }}>{user.username}</div>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="댓글 내용" rows={3} style={{ flex: 3, fontSize: 16, padding: 12, borderRadius: 10, border: '2px solid #fff', background: '#f1f8e9', resize: 'vertical', fontWeight: 500, minHeight: 60, marginRight: 0 }} />
            <button onClick={handleComment} style={{ ...commentBtnStyle, flex: 1, minWidth: 0, borderRadius: '0 10px 10px 0', height: 60, fontSize: 18, marginLeft: 12 }}>댓글 작성</button>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center', padding: 15, background: '#f1f8e9', borderRadius: 10, color: '#388e3c', fontWeight: 600 }}>
            댓글을 작성하려면 <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#1976d2', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}>로그인</button> 해주세요.
          </div>
        )}
      </div>

      {/* 댓글 목록 (스크롤 형식) */}
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto', 
        marginBottom: 100,
        background: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CommentTree 
          comments={comments} 
          user={user} 
          onEdit={handleEditComment} 
          onDelete={handleDeleteComment}
          editCommentId={editCommentId}
          editCommentText={editCommentText}
          setEditCommentText={setEditCommentText}
          saveEditComment={saveEditComment}
        />
      </div>
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 80 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button 
              key={pageNum} 
              onClick={() => handlePageChange(pageNum)}
              style={{
                width: 36,
                height: 36,
                margin: '0 4px',
                borderRadius: '50%',
                border: 'none',
                background: currentPage === pageNum ? '#388e3c' : '#fff',
                color: currentPage === pageNum ? '#fff' : '#388e3c',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}

      {/* 모집 신청/취소, 목록으로 버튼 */}
      <div style={{ 
        position: 'absolute', 
        right: 36, 
        bottom: 36, 
        display: 'flex', 
        gap: 12,
        zIndex: 10
      }}>
        {/* 진행중이고 작성자가 아니고 신청자가 아니고 로그인했을 때만 신청 버튼 표시 */}
        {post.member_count > 0 && !isAuthor && !isApplicant && user && (
          <button onClick={handleApply} style={applyBtnStyle}>모집 신청</button>
        )}
        
        {/* 신청자이고 로그인했을 때는 모집 상태와 관계없이 항상 취소 버튼 표시 */}
        {isApplicant && user && (
          <button 
            onClick={handleCancel} 
            style={cancelBtnStyle}
          >
            모집 취소
          </button>
        )}
        
        <button onClick={() => navigate(-1)} style={listBtnStyle}>목록으로</button>
      </div>
      {/* 축구장 라인 효과 */}
      <div style={{ position: 'absolute', left: 0, top: '30%', width: '100%', height: 4, background: '#fff', opacity: 0.3, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: '10%', top: '10%', width: 4, height: '80%', background: '#fff', opacity: 0.2, borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: '10%', top: '10%', width: 4, height: '80%', background: '#fff', opacity: 0.2, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, width: 4, height: '100%', background: '#fff', opacity: 0.08, borderRadius: 2 }} />
    </div>
  );
}

const editBtnStyle = {
  background: '#fff',
  color: '#1976d2',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #b0c4de',
};
const deleteBtnStyle = {
  background: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #ffcdd2',
};
const applyBtnStyle = {
  background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontWeight: 700,
  fontSize: 17,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #a5d6a7',
  whiteSpace: 'nowrap',
  minWidth: '120px',
  textAlign: 'center'
};
const cancelBtnStyle = {
  background: '#fffde7',
  color: '#ff9800',
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontWeight: 700,
  fontSize: 17,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #ffe0b2',
  whiteSpace: 'nowrap',
  minWidth: '120px',
  textAlign: 'center'
};
const listBtnStyle = {
  background: '#fff',
  color: '#388e3c',
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontWeight: 700,
  fontSize: 17,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #b0c4de',
  whiteSpace: 'nowrap',
  minWidth: '120px',
  textAlign: 'center'
};
const commentBtnStyle = {
  background: 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 24px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #b3e5fc',
  letterSpacing: 1,
};

function CommentTree({ 
  comments, 
  user, 
  onEdit, 
  onDelete, 
  editCommentId, 
  editCommentText, 
  setEditCommentText,
  saveEditComment
}) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
      {comments.map(comment => (
        <li key={comment.id} style={{ 
          marginBottom: 12, 
          marginLeft: comment.parent_id ? 32 : 0, 
          background: comment.is_deleted ? '#f5f5f5' : '#fafafa', 
          borderRadius: 8, 
          padding: 12,
          borderLeft: comment.parent_id ? '4px solid #a5d6a7' : 'none'
        }}>
          <div style={{ color: '#333', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{comment.is_deleted ? '삭제된 댓글입니다' : comment.author}</span>
              <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                {new Date(comment.created_at).toLocaleString()}
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <> (수정됨: {new Date(comment.updated_at).toLocaleString()})</>
                )}
              </span>
            </div>
            
            {/* 댓글 작성자만 수정/삭제 버튼 표시 */}
            {!comment.is_deleted && user && comment.author === user.username && (
              <div style={{ display: 'flex', gap: 8 }}>
                {editCommentId === comment.id ? (
                  <button 
                    onClick={() => saveEditComment(comment.id)} 
                    style={{ 
                      background: '#4caf50', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '4px 8px', 
                      fontSize: 13, 
                      cursor: 'pointer' 
                    }}
                  >
                    저장
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => onEdit(comment.id, comment.content)} 
                      style={{ 
                        background: '#f0f0f0', 
                        border: 'none', 
                        borderRadius: 4, 
                        padding: '4px 8px', 
                        fontSize: 13, 
                        cursor: 'pointer' 
                      }}
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => onDelete(comment.id)} 
                      style={{ 
                        background: '#ffebee', 
                        color: '#e53935', 
                        border: 'none', 
                        borderRadius: 4, 
                        padding: '4px 8px', 
                        fontSize: 13, 
                        cursor: 'pointer' 
                      }}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {!comment.is_deleted && (
            <>
              {editCommentId === comment.id ? (
                <textarea 
                  value={editCommentText} 
                  onChange={e => setEditCommentText(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    borderRadius: 4, 
                    border: '1px solid #ccc', 
                    marginTop: 8, 
                    minHeight: 60,
                    fontSize: 14
                  }} 
                />
              ) : (
                <div style={{ margin: '4px 0 4px 0', fontSize: 15, lineHeight: 1.5 }}>
                  {comment.content}
                </div>
              )}
            </>
          )}
          
          {/* 대댓글 렌더링 */}
          {comment.children && comment.children.length > 0 && (
            <CommentTree 
              comments={comment.children} 
              user={user} 
              onEdit={onEdit} 
              onDelete={onDelete}
              editCommentId={editCommentId}
              editCommentText={editCommentText}
              setEditCommentText={setEditCommentText}
              saveEditComment={saveEditComment}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default PostDetail; 