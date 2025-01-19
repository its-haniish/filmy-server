require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 8080;
const Posts = require("./models/Posts.js");

// Middleware
app.use(express.json());
app.use(cors(
  {
    origin: 'https://hdmovieshub.art'
  }
));

// Validate environment variables
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set in the environment variables.");
  process.exit(1);
}

// Routes

// 1. Get movies with pagination and search
app.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 20; // Default to 20 results per page
    const skip = (page - 1) * limit;
    const search = req.query.search || ""; // Search query

    // Build search query
    const query = search
      ? { title: { $regex: search, $options: "i" } } // Case-insensitive partial match
      : {};

    // Fetch and count movies
    const movies = await Posts.find(query)
      .sort({ uid: -1 }) // Sort by descending UID
      .skip(skip)
      .limit(limit);

    const totalMovies = await Posts.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    res.status(200).json({
      movies,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).send("An error occurred while fetching movies.");
  }
});

// 2. Get movies by category with pagination and search
app.get("/category/:category", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 20; // Default to 20 results per page
    const skip = (page - 1) * limit;
    const search = req.query.search || ""; // Search query
    const { category } = req.params; // Category from URL

    // Allowed categories
    const allowedCategories = [
      "amzn-prime-video",
      "disney-hotstar",
      "sony-live",
      "zee5",
      "jiocinema",
      "hoichoi",
      "alt",
      "bengali",
      "gujarati",
      "punjabi",
      "marathi",
      "hindi-dubbed-movies",
      "hollywood-hindi-dubbed",
      "south-hindi-dubbed",
      "bollywood-movies",
      "web-series",
      "dual-audio-movies",
      "netflix",
    ];

    if (!allowedCategories.includes(category)) {
      console.error("Invalid category:", category);
      return res.redirect("/"); // Redirect to home for invalid category
    }

    // Build query for search and category
    const query = {
      categories: category, // Exact match for category
      ...(search && { title: { $regex: search, $options: "i" } }), // Search query
    };

    // Fetch and count movies
    const movies = await Posts.find(query)
      .sort({ uid: -1 }) // Sort by descending UID
      .skip(skip)
      .limit(limit);

    const totalMovies = await Posts.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    res.status(200).json({
      movies,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching movies by category:", error);
    res.status(500).send("An error occurred while fetching movies by category.");
  }
});

// 3. Get movie by slug
app.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const movie = await Posts.findOne({ slug });

    if (!movie) {
      console.warn("Movie not found:", slug);
      return res.status(404).send("Movie not found.");
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).send("An error occurred while fetching the movie.");
  }
});

// Start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to the database.");
    app.listen(PORT, () => {
      console.log(`The server is live at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });
