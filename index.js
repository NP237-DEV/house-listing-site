const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('./houses.db');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    price INTEGER,
    description TEXT,
    image TEXT
  )
`);

// Home - show listings with filter, sort, search
app.get('/', (req, res) => {
  const { search, sort } = req.query;
  let query = 'SELECT * FROM houses';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR location LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'low') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'high') {
    query += ' ORDER BY price DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    res.render('index', { houses: rows, search: search || '', sort: sort || '' });
  });
});

// Add house form
app.get('/add', (req, res) => {
  res.render('add');
});

// Handle add form submission
app.post('/add', (req, res) => {
  const { name, location, price, description, image } = req.body;
  const stmt = db.prepare('INSERT INTO houses (name, location, price, description, image) VALUES (?, ?, ?, ?, ?)');
  stmt.run(name, location, price, description, image, err => {
    if (err) {
      return res.status(500).send('Failed to add listing');
    }
    res.redirect('/');
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});