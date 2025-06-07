const express = require('express');
const router = express.Router();
const pool = require('../db');

// 게시글 목록 조회 (진행중/완료 필터, 태그 포함)
router.get('/', async (req, res) => {
  console.log("in post/");
  try {
    const { recruiting } = req.query; // ?recruiting=true/false
    let query = 'SELECT * FROM posts';
    const params = [];
    if (recruiting === 'true') {
      query += ' WHERE is_recruiting = TRUE';
    } else if (recruiting === 'false') {
      query += ' WHERE is_recruiting = FALSE';
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    
    // is_recruiting을 member_count에 따라 자동으로 설정
    const formattedRows = rows.map(row => ({
      ...row,
      is_recruiting: row.member_count > 0
    }));
    
    console.log('게시글 목록 반환:', formattedRows.slice(0, 2).map(p => ({ 
      id: p.id, 
      title: p.title, 
      is_recruiting: p.is_recruiting, 
      member_count: p.member_count 
    })));
    
    res.json({ ok: true, posts: formattedRows });
  } catch (err) {
    console.error('게시글 목록 조회 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글 상세 조회 (수정일, 태그 포함, 조회수 증가)
router.get('/:id', async (req, res) => {
  try {
    // 조회수 증가
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    
    // is_recruiting을 member_count에 따라 자동으로 설정
    const post = {
      ...rows[0],
      is_recruiting: rows[0].member_count > 0
    };
    
    console.log('게시글 상세 반환:', { 
      id: post.id, 
      title: post.title, 
      is_recruiting: post.is_recruiting,
      member_count: post.member_count
    });
    
    res.json({ ok: true, post });
  } catch (err) {
    console.error('게시글 상세 조회 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글 생성 (태그, extra_tags, updated_at)
router.post('/', async (req, res) => {
  const { title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags, is_recruiting } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags, is_recruiting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags, is_recruiting || 1]
    );
    console.log('새 게시글 생성:', { id: result.insertId, is_recruiting });
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('게시글 생성 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글 수정 (수정일 자동, 태그, extra_tags)
router.put('/:id', async (req, res) => {
  const { title, content, meeting_time, meeting_place, member_count, is_recruiting, region, age_group, skill_level, extra_tags } = req.body;
  try {
    await pool.query(
      'UPDATE posts SET title=?, content=?, meeting_time=?, meeting_place=?, member_count=?, is_recruiting=?, region=?, age_group=?, skill_level=?, extra_tags=? WHERE id=?',
      [title, content, meeting_time, meeting_place, member_count, is_recruiting, region, age_group, skill_level, extra_tags, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글 삭제
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 모집 신청자 확인 API
router.get('/:id/applicants', async (req, res) => {
  const postId = req.params.id;
  const userName = req.query.user_name;
  
  if (!userName) {
    return res.status(400).json({ ok: false, error: 'user_name parameter required' });
  }
  
  try {
    console.log('모집 신청 확인:', { postId, userName });
    const [applicants] = await pool.query(
      'SELECT * FROM post_applicants WHERE post_id = ? AND user_name = ?',
      [postId, userName]
    );
    
    const applied = applicants.length > 0;
    console.log('모집 신청 결과:', { applied, count: applicants.length });
    
    res.json({ 
      ok: true, 
      applied,
      data: applied ? applicants[0] : null
    });
  } catch (err) {
    console.error('모집 신청 확인 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 모집 신청
router.post('/:id/apply', async (req, res) => {
  const postId = req.params.id;
  const { user_name } = req.body;
  if (!user_name) return res.status(400).json({ ok: false, error: 'user_name required' });
  
  console.log('모집 신청 시도:', { postId, user_name });
  
  try {
    // 모집 마감 체크 (member_count > 0 확인)
    const [[post]] = await pool.query('SELECT member_count FROM posts WHERE id=?', [postId]);
    console.log('게시글 정보:', post);
    
    if (!post) return res.status(404).json({ ok: false, error: '게시글 없음' });
    if (post.member_count <= 0) {
      return res.status(400).json({ ok: false, error: '이미 마감된 모집입니다.' });
    }
    
    // 중복 신청 체크
    const [exists] = await pool.query('SELECT * FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    if (exists.length > 0) {
      console.log('이미 신청한 사용자:', { user_name });
      return res.status(400).json({ ok: false, error: '이미 신청하셨습니다.' });
    }
    
    // 신청 처리
    await pool.query('INSERT INTO post_applicants (post_id, user_name) VALUES (?, ?)', [postId, user_name]);
    await pool.query('UPDATE posts SET member_count = member_count - 1 WHERE id=?', [postId]);
    
    console.log('신청 성공:', { postId, user_name });
    res.json({ ok: true });
  } catch (err) {
    console.error('모집 신청 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 모집 취소
router.post('/:id/cancel', async (req, res) => {
  const postId = req.params.id;
  const { user_name } = req.body;
  if (!user_name) return res.status(400).json({ ok: false, error: 'user_name required' });
  
  console.log('모집 취소 시도:', { postId, user_name });
  
  try {
    // 신청 여부 체크
    const [exists] = await pool.query('SELECT * FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    if (exists.length === 0) {
      console.log('신청 내역 없음:', { postId, user_name });
      return res.status(400).json({ ok: false, error: '신청 내역이 없습니다.' });
    }
    
    // 취소 처리
    await pool.query('DELETE FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    
    // 취소 후 멤버 수 업데이트
    await pool.query('UPDATE posts SET member_count = member_count + 1 WHERE id=?', [postId]);
    
    console.log('취소 성공:', { postId, user_name });
    res.json({ ok: true });
  } catch (err) {
    console.error('모집 취소 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글의 모든 신청자 목록 조회 API (게시글 작성자 전용)
router.get('/:id/all-applicants', async (req, res) => {
  const postId = req.params.id;
  const { author } = req.query; // 요청한 사용자 (작성자 확인용)
  
  if (!author) {
    return res.status(400).json({ ok: false, error: '작성자 정보가 필요합니다.' });
  }
  
  try {
    // 게시글 정보 조회
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ ok: false, error: '게시글을 찾을 수 없습니다.' });
    }
    
    // 작성자 확인
    const post = posts[0];
    if (post.author !== author) {
      return res.status(403).json({ ok: false, error: '게시글 작성자만 신청자 목록을 조회할 수 있습니다.' });
    }
    
    // 신청자 목록 조회
    const [applicants] = await pool.query(
      'SELECT * FROM post_applicants WHERE post_id = ? ORDER BY id ASC',
      [postId]
    );
    
    res.json({ 
      ok: true, 
      post: {
        id: post.id,
        title: post.title,
        member_count: post.member_count
      },
      applicants: applicants,
      total: applicants.length
    });
  } catch (err) {
    console.error('신청자 목록 조회 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router; 