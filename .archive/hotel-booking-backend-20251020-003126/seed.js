const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_CONNECTION_STRING;
if (!uri) { console.error("Please set MONGODB_CONNECTION_STRING in .env"); process.exit(1); }

function simplify(doc) {
  const out = JSON.parse(JSON.stringify(doc));
  if (out._id && out._id.$oid) out._id = out._id.$oid;
  const walk = (o) => {
    for (const k of Object.keys(o)) {
      if (o[k] && typeof o[k] === "object") {
        if (o[k].$numberInt) o[k] = parseInt(o[k].$numberInt, 10);
        else if (o[k].$numberLong) o[k] = Number(o[k].$numberLong);
        else if (o[k].$date && o[k].$date.$numberLong) o[k] = new Date(Number(o[k].$date.$numberLong));
        else walk(o[k]);
      }
    }
  };
  walk(out);
  return out;
}

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to DB for seeding");
  const db = mongoose.connection.db;

  const usersFile = path.join(__dirname, "../data/test-users.json");
  const hotelsFile = path.join(__dirname, "../data/test-hotel.json");
  const userRaw = fs.readFileSync(usersFile, "utf8");
  const hotelRaw = fs.readFileSync(hotelsFile, "utf8");
  const userDoc = JSON.parse(userRaw);
  const hotelDoc = JSON.parse(hotelRaw);
  const user = simplify(userDoc);
  const hotel = simplify(hotelDoc);

  await db.collection("users").updateOne({ email: user.email }, { $set: user }, { upsert: true });
  await db.collection("hotels").updateOne({ name: hotel.name }, { $set: hotel }, { upsert: true });

  console.log("Seeding complete");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
