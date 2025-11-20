const mongoose = require('mongoose');

const run = async () => {
  const uri = "mongodb://localhost:27019/hotel-booking";
  console.log("Connecting to", uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Connection failed:", err);
  }
};

run();
