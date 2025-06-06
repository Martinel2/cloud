import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AppContext } from '../context/userContext';
const SOCKET_URL = 'http://20.5.129.23:5000'; // 서버 주소에 맞게 수정

function updateChatList(chats, setChats, loading, setLoading, error, setError, globalUser) {
  if (!globalUser) return;
    setLoading(true);
    setError('');
    fetch(`/api/chat/${globalUser}`)
      .then(res => {
        if (!res.ok) throw new Error('서버 오류');
        return res.json();
      })
      .then(data => {
        setChats(data.chats || []);
        setLoading(false);
      })
      .catch(err => {
        setError('채팅 목록을 불러오지 못했습니다.');
        setLoading(false);
      });
}

function ChatList() {
  const navigate = useNavigate();
  const { globalUser } = useContext(AppContext); // 전역 사용자 정보
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  // 소켓 연결 및 이벤트 처리
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    // 채팅창 입장
    socketRef.current.emit('joinChatList', { userId : globalUser});

    // 새 메시지 수신
    socketRef.current.on('receiveMessage', (msg) => {
      updateChatList(chats, setChats, loading, setLoading, error, setError, globalUser);
    });

    // 언마운트 시 소켓 연결 해제
    return () => {
      socketRef.current.disconnect();
    };
  }, [globalUser]);
  // 채팅 목록 불러오기
  useEffect(() => {
    updateChatList(chats, setChats, loading, setLoading, error, setError, globalUser);
  }, [globalUser]);

  const handleChatClick = (chatId) => {
    navigate('/messages', { state: { chatId: chatId } });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>{globalUser}의 채팅 목록</h2>

      {/* 로딩 상태 */}
      {loading && (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
          채팅 목록을 불러오는 중...
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div style={{ padding: 24, textAlign: 'center', color: 'red' }}>
          {error}
        </div>
      )}

      {/* 채팅 목록 */}
      <div style={styles.list}>
        {chats.map(chat => (
          <div
            key={chat.chat_id}
            style={styles.chatItem}
            onClick={() => handleChatClick(chat.chat_id)}
          >
            <div style={styles.chatInfo}>
              <div style={styles.chatName}>
                {chat.chat_user_1 === globalUser ? chat.chat_user_2 : chat.chat_user_1}
                {/* 안읽은 메시지 개수 표시 */}
                {chat.unread_count > 0 && (
                  <span style={styles.unreadBadge}>{chat.unread_count}</span>
                )}
              </div>
              <div style={styles.lastMessage}>{chat.last_message}</div>
            </div>
            <div style={styles.chatTime}>
              {new Date(chat.last_message_time).toLocaleString()}
            </div>
          </div>
        ))}

        {/* 채팅이 없을 때 */}
        {!loading && !error && chats.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
            활성화된 채팅이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '40px auto',
    border: '1px solid #ddd',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    margin: 0,
    padding: '16px 24px',
    borderBottom: '1px solid #eee',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  chatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  chatInfo: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
  },
  chatName: {
    fontWeight: '600',
    fontSize: 18,
    color: '#222',
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start',
  },
  unreadBadge: {
    background: '#ff4444',
    color: '#fff',
    borderRadius: '50%',
    fontSize: 12,
    padding: '2px 6px',
    marginLeft: 8,
  },
};

export default ChatList;
