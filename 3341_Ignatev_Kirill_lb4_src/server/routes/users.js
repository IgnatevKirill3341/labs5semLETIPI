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

// Helper function to write users
const writeUsers = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
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

// Get all users (without passwords)
router.get('/', (req, res) => {
  const data = readUsers();
  const usersWithoutPasswords = data.users.map(user => sanitizeUser(user));
  res.json({ users: usersWithoutPasswords });
});

// Get user by ID (without password)
router.get('/:id', (req, res) => {
  const data = readUsers();
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Create user
router.post('/', (req, res) => {
  const data = readUsers();
  
  // Check if user with this email already exists
  const existingUser = data.users.find(u => u.email === req.body.email);
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  
  // Hash password if provided
  const userData = { ...req.body };
  if (userData.password) {
    userData.password = hashPassword(userData.password);
  }
  
  const newUser = {
    id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
    ...userData,
    createdAt: new Date().toISOString()
  };
  data.users.push(newUser);
  writeUsers(data);
  res.status(201).json(sanitizeUser(newUser));
});

// Update user
router.put('/:id', (req, res) => {
  const data = readUsers();
  const index = data.users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    const updateData = { ...req.body };
    // Hash password if provided
    if (updateData.password) {
      updateData.password = hashPassword(updateData.password);
    }
    data.users[index] = { ...data.users[index], ...updateData, updatedAt: new Date().toISOString() };
    writeUsers(data);
    res.json(sanitizeUser(data.users[index]));
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const data = readUsers();
  const index = data.users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    data.users.splice(index, 1);
    writeUsers(data);
    res.json({ message: 'User deleted' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

export default router;




