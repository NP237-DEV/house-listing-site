// index.js const express = require('express'); const mongoose = require('mongoose'); const bodyParser = require('body-parser'); const methodOverride = require('method-override'); const multer = require('multer'); const cloudinary = require('cloudinary').v2; const { CloudinaryStorage } = require('multer-storage-cloudinary'); const path = require('path'); require('dotenv').config();

const app = express();

// Cloudinary config cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, });

const storage = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: 'house_images', allowed_formats: ['jpg', 'png', 'jpeg'], }, }); const upload = multer({ storage });

const House = require('./models/House');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, });

app.set('view engine', 'ejs'); app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'))); app.use(bodyParser.urlencoded({ extended: true })); app.use(methodOverride('_method'));

// Home - list houses app.get('/', async (req, res) => { const houses = await House.find(); res.render('index', { houses }); });

// Detail page app.get('/detail/:id', async (req, res) => { const house = await House.findById(req.params.id); res.render('detail', { house }); });

// Add house form app.get('/add', (req, res) => { res.render('add'); });

// Create new house app.post('/add', upload.single('image'), async (req, res) => { const result = await cloudinary.uploader.upload(req.file.path);

const newHouse = new House({ name: req.body.name, location: req.body.location, price: req.body.price, image: result.secure_url, description: req.body.description, amenities: req.body.amenities.split(',').map(item => item.trim()), contact: req.body.contact, });

await newHouse.save(); res.redirect('/'); });

// Edit form app.get('/edit/:id', async (req, res) => { const house = await House.findById(req.params.id); res.render('edit', { house }); });

// Update house app.post('/edit/:id', async (req, res) => { const updatedData = { name: req.body.name, location: req.body.location, price: req.body.price, description: req.body.description, amenities: req.body.amenities.split(',').map(item => item.trim()), contact: req.body.contact, };

await House.findByIdAndUpdate(req.params.id, updatedData); res.redirect(/detail/${req.params.id}); });

// Delete house app.post('/delete/:id', async (req, res) => { await House.findByIdAndDelete(req.params.id); res.redirect('/'); });

// Start server const PORT = process.env.PORT || 3000; app.listen(PORT, () => { console.log(Server running on port ${PORT}); });
