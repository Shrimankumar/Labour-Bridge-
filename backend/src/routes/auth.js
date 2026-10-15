const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'worker', phone = null } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required.' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!['worker', 'employer'].includes(role)) return res.status(400).json({ error: 'Role must be worker or employer.' });
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Email is already registered.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute('INSERT INTO users (name,email,password_hash,role,phone) VALUES (?,?,?,?,?)', [String(name).trim(), String(email).trim().toLowerCase(), hash, role, phone]);
    if (role === 'worker') await pool.execute('INSERT INTO worker_profiles (user_id) VALUES (?)', [result.insertId]);
    const user = { id: result.insertId, name: String(name).trim(), email: String(email).trim().toLowerCase(), role };
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const [rows] = await pool.execute('SELECT id,name,email,password_hash,role,phone FROM users WHERE email = ? AND is_active = 1', [String(email).trim().toLowerCase()]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
    const { password_hash, ...user } = rows[0];
    res.json({ user, token: tokenFor(user) });
  } catch (e) { next(e); }
});
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id,name,email,role,phone,created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});
module.exports = router;
