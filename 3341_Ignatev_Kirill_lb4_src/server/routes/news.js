import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/news.json');

// Helper function to read news
const readNews = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { news: [] };
  }
};

// Helper function to write news
const writeNews = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Get all news (with optional user filter)
router.get('/', (req, res) => {
  const data = readNews();
  let news = data.news;
  
  if (req.query.userId) {
    const userId = parseInt(req.query.userId);
    news = news.filter(n => n.authorId === userId);
  }
  
  // Sort by date (newest first)
  news.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ news });
});

// Get news by ID
router.get('/:id', (req, res) => {
  const data = readNews();
  const newsItem = data.news.find(n => n.id === parseInt(req.params.id));
  if (newsItem) {
    res.json(newsItem);
  } else {
    res.status(404).json({ error: 'News not found' });
  }
});

// Create news
router.post('/', (req, res) => {
  const data = readNews();
  const newNews = {
    id: data.news.length > 0 ? Math.max(...data.news.map(n => n.id)) + 1 : 1,
    ...req.body,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    createdAt: new Date().toISOString()
  };
  data.news.push(newNews);
  writeNews(data);
  
  // Emit WebSocket event
  const io = req.app.get('io');
  if (io) {
    io.emit('newNews', newNews);
  }
  
  res.status(201).json(newNews);
});

// Update news
router.put('/:id', (req, res) => {
  const data = readNews();
  const index = data.news.findIndex(n => n.id === parseInt(req.params.id));
  if (index !== -1) {
    data.news[index] = { ...data.news[index], ...req.body, updatedAt: new Date().toISOString() };
    writeNews(data);
    res.json(data.news[index]);
  } else {
    res.status(404).json({ error: 'News not found' });
  }
});

// Delete news
router.delete('/:id', (req, res) => {
  const data = readNews();
  const index = data.news.findIndex(n => n.id === parseInt(req.params.id));
  if (index !== -1) {
    data.news.splice(index, 1);
    writeNews(data);
    res.json({ message: 'News deleted' });
  } else {
    res.status(404).json({ error: 'News not found' });
  }
});

// Toggle news status (block/activate)
router.patch('/:id/toggle', (req, res) => {
  const data = readNews();
  const index = data.news.findIndex(n => n.id === parseInt(req.params.id));
  if (index !== -1) {
    data.news[index].isActive = !data.news[index].isActive;
    data.news[index].updatedAt = new Date().toISOString();
    writeNews(data);
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.emit('newsUpdate', data.news[index]);
    }
    
    res.json(data.news[index]);
  } else {
    res.status(404).json({ error: 'News not found' });
  }
});

export default router;




