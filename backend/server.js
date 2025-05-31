// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Favourite = require('./models/Favourite');

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