const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();

// TODO: .env would help here
/*
  Create a readme file for steps and provide a .env.sample file for reference if possible.
  Also, if not feasible, add a top level comment in the code showing why a .env based approach is not taken.
*/
const port = 3000;

// Define a memoization cache for analytics
const blogsAnalyticsCache = _.memoize(
  async () => {
    try {
      //Fetching blog data from the third-party API
      const response = await axios.get(
        "https://intent-kit-16.hasura.app/api/rest/blogs", // TODO: code this into a constant variable at the top
        {
          headers: {
            "x-hasura-admin-secret":
              "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6", // TODO: .env please
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
        "https://intent-kit-16.hasura.app/api/rest/blogs", // TODO: Same as above
        {
          headers: {
            "x-hasura-admin-secret":
              "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6", // TODO: Same as above
          },
        }
      );

      // Check if the response status is not successful
      /* 
      TODO: Can we do a response code based error message? 
      Example - instead of just outputting failed to fetch the api, go more granular and send the exact root cause, just as an enhancement
      */
      if (response.status !== 200) {
        throw new Error(`Failed to fetch data from the third-party API. Status: ${response.status}`); 
      }

      // Extract the blogs data from the response
      const blogs = response.data["blogs"]; //TODO: Safe access here. Handle if the key is not present

      // Convert query to lowercase for case-insensitive search
      query = query.toLowerCase(); // TODO: Same here, handle query not present

      // Implement a search functionality
      const searchResults = _.filter(blogs, (blog) =>
        _.includes(blog.title.toLowerCase(), query)
      );

      return searchResults; // TODO: What if this is empty? Appropriate message if specified in the requirements?
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  (query) => query
); // Cache results based on the query string


// TODO: Create a get route on / as well, so index route doesn't throw a 404

// Middleware to fetch blog analytics data
// !TODO: This is not a middleware function
app.get("/api/blog-stats", async (req, res) => {
  try {
    const statistics = await blogsAnalyticsCache(); // Use memoized function
    res.json(statistics);
  } catch (error) {
    // TODO: What kind of errors are we dealing with here?
    // TODO: Return messages based on the type of errors
    // Handle errors
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Blog search endpoint
// !TODO: Same as above
app.get("/api/blog-search", async (req, res) => {
  try {
    const query = req.query.query;
    const searchResults = await blogSearchCache(query); // Use memoized function
    res.json(searchResults);
  } catch (error) {
    // TODO: Same as above
    // Handle errors
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
