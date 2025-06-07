import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/userContext'
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
  const { globalUser, setGlobalUser } = useContext(AppContext);
  const [commentText, setCommentText] = useState('');
  const [isApplicant, setIsApplicant] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showApplicants, setShowApplicants] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const commentsPerPage = 5;

  useEffect(() => {
    fetch(`http://20.5.129.23:5000/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setPost(data.post);
          setIsAuthor(user && data.post.author === user.username);
          setLoading(false);
          
          // 모집 신청 여부를 함께 확인
          if (user) {
            fetch(`http://20.5.129.23:5000/api/posts/${id}/applicants?user_name=${encodeURIComponent(user.username)}`)
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
      
    fetch(`http://20.5.129.23:5000/api/comments/post/${id}`)
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
    
    await fetch('http://20.5.129.23:5000/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id, content: commentText, author: user.username })
    });
    setCommentText('');
    fetch(`http://20.5.129.23:5000/api/comments/post/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setComments(data.comments || []);
        }
      });
  };


  const isAuthorScreenControl = () => {

    if (!user) {
      return (
        <>
        <div style={{ width: '100%', textAlign: 'center', padding: 15, background: '#f1f8e9', borderRadius: 10, color: '#388e3c', fontWeight: 600 }}>
        댓글을 작성하려면 <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#1976d2', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}>로그인</button> 해주세요.
        </div>
      </>
      )
    }
    else if (!isAuthor) {
      return (
        <>
        <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="댓글 내용" rows={3} style={{ flex: 7, fontSize: 16, padding: 12, borderRadius: 10, border: '2px solid #fff', background: '#f1f8e9', resize: 'vertical', fontWeight: 500, minHeight: 60, marginRight: 0 }} />
        <button onClick={handleComment} style={{ ...commentBtnStyle, flex: 1, minWidth: 0, borderRadius: '0 10px 10px 0', height: 60, fontSize: 18, marginLeft: 12 }}>댓글 작성</button>
        <button onClick={async () => await navigateMessage(post.author, globalUser, navigate)} style={{ ...commentBtnStyle, flex: 1, minWidth: 0, borderRadius: '0 10px 10px 0', height: 60, fontSize: 18, marginLeft: 12 }}>메시지 보내기</button>
      </>
      )
    }
    else {
      return (
        <></>
      )
    }
  }

  const handleApply = async () => {
    if (!user) {
      alert('모집 신청을 하려면 로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('모집에 신청하시겠습니까?')) return;
    const res = await fetch(`http://20.5.129.23:5000/api/posts/${id}/apply`, {
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
    const res = await fetch(`http://20.5.129.23:5000/api/posts/${id}/cancel`, {
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

  // 댓글 수정 취소 함수
  const cancelEditComment = () => {
    setEditCommentId(null);
    setEditCommentText('');
  };

  //메세지로 이동
  async function navigateMessage(author, userId, navigate) {
    await setGlobalUser(userId);
    await fetch(`/api/chat/search/${author}/${userId}`)
    .then(res => res.json())
    .then(data => {
      navigate('/messages', { state: { chatId: data.chat_id } });
    });
  }

  // 댓글 수정 저장 함수
  const saveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const response = await fetch(`http://20.5.129.23:5000/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentText })
      });
      const data = await response.json();
      if (data.ok) {
        // 댓글 목록 다시 불러오기
        fetch(`http://20.5.129.23:5000/api/comments/post/${id}`)
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
      const response = await fetch(`http://20.5.129.23:5000/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.ok) {
        // 댓글 목록 다시 불러오기
        fetch(`http://20.5.129.23:5000/api/comments/post/${id}`)
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

  // 대댓글 작성 처리 함수
  const handleReply = async () => {
    if (!replyText || !user || !replyToId) {
      if (!user) alert('답글을 작성하려면 로그인이 필요합니다.');
      return;
    }
    
    await fetch('http://20.5.129.23:5000/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        post_id: id, 
        content: replyText, 
        author: user.username, 
        parent_id: replyToId 
      })
    });
    
    // 폼 초기화
    setReplyText('');
    setReplyToId(null);
    
    // 댓글 목록 새로고침
    fetch(`http://20.5.129.23:5000/api/comments/post/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setComments(data.comments || []);
        }
      });
  };

  // 페이지 변경 함수
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 신청자 목록 조회 함수
  const fetchApplicants = async () => {
    if (!user || !isAuthor) return;
    
    try {
      setLoadingApplicants(true);
      const response = await fetch(`http://20.5.129.23:5000/api/posts/${id}/all-applicants?author=${encodeURIComponent(user.username)}`);
      const data = await response.json();
      
      if (data.ok) {
        setApplicants(data.applicants || []);
        setShowApplicants(true);
      } else {
        alert(data.error || '신청자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('신청자 목록 조회 오류:', error);
      alert('신청자 목록을 불러오는데 오류가 발생했습니다.');
    } finally {
      setLoadingApplicants(false);
    }
  };
  
  // 모달 닫기 함수
  const closeApplicantsModal = () => {
    setShowApplicants(false);
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
      <img src="https://cdn-icons-png.flaticon.com/512/861/861512.png" alt="축구공" style={{ width: 60, position: 'absolute', right: 32, top: 32, opacity: 0.13, zIndex: 1 }} />
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
            <button 
              onClick={fetchApplicants} 
              style={{
                ...editBtnStyle,
                background: '#6a1b9a',
                color: '#fff',
                boxShadow: '0 2px 8px #ce93d8',
                zIndex: 2,
                position: 'relative'
              }}
              disabled={loadingApplicants}
            >
              {loadingApplicants ? '로딩중...' : '신청자 확인'}
            </button>
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
        {isAuthorScreenControl()}
      </div>'              
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
        {post && comments.length > 0 && (
          <CommentTree
            comments={comments}
            user={user}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            editCommentId={editCommentId}
            editCommentText={editCommentText}
            setEditCommentText={setEditCommentText}
            saveEditComment={saveEditComment}
            cancelEditComment={cancelEditComment}
            replyToId={replyToId}
            setReplyToId={setReplyToId}
            replyText={replyText}
            setReplyText={setReplyText}
            handleReply={handleReply}
            isPostAuthor={isAuthor}
            globalUser={globalUser}
            navigate={navigate}
            navigateMessage={navigateMessage}
          />
        )}
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
      
      {/* 신청자 목록 모달 */}
      {showApplicants && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 4, width: 150, textAlign: 'center', color: '#2e7d32', fontSize: 24, fontWeight: 700 }}>신청자 목록</h3>
              <button 
                onClick={closeApplicantsModal}
                style={{
                  background: 'transparent',
                  width: 40,
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#757575'
                }}
              >
                &times;
              </button>
            </div>
            
            {applicants.length === 0 ? (
              <div style={{ 
                padding: 36, 
                textAlign: 'center', 
                color: '#757575', 
                borderRadius: 8, 
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}>
                <div style={{ fontSize: 64, opacity: 0.3 }}>👥</div>
                <div style={{ fontWeight: 500, fontSize: 18 }}>신청자가 없습니다.</div>
                <div style={{ fontSize: 14, color: '#9e9e9e' }}>
                  아직 이 모집글에 신청한 사람이 없습니다.<br />
                  모집글이 더 많은 사람들에게 노출될 수 있도록 태그를 확인해 보세요.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ 
                  marginBottom: 16, 
                  color: '#388e3c', 
                  fontSize: 16, 
                  fontWeight: 500,
                  backgroundColor: '#e8f5e9',
                  padding: '10px 16px',
                  borderRadius: 8
                }}>
                  총 <strong>{applicants.length}</strong>명이 신청했습니다.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e8f5e9', borderBottom: '2px solid #c8e6c9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2e7d32' }}>사용자</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2e7d32' }}>신청일시</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2e7d32' }}>메시지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((applicant, index) => (
                      <tr 
                        key={applicant.id} 
                        style={{ 
                          borderBottom: '1px solid #e0e0e0',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{applicant.user_name}</td>
                        <td style={{ padding: '12px 16px', color: '#757575' }}>
                          {applicant.applied_at ? new Date(applicant.applied_at).toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button 
                            onClick={async() => await navigateMessage(applicant.user_name, user.username, navigate)}
                            style={{
                              background: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 14px',
                              fontSize: 14,
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span style={{ fontSize: 14 }}>✉</span> 메시지 보내기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button 
                onClick={closeApplicantsModal}
                style={{
                  background: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
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
  boxShadow: '0 2px 8px rgb(45, 190, 125)',
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
  saveEditComment,
  cancelEditComment,
  replyToId,
  setReplyToId,
  replyText,
  setReplyText,
  handleReply,
  isPostAuthor,
  globalUser,
  navigate,
  navigateMessage
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
            
            <div style={{ display: 'flex', gap: 8 }}>
              {/* 댓글 작성자만 수정/삭제 버튼 표시 */}
              {!comment.is_deleted && user && comment.author === user.username && (
                <>
                  {editCommentId === comment.id ? (
                    <>
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
                      <button 
                        onClick={cancelEditComment} 
                        style={{ 
                          background: '#e3f2fd', 
                          color: '#1976d2', 
                          border: 'none', 
                          borderRadius: 4, 
                          padding: '4px 8px', 
                          fontSize: 13, 
                          cursor: 'pointer' 
                        }}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => onEdit(comment.id, comment.content)} 
                        style={{ 
                          background: 'rgb(198, 255, 187)', 
                          color: '#36ba53',
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
                </>
              )}

              {/* 게시글 작성자에게만 댓글 작성자에게 메시지 보내기 버튼 표시 */}
              {!comment.is_deleted && isPostAuthor && user && comment.author !== user.username && (
                <button 
                  onClick={async() => await navigateMessage(comment.author, user.username, navigate)}
                  style={{ 
                    background: '#e8f5e9', 
                    color: '#1b5e20', 
                    width: 74,
                    height: 32,
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '4px 8px', 
                    fontSize: 13, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span style={{ fontSize: 12 }}>✉</span> 메시지
                </button>
              )}
              
              {/* 모든 사용자에게 답글 버튼 표시 (삭제된 댓글 제외) */}
              {!comment.is_deleted && user && (
                <button 
                  onClick={() => {
                    if (replyToId === comment.id) {
                      setReplyToId(null); // 답글 폼 닫기
                    } else {
                      setReplyToId(comment.id); // 답글 폼 열기
                      setReplyText(''); // 답글 내용 초기화
                    }
                  }}
                  style={{ 
                    background: '#e3f2fd', 
                    color: '#1976d2',
                    width: 74,
                     
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '4px 8px', 
                    fontSize: 13, 
                    cursor: 'pointer' 
                  }}
                >
                  {replyToId === comment.id ? '취소' : '답글'}
                </button>
              )}
            </div>
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
          
          {/* 답글 작성 폼 */}
          {replyToId === comment.id && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <textarea 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="답글 작성..."
                style={{
                  flex: 7,
                  fontSize: 16,
                  padding: 12,
                  borderRadius: 10,
                  border: '2px solid #fff',
                  background: '#f1f8e9',
                  resize: 'vertical',
                  fontWeight: 500,
                  minHeight: 60,
                  marginRight: 0
                }}
              />
              <button
                onClick={handleReply}
                style={{
                  ...commentBtnStyle,
                  flex: 1,
                  minWidth: 0,
                  borderRadius: '0 10px 10px 0',
                  height: 60,
                  fontSize: 18,
                  marginLeft: 12
                }}
              >
                등록
              </button>
            </div>
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
              cancelEditComment={cancelEditComment}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              isPostAuthor={isPostAuthor}
              globalUser={globalUser}
              navigate={navigate}
              navigateMessage={navigateMessage}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default PostDetail; 