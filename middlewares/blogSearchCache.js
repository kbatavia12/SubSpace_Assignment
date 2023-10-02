const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
require("dotenv").config();
app.use(express.static("public"));
app.use(express.json());

const blogSearchCache = _.memoize(
  async (req, res, next) => {
    next();
    const startTime = new Date(); // Record the start time
    try {
      // Fetch blog data from the third-party API
      const response = await axios.get(
        process.env.API_URL, // TODO: Same as above
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
      if (req.query.query) {
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

      req.blogSearchResults = searchResults;
      
      //if searchResults is empty then we are sending empty array
    } catch (error) {
      throw error; // Rethrow the error to be handled later
    }
  },
  (query) => query
); //

module.exports = blogSearchCache;
