import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';

import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import newsRouter from './routes/news.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3443;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from both build directories
app.use('/gulp', express.static(path.join(__dirname, '../dist-gulp')));
app.use('/webpack', express.static(path.join(__dirname, '../dist-webpack')));
// Angular app static files (Angular 17+ outputs to browser/ subdirectory)
app.use('/app', express.static(path.join(__dirname, '../dist-angular/browser')));

// Serve static files from dist-gulp for root routes (JS, CSS, etc.)
app.use(express.static(path.join(__dirname, '../dist-gulp')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/news', newsRouter);

// Default route - serve GULP build (admin panel)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-gulp/index.html'));
});

// Angular app route (must be last to not interfere with static files)
// This route handles all Angular routes (SPA routing)
// express.static middleware above will handle static files first
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-angular/browser/index.html'));
});

// HTTPS Configuration
let options;
try {
  options = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/server.crt'))
  };
} catch (error) {
  console.error('SSL certificates not found!');
  console.error('Please run: bash scripts/generate-ssl.sh');
  console.error('Or create ssl/server.key and ssl/server.crt manually');
  process.exit(1);
}

// Create HTTPS server
const server = https.createServer(options, app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Listen for new news events
  socket.on('newNews', (news) => {
    // Broadcast to all connected clients
    io.emit('newNews', news);
  });

  // Listen for news updates
  socket.on('newsUpdate', (news) => {
    io.emit('newsUpdate', news);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
  console.log('Note: You may need to accept the self-signed certificate in your browser');
  console.log('Admin panel: https://localhost:3443/');
  console.log('User app: https://localhost:3443/app/');
});

