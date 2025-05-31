// BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlus, FaTimes, FaCheck } from 'react-icons/fa';
import './BookDetails.css';

export default function BookDetail() {
  const { bookKey } = useParams(); // e.g., OL12345W
  const [book, setBook] = useState(null);
  const [author, setAuthor] = useState(null);
  const [googleBook, setGoogleBook] = useState({});
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const userId = localStorage.getItem('userId'); 
  const [showModal, setShowModal] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]); // Lists the book should be in
  const [initialSelectedLists, setInitialSelectedLists] = useState([]); // Track original state
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [createListLoading, setCreateListLoading] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const handleAddToList = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/favourite/lists/${userId}`);
      const lists = await res.json();
      setUserLists(lists);
      
      // Check which lists already contain this book
      await checkBookInLists(lists);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching lists:', err);
      alert('Error loading your lists. Please try again.');
    }
  };

  // Check which lists already contain this book
  const checkBookInLists = async (lists) => {
    try {
      const listsWithBook = [];
      
      // Check each list to see if it contains this book
      for (const list of lists) {
        const res = await fetch(`http://localhost:4000/api/favourite/list/${list._id}`);
        const listBooks = await res.json();
        
        if (listBooks.some(book => book.bookKey === bookKey)) {
          listsWithBook.push(list._id);
        }
      }
      
      setSelectedLists(listsWithBook);
      setInitialSelectedLists([...listsWithBook]); // Store initial state
    } catch (err) {
      console.error('Error checking book in lists:', err);
    }
  };

  // Handle checkbox selection
  const handleListSelection = (listId) => {
    setSelectedLists(prev => {
      if (prev.includes(listId)) {
        return prev.filter(id => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };

  // Save changes to lists
  const saveListChanges = async () => {
    setSavingChanges(true);
    const errors = [];
    const successes = [];

    try {
      // Find lists to add to (selected but not initially selected)
      const listsToAddTo = selectedLists.filter(id => !initialSelectedLists.includes(id));
      
      // Find lists to remove from (initially selected but not currently selected)
      const listsToRemoveFrom = initialSelectedLists.filter(id => !selectedLists.includes(id));

      // Add to new lists
      for (const listId of listsToAddTo) {
        try {
          const payload = {
            userId,
            bookKey,
            listId,
            title: book.title,
            author: author?.name || 'Unknown',
            cover: book.covers?.[0] || null
          };
          
          const res = await fetch('http://localhost:4000/api/favourite/add-to-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const result = await res.json();
          
          if (!res.ok) {
            const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
            errors.push(`Failed to add to ${listName}: ${result.error || 'Unknown error'}`);
          } else {
            const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
            successes.push(`Added to ${listName}`);
          }
        } catch (err) {
          const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
          errors.push(`Failed to add to ${listName}: Network error`);
        }
      }

      // Remove from lists
      for (const listId of listsToRemoveFrom) {
        try {
          const res = await fetch('http://localhost:4000/api/favourite/remove-from-list', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              bookKey,
              listId
            }),
          });

          const result = await res.json();
          
          if (!res.ok) {
            const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
            errors.push(`Failed to remove from ${listName}: ${result.error || 'Unknown error'}`);
          } else {
            const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
            successes.push(`Removed from ${listName}`);
          }
        } catch (err) {
          const listName = userLists.find(list => list._id === listId)?.name || 'Unknown List';
          errors.push(`Failed to remove from ${listName}: Network error`);
        }
      }

      // Show results
      if (successes.length > 0 && errors.length === 0) {
        alert(`Changes saved successfully!\n${successes.join('\n')}`);
      } else if (successes.length > 0 && errors.length > 0) {
        alert(`Some changes saved:\n${successes.join('\n')}\n\nErrors:\n${errors.join('\n')}`);
      } else if (errors.length > 0) {
        alert(`Errors occurred:\n${errors.join('\n')}`);
      } else {
        alert('No changes to save.');
      }

      // Update bookmark status
      setBookmarked(selectedLists.length > 0);
      setInitialSelectedLists([...selectedLists]); // Update initial state
      
      if (errors.length === 0) {
        setShowModal(false);
      }
    } catch (err) {
      console.error('Save changes error:', err);
      alert('Error saving changes. Please try again.');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    setCreateListLoading(true);
    try {
      const payload = {
        userId,
        name: newListName.trim(),
        description: ''
      };

      const res = await fetch('http://localhost:4000/api/favourite/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (!res.ok) {
        alert(result.error || 'Failed to create list');
        return;
      }

      // Refresh the lists and check book status
      const listsRes = await fetch(`http://localhost:4000/api/favourite/lists/${userId}`);
      const updatedLists = await listsRes.json();
      setUserLists(updatedLists);
      await checkBookInLists(updatedLists);
      
      // Reset form
      setNewListName('');
      setShowCreateList(false);
      
      alert('List created successfully!');
    } catch (err) {
      console.error('Create list error:', err);
      alert('Error creating list. Please try again.');
    } finally {
      setCreateListLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowCreateList(false);
    setNewListName('');
    // Reset to initial state when closing without saving
    setSelectedLists([...initialSelectedLists]);
  };

  // Check if there are any changes to save
  const hasChanges = () => {
    return JSON.stringify(selectedLists.sort()) !== JSON.stringify(initialSelectedLists.sort());
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    console.log('BookDetails mounted. userId:', storedUserId);
  }, []);

  // Check if book is bookmarked in any list
  useEffect(() => {
    const checkIfBookmarked = async () => {
      if (!userId || !bookKey) return;

      try {
        const res = await fetch(`http://localhost:4000/api/favourite/${userId}`);
        const favourites = await res.json();

        const isBookmarked = favourites.some(fav => fav.bookKey === bookKey);
        setBookmarked(isBookmarked);
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      }
    };

    checkIfBookmarked();
  }, [bookKey, userId]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      const decodedKey = decodeURIComponent(bookKey);
      try {
        console.log('Fetching book:', decodedKey);
        const res = await fetch(`https://openlibrary.org${decodedKey}.json`);
        const data = await res.json();
        setBook(data);
        console.log('Book data:', data);

        if (data.authors && data.authors[0]?.author?.key) {
          const authorKey = data.authors[0].author.key;
          console.log('Author key:', authorKey);

          const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
          const authorData = await authorRes.json();
          setAuthor(authorData);
          console.log('Author data:', authorData);

          const worksRes = await fetch(`https://openlibrary.org${authorKey}/works.json`);
          const worksData = await worksRes.json();
          console.log('Related works data:', worksData);
          setRelatedBooks(worksData.entries.slice(0, 5));
        } else {
          console.warn('No author key found in book data.');
          setAuthor(null);
          setRelatedBooks([]);
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
      }
    };

    fetchBookDetails();
  }, [bookKey]);

  useEffect(() => {
    const fetchGoogleBook = async () => {
      if (!book?.title) return;
      const title = book.title;
      const authorName = author?.name;

      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}${
        authorName ? `+inauthor:${encodeURIComponent(authorName)}` : ''
      }`;

      try {
        const googleRes = await fetch(googleUrl);
        const googleData = await googleRes.json();

        if (googleData.totalItems > 0) {
          setGoogleBook(googleData.items[0].volumeInfo);
          console.log('Google Book info:', googleData.items[0].volumeInfo);
        } else {
          console.warn('No matching book found in Google Books for:', title, 'by', authorName);
          setGoogleBook({});
        }
      } catch (err) {
        console.error('Error fetching Google Book info:', err);
      }
    };

    fetchGoogleBook();
  }, [book?.title, author?.name]);

  if (!book) {
    return <div className="book_details_container"><p>Loading...</p></div>;
  }

  if (!userId) {
    alert('Please log in to bookmark books.');
    return;
  }

  const getFirstAvailable = (...values) => {
    return values.find(val => val !== null && val !== undefined && val !== '') || 'Not available';
  };

  return (
    <div className="book_details_container">
      <div className="cover-section">
        {book.covers?.[0] && (
          <img
            src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`}
            alt={book.title}
          />
        )}
        <h2>{book.title}</h2>
      </div>

      <div className={`addtolist-icon ${bookmarked ? 'bookmarked' : ''}`} onClick={handleAddToList}>
        {bookmarked ? <FaCheck /> : <FaPlus />}
      </div>

      {/* Modal for selecting/creating lists */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Lists</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {!showCreateList ? (
                <>
                  <div className="lists-section">
                    <h4>Select Lists:</h4>
                    <p className="instructions">✓ = Book is in this list | ✗ = Book will be removed</p>
                    {userLists.length > 0 ? (
                      <div className="lists-checkbox-container">
                        {userLists.map((list) => (
                          <div key={list._id} className="list-checkbox-item">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedLists.includes(list._id)}
                                onChange={() => handleListSelection(list._id)}
                                className="list-checkbox"
                              />
                              <span className="checkmark"></span>
                              <div className="list-info">
                                <h5>
                                  {list.name}
                                  {initialSelectedLists.includes(list._id) && (
                                    <span className="status-indicator">
                                      {selectedLists.includes(list._id) ? 
                                        <span className="in-list"> (Currently in list)</span> : 
                                        <span className="will-remove"> (Will be removed)</span>
                                      }
                                    </span>
                                  )}
                                  {!initialSelectedLists.includes(list._id) && selectedLists.includes(list._id) && (
                                    <span className="will-add"> (Will be added)</span>
                                  )}
                                </h5>
                                {list.description && <p>{list.description}</p>}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No lists found. Create your first list!</p>
                    )}

                    {userLists.length > 0 && (
                      <div className="selected-info">
                        <p>Book will be in {selectedLists.length} list(s) after saving</p>
                        {hasChanges() && <p className="changes-indicator">⚠ You have unsaved changes</p>}
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    {userLists.length > 0 && (
                      <button 
                        className="save-changes-btn"
                        onClick={saveListChanges}
                        disabled={!hasChanges() || savingChanges}
                      >
                        {savingChanges ? 'Saving...' : hasChanges() ? 'Save Changes' : 'No Changes to Save'}
                      </button>
                    )}

                    <button 
                      className="create-list-btn"
                      onClick={() => setShowCreateList(true)}
                    >
                      + Create New List
                    </button>
                  </div>
                </>
              ) : (
                <div className="create-list-form">
                  <h4>Create New List</h4>
                  <form onSubmit={handleCreateList}>
                    <div className="form-group">
                      <label htmlFor="listName">List Name:</label>
                      <input
                        type="text"
                        id="listName"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g., Sci-Fi Books, To Read Later"
                        maxLength="50"
                        required
                      />
                    </div>

                    <div className="form-buttons">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateList(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createListLoading}
                        className="submit-btn"
                      >
                        {createListLoading ? 'Creating...' : 'Create List'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="detail-section">
        {/* ISBN - Show if available from either source */}
        <p><strong>ISBN 10:</strong> {getFirstAvailable(
          book.isbn_10?.[0],
          googleBook.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier
        )}</p>

        {/* Publish Date */}
        <p><strong>Publish Date:</strong> {getFirstAvailable(
          book.first_publish_date,
          googleBook.publishedDate
        )}</p>

        {/* Publisher */}
        <p><strong>Publisher:</strong> {getFirstAvailable(
          book.publishers?.[0],
          googleBook.publisher
        )}</p>

        {/* Pages */}
        <p><strong>Pages:</strong> {getFirstAvailable(
          book.number_of_pages,
          googleBook.pageCount
        )}</p>

        {/* Rating - Only from Google Books */}
        {googleBook.averageRating && (
          <p><strong>Rating:</strong> {googleBook.averageRating} ⭐</p>
        )}

        {/* Preview Link */}
        {googleBook.previewLink && (
          <p>
            <strong>Preview:</strong>{' '}
            <a href={googleBook.previewLink} target="_blank" rel="noopener noreferrer">
              View on Google Books
            </a>
          </p>
        )}

        {/* Language */}
        <p><strong>Language:</strong> {getFirstAvailable(
          book.languages?.[0]?.key?.replace('/languages/', '').toUpperCase(),
          googleBook.language,
          'Not specified'
        )}</p>

        {/* Description */}
        {(() => {
          const openLibDesc = typeof book.description === 'string' 
            ? book.description 
            : book.description?.value;
          const description = getFirstAvailable(openLibDesc, googleBook.description);
          
          if (description !== 'Not available') {
            return (
              <>
                <h3>Description</h3>
                <p>{description}</p>
              </>
            );
          } else {
            return <p><em>No description available.</em></p>;
          }
        })()}

        {/* Author */}
        {author && (
          <>
            <h3>Author</h3>
            <p>{author.name}</p>
            {author.bio && (
              <p>
                {typeof author.bio === 'string'
                  ? author.bio
                  : author.bio.value}
              </p>
            )}
          </>
        )}

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <>
            <h3>Related Books</h3>
            <div className="related-books">
              {relatedBooks
                .filter(book => book.covers && book.covers.length > 0)
                .map((item, index) => (
                  <Link to={`/book/${encodeURIComponent(item.key)}`} key={index}>
                    <img
                      src={`https://covers.openlibrary.org/b/id/${item.covers[0]}-M.jpg`}
                      alt={item.title}
                    />
                  </Link>
                ))}
            </div>
          </>
        )}

        <Link to="/home" style={{ marginTop: '20px', color: '#3e2d18', textDecoration: 'underline' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}