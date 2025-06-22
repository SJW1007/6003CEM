// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Favourite = require('./models/Favourite');
const FavouriteList = require('./models/FavouriteList');

const app = express();
const PORT = process.env.PORT || 4000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
  origin: ['https://six003cem-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://p23014870:shoutaaoi4968@cluster0.8p9cp8q.mongodb.net/Web_API', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Authentication Middleware');
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('✅ Token verified successfully');
    console.log('Decoded User Info:', user);
    req.user = user; // Store user info in request
    next();
  });
};

// Sign-up route
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

// Login route
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and user info
    return res.json({ 
      message: 'Login successful!', 
      userId: user._id.toString(),
      token: token
    });

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

// ========== FAVOURITE LIST ROUTES (TOKEN REQUIRED) ==========

// Create a new favourite list
app.post('/api/favourite/lists', authenticateToken, async (req, res) => {
  console.log('📝 CREATE FAVOURITE LIST');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  const { name, description } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    const existingList = await FavouriteList.findOne({ userId, name });
    if (existingList) {
      console.log('❌ List already exists:', existingList);
      return res.status(400).json({ error: 'List with this name already exists' });
    }

    const newList = new FavouriteList({ userId, name, description });
    await newList.save();
    
    console.log('✅ List created successfully:', newList);
    res.status(201).json({ 
      message: 'List created successfully', 
      list: newList 
    });
  } catch (err) {
    console.error('❌ Error creating list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all lists for a user
app.get('/api/favourite/lists/:userId', authenticateToken, async (req, res) => {
  console.log('📋 GET USER LISTS');
  console.log('User from token:', req.user);
  console.log('Requested userId:', req.params.userId);
  
  try {
    // Verify user can only access their own lists
    if (req.params.userId !== req.user.userId) {
      console.log('❌ Access denied - userId mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    const lists = await FavouriteList.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    console.log('✅ Lists fetched:', lists);
    res.json(lists);
  } catch (err) {
    console.error('❌ Error fetching lists:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a favourite list (and all books in it)
app.delete('/api/favourite/lists/:listId', authenticateToken, async (req, res) => {
  console.log('🗑️ DELETE FAVOURITE LIST');
  console.log('User from token:', req.user);
  console.log('List ID to delete:', req.params.listId);
  
  const { listId } = req.params;
  const userId = req.user.userId; // Get from token

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      console.log('❌ List not found or unauthorized');
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    console.log('✅ List found, proceeding to delete:', list);

    // Delete all favourites in this list
    const deletedFavourites = await Favourite.deleteMany({ listId });
    console.log('✅ Deleted favourites:', deletedFavourites);
    
    // Delete the list itself
    const deletedList = await FavouriteList.findByIdAndDelete(listId);
    console.log('✅ List deleted:', deletedList);
    
    res.json({ message: 'List and all its books deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== FAVOURITE BOOK ROUTES (TOKEN REQUIRED) ==========

// Add book to a specific list
app.post('/api/favourite/add-to-list', authenticateToken, async (req, res) => {
  console.log('📚 ADD BOOK TO LIST');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  const { bookKey, listId, title, author, cover } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      console.log('❌ List not found or unauthorized');
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    console.log('✅ List found:', list);

    // Check if book already exists in this list
    const exists = await Favourite.findOne({ listId, bookKey });
    if (exists) {
      console.log('❌ Book already exists in list:', exists);
      return res.status(400).json({ error: 'Book already in this list' });
    }

    const favourite = new Favourite({ listId, bookKey, title, author, cover });
    await favourite.save();
    
    console.log('✅ Book added to list:', favourite);
    res.status(201).json({ message: 'Book added to list successfully' });
  } catch (err) {
    console.error('❌ Error adding book to list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all books in a specific list
app.get('/api/favourite/list/:listId', authenticateToken, async (req, res) => {
  console.log('📖 GET BOOKS IN LIST');
  console.log('User from token:', req.user);
  console.log('List ID:', req.params.listId);
  
  try {
    const userId = req.user.userId;
    
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: req.params.listId, userId });
    if (!list) {
      console.log('❌ List not found or unauthorized');
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    console.log('✅ List found:', list);

    const books = await Favourite.find({ listId: req.params.listId })
      .sort({ addedAt: -1 });
    
    console.log('✅ Books in list:', books);
    res.json(books);
  } catch (err) {
    console.error('❌ Error fetching list books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a favourite list name
app.put('/api/favourite/lists/:listId', authenticateToken, async (req, res) => {
  console.log('✏️ UPDATE FAVOURITE LIST');
  console.log('User from token:', req.user);
  console.log('List ID:', req.params.listId);
  console.log('Request body:', req.body);
  
  const { listId } = req.params;
  const { name } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      console.log('❌ List not found or unauthorized');
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    console.log('✅ List found:', list);

    // Check if another list with the same name exists for this user
    const existingList = await FavouriteList.findOne({ 
      userId, 
      name, 
      _id: { $ne: listId } 
    });
    if (existingList) {
      console.log('❌ List with same name already exists:', existingList);
      return res.status(400).json({ error: 'List with this name already exists' });
    }

    // Update the list name
    list.name = name;
    await list.save();
    
    console.log('✅ List updated:', list);
    res.json({ message: 'List name updated successfully', list });
  } catch (err) {
    console.error('❌ Error updating list name:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove book from a specific list
app.delete('/api/favourite/remove-from-list', authenticateToken, async (req, res) => {
  console.log('📚🗑️ REMOVE BOOK FROM LIST');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  const { listId, bookKey } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    // Verify the list belongs to the user
    const list = await FavouriteList.findOne({ _id: listId, userId });
    if (!list) {
      console.log('❌ List not found or unauthorized');
      return res.status(404).json({ error: 'List not found or unauthorized' });
    }

    console.log('✅ List found:', list);

    const result = await Favourite.findOneAndDelete({ listId, bookKey });
    if (!result) {
      console.log('❌ Book not found in this list');
      return res.status(404).json({ error: 'Book not found in this list' });
    }
    
    console.log('✅ Book removed from list:', result);
    res.json({ message: 'Book removed from list successfully' });
  } catch (err) {
    console.error('❌ Error removing book from list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to favourite
app.post('/api/favourite', authenticateToken, async (req, res) => {
  console.log('⭐ ADD TO FAVOURITE');
  console.log('User from token:', req.user);
  console.log('Received favourite payload:', req.body);
  
  const { bookKey, title, author, cover } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    const exists = await Favourite.findOne({ userId, bookKey });
    if (exists) {
      console.log('❌ Book already in favourite:', exists);
      return res.status(400).json({ error: 'Book already in favourite.' });
    }

    const fav = new Favourite({ userId, bookKey, title, author, cover });
    await fav.save();
    
    console.log('✅ Book added to favourite:', fav);
    res.status(201).json({ message: 'Book added to favourite.' });
  } catch (err) {
    console.error('❌ Error adding favourite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from favourite
app.delete('/api/favourite', authenticateToken, async (req, res) => {
  console.log('🗑️ REMOVE FROM FAVOURITE');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  const { bookKey } = req.body;
  const userId = req.user.userId; // Get from token

  try {
    const result = await Favourite.findOneAndDelete({ userId, bookKey });
    console.log('✅ Favourite removed:', result);
    res.json({ message: 'Book removed from favourites.' });
  } catch (err) {
    console.error('❌ Error removing favourite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user info
app.get('/api/user/:userId', authenticateToken, async (req, res) => {
  console.log('👤 GET USER INFO');
  console.log('User from token:', req.user);
  console.log('Requested userId:', req.params.userId);
  
  try {
    // Verify user can only access their own info
    if (req.params.userId !== req.user.userId) {
      console.log('❌ Access denied - userId mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.params.userId).select('name email');
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User info fetched:', user);
    res.json(user);
  } catch (err) {
    console.error('❌ Fetch user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get favourite books by user id
app.get('/api/favourite/:userId', authenticateToken, async (req, res) => {
  console.log('⭐ GET USER FAVOURITES');
  console.log('User from token:', req.user);
  console.log('Requested userId:', req.params.userId);
  
  try {
    // Verify user can only access their own favourites
    if (req.params.userId !== req.user.userId) {
      console.log('❌ Access denied - userId mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    const favourites = await Favourite.find({ userId: req.params.userId });
    console.log('✅ Favourites fetched:', favourites);
    res.json(favourites);
  } catch (err) {
    console.error('❌ Fetch favourites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/user/:userId', authenticateToken, async (req, res) => {
  console.log('✏️ UPDATE USER PROFILE');
  console.log('User from token:', req.user);
  console.log('Requested userId:', req.params.userId);
  console.log('Request body:', req.body);
  
  try {
    // Verify user can only update their own profile
    if (req.params.userId !== req.user.userId) {
      console.log('❌ Access denied - userId mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: req.params.userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }

    // Check if name is already taken by another user
    const existingName = await User.findOne({ 
      name: name, 
      _id: { $ne: req.params.userId } 
    });
    
    if (existingName) {
      return res.status(400).json({ error: 'Username is already taken by another user' });
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email },
      { new: true, runValidators: true }
    ).select('name email');

    if (!updatedUser) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User profile updated:', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('❌ Error updating user profile:', err);
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

app.post('/api/chatbot', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3.2:latest',
      messages: [
        {
          role: "system",
          content: `You are a literary expert and book recommendation system. Your job is to help users find books based on their queries, whether they search by title, author, or plot description.

IMPORTANT RULES:
1. AUTHOR SEARCH: If the user asks for books by a specific author (like "books by Stephen King", "Agatha Christie novels"), provide three popular/notable books by that author.

2. PLOT DESCRIPTION: If the user describes a story, plot, or themes without mentioning specific titles or authors, provide three real books that best match the description.

3. All books must be real, published works - never invent fake books.

RESPONSE FORMAT:
Always return your answer in this exact format:

Here are the related books:
1. Title by Author
2. Title by Author  
3. Title by Author

EXAMPLES:
- "Harry Potter" → "Harry Potter and the Philosopher's Stone by J.K. Rowling" + similar fantasy books
- "books by Stephen King" → "The Shining by Stephen King", "It by Stephen King", "Pet Sematary by Stephen King"
- "Agatha Christie" → "Murder on the Orient Express by Agatha Christie", "And Then There Were None by Agatha Christie", "The Murder of Roger Ackroyd by Agatha Christie"
- "book about a dystopian future" → "1984 by George Orwell", "Brave New World by Aldous Huxley", "The Handmaid's Tale by Margaret Atwood"
- "story about wizards and magic school" → "Harry Potter and the Philosopher's Stone by J.K. Rowling", "The Name of the Wind by Patrick Rothfuss", "A Wizard of Earthsea by Ursula K. Le Guin"

DETECTION PATTERNS:
- Title search: Direct book names, quotes around titles
- Author search: "books by [author]", "[author] novels", "[author] books"
- Plot search: "book about...", "story with...", describing themes, characters, or plot elements

Always prioritize exact matches when titles or authors are specifically mentioned.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      stream: false
    });

    const reply = response.data.message?.content || 'Sorry, I could not process your request.';
    res.json({ reply });
  } catch (error) {
    console.error('Error communicating with Ollama API:', error.message);
    res.status(500).json({ error: 'Failed to connect to Ollama API.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
