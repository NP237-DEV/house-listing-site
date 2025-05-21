const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

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
app.post('/add', (req, res) => {
  const { name, location, price, image, description, amenities, contact } = req.body;

  if (!name || !location || !price) {
    return res.status(400).send("Missing required fields");
  }

  const newHouse = {
    id: Date.now().toString(),
    name,
    location,
    price,
    image: image || '',
    description: description || '',
    amenities: amenities || '',
    contact: contact || ''
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