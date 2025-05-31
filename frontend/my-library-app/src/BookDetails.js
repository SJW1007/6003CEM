// BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaRegBookmark, FaBookmark } from 'react-icons/fa';
import './BookDetails.css';

export default function BookDetail() {
  const { bookKey } = useParams(); // e.g., OL12345W
  const [book, setBook] = useState(null);
  const [author, setAuthor] = useState(null);
  const [googleBook, setGoogleBook] = useState({});// JW: Added googleBook state to store Google Books data
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

//JW added useEffect to fetch Google Books data
  useEffect(() => {
  const fetchGoogleBook = async () => {
    if (!book?.title) return; // wait for book title
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

      <div className="bookmark-icon" onClick={toggleBookmark}>
  {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
</div>


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
