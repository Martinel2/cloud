import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AppContext } from '../context/userContext';
const SOCKET_URL = 'http://localhost:5000'; // 서버 주소에 맞게 수정

function MessageScreen() {
  const { state } = useLocation(); // 예: { chatId, user }
  const [messages, setMessages] = useState([]);
  const { globalUser} = useContext(AppContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  // 소켓 연결 및 이벤트 처리
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    // 채팅방 입장
    socketRef.current.emit('joinRoom', { chatId: state.chatId , userId : globalUser});

    // 이전 메시지 불러오기 (서버에서 emit)
    socketRef.current.on('previousMessages', (prevMsgs) => {
      setMessages(prevMsgs);
    });

    // 새 메시지 수신
    socketRef.current.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // 언마운트 시 소켓 연결 해제
    return () => {
      socketRef.current.emit('leftRoom', { chatId: state.chatId , userId : globalUser});
      socketRef.current.disconnect();
    };
  }, [state.chatId]);

  // 스크롤 항상 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSend = () => {
    if (input.trim() === '') return;
    const msg = {
      chatId: state.chatId,
      sender: globalUser,
      text: input,
      time: new Date().toISOString(),
    };
    socketRef.current.emit('sendMessage', msg);
    setInput('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.sender === globalUser ? styles.myMessage : styles.otherMessage),
            }}
          >
            <div>{msg.text}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              {msg.sender} {msg.time && new Date(msg.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputBar}>
        <input
          type="text"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.sendBtn}>전송</button>
      </div>
    </div>
  );
}
/*

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const mockMessages = [
  { id: 1, sender: 'me', text: '안녕하세요!' },
  { id: 2, sender: 'other', text: '안녕하세요. 무엇을 도와드릴까요?' },
  { id: 3, sender: 'me', text: '내일 경기 일정이 궁금해요.' },
  { id: 4, sender: 'other', text: '오후 3시에 시작합니다.' },
];

function MessageScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // 스크롤을 항상 최신 메시지로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { id: Date.now(), sender: 'me', text: input }]);
    setInput('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // 실제로는 채팅방 정보를 받아와야 하지만, 예시로 chatId 사용
  //const chatPartner = `채팅방 #${chatId}`;

  return (
    <div style={styles.container}>
      
      <div style={styles.messages}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              ...(msg.sender === 'me' ? styles.myMessage : styles.otherMessage),
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={styles.inputBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
        <input
          type="text"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.sendBtn}>전송</button>
      </div>
    </div>
  );
}
*/
const styles = {
  container: {
    maxWidth: 600,
    margin: '40px auto',
    background: '#f5f5f5',
    borderRadius: 18,
    boxShadow: '0 2px 12px #b0c4de55',
    display: 'flex',
    flexDirection: 'column',
    height: '80vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(90deg, #388e3c 80%, #fff 100%)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
    minHeight: 60,
  },
  backBtn: {
    background: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 700,
    color: '#388e3c',
    cursor: 'pointer',
    marginRight: 5,
    padding: '6px 6px',
    boxShadow: '0 2px 6px #a5d6a7',
  },
  partner: {
    fontSize: 20,
    fontWeight: 700,
    color: '#388e3c',
    letterSpacing: 1,
  },
  messages: {
    flex: 1,
    padding: '24px 16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  message: {
    maxWidth: '65%',
    padding: '10px 18px',
    borderRadius: 18,
    fontSize: 16,
    lineHeight: 1.5,
    wordBreak: 'break-word',
    boxShadow: '0 1px 4px #b0c4de22',
    marginBottom: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)',
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    background: '#fff',
    color: '#333',
    borderBottomLeftRadius: 4,
    border: '1px solid #e0e0e0',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    borderTop: '1px solid #e0e0e0',
    background: '#fff',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    gap: 12,
  },
  input: {
    flex: 6,
    fontSize: 16,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #b0c4de',
    outline: 'none',
    marginRight: 8,
  },
  sendBtn: {
    flex:1,
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
  },
};

export default MessageScreen;
