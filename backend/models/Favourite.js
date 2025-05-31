//Favourite.js
const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'FavouriteList', required: true },
  bookKey: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String },
  cover: { type: Number },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('favourite', favouriteSchema);



