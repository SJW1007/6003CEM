//Profile.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const userId = '683819b3e7f410df7ddb3f92'; // Example hardcoded userId – replace with actual logic (e.g., from localStorage or context)
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Fetch user info
    fetch(`http://localhost:4000/api/user/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Failed to fetch user info:', err));

    // Fetch favorite books
    fetch(`http://localhost:4000/api/favourite/${userId}`)
      .then(res => res.json())
      .then(data => setFavorites(data))
      .catch(err => console.error('Failed to fetch favorites:', err));
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image">
          <svg viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="favorites-section">
        <h2>My Favourite List</h2>
        <div className="favorites-grid">
  {favorites.map((book, index) => (
    <Link to={`/book/${encodeURIComponent(book.bookKey)}`} key={index}>
      <div className="fav-book-card">
        <img
          src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`}
          alt={book.title}
        />
        <p>{book.title}</p>
        <p className="author">{book.author}</p>
      </div>
    </Link>
  ))}
</div>
      </div>
    </div>
  );
};

export default Profile;
