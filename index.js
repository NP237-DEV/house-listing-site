const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./houses.db');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT
)`);

// Homepage with filters, search, and sort
app.get('/', (req, res) => {
  const { type, location, sort, search } = req.query;
  let sql = 'SELECT * FROM houses WHERE 1=1';
  let params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (location) {
    sql += ' AND location = ?';
    params.push(location);
  }

  if (search) {
    sql += ' AND (title LIKE ? OR location LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'asc') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'desc') {
    sql += ' ORDER BY price DESC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.send('Error loading houses');
    res.render('index', { houses: rows, search });
  });
});

// Detail page
app.get('/listing/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM houses WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.send('Listing not found');
    res.render('detail', { house: row });
  });
});

// Add new listing page
app.get('/add', (req, res) => {
  res.render('add');
});

// Handle add new listing
app.post('/add', (req, res) => {
  const { title, price, description, location, type } = req.body;
  db.run(
    'INSERT INTO houses (title, price, description, location, type) VALUES (?, ?, ?, ?, ?)',
    [title, price, description, location, type],
    err => {
      if (err) return res.send('Failed to add listing');
      res.redirect('/');
    }
  );
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));