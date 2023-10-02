const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
require("dotenv").config();
app.use(express.static("public"));
app.use(express.json());

const port = process.env.PORT || 3000;

const blogsAnalyticsCache = _.memoize(
  async (req, res, next) => {
    const startTime = new Date(); // Record the start time
    try {
      //Fetching blog data from the third-party API
      const response = await axios.get(
        process.env.API_URL, // TODO: code this into a constant variable at the top
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

      req.blogStatistics = statistics;
      console.log(req.blogStatistics);
      next();
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  () => 60000
);

module.exports = blogsAnalyticsCache;
