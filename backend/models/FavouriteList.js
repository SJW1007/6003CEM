// FavouriteList.js
const mongoose = require('mongoose');

const favouriteListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g., "Sci-Fi", "To Read"
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FavouriteList', favouriteListSchema);
