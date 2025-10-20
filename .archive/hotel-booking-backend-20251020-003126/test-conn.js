const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGODB_CONNECTION_STRING;
if (!uri) { console.error('MONGODB_CONNECTION_STRING not set'); process.exit(1); }
mongoose.connect(uri)
  .then(()=> { console.log('Connected to MongoDB successfully'); return mongoose.disconnect(); })
  .then(()=> process.exit(0))
  .catch(err=> { console.error('Connection error:', err); process.exit(1); });
