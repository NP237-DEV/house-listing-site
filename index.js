const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

let listings = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
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

app.post('/add', (req, res) => {
  const { title, price, description } = req.body;
  listings.push({ title, price, description });
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
