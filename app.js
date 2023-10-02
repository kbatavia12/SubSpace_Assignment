const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
require("dotenv").config();
app.use(express.static("public"));
app.use(express.json());

const port = process.env.PORT || 3000;

const API_URL = "https://intent-kit-16.hasura.app/api/rest/blogs";

// Define a memoization cache for analytics
const blogsAnalyticsCache = _.memoize(
  async () => {
    const startTime = new Date(); // Record the start time
    try {
      //Fetching blog data from the third-party API
      const response = await axios.get(
        API_URL, // TODO: code this into a constant variable at the top
        {
          headers: {
            "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET, // TODO: .env please
          },
        }
      );

      // Check if the response status is not successful
      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch data from the third-party API. Status: ${response.status}`
        );
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
        lastCachedAt: startTime.toLocaleTimeString(), // Add last caching timestamp
        timeToServeRequest: new Date() - startTime, // Calculate time to serve the request
        blogStatistics: {
          totalBlogs,
          longestBlog: longestBlog.title,
          blogsWithPrivacy: blogsWithPrivacy.length,
          uniqueTitles: uniqueTitles.map((blog) => blog.title),
        },
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
    const startTime = new Date(); // Record the start time
    try {
      // Fetch blog data from the third-party API
      const response = await axios.get(
        API_URL, // TODO: Same as above
        {
          headers: {
            "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET, // TODO: Same as above
          },
        }
      );

      // Check if the response status is not successful
      /* 
      TODO: Can we do a response code based error message? 
      Example - instead of just outputting failed to fetch the api, go more granular and send the exact root cause, just as an enhancement
      */
      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch data from the third-party API. Status: ${response.status}`
        );
      }

      // Extract the blogs data from the response
      const blogs = response.data?.blogs || []; //TODO: Safe access here. Handle if the key is not present

      let results;
      if (query) {
        query = query.toLowerCase();
        results = _.filter(blogs, (blog) =>
          _.includes(blog.title.toLowerCase(), query)
        );
      } else {
        results = [];
      }
      const searchResults = {
        lastCachedAt: startTime.toLocaleTimeString(), // Add last caching timestamp
        timeToServeRequest: new Date() - startTime, // Calculate time to serve the request
        SearchResults: results,
      };

      return searchResults; // TODO: What if this is empty? Appropriate message if specified in the requirements?
      //if searchResults is empty then we are sending empty array
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  (query) => query
); // Cache results based on the query string

// TODO: Create a get route on / as well, so index route doesn't throw a 404
app.get("/", (req, res) => {
  res.send("Welcome to the SubSpace Assignment");
});

// Middleware to fetch blog analytics data
// !TODO: This is not a middleware function
app.get("/api/blog-stats", async (req, res) => {
  try {
    const startTime = new Date(); // Record the start time
    const statistics = await blogsAnalyticsCache(); // Use memoized function
    const timeToServeRequest = new Date() - startTime; // Calculate time to serve the request
    statistics.timeToServeRequest = timeToServeRequest; // Add time to serve request to the response
    res.json(statistics);
  } catch (error) {
    // TODO: What kind of errors are we dealing with here?
    // TODO: Return messages based on the type of errors
    // Handle errors
    if (error.response) {
      // Handle errors related to the HTTP response (e.g., 404, 401)
      const status = error.response.status;
      if (status === 404) {
        res.status(404).json({ error: "API not found" });
      } else if (status === 401) {
        res
          .status(401)
          .json({ error: "Unauthorized. Check your credentials." });
      } else {
        res
          .status(status)
          .json({ error: `API request failed with status ${status}` });
      }
    } else if (error.message.includes("timeout")) {
      // Handle timeout errors
      res.status(504).json({ error: "Request timed out" });
    } else {
      // Handle other types of errors
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Blog search endpoint
// !TODO: Same as above
app.get("/api/blog-search", async (req, res) => {
  try {
    const startTime = new Date(); // Record the start time
    const query = req.query.query;
    const searchResults = await blogSearchCache(query); // Use memoized function
    const timeToServeRequest = new Date() - startTime; // Calculate time to serve the request
    searchResults.timeToServeRequest = timeToServeRequest; // Add time to serve request to the response
    res.json(searchResults);
  } catch (error) {
    // TODO: Same as above
    if (error.response) {
      // Handle errors related to the HTTP response (e.g., 404, 401)
      const status = error.response.status;
      if (status === 404) {
        res.status(404).json({ error: "API not found" });
      } else if (status === 401) {
        res
          .status(401)
          .json({ error: "Unauthorized. Check your credentials." });
      } else {
        res
          .status(status)
          .json({ error: `API request failed with status ${status}` });
      }
    } else if (error.message.includes("timeout")) {
      // Handle timeout errors
      res.status(504).json({ error: "Request timed out" });
    } else {
      // Handle other types of errors
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
