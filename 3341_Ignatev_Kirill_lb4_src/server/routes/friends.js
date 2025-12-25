import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/friends.json');

// Helper function to read friends
const readFriends = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { friendships: [] };
  }
};

// Helper function to write friends
const writeFriends = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Get all friendships
router.get('/', (req, res) => {
  const data = readFriends();
  res.json(data);
});

// Get friends of a user
router.get('/:userId', (req, res) => {
  const data = readFriends();
  const userId = parseInt(req.params.userId);
  const friends = data.friendships.filter(f => 
    f.userId1 === userId || f.userId2 === userId
  ).map(f => f.userId1 === userId ? f.userId2 : f.userId1);
  res.json({ userId, friends });
});

// Add friendship
router.post('/', (req, res) => {
  const data = readFriends();
  const { userId1, userId2 } = req.body;
  
  // Check if friendship already exists
  const exists = data.friendships.some(f => 
    (f.userId1 === userId1 && f.userId2 === userId2) ||
    (f.userId1 === userId2 && f.userId2 === userId1)
  );
  
  if (exists) {
    return res.status(400).json({ error: 'Friendship already exists' });
  }
  
  const newFriendship = {
    id: data.friendships.length > 0 ? Math.max(...data.friendships.map(f => f.id)) + 1 : 1,
    userId1,
    userId2,
    createdAt: new Date().toISOString()
  };
  
  data.friendships.push(newFriendship);
  writeFriends(data);
  res.status(201).json(newFriendship);
});

// Remove friendship
router.delete('/:userId1/:userId2', (req, res) => {
  const data = readFriends();
  const userId1 = parseInt(req.params.userId1);
  const userId2 = parseInt(req.params.userId2);
  
  const index = data.friendships.findIndex(f => 
    (f.userId1 === userId1 && f.userId2 === userId2) ||
    (f.userId1 === userId2 && f.userId2 === userId1)
  );
  
  if (index !== -1) {
    data.friendships.splice(index, 1);
    writeFriends(data);
    res.json({ message: 'Friendship removed' });
  } else {
    res.status(404).json({ error: 'Friendship not found' });
  }
});

export default router;




