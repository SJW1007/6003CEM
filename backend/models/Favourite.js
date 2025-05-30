//Favourite.js
// models/Favourite.js
const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookKey: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String },
  cover: { type: Number }
});

module.exports = mongoose.model('favourite', favouriteSchema);



