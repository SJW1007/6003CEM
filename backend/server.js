// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Favourite = require('./models/Favourite');
const FavouriteList = require('./models/FavouriteList');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://p23014870:shoutaaoi4968@cluster0.8p9cp8q.mongodb.net/Web_API', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sign-up route
const bcrypt = require('bcrypt');

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/forgetpassword', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


const jwt = require('jsonwebtoken'); // Optional if you want token-based auth

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { name: identifier }]
    });

    if (!user) {
      return res.status(400).json({ error: 'No such account. Please sign up.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }

    // Send userId in response once here:
    return res.json({ message: 'Login successful!', userId: user._id.toString() });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get books by subject/category
app.get('/api/books/subject/:name', async (req, res) => {
  const subject = req.params.name.toLowerCase();
  const url = `https://openlibrary.org/subjects/${subject}.json?limit=20`;

  try {
    const response = await fetch(url); // native fetch in Node 18+
    const data = await response.json();
    console.log('Open Library response status:', response.status);

    const books = data.works.map(book => ({
      title: book.title,
      cover_id: book.cover_id,
      key: book.key,
      authors: book.authors?.map(author => author.name) || []
    }));

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Failed to fetch books from Open Library' });
  }
});

// Route to search books by title
app.get('/api/books/title/:title', async (req, res) => {
  const title = req.params.title;
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=20`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Open Library title search response status:', response.status);

    const books = data.docs.map(book => ({
      title: book.title,
      cover_id: book.cover_i, 
      key: book.key,
      authors: book.author_name || []
    }));

    res.json(books);
  } catch (error) {
    console.error('Error searching books by title:', error.message);
    res.status(500).json({ error: 'Failed to search books by title' });
  }
});

// ========== FAVOURITE LIST ROUTES ==========

// Create a new favourite list
app.post('/api/favourite/lists', async (req, res) => {
  const { userId, name, description } = req.body;

  try {
    const existingList = await FavouriteList.findOne({ userId, name });
    if (existingList) {
      return res.status(400).json({ error: 'List with this name already exists' });
    }

    const newList = new FavouriteList({ userId, name, description });
    await newList.save();
    
    res.status(201).json({ 
      message: 'List created successfully', 
      list: newList 
    });
  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all lists for a user
app.get('/api/favourite/lists/:userId', async (req, res) => {
  try {
    const lists = await FavouriteList.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(lists);
  } catch (err) {
    console.error('Error fetching lists:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a favourite list (and all books in it)
app.delete('/api/favourite/lists/:listId', async (req, res) => {
  const { listId } = req.params;
  const { userId } = req.body;

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    // Delete all favourites in this list
    await Favourite.deleteMany({ listId });
    
    // Delete the list itself
    await FavouriteList.findByIdAndDelete(listId);
    
    res.json({ message: 'List and all its books deleted successfully' });
  } catch (err) {
    console.error('Error deleting list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== FAVOURITE BOOK ROUTES ==========

// Add book to a specific list
app.post('/api/favourite/add-to-list', async (req, res) => {
  const { userId, bookKey, listId, title, author, cover } = req.body;

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    // Check if book already exists in this list
    const exists = await Favourite.findOne({ listId, bookKey });
    if (exists) {
      return res.status(400).json({ error: 'Book already in this list' });
    }

    const favourite = new Favourite({ listId, bookKey, title, author, cover });
    await favourite.save();
    
    res.status(201).json({ message: 'Book added to list successfully' });
  } catch (err) {
    console.error('Error adding book to list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all books in a specific list
app.get('/api/favourite/list/:listId', async (req, res) => {
  try {
    const books = await Favourite.find({ listId: req.params.listId })
      .sort({ addedAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('Error fetching list books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a favourite list name
app.put('/api/favourite/lists/:listId', async (req, res) => {
  const { listId } = req.params;
  const { name, userId } = req.body;

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    // Check if another list with the same name exists for this user
    const existingList = await FavouriteList.findOne({ 
      userId, 
      name, 
      _id: { $ne: listId } 
    });
    if (existingList) {
      return res.status(400).json({ error: 'List with this name already exists' });
    }

    // Update the list name
    list.name = name;
    await list.save();
    
    res.json({ message: 'List name updated successfully', list });
  } catch (err) {
    console.error('Error updating list name:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove book from a specific list
app.delete('/api/favourite/remove-from-list', async (req, res) => {
  const { listId, bookKey } = req.body;

  try {
    const result = await Favourite.findOneAndDelete({ listId, bookKey });
    if (!result) {
      return res.status(404).json({ error: 'Book not found in this list' });
    }
    
    res.json({ message: 'Book removed from list successfully' });
  } catch (err) {
    console.error('Error removing book from list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to favourite
app.post('/api/favourite', async (req, res) => {
  console.log('Received favourite payload:', req.body);
  const { userId, bookKey, title, author, cover } = req.body;

  try {
    const exists = await Favourite.findOne({ userId, bookKey });
    if (exists) {
      return res.status(400).json({ error: 'Book already in favourite.' });
    }

    const fav = new Favourite({ userId, bookKey, title, author, cover });
    await fav.save();
    res.status(201).json({ message: 'Book added to favourite.' });
  } catch (err) {
    console.error('Error adding favourite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from favourite
app.delete('/api/favourite', async (req, res) => {
  const { userId, bookKey } = req.body;

  try {
    await Favourite.findOneAndDelete({ userId, bookKey });
    res.json({ message: 'Book removed from favourites.' });
  } catch (err) {
    console.error('Error removing favourite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//get user ID
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//get favourite book by user id
app.get('/api/favourite/:userId', async (req, res) => {
  try {
    const favourites = await Favourite.find({ userId: req.params.userId });
    res.json(favourites);
  } catch (err) {
    console.error('Fetch favourites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});