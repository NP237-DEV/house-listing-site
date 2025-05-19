
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const streamifier = require('streamifier');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = process.env.PORT || 3000;
const upload = multer();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM listings ORDER BY id DESC');
  const listings = result.rows;

  let html = `
    <h1>Houses for Sale</h1>
    <a href="/add">Post a New Listing</a>
    <ul>
      ${listings.map(listing => `
        <li>
          <h2>${listing.title}</h2>
          <p>Price: $${listing.price}</p>
          <p>${listing.description}</p>
          ${listing.image_url ? `<img src="${listing.image_url}" width="300">` : ''}
        </li>
      `).join('')}
    </ul>
  `;
  res.send(html);
});

app.get('/add', (req, res) => {
  res.send(`
    <h1>Post a House for Sale</h1>
    <form method="POST" action="/add" enctype="multipart/form-data">
      <label>Title: <input name="title" required></label><br>
      <label>Price: <input name="price" type="number" required></label><br>
      <label>Description:<br><textarea name="description" required></textarea></label><br>
      <label>Image: <input type="file" name="image" accept="image/*" required></label><br>
      <button type="submit">Post Listing</button>
    </form>
  `);
});

app.post('/add', upload.single('image'), async (req, res) => {
  const { title, price, description } = req.body;
  let imageUrl = null;

  if (req.file) {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) {
        console.error('Cloudinary Error:', error);
        res.status(500).send('Image upload failed');
      } else {
        imageUrl = result.secure_url;
        saveListing();
      }
    });

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } else {
    saveListing();
  }

  async function saveListing() {
    await pool.query(
      'INSERT INTO listings (title, price, description, image_url) VALUES ($1, $2, $3, $4)',
      [title, price, description, imageUrl]
    );
    res.redirect('/');
  }
});

app.listen(port, async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      title TEXT,
      price NUMERIC,
      description TEXT,
      image_url TEXT
    )
  `);
  console.log(`Server running at http://localhost:${port}`);
});
