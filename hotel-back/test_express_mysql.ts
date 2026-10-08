import express from 'express';
import { query } from './src/db.js';

const app = express();
app.delete('/:id', async (req, res) => {
  const { id } = req.params; // this is guaranteed to be a string
  console.log("type of id in express params:", typeof id);
  try {
    await query(
      "UPDATE rooms SET is_deleted = TRUE, available = FALSE WHERE id = ? OR room_number = ? OR room_uid = ?",
      [id, id, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error during update:", err);
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server listening on port ${port}`);
  try {
    const fetchRes = await fetch(`http://localhost:${port}/3`, { method: 'DELETE' });
    const text = await fetchRes.text();
    console.log("Response:", fetchRes.status, text);
  } finally {
    server.close();
    process.exit(0);
  }
});
