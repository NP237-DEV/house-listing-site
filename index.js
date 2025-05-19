const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve post page
app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'post.html'));
});

// Handle form submissions
app.post('/submit', (req, res) => {
  const newListing = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description
  };

  // Read existing listings
  const dataPath = path.join(__dirname, 'listings.json');
  let listings = [];

  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath);
    listings = JSON.parse(data);
  }

  listings.push(newListing);

  // Save updated listings
  fs.writeFileSync(dataPath, JSON.stringify(listings, null, 2));

  res.redirect('/');
});

// API endpoint to get listings (optional, used for dynamic frontend)
app.get('/api/listings', (req, res) => {
  const dataPath = path.join(__dirname, 'listings.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath);
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});