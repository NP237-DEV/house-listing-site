const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup storage for images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// SQLite DB
const db = new sqlite3.Database('houses.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    description TEXT,
    location TEXT,
    image_path TEXT
  )`);
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES

// Homepage - show listings with filter, sort, search
app.get('/', (req, res) => {
  const search = req.query.search || '';
  const sort = req.query.sort || '';

  let sql = 'SELECT * FROM houses';
  const params = [];

  if (search) {
    sql += ' WHERE name LIKE ? OR location LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'low') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'high') {
    sql += ' ORDER BY price DESC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.send('Database error');
    } else {
      res.render('index', { houses: rows, search, sort });
    }
  });
});

// Show add house form
app.get('/add', (req, res) => {
  res.render('add');
});

// Handle new house submission
app.post('/add', upload.single('image'), (req, res) => {
  const { name, price, description, location } = req.body;
  const image_path = req.file ? 'uploads/' + req.file.filename : null;

  db.run(
    'INSERT INTO houses (name, price, description, location, image_path) VALUES (?, ?, ?, ?, ?)',
    [name, price, description, location, image_path],
    (err) => {
      if (err) {
        res.send('Error saving to database');
      } else {
        res.redirect('/');
      }
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});