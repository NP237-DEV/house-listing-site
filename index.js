const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Auto-create "houses" table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS houses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT NOT NULL,
        imageurl TEXT
      );
    `);
    console.log("✅ Table 'houses' is ready.");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
})();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Serve the listing form
app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Handle form submission
app.post('/add', upload.single('image'), async (req, res) => {
  const { title, price, description } = req.body;
  const imageurl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await pool.query(
      'INSERT INTO houses (title, price, description, imageurl) VALUES ($1, $2, $3, $4)',
      [title, price, description, imageurl]
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error saving to DB:', error);
    res.status(500).send('Something went wrong.');
  }
});

// Show all listings
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM houses ORDER BY id DESC');
    let html = `
      <html>
      <head><title>House Listings</title></head>
      <body style="font-family:sans-serif;padding:20px;">
        <h1>House Listings</h1>
        <a href="/add">+ Add New Listing</a>
        <hr>`;
    result.rows.forEach((row) => {
      html += `
        <div style="margin-bottom:30px;">
          <h2>${row.title}</h2>
          <p><strong>Price:</strong> $${row.price}</p>
          <p>${row.description}</p>
          ${row.imageurl ? `<img src="${row.imageurl}" style="max-width:300px;">` : ''}
        </div>`;
    });
    html += `</body></html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching listings');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});