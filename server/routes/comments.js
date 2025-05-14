const express = require('express');
const router = express.Router();
const pool = require('../db');

// 댓글 목록 조회 (특정 게시글, 계층형, 시간순 정렬)
router.get('/post/:postId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [req.params.postId]);
    // 계층형 구조로 변환
    function buildTree(list, parentId = null) {
      return list.filter(c => c.parent_id === parentId).map(c => ({
        ...c,
        children: buildTree(list, c.id)
      }));
    }
    const tree = buildTree(rows);
    res.json({ ok: true, comments: tree });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 댓글 생성 (대댓글 지원)
router.post('/', async (req, res) => {
  const { post_id, content, author, parent_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, content, author, parent_id) VALUES (?, ?, ?, ?)',
      [post_id, content, author, parent_id || null]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 댓글 수정 (수정일 자동)
router.put('/:id', async (req, res) => {
  const { content } = req.body;
  try {
    await pool.query('UPDATE comments SET content=?, updated_at=NOW() WHERE id=?', [content, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 댓글 소프트딜리트
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET is_deleted=TRUE WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router; 