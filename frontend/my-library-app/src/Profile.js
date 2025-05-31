//Profile.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const userId = localStorage.getItem('userId');
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoriteLists, setFavoriteLists] = useState([]);
  const [selectedListBooks, setSelectedListBooks] = useState({});
  const [managingList, setManagingList] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [editingList, setEditingList] = useState(null);
  const [editListName, setEditListName] = useState('');
  const [creatingNewList, setCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const fetchListBooks = useCallback((listId) => {
    fetch(`http://localhost:4000/api/favourite/list/${listId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedListBooks(prev => ({
          ...prev,
          [listId]: data
        }));
      })
      .catch(err => console.error('Failed to fetch list books:', err));
  }, []);

  const fetchFavoriteLists = useCallback(() => {
    fetch(`http://localhost:4000/api/favourite/lists/${userId}`)
      .then(res => res.json())
      .then(data => {
        setFavoriteLists(data);
        // Fetch books for each list
        data.forEach(list => fetchListBooks(list._id));
      })
      .catch(err => console.error('Failed to fetch favorite lists:', err));
  }, [userId, fetchListBooks]);

  useEffect(() => {
    if (!userId) return;

    // Fetch user info
    fetch(`http://localhost:4000/api/user/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Failed to fetch user info:', err));

    // Fetch individual favorites (for backward compatibility)
    fetch(`http://localhost:4000/api/favourite/${userId}`)
      .then(res => res.json())
      .then(data => setFavorites(data))
      .catch(err => console.error('Failed to fetch favorites:', err));

    // Fetch favorite lists
    fetchFavoriteLists();
  }, [userId, fetchFavoriteLists]);

  const handleManageList = (listId) => {
    setManagingList(listId);
    setSelectedBooks([]);
  };

  const handleBookSelection = (bookKey) => {
    setSelectedBooks(prev => 
      prev.includes(bookKey) 
        ? prev.filter(key => key !== bookKey)
        : [...prev, bookKey]
    );
  };

  const handleDeleteSelectedBooks = async () => {
    if (selectedBooks.length === 0) return;

    try {
      for (const bookKey of selectedBooks) {
        await fetch('http://localhost:4000/api/favourite/remove-from-list', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId: managingList, bookKey })
        });
      }
      
      // Refresh the list
      fetchListBooks(managingList);
      setSelectedBooks([]);
      alert('Selected books removed successfully!');
    } catch (error) {
      console.error('Error deleting books:', error);
      alert('Failed to delete some books');
    }
  };

  const handleEditList = (list) => {
    setEditingList(list._id);
    setEditListName(list.name);
  };

  const handleSaveListName = async () => {
    try {
      // Note: You'll need to add this route to your server.js
      const response = await fetch(`http://localhost:4000/api/favourite/lists/${editingList}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editListName, userId })
      });

      if (response.ok) {
        fetchFavoriteLists();
        setEditingList(null);
        setEditListName('');
        alert('List name updated successfully!');
      } else {
        alert('Failed to update list name');
      }
    } catch (error) {
      console.error('Error updating list name:', error);
      alert('Failed to update list name');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list and all its books?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/favourite/lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        fetchFavoriteLists();
        setManagingList(null);
        alert('List deleted successfully!');
      } else {
        alert('Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/favourite/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newListName.trim(), 
          userId 
        })
      });

      if (response.ok) {
        fetchFavoriteLists();
        setCreatingNewList(false);
        setNewListName('');
        alert('List created successfully!');
      } else {
        alert('Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const handleCancelCreateList = () => {
    setCreatingNewList(false);
    setNewListName('');
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      {/* Back Button - Moved to the top */}
      <div className="back-button-container">
        <Link to="/home" className="back-button">
          ← Back to Home
        </Link>
      </div>

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

      {/* Individual Favorites (Backward Compatibility) */}
      {favorites.length > 0 && (
        <div className="favorites-section">
          <h2>My Individual Favorites</h2>
          <div className="favorites-grid">
            {favorites.map((book, index) => (
              <Link to={`/book/${encodeURIComponent(book.bookKey)}`} key={index}>
                <div className="fav-book-card">
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`}
                    alt={book.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-book.png';
                    }}
                  />
                  <p className="book-title">{book.title}</p>
                  <p className="author">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Lists */}
      <div className="favorite-lists-section">
        <div className="lists-header">
          <h2>My Favorite Lists</h2>
          <button 
            onClick={() => setCreatingNewList(true)}
            className="create-list-btn"
          >
            + Create New List
          </button>
        </div>

        {/* Create New List Form - Simplified without description */}
        {creatingNewList && (
          <div className="create-list-form">
            <h3>Create New List</h3>
            <div className="form-group">
              <label>List Name *</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button onClick={handleCreateNewList} className="create-btn">
                Create List
              </button>
              <button onClick={handleCancelCreateList} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {favoriteLists.length === 0 ? (
          <p className="no-lists">No favorite lists created yet.</p>
        ) : (
          favoriteLists.map((list) => (
            <div key={list._id} className="favorite-list">
              <div className="list-header">
                <div className="list-title-section">
                  {editingList === list._id ? (
                    <div className="edit-list-name">
                      <input
                        type="text"
                        value={editListName}
                        onChange={(e) => setEditListName(e.target.value)}
                        className="edit-input"
                      />
                      <button onClick={handleSaveListName} className="save-btn">
                        ✓
                      </button>
                      <button 
                        onClick={() => setEditingList(null)} 
                        className="cancel-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="list-title-display">
                      <h3>{list.name}</h3>
                      <button 
                        onClick={() => handleEditList(list)}
                        className="edit-icon-btn"
                        title="Edit list name"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="list-actions">
                  {managingList === list._id ? (
                    <div className="manage-actions">
                      <button 
                        onClick={handleDeleteSelectedBooks}
                        className="delete-selected-btn"
                        disabled={selectedBooks.length === 0}
                      >
                        Delete Selected ({selectedBooks.length})
                      </button>
                      <button 
                        onClick={() => setManagingList(null)}
                        className="cancel-manage-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="normal-actions">
                      <button 
                        onClick={() => handleManageList(list._id)}
                        className="manage-btn"
                      >
                        Manage Books
                      </button>
                      <button 
                        onClick={() => handleDeleteList(list._id)}
                        className="delete-list-btn"
                      >
                        Delete List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {list.description && (
                <p className="list-description">{list.description}</p>
              )}

              <div className="list-books-grid">
                {selectedListBooks[list._id]?.length > 0 ? (
                  selectedListBooks[list._id].map((book, index) => (
                    <div key={index} className="list-book-card">
                      {managingList === list._id && (
                        <div className="book-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedBooks.includes(book.bookKey)}
                            onChange={() => handleBookSelection(book.bookKey)}
                          />
                        </div>
                      )}
                      
                      {managingList !== list._id ? (
                        <Link to={`/book/${encodeURIComponent(book.bookKey)}`}>
                          <div className="book-content">
                            <img
                              src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`}
                              alt={book.title}
                              onError={(e) => {
                                e.target.src = '/placeholder-book.png';
                              }}
                            />
                            <p className="book-title">{book.title}</p>
                            <p className="author">{book.author}</p>
                          </div>
                        </Link>
                      ) : (
                        <div className="book-content">
                          <img
                            src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`}
                            alt={book.title}
                            onError={(e) => {
                              e.target.src = '/placeholder-book.png';
                            }}
                          />
                          <p className="book-title">{book.title}</p>
                          <p className="author">{book.author}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-books">No books in this list yet.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;