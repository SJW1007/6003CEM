import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRobot, faSpinner, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Chatbot.css';

const Chatbot = ({ closeChatbot }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [searchType, setSearchType] = useState(''); // 'title', 'author', 'plot', or ''
  const [searchInput, setSearchInput] = useState('');

  // Search type options
  const searchTypes = [
    { 
      type: 'author', 
      label: 'Search by Author', 
      icon: '✍️', 
      placeholder: 'Enter author name ("Stephen King")',
      description: 'Find books by a specific author'
    },
    { 
      type: 'plot', 
      label: 'Search by Plot/Theme', 
      icon: '🔍', 
      placeholder: 'Describe the story ("time travel adventure")',
      description: 'Find books based on story themes or plot'
    }
  ];

  // Function to extract book titles and authors from chatbot response
  const extractBooksFromResponse = (text) => {
    const lines = text.split('\n');
    const books = [];
    
    lines.forEach(line => {
      // Match patterns like "1. Title by Author" or "• Title by Author"
      const match = line.match(/^\d+\.\s*["""]?([^""]+?)["""]?\s+by\s+(.+?)$/i) ||
                   line.match(/^•\s*["""]?([^""]+?)["""]?\s+by\s+(.+?)$/i);
      
      if (match) {
        const title = match[1].trim().replace(/^[""]|[""]$/g, '');
        const author = match[2].trim();
        books.push({ title, author });
      }
    });
    
    return books;
  };

  // Function to search for book using Open Library API
  // Function to search for book using Open Library API - FIXED VERSION
const searchBookOnOpenLibrary = async (title, author) => {
  try {
    // Search by title only to get more accurate results
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      // Find the best match by checking if author matches (case insensitive)
      let bestMatch = data.docs[0]; // Default to first result
      
      // Try to find a better match by comparing authors
      for (const book of data.docs.slice(0, 5)) { // Check first 5 results
        if (book.author_name && author) {
          const bookAuthors = book.author_name.map(a => a.toLowerCase());
          const searchAuthor = author.toLowerCase();
          
          // Check if any of the book's authors match the search author
          if (bookAuthors.some(bookAuthor => 
            bookAuthor.includes(searchAuthor) || searchAuthor.includes(bookAuthor)
          )) {
            bestMatch = book;
            break;
          }
        }
      }
      
      return {
        title: bestMatch.title,
        author: bestMatch.author_name ? bestMatch.author_name[0] : author,
        cover_id: bestMatch.cover_i,
        key: bestMatch.key, // This should now be the correct key
        first_publish_year: bestMatch.first_publish_year,
        found: true
      };
    }
  } catch (error) {
    console.error('Error searching for book:', error);
  }
  
  return { title, author, found: false };
};

  // Function to get book details for all extracted books
  const fetchBookDetails = async (books) => {
    setLoadingBooks(true);
    const bookDetails = [];
    
    for (const book of books) {
      const details = await searchBookOnOpenLibrary(book.title, book.author);
      bookDetails.push(details);
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setLoadingBooks(false);
    return bookDetails;
  };

  // Format query based on search type
  const formatQuery = (type, query) => {
    switch (type) {
      case 'title':
        return query; // Send title as-is
      case 'author':
        return `books by ${query}`;
      case 'plot':
        return `book about ${query}`;
      default:
        return query;
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowExamples(false); // Hide examples after first message

    try {
      const res = await fetch('http://localhost:4000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      const data = await res.json();
      const botMessage = { sender: 'bot', text: data.reply };
      setMessages(prev => [...prev, botMessage]);

      // Extract books from the response
      const extractedBooks = extractBooksFromResponse(data.reply);
      
      if (extractedBooks.length > 0) {
        // Fetch book details from Open Library
        const bookDetails = await fetchBookDetails(extractedBooks);
        
        // Add book cards message
        const bookCardsMessage = {
          sender: 'bot',
          type: 'chat-book-cards',
          books: bookDetails
        };
        setMessages(prev => [...prev, bookCardsMessage]);
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Error contacting the chatbot server. Please make sure the server is running.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !isLoading) {
      if (searchType && searchInput.trim()) {
        handleSearchSubmit();
      } else {
        sendMessage();
      }
    }
  };

  const handleSearchTypeSelect = (type) => {
    setSearchType(type);
    setSearchInput('');
  };

  const handleSearchSubmit = () => {
    if (!searchInput.trim()) return;
    
    const formattedQuery = formatQuery(searchType, searchInput.trim());
    sendMessage(formattedQuery);
    
    // Reset search form
    setSearchType('');
    setSearchInput('');
  };

  const handleBackToTypes = () => {
    setSearchType('');
    setSearchInput('');
  };

  const handleBookClick = (bookKey) => {
    // Navigate to book details page
    const encodedKey = encodeURIComponent(bookKey);
    window.open(`http://localhost:3000/book/${encodedKey}`, '_blank');
  };

  const BookCard = ({ book }) => {
    const coverUrl = book.cover_id 
      ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
      : '/api/placeholder/120/180';

    return (
      <div 
        className="chat-book-card"
        onClick={() => book.key && handleBookClick(book.key)}
        style={{
          cursor: book.found ? 'pointer' : 'default',
          opacity: book.found ? 1 : 0.7
        }}
      >
        <div className="chat-book-cover">
          <img 
            src={coverUrl} 
            alt={book.title}
            onError={(e) => {
              e.target.src = '/api/placeholder/120/180';
            }}
          />
        </div>
        <div className="chat-book-info">
          <h4 className="chat-book-title">{book.title}</h4>
          <p className="chat-book-author">by {book.author}</p>
          {book.first_publish_year && (
            <p className="chat-book-year">({book.first_publish_year})</p>
          )}
          {!book.found && (
            <p className="chat-book-status">Not found in Open Library</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-box">
        <div className="chatbot-header">
          <span>Literary Assistant</span>
          <button onClick={closeChatbot}>✖</button>
        </div>
        
        <div className="chatbot-messages">
          {showExamples && messages.length === 0 && (
            <div className="chatbot-welcome">
              {!searchType ? (
                // Show search type selection
                <>
                  <div className="welcome-message">
                    <FontAwesomeIcon icon={faRobot} />
                    <p>Hi! How would you like to search for books?</p>
                  </div>
                  <div className="search-type-selection">
                    {searchTypes.map((type, index) => (
                      <div 
                        key={index}
                        className="search-type-option"
                        onClick={() => handleSearchTypeSelect(type.type)}
                      >
                        <span className="search-type-icon">{type.icon}</span>
                        <div className="search-type-content">
                          <strong>{type.label}</strong>
                          <p>{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="free-text-option">
                    <p>Or type your question directly below!</p>
                  </div>
                </>
              ) : (
                // Show search input for selected type
                <div className="search-input-form">
                  <div className="search-form-header">
                    <button 
                      className="back-button"
                      onClick={handleBackToTypes}
                    >
                      ← Back
                    </button>
                    <div className="selected-search-type">
                      <span className="search-type-icon">
                        {searchTypes.find(t => t.type === searchType)?.icon}
                      </span>
                      <span>{searchTypes.find(t => t.type === searchType)?.label}</span>
                    </div>
                  </div>
                  <div className="search-input-container">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      placeholder={searchTypes.find(t => t.type === searchType)?.placeholder}
                      className="search-input-field"
                      autoFocus
                    />
                    <button 
                      onClick={handleSearchSubmit}
                      disabled={!searchInput.trim()}
                      className="search-submit-button"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'chat-book-cards' ? (
                <div className="chat-book-cards-container">
                  <div className="chat-book-cards-header">
                    <FontAwesomeIcon icon={faRobot} />
                    <span>Here are the books found:</span>
                  </div>
                  <div className="chat-book-cards-grid">
                    {msg.books.map((book, bookIndex) => (
                      <BookCard key={bookIndex} book={book} />
                    ))}
                  </div>
                  {loadingBooks && (
                    <div className="chat-loading-books">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Loading book details...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`chatbot-message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  <span className="chatbot-icon">
                    <FontAwesomeIcon icon={msg.sender === 'user' ? faUser : faRobot} />
                  </span>
                  <div className={`chatbot-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                    {msg.text ? msg.text.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    )) : ''}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="chatbot-message-row bot">
              <span className="chatbot-icon">
                <FontAwesomeIcon icon={faRobot} />
              </span>
              <div className="chatbot-message bot">
                <FontAwesomeIcon icon={faSpinner} spin /> Searching for books...
              </div>
            </div>
          )}
        </div>
        
        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask by title, author, or describe the story..."
            disabled={isLoading}
          />
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;