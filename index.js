const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

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
        </li>
      `).join('')}
    </ul>
  `;
  res.send(html);
});

app.get('/add', (req, res) => {
  res.send(`
    <h1>Post a House for Sale</h1>
    <form method="POST" action="/add">
      <label>Title: <input name="title" required></label><br>
      <label>Price: <input name="price" type="number" required></label><br>
      <label>Description:<br><textarea name="description" required></textarea></label><br>
      <button type="submit">Post Listing</button>
    </form>
  `);
});

app.post('/add', async (req, res) => {
  const { title, price, description } = req.body;
  await pool.query(
    'INSERT INTO listings (title, price, description) VALUES ($1, $2, $3)',
    [title, price, description]
  );
  res.redirect('/');
});

app.listen(port, async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      title TEXT,
      price NUMERIC,
      description TEXT
    )
  `);
  console.log(`Server running at http://localhost:${port}`);
});
