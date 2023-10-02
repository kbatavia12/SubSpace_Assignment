const blogStatistics = async (req, res) => {
  try {
    console.log(req.blogStatistics);
    const startTime = new Date(); // Record the start time
    const statistics = req.blogStatistics;
    // const timeToServeRequest = new Date() - startTime; 
    // statistics.timeToServeRequest = timeToServeRequest; 
    res.json(statistics);
    console.log(statistics);
  } catch (error) {
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
};

module.exports = blogStatistics;
