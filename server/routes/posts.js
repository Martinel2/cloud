const express = require('express');
const router = express.Router();
const pool = require('../db');

// 게시글 목록 조회 (진행중/완료 필터, 태그 포함)
router.get('/', async (req, res) => {
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
    res.json({ ok: true, posts: rows });
  } catch (err) {
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
    res.json({ ok: true, post: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 게시글 생성 (태그, extra_tags, updated_at)
router.post('/', async (req, res) => {
  const { title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, author, meeting_time, meeting_place, member_count, region, age_group, skill_level, extra_tags]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
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

// 모집 신청
router.post('/:id/apply', async (req, res) => {
  const postId = req.params.id;
  const { user_name } = req.body;
  if (!user_name) return res.status(400).json({ ok: false, error: 'user_name required' });
  try {
    // 모집 마감 체크
    const [[post]] = await pool.query('SELECT member_count, is_recruiting FROM posts WHERE id=?', [postId]);
    if (!post) return res.status(404).json({ ok: false, error: '게시글 없음' });
    if (!post.is_recruiting || post.member_count <= 0) {
      return res.status(400).json({ ok: false, error: '이미 마감된 모집입니다.' });
    }
    // 중복 신청 체크
    const [exists] = await pool.query('SELECT * FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    if (exists.length > 0) {
      return res.status(400).json({ ok: false, error: '이미 신청하셨습니다.' });
    }
    // 신청 처리
    await pool.query('INSERT INTO post_applicants (post_id, user_name) VALUES (?, ?)', [postId, user_name]);
    await pool.query('UPDATE posts SET member_count = member_count - 1 WHERE id=?', [postId]);
    // 모집인원이 0이 되면 모집 완료 처리
    await pool.query('UPDATE posts SET is_recruiting = FALSE WHERE id=? AND member_count <= 1', [postId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 모집 취소
router.post('/:id/cancel', async (req, res) => {
  const postId = req.params.id;
  const { user_name } = req.body;
  if (!user_name) return res.status(400).json({ ok: false, error: 'user_name required' });
  try {
    // 신청 여부 체크
    const [exists] = await pool.query('SELECT * FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    if (exists.length === 0) {
      return res.status(400).json({ ok: false, error: '신청 내역이 없습니다.' });
    }
    // 취소 처리
    await pool.query('DELETE FROM post_applicants WHERE post_id=? AND user_name=?', [postId, user_name]);
    await pool.query('UPDATE posts SET member_count = member_count + 1, is_recruiting = TRUE WHERE id=?', [postId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router; 