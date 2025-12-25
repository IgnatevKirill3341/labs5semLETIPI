import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import newsRouter from './routes/news.js';

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

// Serve static files from dist-gulp for root routes (JS, CSS, etc.)
app.use(express.static(path.join(__dirname, '../dist-gulp')));

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/news', newsRouter);

// Default route - serve GULP build
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-gulp/index.html'));
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
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
  console.log('Note: You may need to accept the self-signed certificate in your browser');
});

