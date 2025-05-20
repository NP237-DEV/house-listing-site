const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Setup EJS and public folder
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // to serve images

// In-memory house listings (for now)
let houses = [];

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.render('index', { houses });
});

app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/add', upload.single('image'), (req, res) => {
  const { name, price, description, location } = req.body;
  const image_path = req.file ? 'uploads/' + req.file.filename : null;

  houses.push({ name, price, description, location, image_path });
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});