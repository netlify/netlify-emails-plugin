const config = {
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(fetch-blob|node-fetch)/)"],
};

module.exports = config;
