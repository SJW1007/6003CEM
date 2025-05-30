// Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './App.css';

const categories = [
  'Romance', 'Mystery', 'Arts', 'Cooking',
  'History', 'Health', 'Technology', 'Literature'
];

export default function Home() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Romance');

  const fetchBooksByCategory = async (category) => {
    try {
      const res = await fetch(`http://localhost:4000/api/books/subject/${category.toLowerCase()}`);
      const data = await res.json();
      setBooks(data);
      setSelectedCategory(category);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        const res = await fetch(`http://localhost:4000/api/books/title/${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setBooks(data);
        setSelectedCategory('');
      } catch (err) {
        console.error('Error searching books by title:', err);
      }
    } else {
      fetchBooksByCategory('Romance');
    }
  };

  useEffect(() => {
    fetchBooksByCategory('Romance');
  }, []);

  return (
    <div className="home_container">
        <div className="account-icon">
  <Link to="/profile">
    <FaUserCircle size={32} style={{ color: '#fdf7eb' }} title="Profile" />
  </Link>
</div>

      <h1 className="title">Knowledge Is Power</h1>
      
      <div className="search-bar">
        <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                handleSearch();
      }
    }}
  />
  <button className="search-button" onClick={handleSearch}>🔍</button>
</div>

      <div className="categories">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            className={`category-button ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => fetchBooksByCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="book-list">
  {books.filter(book => book.cover_id).length === 0 ? (
    <p className="no-books-message">Sorry, No Book Found.</p>
  ) : (
    books.filter(book => book.cover_id).map((book, idx) => (
      <Link to={`/book/${encodeURIComponent(book.key)}`}
        key={idx}
        className="book-card"
        onClick={() => console.log('Selected book:', book)}
      >
        <img
          src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
          alt={book.title}
        />
        <p>{book.title}</p>
      </Link>
    ))
  )}
</div>
    </div>
  );
}
