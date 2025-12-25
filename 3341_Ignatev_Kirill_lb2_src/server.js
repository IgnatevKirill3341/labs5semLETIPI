const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'library-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Passport Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const users = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8'));
      const user = users.find(u => u.username === username);
      
      if (!user) {
        console.log('User not found:', username);
        return done(null, false, { message: 'Неверное имя пользователя' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return done(null, false, { message: 'Неверный пароль' });
      }
      
      console.log('User authenticated:', username);
      return done(null, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    const user = users.find(u => u.id === id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Helper functions
async function readBooks() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'books.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeBooks(books) {
  await fs.writeFile(
    path.join(__dirname, 'data', 'books.json'),
    JSON.stringify(books, null, 2),
    'utf8'
  );
}

// Authentication middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Routes
app.get('/', ensureAuthenticated, (req, res) => {
  res.redirect('/books');
});

app.get('/login', (req, res) => {
  const error = req.query.error || null;
  res.render('login', { error });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login?error=' + encodeURIComponent(info?.message || 'Неверное имя пользователя или пароль'));
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/books');
    });
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    const users = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    
    if (users.find(u => u.username === username)) {
      return res.render('register', { error: 'Пользователь с таким именем уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      name
    };
    
    users.push(newUser);
    await fs.writeFile(
      path.join(__dirname, 'data', 'users.json'),
      JSON.stringify(users, null, 2),
      'utf8'
    );
    
    res.redirect('/login');
  } catch (error) {
    res.render('register', { error: 'Ошибка при регистрации' });
  }
});

app.get('/books', ensureAuthenticated, async (req, res) => {
  const books = await readBooks();
  res.render('books-list', { books, user: req.user });
});

app.get('/books/:id', ensureAuthenticated, async (req, res) => {
  const books = await readBooks();
  const book = books.find(b => b.id === req.params.id);
  if (!book) {
    return res.status(404).send('Книга не найдена');
  }
  res.render('book-detail', { book, user: req.user });
});

// REST API routes
app.get('/api/books', ensureAuthenticated, async (req, res) => {
  let books = await readBooks();
  
  // Filtering
  if (req.query.filter === 'available') {
    books = books.filter(b => b.isAvailable);
  } else if (req.query.filter === 'borrowed') {
    books = books.filter(b => !b.isAvailable);
  } else if (req.query.filter === 'overdue') {
    const today = new Date().toISOString().split('T')[0];
    books = books.filter(b => !b.isAvailable && b.returnDate && b.returnDate < today);
  }
  
  res.json(books);
});

app.post('/api/books', ensureAuthenticated, async (req, res) => {
  try {
    // Валидация даты выпуска - не может быть из будущего
    const releaseDate = req.body.releaseDate || '';
    if (releaseDate) {
      const today = new Date().toISOString().split('T')[0];
      if (releaseDate > today) {
        return res.status(400).json({ error: 'Дата выпуска не может быть из будущего' });
      }
    }
    
    const books = await readBooks();
    const newBook = {
      id: uuidv4(),
      title: req.body.title || '',
      author: req.body.author || '',
      releaseDate: releaseDate,
      isAvailable: true,
      borrowedBy: null,
      returnDate: null,
      coverImage: null
    };
    books.push(newBook);
    await writeBooks(books);
    res.json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при добавлении книги' });
  }
});

app.put('/api/books/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Валидация даты выпуска - не может быть из будущего
    if (req.body.releaseDate) {
      const today = new Date().toISOString().split('T')[0];
      if (req.body.releaseDate > today) {
        return res.status(400).json({ error: 'Дата выпуска не может быть из будущего' });
      }
    }
    
    const books = await readBooks();
    const index = books.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    books[index] = {
      ...books[index],
      title: req.body.title || books[index].title,
      author: req.body.author || books[index].author,
      releaseDate: req.body.releaseDate || books[index].releaseDate
    };
    
    await writeBooks(books);
    res.json(books[index]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении книги' });
  }
});

app.delete('/api/books/:id', ensureAuthenticated, async (req, res) => {
  try {
    const books = await readBooks();
    const index = books.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    // Delete cover image if exists
    if (books[index].coverImage) {
      const imagePath = path.join(__dirname, 'public', books[index].coverImage);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    books.splice(index, 1);
    await writeBooks(books);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении книги' });
  }
});

app.post('/api/books/:id/borrow', ensureAuthenticated, async (req, res) => {
  try {
    const books = await readBooks();
    const index = books.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    if (!books[index].isAvailable) {
      return res.status(400).json({ error: 'Книга уже выдана' });
    }
    
    books[index].isAvailable = false;
    books[index].borrowedBy = req.body.borrowedBy || '';
    books[index].returnDate = req.body.returnDate || '';
    
    await writeBooks(books);
    res.json(books[index]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при выдаче книги' });
  }
});

app.post('/api/books/:id/return', ensureAuthenticated, async (req, res) => {
  try {
    const books = await readBooks();
    const index = books.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    books[index].isAvailable = true;
    books[index].borrowedBy = null;
    books[index].returnDate = null;
    
    await writeBooks(books);
    res.json(books[index]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при возврате книги' });
  }
});

app.post('/api/books/:id/cover', ensureAuthenticated, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const books = await readBooks();
    const index = books.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    // Delete old cover if exists
    if (books[index].coverImage) {
      const oldImagePath = path.join(__dirname, 'public', books[index].coverImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    
    books[index].coverImage = `/uploads/${req.file.filename}`;
    await writeBooks(books);
    res.json({ coverImage: books[index].coverImage });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при загрузке обложки' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
