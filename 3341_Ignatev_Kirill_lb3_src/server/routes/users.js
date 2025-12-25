import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Get all users
router.get('/', (req, res) => {
  const data = readUsers();
  res.json(data);
});

// Get user by ID
router.get('/:id', (req, res) => {
  const data = readUsers();
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Create user
router.post('/', (req, res) => {
  const data = readUsers();
  const newUser = {
    id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.users.push(newUser);
  writeUsers(data);
  res.status(201).json(newUser);
});

// Update user
router.put('/:id', (req, res) => {
  const data = readUsers();
  const index = data.users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    data.users[index] = { ...data.users[index], ...req.body, updatedAt: new Date().toISOString() };
    writeUsers(data);
    res.json(data.users[index]);
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

