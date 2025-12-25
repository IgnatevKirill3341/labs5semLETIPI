import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/users.json');

// Helper function to read users
const readUsers = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [] };
  }
};

// Helper function to hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper function to verify password
const verifyPassword = (password, hash) => {
  return hashPassword(password) === hash;
};

// Helper function to remove password from user object
const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = readUsers();
  const user = data.users.find(u => u.email === email && u.status === 'active');

  if (!user) {
    return res.status(401).json({ user: null, error: 'Invalid email or password' });
  }

  // Verify password
  if (!user.password || !verifyPassword(password, user.password)) {
    return res.status(401).json({ user: null, error: 'Invalid email or password' });
  }

  res.json({ user: sanitizeUser(user) });
});

export default router;

