const express = require('express');
const router = express.Router();
const pool = require('../db');
var cid = 120;
router.get('/search/:user1/:user2', async (req, res) => {
  const user1 = req.params.user1;
  const user2 = req.params.user2;
  console.log(user1 + " & " + user2);
  try {
    const [rows] = await pool.query(`
      SELECT chat_id FROM chat_table WHERE (chat_user_1 = ? AND chat_user_2 = ?) OR (chat_user_1 = ? AND chat_user_2 = ?)
    `, [user1, user2, user1, user2]);
    if (rows.length > 0) {
      console.log(rows[0].chat_id);
      res.json({ ok: true, chat_id: rows[0].chat_id });
    }
    else {
      cid++;
      await pool.query(`
        INSERT INTO chat_table(chat_id, chat_user_1, chat_user_2) VALUES (?,?,?)
      `, [cid, user1, user2]);
      res.json({ ok: true, chat_id: cid});
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// /api/chat/:user
router.get('/:user', async (req, res) => {
  const user = req.params.user;
  console.log(user);
  try {
    const [rows] = await pool.query(`
      SELECT 
    c.chat_id,
    c.chat_user_1,
    c.chat_user_2,
    m.message_text AS last_message,
    m.message_time AS last_message_time,
    (
      SELECT COUNT(*) 
      FROM recruit_board.message_table 
      WHERE chat_id = c.chat_id 
        AND writer_id <> ?
        AND message_read = 0
    ) AS unread_count
FROM chat_table c
LEFT JOIN (
    SELECT t1.chat_id, t1.message_text, t1.message_time
    FROM message_table t1
    INNER JOIN (
        SELECT chat_id, MAX(message_time) AS max_time
        FROM message_table
        GROUP BY chat_id
    ) t2 ON t1.chat_id = t2.chat_id AND t1.message_time = t2.max_time
) m ON c.chat_id = m.chat_id
WHERE c.chat_user_1 = ? OR c.chat_user_2 = ?
ORDER BY m.message_time DESC

    `, [user, user, user]);
    console.log(rows);
    res.json({ ok: true, chats: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
