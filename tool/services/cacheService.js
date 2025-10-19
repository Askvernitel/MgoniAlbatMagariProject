const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "../cache.json");

function writeCache(hash, response) {
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      cache = JSON.parse(data);
    } catch (err) {
      cache = {};
    }
  }
  // Only write if hash is new or response is different
  if (
    !cache[hash] ||
    JSON.stringify(cache[hash]) !== JSON.stringify(response)
  ) {
    cache[hash] = response;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  }
}

module.exports = { writeCache };
