const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
const port = 3000;

// Define a memoization cache for analytics
const blogsAnalyticsCache = _.memoize(
  async () => {
    try {
      //Fetching blog data from the third-party API
      const response = await axios.get(
        "https://intent-kit-16.hasura.app/api/rest/blogs",
        {
          headers: {
            "x-hasura-admin-secret":
              "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
          },
        }
      );

      // Check if the response status is not successful
      if (response.status !== 200) {
        throw new Error(`Failed to fetch data from the third-party API. Status: ${response.status}`);
      }

      // Perform data analysis using Lodash
      const blogs = response.data["blogs"];
      const totalBlogs = blogs.length;
      const longestBlog = _.maxBy(blogs, "title.length");
      const blogsWithPrivacy = _.filter(blogs, (blog) =>
        _.includes(blog.title.toLowerCase(), "privacy")
      );
      const uniqueTitles = _.uniqBy(blogs, "title");

      const statistics = {
        totalBlogs,
        longestBlog: longestBlog.title,
        blogsWithPrivacy: blogsWithPrivacy.length,
        uniqueTitles: uniqueTitles.map((blog) => blog.title),
      };

      return statistics;
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  () => 60000
); // Cache results for 60 seconds

// Define a memoization cache for search results
const blogSearchCache = _.memoize(
  async (query) => {
    try {
      // Fetch blog data from the third-party API
      const response = await axios.get(
        "https://intent-kit-16.hasura.app/api/rest/blogs",
        {
          headers: {
            "x-hasura-admin-secret":
              "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
          },
        }
      );

      // Check if the response status is not successful
      if (response.status !== 200) {
        throw new Error(`Failed to fetch data from the third-party API. Status: ${response.status}`);
      }

      // Extract the blogs data from the response
      const blogs = response.data["blogs"];

      // Convert query to lowercase for case-insensitive search
      query = query.toLowerCase();

      // Implement a search functionality
      const searchResults = _.filter(blogs, (blog) =>
        _.includes(blog.title.toLowerCase(), query)
      );

      return searchResults;
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  (query) => query
); // Cache results based on the query string

// Middleware to fetch blog analytics data
app.get("/api/blog-stats", async (req, res) => {
  try {
    const statistics = await blogsAnalyticsCache(); // Use memoized function
    res.json(statistics);
  } catch (error) {
    // Handle errors
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Blog search endpoint
app.get("/api/blog-search", async (req, res) => {
  try {
    const query = req.query.query;
    const searchResults = await blogSearchCache(query); // Use memoized function
    res.json(searchResults);
  } catch (error) {
    // Handle errors
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
