// BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaRegBookmark, FaBookmark } from 'react-icons/fa';
import './BookDetails.css';

export default function BookDetail() {
  const { bookKey } = useParams(); // e.g., OL12345W
  const [book, setBook] = useState(null);
  const [author, setAuthor] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const userId = localStorage.getItem('userId'); 

  useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  console.log('BookDetails mounted. userId:', storedUserId);
}, []);


// Optionally store bookmarks in localStorage
useEffect(() => {
  const stored = localStorage.getItem('bookmarks');
  if (stored) {
    const bookmarks = JSON.parse(stored);
    setBookmarked(bookmarks.includes(bookKey));
  }
}, [bookKey]);
console.log("Current userId:", userId);

const toggleBookmark = async () => {
  const url = 'http://localhost:4000/api/favourite';
  const payload = {
    userId,
    bookKey,
    title: book.title,
    author: author?.name || 'Unknown',
    cover: book.covers?.[0] || null
  };
  console.log('Sending payload to backend:', payload);


  try {
    if (bookmarked) {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookKey })
      });
      if (!res.ok) throw new Error('Failed to remove favourite');
    } else {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add favourite');
    }

    setBookmarked(!bookmarked);
  } catch (err) {
    console.error('Bookmark toggle error:', err.message);
  }
};

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
      const decodedKey = decodeURIComponent(bookKey); // now it's "OL21177W"
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

  if (!book) {
    return <div className="book_details_container"><p>Loading...</p></div>;
  }
  if (!userId) {
  alert('Please log in to bookmark books.');
  return;
}

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

      <div className="bookmark-icon" onClick={toggleBookmark}>
  {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
</div>


      <div className="detail-section">
        {book.isbn_10 && (
          <p><strong>ISBN 10 :</strong> {book.isbn_10.join(', ')}</p>
        )}
        {book.first_publish_date && (
          <p><strong>Publish Date:</strong> {book.first_publish_date}</p>
        )}
        {book.publishers && (
          <p><strong>Publisher:</strong> {book.publishers[0]}</p>
        )}
        {book.languages && book.languages.length > 0 && (
          <p><strong>Language:</strong> English</p>
        )}
        {book.number_of_pages && (
          <p><strong>Pages:</strong> {book.number_of_pages}</p>
        )}

        {book.description && (
          <>
            <h3>Description</h3>
            <p>
              {typeof book.description === 'string'
                ? book.description
                : book.description.value}
            </p>
          </>
        )}

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

{relatedBooks.length > 0 && (
  <>
    <h3>Related Books</h3>
    <div className="related-books">
      {relatedBooks
        .filter(book => book.covers && book.covers.length > 0) // Only books with covers
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
