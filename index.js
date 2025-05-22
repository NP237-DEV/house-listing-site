const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const House = require('./models/House'); // Your Mongoose model
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Delete Route
app.post('/delete/:id', async (req, res) => {
  try {
    await House.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting house.');
  }
});

// Edit Form Route
app.get('/edit/:id', async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).send('House not found');
    res.render('edit', { house });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit form.');
  }
});

// Update House Route
app.post('/edit/:id', async (req, res) => {
  try {
    const updatedData = {
      name: req.body.name,
      location: req.body.location,
      price: req.body.price,
      description: req.body.description,
      amenities: req.body.amenities.split(',').map(a => a.trim()),
      contact: req.body.contact
    };
    await House.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect(`/detail/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating house.');
  }
});

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'house-listings',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

const upload = multer({ storage: storage });


// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files like CSS, images, etc.
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for house listings
let houses = [];

// Home page: list all houses
app.get('/', (req, res) => {
  res.render('index', { houses });
});

// Form page to add new house
app.get('/add', (req, res) => {
  res.render('add');
});

// Handle new house form submission

app.post('/add', upload.single('image'), (req, res) => {
  const { name, location, price, description, amenities, contact } = req.body;

  const newHouse = {
    id: Date.now().toString(),
    name,
    location,
    price,
    image: req.file.path, // Cloudinary URL
    description,
    amenities,
    contact
  };

  houses.push(newHouse);
  res.redirect('/');
});

// Detail page for a specific house
app.get('/houses/:id', (req, res) => {
  const house = houses.find(h => h.id === req.params.id);

  if (!house) {
    return res.status(404).send("House not found");
  }

  res.render('detail', { house });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});