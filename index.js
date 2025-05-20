const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const app = express();

// Connect to MongoDB
mongoose.connect("your_mongo_db_connection_string_here");

// Schema
const houseSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  location: String,
  image_path: String,
  createdAt: { type: Date, default: Date.now }
});
const House = mongoose.model("House", houseSchema);

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Multer (for image upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ROUTES
app.get("/", async (req, res) => {
  const search = req.query.search || "";
  const sort = req.query.sort || "";

  const query = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ]
  };

  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };

  const houses = await House.find(query).sort(sortOption);
  res.render("index", { houses, search, sort });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", upload.single("image"), async (req, res) => {
  const { name, price, description, location } = req.body;
  const image_path = req.file ? req.file.path : "";
  const newHouse = new House({ name, price, description, location, image_path });
  await newHouse.save();
  res.redirect("/");
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));