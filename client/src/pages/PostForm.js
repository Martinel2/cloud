import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '기타'];
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대 이상', '자유'];
const SKILL_LEVELS = ['초보', '중급', '고수', '자유'];

const CONTENT_TEMPLATE = `모임 시간:
장소:
모인 인원:
추가사항:`;

function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    content: CONTENT_TEMPLATE,
    region: '',
    age_group: '',
    skill_level: '',
    member_count: '',
  });
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/posts/${id}`)
        .then(res => res.json())
        .then(data => setForm({
          title: data.post.title,
          content: data.post.content || CONTENT_TEMPLATE,
          region: data.post.region,
          age_group: data.post.age_group,
          skill_level: data.post.skill_level,
          member_count: data.post.member_count,
        }));
    }
    // eslint-disable-next-line
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = e => {
    // 내용 입력란이 템플릿 그대로일 때 클릭하면 텍스트 전체 선택
    if (e.target.value === CONTENT_TEMPLATE) {
      e.target.select();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/posts/${id}` : '/api/posts';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    navigate('/posts');
  };

  const listBtnStyle = {
    background: '#fff',
    color: '#388e3c',
    border: 'none',
    borderRadius: 10,
    padding: '12px 28px',
    fontWeight: 700,
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 2px 8px #b0c4de',
    letterSpacing: 1,
  };

  return (
    <div style={{
      maxWidth: 540,
      margin: '40px auto',
      background: 'linear-gradient(135deg, #43a047 80%, #fff 100%)',
      borderRadius: 24,
      boxShadow: '0 4px 16px #a5d6a7',
      padding: 36,
      border: '4px solid #fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <img src="https://cdn-icons-png.flaticon.com/512/861/861512.png" alt="축구공" style={{ width: 48, position: 'absolute', right: 24, top: 24, opacity: 0.18 }} />
      <h2 style={{ marginBottom: 28, color: '#fff', textShadow: '0 2px 8px #388e3c', fontWeight: 900, letterSpacing: 2, fontSize: 28, textAlign: 'center', background: 'rgba(0,0,0,0.08)', borderRadius: 12, padding: 8 }}>게시글 작성</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <select name="region" value={form.region} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 10, border: '2px solid #fff', background: '#e8f5e9', fontWeight: 600 }}>
            <option value="">지역</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="age_group" value={form.age_group} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 10, border: '2px solid #fff', background: '#e8f5e9', fontWeight: 600 }}>
            <option value="">연령대</option>
            {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="skill_level" value={form.skill_level} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 10, border: '2px solid #fff', background: '#e8f5e9', fontWeight: 600 }}>
            <option value="">실력</option>
            {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input name="member_count" type="number" min="1" value={form.member_count} onChange={handleChange} required placeholder="모집인원" style={{ flex: 1, padding: 10, borderRadius: 10, border: '2px solid #fff', background: '#e8f5e9', fontWeight: 600 }} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="제목" style={{ width: '100%', fontSize: 20, padding: 12, borderRadius: 10, border: '2px solid #fff', fontWeight: 700, background: '#f1f8e9' }} required />
        </div>
        <div style={{ marginBottom: 36 }}>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            onFocus={handleFocus}
            rows={8}
            placeholder="내용을 입력하세요"
            style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 10, border: '2px solid #fff', background: '#f1f8e9', resize: 'vertical', fontWeight: 500 }}
            required
          />
        </div>
        <button type="submit" style={{ width: '100%', background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)', color: '#fff', fontWeight: 700, fontSize: 20, border: 'none', borderRadius: 12, padding: '16px 0', cursor: 'pointer', boxShadow: '0 2px 8px #a5d6a7', letterSpacing: 2 }}>
          글 작성
        </button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={() => navigate('/posts')} style={listBtnStyle}>목록으로</button>
      </div>
      {/* 축구장 라인 효과 */}
      <div style={{ position: 'absolute', left: 0, top: '30%', width: '100%', height: 4, background: '#fff', opacity: 0.3, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: '10%', top: '10%', width: 4, height: '80%', background: '#fff', opacity: 0.2, borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: '10%', top: '10%', width: 4, height: '80%', background: '#fff', opacity: 0.2, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, width: 4, height: '100%', background: '#fff', opacity: 0.08, borderRadius: 2 }} />
    </div>
  );
}

export default PostForm; 