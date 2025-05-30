//Profile.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const navigate = useNavigate(); 
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

 // Profile update states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Helper function to create headers with authorization
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  // Helper function to handle authentication errors
  const handleAuthError = useCallback((response) => {
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/', { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  const fetchListBooks = useCallback((listId) => {
    fetch(`http://localhost:4000/api/favourite/list/${listId}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (handleAuthError(res)) return;
        return res.json();
      })
      .then(data => {
        if (data) {
          setSelectedListBooks(prev => ({
            ...prev,
            [listId]: data
          }));
        }
      })
      .catch(err => console.error('Failed to fetch list books:', err));
  }, [getAuthHeaders, handleAuthError]);

  const fetchFavoriteLists = useCallback(() => {
    console.log("Fetching favorite lists with token:", token);
    fetch(`http://localhost:4000/api/favourite/lists/${userId}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (handleAuthError(res)) return;
        return res.json();
      })
      .then(data => {
        if (data) {
          setFavoriteLists(data);
          data.forEach(list => fetchListBooks(list._id));
        }
      })
      .catch(err => console.error('Failed to fetch favorite lists:', err));
  }, [userId, fetchListBooks, getAuthHeaders, handleAuthError, token]);

  // Fetch user data
  const fetchUserData = useCallback(() => {
  fetch(`http://localhost:4000/api/user/${userId}`, {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (handleAuthError(res)) return;
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      return res.json();
    })
    .then(data => {
      if (data) {
        setUser(data);
        setProfileData({
          name: data.name,
          email: data.email
        });
      }
    })
    .catch(err => {
      console.error('Failed to fetch user info:', err);
      // Don't redirect on fetch errors, just log them
    });
}, [userId, getAuthHeaders, handleAuthError]);

  useEffect(() => {
    if (!userId || !token) {
      // Redirect to login if no user ID or token
      window.location.href = '/login';
      return;
    }

    // Fetch user info
    fetchUserData();

    // Fetch individual favorites (for backward compatibility)
    fetch(`http://localhost:4000/api/favourite/${userId}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (handleAuthError(res)) return;
        return res.json();
      })
      .then(data => {
        if (data) setFavorites(data);
      })
      .catch(err => console.error('Failed to fetch favorites:', err));

    // Fetch favorite lists
    fetchFavoriteLists();
  }, [userId, token, fetchFavoriteLists, getAuthHeaders, fetchUserData, handleAuthError]);

  // Profile update handlers
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileData({
      name: user.name,
      email: user.email
    });
  };

  const handleUpdateProfile = async () => {
  if (!profileData.name.trim() || !profileData.email.trim()) {
    alert('Name and email are required');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(profileData.email)) {
    alert('Please enter a valid email address');
    return;
  }

  setUpdateLoading(true);
  try {
    const response = await fetch(`http://localhost:4000/api/user/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    if (handleAuthError(response)) return;

    if (response.ok) {
  const updatedUser = await response.json();
  setUser(updatedUser);
  setProfileData({
    name: updatedUser.name,
    email: updatedUser.email
  });
  setIsEditingProfile(false);
  alert('Profile updated successfully!');
} else {
      const errorData = await response.json();
      alert(errorData.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  } finally {
    setUpdateLoading(false);
  }
};

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
        const response = await fetch('http://localhost:4000/api/favourite/remove-from-list', {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ listId: managingList, bookKey })
        });

        if (handleAuthError(response)) return;
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
      const response = await fetch(`http://localhost:4000/api/favourite/lists/${editingList}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editListName, userId })
      });

      if (handleAuthError(response)) return;

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
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId })
      });

      if (handleAuthError(response)) return;

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
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      alert('Please enter a list name');
      return;
    }

    const isDuplicate = favoriteLists.some(
      (list) => list.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert('A list with this name already exists. Please choose a different name.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/favourite/lists', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: trimmedName, userId })
      });

      if (handleAuthError(response)) return;

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
          <div className="profile-actions">
            <button 
              onClick={handleEditProfile}
              className="edit-profile-btn"
              disabled={isEditingProfile}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditingProfile && (
        <div className="update-form-section">
          <div className="update-form">
            <h3>Update Profile</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email..."
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button 
                onClick={handleUpdateProfile} 
                className="save-btn"
                disabled={updateLoading}
              >
                {updateLoading ? 'Updating...' : 'Update Profile'}
              </button>
              <button 
                onClick={handleCancelEdit} 
                className="cancel-btn"
                disabled={updateLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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