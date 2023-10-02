const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
require("dotenv").config();
app.use(express.static("public"));
app.use(express.json());

const port = process.env.PORT || 3000;

const blogSearchCache = require("./middlewares/blogSearchCache");
const blogStatsCache = require("./middlewares/blogStatsCache");

const blogSearch = require("./controllers/blogSearch");
const blogStats = require("./controllers/blogStatistics");

// TODO: Create a get route on / as well, so index route doesn't throw a 404
app.get("/", (req, res) => {
  res.send("Welcome to the SubSpace Assignment");
});

// Middleware to fetch blog analytics data
// !TODO: This is not a middleware function
app.get("/api/blog-stats", blogStatsCache, blogStats);

// Blog search endpoint
app.get("/api/blog-search", blogSearchCache, blogSearch);

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
