const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;
const pool = require('./db');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ ok: true, result: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});