const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Set up PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Upload image setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Homepage - show listings
app.get('/', async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM houses ORDER BY id DESC');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>House Listings</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <h1>Houses for Sale</h1>
        <a href="/add">Post a New Listing</a>
        <ul>
          ${results.rows.map(row => `
            <li>
              <h2>${row.title}</h2>
              <p><strong>Price:</strong> $${row.price}</p>
              <p>${row.description}</p>
              <img src="${row.imageurl}" alt="${row.title}" width="300">
            </li>
          `).join('')}
        </ul>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listings.");
  }
});

// Show form
app.get('/add', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Add Listing</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h2>Post a House for Sale</h2>
      <form action="/add" method="post" enctype="multipart/form-data">
        <input type="text" name="title" placeholder="Title" required><br>
        <input type="number" name="price" placeholder="Price" required><br>
        <textarea name="description" placeholder="Description" required></textarea><br>
        <input type="file" name="image" accept="image/*" required><br>
        <button type="submit">Post Listing</button>
      </form>
    </body>
    </html>
  `);
});

// Handle form
app.post('/add', upload.single('image'), async (req, res) => {
  const { title, price, description } = req.body;
  const imageurl = req.file ? '/uploads/' + req.file.filename : '';

  try {
    await pool.query(
      'INSERT INTO houses (title, price, description, imageurl) VALUES ($1, $2, $3, $4)',
      [title, price, description, imageurl]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving listing.');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});