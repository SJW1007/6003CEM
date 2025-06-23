import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes, FaCheck, FaLanguage, FaSpinner, FaUndo } from 'react-icons/fa';
import './BookDetails.css';

export default function BookDetail() {
  const { bookKey } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [author, setAuthor] = useState(null);
  const [googleBook, setGoogleBook] = useState({});
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const API_URL = 'https://six003cem.onrender.com';
  
  // Authentication state
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Modal and list management states
  const [showModal, setShowModal] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [initialSelectedLists, setInitialSelectedLists] = useState([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [createListLoading, setCreateListLoading] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // Translation states
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalContent, setOriginalContent] = useState({});
  const [translatedContent, setTranslatedContent] = useState({});
  const [translationLanguage, setTranslationLanguage] = useState('es');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState('');

  // Available languages for translation
  const availableLanguages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' }
  ];

  // UI Text translations
  const uiTexts = {
    en: {
      loading: 'Loading...',
      loadingBookDetails: 'Loading book details...',
      isbn10: 'ISBN 10',
      publishDate: 'Publish Date',
      publisher: 'Publisher',
      pages: 'Pages',
      rating: 'Rating',
      preview: 'Preview',
      viewOnGoogleBooks: 'View on Google Books',
      language: 'Language',
      notSpecified: 'Not specified',
      description: 'Description',
      noDescriptionAvailable: 'No description available.',
      author: 'Author',
      relatedBooks: 'Related Books',
      backToHome: '← Back to Home',
      translateTo: 'Translate to:',
      translate: 'Translate',
      showOriginal: 'Show Original',
      translating: 'Translating...',
      translationFailed: 'Translation failed. Please try again.',
      contentTranslatedTo: 'Content translated to',
      clickToShowOriginal: 'Click here to show original text',
      notAvailable: 'Not available',
      manageListsTitle: 'Manage Lists',
      selectLists: 'Select Lists:',
      createNewList: '+ Create New List',
      saveChanges: 'Save Changes',
      noChangesToSave: 'No Changes to Save',
      saving: 'Saving...',
      name: 'Name',
      biography: 'Biography',
      instructions: '✓ = Book is in this list | ✗ = Book will be removed',
      noListsFound: 'No lists found. Create your first list!',
      bookWillBeIn: 'Book will be in',
      listsAfterSaving: 'list(s) after saving',
      unsavedChanges: 'You have unsaved changes',
      createNewListTitle: 'Create New List',
      listName: 'List Name',
      listNamePlaceholder: 'e.g., Sci-Fi Books, To Read Later',
      cancel: 'Cancel',
      createList: 'Create List',
      creating: 'Creating...',
      currentlyInList: ' Currently in list',
      willBeRemoved: ' Will be removed',
      willBeAdded: ' Will be added'
    }
  };

const logToTerminal = (message, data = null) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  const formattedMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    // Browser console with better formatting
    console.group(`🔍 ${formattedMessage}`);
    console.log(data);
    console.groupEnd();
    
    // Terminal output (if available)
    try {
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write(`${formattedMessage}\n${JSON.stringify(data, null, 2)}\n`);
      }
    } catch (e) {
      // Enhanced fallback for browser with structured output
      console.log(`📟 [TERMINAL-STYLE] ${formattedMessage}:`, data);
    }
  } else {
    // Browser console
    console.log(`🔍 ${formattedMessage}`);
    
    // Terminal output (if available)
    try {
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write(`${formattedMessage}\n`);
      }
    } catch (e) {
      // Fallback for browser
      console.log(`📟 [TERMINAL-STYLE] ${formattedMessage}`);
    }
  }
};

const logDataSource = (field, openLibValue, googleValue, finalValue, source) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  
  console.group(`🔍 [${timestamp}] ${field.toUpperCase()} DATA SOURCE ANALYSIS`);
  console.log('═'.repeat(50));
  console.log('📚 OpenLibrary:', openLibValue || '❌ Not available');
  console.log('🌐 Google Books:', googleValue || '❌ Not available');
  console.log('✅ Final Value:', finalValue || '❌ Not available');
  console.log('🎯 Source Used:', source);
  console.log('═'.repeat(50));
  
  const logData = {
    field: field.toUpperCase(),
    timestamp: timestamp,
    sources: {
      openLibrary: openLibValue || '❌ Not available',
      googleBooks: googleValue || '❌ Not available'
    },
    result: {
      finalValue: finalValue || '❌ Not available',
      sourceUsed: source
    }
  };
  
  console.log('📊 Complete Data Object:', logData);
  console.groupEnd();
  
  // Terminal output
  try {
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`\n[${timestamp}] 🔍 ${field.toUpperCase()} DATA SOURCE ANALYSIS\n`);
      process.stdout.write('═'.repeat(50) + '\n');
      process.stdout.write(`📚 OpenLibrary: ${openLibValue || '❌ Not available'}\n`);
      process.stdout.write(`🌐 Google Books: ${googleValue || '❌ Not available'}\n`);
      process.stdout.write(`✅ Final Value: ${finalValue || '❌ Not available'}\n`);
      process.stdout.write(`🎯 Source Used: ${source}\n`);
      process.stdout.write('═'.repeat(50) + '\n');
      process.stdout.write(`📊 Complete Data: ${JSON.stringify(logData, null, 2)}\n`);
    }
  } catch (e) {
    console.log(`📟 [TERMINAL-STYLE] ${field.toUpperCase()} Analysis:`, logData);
  }
};

const logTranslationContent = (content, stage) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  
  console.group(`🌐 [${timestamp}] TRANSLATION ${stage.toUpperCase()}`);
  console.log('═'.repeat(60));
  
  Object.entries(content).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      const preview = value.length > 150 ? value.substring(0, 150) + '...' : value;
      console.log(`📝 ${key.toUpperCase()}:`, preview);
    } else {
      console.log(`❌ ${key.toUpperCase()}:`, value || 'N/A');
    }
  });
  
  console.log('═'.repeat(60));
  console.log('🗂️ Full Content Object:', content);
  console.groupEnd();
  
  // Terminal output
  try {
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`\n[${timestamp}] 🌐 TRANSLATION ${stage.toUpperCase()}\n`);
      process.stdout.write('═'.repeat(60) + '\n');
      Object.entries(content).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const preview = value.length > 150 ? value.substring(0, 150) + '...' : value;
          process.stdout.write(`📝 ${key.toUpperCase()}: ${preview}\n`);
        } else {
          process.stdout.write(`❌ ${key.toUpperCase()}: ${value || 'N/A'}\n`);
        }
      });
      process.stdout.write('═'.repeat(60) + '\n');
    }
  } catch (e) {
    console.log(`📟 [TERMINAL-STYLE] Translation ${stage}:`, content);
  }
};

  // Get translated UI text
  const getUIText = (key) => {
    if (!isTranslated || !translatedContent.uiTexts) {
      return uiTexts.en[key] || key;
    }
    return translatedContent.uiTexts[key] || uiTexts.en[key] || key;
  };

  // Authentication helper function
  const getAuthHeaders = useCallback(() => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  // Check authentication and redirect if not authenticated
  const checkAuth = useCallback(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    if (!storedToken || !storedUserId) {
      alert('Please log in to view book details.');
      navigate('/login');
      return false;
    }
    
    setToken(storedToken);
    setUserId(storedUserId);
    return true;
  }, [navigate]);

  // Handle authentication errors
  const handleAuthError = useCallback((error) => {
    logToTerminal('Authentication error:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    alert('Your session has expired. Please log in again.');
    navigate('/login');
  }, [navigate]);

  // API call wrapper with token authentication
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (response.status === 401) {
        handleAuthError('Token expired or invalid');
        return null;
      }

      return response;
    } catch (error) {
      logToTerminal('Authenticated fetch error:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  // ISBN 10 extraction helper
  const getISBN10Value = useCallback(() => {
    const openLibISBN = book?.isbn_10?.[0];
    const googleISBN = googleBook?.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibISBN && openLibISBN.trim()) {
      finalValue = openLibISBN;
      source = '📚 OpenLibrary';
    } else if (googleISBN && googleISBN.trim()) {
      finalValue = googleISBN;
      source = '🌐 Google Books';
    }
    
    logDataSource('ISBN 10', openLibISBN, googleISBN, finalValue, source);
    return finalValue;
  }, [book?.isbn_10, googleBook?.industryIdentifiers]);

  // Publish Date extraction helper
  const getPublishDateValue = useCallback(() => {
    const openLibDate = book?.first_publish_date;
    const googleDate = googleBook?.publishedDate;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibDate && openLibDate.trim()) {
      finalValue = openLibDate;
      source = '📚 OpenLibrary';
    } else if (googleDate && googleDate.trim()) {
      finalValue = googleDate;
      source = '🌐 Google Books';
    }
    
    logDataSource('Publish Date', openLibDate, googleDate, finalValue, source);
    return finalValue;
  }, [book?.first_publish_date, googleBook?.publishedDate]);

  // Publisher extraction helper
  const getPublisherValue = useCallback(() => {
    const openLibPublisher = book?.publishers?.[0];
    const googlePublisher = googleBook?.publisher;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibPublisher && openLibPublisher.trim() && openLibPublisher !== 'Not available') {
      finalValue = openLibPublisher;
      source = '📚 OpenLibrary';
    } else if (googlePublisher && googlePublisher.trim() && googlePublisher !== 'Not available') {
      finalValue = googlePublisher;
      source = '🌐 Google Books';
    }
    
    logDataSource('Publisher', openLibPublisher, googlePublisher, finalValue, source);
    return finalValue;
  }, [book?.publishers, googleBook?.publisher]);

  // Pages extraction helper
  const getPagesValue = useCallback(() => {
    const openLibPages = book?.number_of_pages;
    const googlePages = googleBook?.pageCount;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibPages && typeof openLibPages === 'number' && openLibPages > 0) {
      finalValue = openLibPages;
      source = '📚 OpenLibrary';
    } else if (googlePages && typeof googlePages === 'number' && googlePages > 0) {
      finalValue = googlePages;
      source = '🌐 Google Books';
    }
    
    logDataSource('Pages', openLibPages, googlePages, finalValue, source);
    return finalValue;
  }, [book?.number_of_pages, googleBook?.pageCount]);

  // Language extraction helper
  const getLanguageValue = useCallback(() => {
    const openLibLang = book?.languages?.[0]?.key?.replace('/languages/', '').toUpperCase();
    const googleLang = googleBook?.language;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibLang && openLibLang.trim()) {
      finalValue = openLibLang;
      source = '📚 OpenLibrary';
    } else if (googleLang && googleLang.trim()) {
      finalValue = googleLang;
      source = '🌐 Google Books';
    }
    
    logDataSource('Language', openLibLang, googleLang, finalValue, source);
    return finalValue;
  }, [book?.languages, googleBook?.language]);

  // Description extraction helper
  const getDescriptionValue = useCallback(() => {
    const openLibDesc = typeof book?.description === 'string' 
      ? book.description 
      : book?.description?.value;
    const googleDesc = googleBook?.description;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (openLibDesc && openLibDesc.trim() && openLibDesc !== 'Not available') {
      finalValue = openLibDesc;
      source = '📚 OpenLibrary';
    } else if (googleDesc && googleDesc.trim() && googleDesc !== 'Not available') {
      finalValue = googleDesc;
      source = '🌐 Google Books';
    }
    
    // Special logging for description with preview
    logDataSource('Description', 
      openLibDesc ? `"${openLibDesc.substring(0, 100)}..."` : null,
      googleDesc ? `"${googleDesc.substring(0, 100)}..."` : null,
      finalValue ? `"${finalValue.substring(0, 100)}..."` : null,
      source
    );
    
    return finalValue;
  }, [book?.description, googleBook?.description]);

  // Author Name extraction helper
  const getAuthorNameValue = useCallback(() => {
    const authorName = author?.name;
    
    let finalValue = null;
    let source = '❌ None';
    
    if (authorName && authorName.trim()) {
      finalValue = authorName;
      source = '📚 OpenLibrary';
    }
    
    logDataSource('Author Name', authorName, 'N/A', finalValue, source);
    return finalValue;
  }, [author?.name]);

  // Author Biography extraction helper
  const getAuthorBiographyValue = useCallback(() => {
    let authorBio = null;
    let source = '❌ None';
    
    if (author?.bio) {
      if (typeof author.bio === 'string') {
        authorBio = author.bio;
        source = '📚 OpenLibrary (string)';
      } else if (author.bio.value) {
        authorBio = author.bio.value;
        source = '📚 OpenLibrary (object.value)';
      }
    }
    
    // Enhanced logging for biography
    const timestamp = new Date().toISOString().slice(11, 23);
    console.group(`👤 [${timestamp}] AUTHOR BIOGRAPHY DATA SOURCE ANALYSIS`);
    console.log('═'.repeat(60));
    console.log('📚 Raw Author Bio Object:', author?.bio);
    console.log('📝 Bio Type:', typeof author?.bio);
    console.log('✅ Final Biography:', authorBio ? `"${authorBio.substring(0, 150)}..."` : '❌ Not available');
    console.log('🎯 Source Used:', source);
    console.log('📏 Biography Length:', authorBio ? `${authorBio.length} characters` : 'N/A');
    console.log('═'.repeat(60));
    console.groupEnd();
    
    return authorBio;
  }, [author?.bio]);

  // Related Books extraction helper
  const getRelatedBooksValue = useCallback(() => {
    const timestamp = new Date().toISOString().slice(11, 23);
    
    console.group(`📚 [${timestamp}] RELATED BOOKS DATA SOURCE ANALYSIS`);
    console.log('═'.repeat(60));
    console.log('📊 Total Related Books Found:', relatedBooks.length);
    console.log('📖 Books with Covers:', relatedBooks.filter(book => book.covers && book.covers.length > 0).length);
    console.log('🎯 Source Used: 📚 OpenLibrary Author Works API');
    
    if (relatedBooks.length > 0) {
      console.log('\n📋 RELATED BOOKS DETAILS:');
      relatedBooks.forEach((book, index) => {
        console.log(`   ${index + 1}. Title: "${book.title || 'No title'}"`);
        console.log(`      Key: ${book.key || 'No key'}`);
        console.log(`      Covers: ${book.covers ? book.covers.length : 0} available`);
        console.log(`      First Cover ID: ${book.covers?.[0] || 'N/A'}`);
      });
      
      console.log('\n🖼️ DISPLAYABLE BOOKS (with covers):');
      const displayableBooks = relatedBooks.filter(book => book.covers && book.covers.length > 0);
      displayableBooks.forEach((book, index) => {
        console.log(`   ${index + 1}. "${book.title}" - Cover: ${book.covers[0]}`);
      });
    } else {
      console.log('❌ No related books found');
    }
    
    console.log('═'.repeat(60));
    console.groupEnd();
    
    return relatedBooks;
  }, [relatedBooks]);

  // Biography tracking function
  const debugBiographyFlow = (stage, data) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    console.group(`👤 [${timestamp}] BIOGRAPHY DEBUG - ${stage.toUpperCase()}`);
    console.log('Current author object:', author);
    console.log('Author bio type:', typeof author?.bio);
    console.log('Author bio value:', author?.bio);
    console.log('Original content keys:', Object.keys(originalContent));
    console.log('Original content authorBio:', originalContent.authorBio);
    console.log('Additional data:', data);
    console.groupEnd();
  };

  // Check bookmark status
  const checkBookmarkStatus = useCallback(async () => {
    if (!userId || !bookKey || !token) {
      logToTerminal('❌ Missing required data for bookmark check:', { userId: !!userId, bookKey: !!bookKey, token: !!token });
      return;
    }

    try {
      logToTerminal('🔍 Checking bookmark status for book:', bookKey);
      
      const res = await authenticatedFetch(`${API_URL}/api/favourite/lists/${userId}`);
      if (!res) {
        logToTerminal('❌ Failed to fetch user lists');
        return;
      }
      
      const lists = await res.json();
      logToTerminal('📋 Found user lists:', lists.length);
      
      let isBookInAnyList = false;
      
      for (const list of lists) {
        try {
          const listRes = await authenticatedFetch(`${API_URL}/api/favourite/list/${list._id}`);
          if (!listRes) continue;
          
          const listBooks = await listRes.json();
          
          if (listBooks.some(book => book.bookKey === bookKey)) {
            logToTerminal(`✅ Book found in list: ${list.name}`);
            isBookInAnyList = true;
            break;
          }
        } catch (err) {
          logToTerminal(`Error checking list ${list.name}:`, err);
        }
      }
      
      logToTerminal('📖 Final bookmark status:', isBookInAnyList);
      setBookmarked(isBookInAnyList);
      
    } catch (err) {
      logToTerminal('❌ Error checking bookmark status:', err);
      setBookmarked(false);
    }
  }, [userId, bookKey, token, authenticatedFetch]);

  //Google translate with error handling
  const batchTranslateTexts = async (texts, targetLanguage) => {
    try {
      logToTerminal(`🌐 Sending ${texts.length} texts to Google Translate API`);
      
      const validTexts = texts.filter(text => text && text.trim());
      
      if (validTexts.length === 0) {
        throw new Error('No valid texts to translate');
      }

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: validTexts,
            target: targetLanguage,
            format: 'text',
            source: 'en',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logToTerminal('❌ Translation API error:', errorData);
        throw new Error(errorData.error?.message || 'Translation failed');
      }

      const data = await response.json();
      logToTerminal('✅ Translation API response received');
      return data.data.translations.map(t => t.translatedText);
    } catch (error) {
      logToTerminal('❌ Translation error:', error);
      throw error;
    }
  };

  // Store original content with better timing and detailed logging
const storeOriginalContent = useCallback(() => {
  console.log('\n🔄 STORING ORIGINAL CONTENT (ENHANCED)');
  
  if (!book) {
    console.log('❌ No book data available');
    return;
  }

  // Wait for author data if it's still loading
  if (book.authors && book.authors.length > 0 && !author) {
    console.log('⏳ Author data still loading, deferring storage...');
    setTimeout(() => storeOriginalContent(), 500);
    return;
  }

  const contentToStore = {};
  
  // Title
  contentToStore.title = book.title;
  console.log('✅ Title stored:', !!contentToStore.title);
  
  // Description
  const openLibDesc = typeof book.description === 'string' 
    ? book.description 
    : book.description?.value;
  const googleDesc = googleBook.description;
  contentToStore.description = openLibDesc || googleDesc;
  console.log('✅ Description stored:', !!contentToStore.description);
  
  // Author handling with detailed logging
  if (author) {
    // Author name
    contentToStore.authorName = author.name;
    console.log('✅ Author name stored:', contentToStore.authorName);
    
    // Author biography with multiple fallback strategies
    let authorBio = null;
    
    if (author.bio) {
      if (typeof author.bio === 'string' && author.bio.trim()) {
        authorBio = author.bio.trim();
        console.log('✅ Author bio stored (string):', authorBio.substring(0, 50) + '...');
      } else if (author.bio.value && typeof author.bio.value === 'string' && author.bio.value.trim()) {
        authorBio = author.bio.value.trim();
        console.log('✅ Author bio stored (object.value):', authorBio.substring(0, 50) + '...');
      } else if (author.bio.text && typeof author.bio.text === 'string' && author.bio.text.trim()) {
        authorBio = author.bio.text.trim();
        console.log('✅ Author bio stored (object.text):', authorBio.substring(0, 50) + '...');
      } else {
        console.log('❌ Author bio object exists but no usable text found');
        console.log('   Bio structure:', author.bio);
      }
    } else {
      console.log('❌ No author.bio property found');
    }
    
    contentToStore.authorBio = authorBio;
  } else {
    console.log('❌ No author object available');
    console.log('   Book authors array:', book.authors);
  }
  
  // Publisher
  contentToStore.publisher = getPublisherValue();
  console.log('✅ Publisher stored:', contentToStore.publisher);
  
  // Language
  const openLibLang = book.languages?.[0]?.key?.replace('/languages/', '').toUpperCase();
  const googleLang = googleBook.language;
  contentToStore.language = openLibLang || googleLang;
  console.log('✅ Language stored:', contentToStore.language);
  
  console.log('\n📦 FINAL CONTENT TO STORE:');
  Object.entries(contentToStore).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? (typeof value === 'string' && value.length > 50 ? 'Available (long text)' : value) : 'Not available'}`);
  });
  
  setOriginalContent(contentToStore);
}, [book, author, googleBook.description, googleBook.language, getPublisherValue]);

  // Handle comprehensive translation with biography included
  const handleInPlaceTranslation = async () => {
  if (isTranslated) {
    setIsTranslated(false);
    setTranslationError('');
    return;
  }

  console.log('\n🌐 STARTING ENHANCED TRANSLATION');
  
  setTranslationLoading(true);
  setTranslationError('');
  
  try {
    const textsToTranslate = [];
    const textKeys = [];
    
    // Build translation arrays with validation
    const addForTranslation = (text, key) => {
      if (text && typeof text === 'string' && text.trim()) {
        textsToTranslate.push(text.trim());
        textKeys.push(key);
        console.log(`✅ Added for translation - ${key}: "${text.substring(0, 30)}..."`);
        return true;
      } else {
        console.log(`❌ Skipped translation - ${key}: invalid text`);
        return false;
      }
    };
    
    // Add content for translation
    addForTranslation(originalContent.title, 'title');
    addForTranslation(originalContent.description, 'description');
    addForTranslation(originalContent.authorName, 'authorName');
    addForTranslation(originalContent.authorBio, 'authorBio');
    addForTranslation(originalContent.publisher, 'publisher');
    
    console.log(`\n📊 TRANSLATION BATCH: ${textsToTranslate.length} items`);
    
    if (textsToTranslate.length === 0) {
      throw new Error('No valid content to translate');
    }
    
    // Add UI texts
    const uiTextValues = Object.values(uiTexts.en);
    const uiTextKeys = Object.keys(uiTexts.en);
    
    const allTexts = [...textsToTranslate, ...uiTextValues];
    const allKeys = [...textKeys, ...uiTextKeys.map(key => `ui_${key}`)];
    
    // Perform translation
    const translations = await batchTranslateTexts(allTexts, translationLanguage);
    
    // Map translations back
    const newTranslatedContent = { uiTexts: {} };
    
    translations.forEach((translation, index) => {
      const key = allKeys[index];
      if (key.startsWith('ui_')) {
        newTranslatedContent.uiTexts[key.replace('ui_', '')] = translation;
      } else {
        newTranslatedContent[key] = translation;
        console.log(`✅ Translation mapped - ${key}: "${translation.substring(0, 30)}..."`);
      }
    });
    
    console.log('\n🎉 TRANSLATION COMPLETED');
    console.log('   Translated content keys:', Object.keys(newTranslatedContent));
    
    setTranslatedContent(newTranslatedContent);
    setIsTranslated(true);
    
  } catch (error) {
    console.error('❌ Translation failed:', error);
    setTranslationError('Translation failed: ' + error.message);
  } finally {
    setTranslationLoading(false);
  }
};

  //  Get display content with improved logging
  const getDisplayContent = () => {
  //  Call all your data analysis functions
  const isbn10 = getISBN10Value();
  const publishDate = getPublishDateValue();
  const publisher = getPublisherValue();
  const pages = getPagesValue();
  const language = getLanguageValue();
  const description = getDescriptionValue();
  const authorName = getAuthorNameValue();
  const authorBio = getAuthorBiographyValue();
  const relatedBooksAnalysis = getRelatedBooksValue();
  
  // Log summary of all data sources
  logToTerminal('\n📊 COMPLETE DATA SOURCE SUMMARY');
  logToTerminal('═'.repeat(70));
  logToTerminal(`📚 ISBN 10: ${isbn10 || '❌ Not available'}`);
  logToTerminal(`📅 Publish Date: ${publishDate || '❌ Not available'}`);
  logToTerminal(`🏢 Publisher: ${publisher || '❌ Not available'}`);
  logToTerminal(`📄 Pages: ${pages || '❌ Not available'}`);
  logToTerminal(`🌍 Language: ${language || '❌ Not available'}`);
  logToTerminal(`📖 Description: ${description ? 'Available' : '❌ Not available'}`);
  logToTerminal(`👤 Author Name: ${authorName || '❌ Not available'}`);
  logToTerminal(`📝 Author Bio: ${authorBio ? 'Available' : '❌ Not available'}`);
  logToTerminal(`📚 Related Books: ${relatedBooksAnalysis.length} found`);
  logToTerminal('═'.repeat(70));
  
  if (!isTranslated) {
    // Get original author bio with proper handling
    const originalAuthorBio = author?.bio 
      ? (typeof author.bio === 'string' ? author.bio : author.bio.value)
      : null;
        
    const content = {
      title: book?.title || '',
      description: description || getUIText('notAvailable'),
      authorName: authorName || '',
      authorBio: originalAuthorBio,
      publisher: publisher || getUIText('notAvailable'),
      language: language || getUIText('notSpecified'),
      // Add the additional fields
      isbn10: isbn10,
      publishDate: publishDate,
      pages: pages
    };
    
    logToTerminal('\n📄 DISPLAYING ORIGINAL CONTENT');
    logTranslationContent(content, 'DISPLAY (ORIGINAL)');
    return content;
  }

  // For translated content, use translated values with fallbacks
  const content = {
    title: translatedContent.title || book?.title || '',
    description: translatedContent.description || description || getUIText('notAvailable'),
    authorName: translatedContent.authorName || authorName || '',
    authorBio: translatedContent.authorBio || (author?.bio ? (typeof author.bio === 'string' ? author.bio : author.bio.value) : null),
    publisher: translatedContent.publisher || publisher || getUIText('notAvailable'),
    language: language || getUIText('notSpecified'),
    // Add the additional fields
    isbn10: isbn10,
    publishDate: publishDate,
    pages: pages
  };
  
  logToTerminal('\n📄 DISPLAYING TRANSLATED CONTENT');
  logTranslationContent(content, 'DISPLAY (TRANSLATED)');
  
  // Special check for author biography translation
  if (content.authorBio && translatedContent.authorBio) {
    logToTerminal('\n✅ AUTHOR BIOGRAPHY TRANSLATION VERIFICATION');
    logToTerminal('═'.repeat(60));
    logToTerminal(`📖 Original: "${originalContent.authorBio?.substring(0, 100)}..."`);
    logToTerminal(`🌐 Translated: "${translatedContent.authorBio.substring(0, 100)}..."`);
    logToTerminal('═'.repeat(60));
  } else if (originalContent.authorBio && !translatedContent.authorBio) {
    logToTerminal('\n❌ AUTHOR BIOGRAPHY TRANSLATION MISSING');
    logToTerminal('═'.repeat(60));
    logToTerminal('Warning: Original biography exists but translation is missing');
    logToTerminal('═'.repeat(60));
  }
  
  return content;
};

  // LIST MANAGEMENT FUNCTIONS
  const handleAddToList = async () => {
    if (!token || !userId) {
      alert('Please log in to manage your lists.');
      navigate('/');
      return;
    }
    
    try {
      const res = await authenticatedFetch(`${API_URL}/api/favourite/lists/${userId}`);
      if (!res) return;
      
      const lists = await res.json();
      setUserLists(lists);
      
      await checkBookInLists(lists);
      setShowModal(true);
    } catch (err) {
      logToTerminal('Error fetching lists:', err);
      alert('Error loading your lists. Please try again.');
    }
  };

  const checkBookInLists = async (lists) => {
    try {
      const listsWithBook = [];
      
      for (const list of lists) {
        const res = await authenticatedFetch(`${API_URL}/api/favourite/list/${list._id}`);
        if (!res) continue;
        
        const listBooks = await res.json();
        
        if (listBooks.some(book => book.bookKey === bookKey)) {
          listsWithBook.push(list._id);
        }
      }
      
      setSelectedLists(listsWithBook);
      setInitialSelectedLists([...listsWithBook]);
    } catch (err) {
      logToTerminal('Error checking book in lists:', err);
    }
  };

  const handleListSelection = (listId) => {
    setSelectedLists(prev => {
      if (prev.includes(listId)) {
        return prev.filter(id => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };

  //add book to list and delete book from list
  const saveListChanges = async () => {
    setSavingChanges(true);
    const errors = [];
    const successes = [];

    try {
      const listsToAddTo = selectedLists.filter(id => !initialSelectedLists.includes(id));
      const listsToRemoveFrom = initialSelectedLists.filter(id => !selectedLists.includes(id));

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
          
          const res = await authenticatedFetch('${API_URL}/api/favourite/add-to-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res) continue;

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

      for (const listId of listsToRemoveFrom) {
        try {
          const res = await authenticatedFetch(`${API_URL}/api/favourite/remove-from-list`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              bookKey,
              listId
            }),
          });

          if (!res) continue;

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

      if (successes.length > 0 && errors.length === 0) {
        alert(`Changes saved successfully!\n${successes.join('\n')}`);
      } else if (successes.length > 0 && errors.length > 0) {
        alert(`Some changes saved:\n${successes.join('\n')}\n\nErrors:\n${errors.join('\n')}`);
      } else if (errors.length > 0) {
        alert(`Errors occurred:\n${errors.join('\n')}`);
      } else {
        alert('No changes to save.');
      }

      const newBookmarkStatus = selectedLists.length > 0;
      setBookmarked(newBookmarkStatus);
      setInitialSelectedLists([...selectedLists]);
      
      console.log('📖 Updated bookmark status after save:', newBookmarkStatus);
      
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

    const res = await authenticatedFetch(`${API_URL}/api/favourite/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res) {
      setCreateListLoading(false);
      alert('Network error. Please try again.');
      return;
    }

    const result = await res.json();
    
    if (!res.ok) {
      setCreateListLoading(false);
      // Handle specific error cases
      if (result.error && result.error.toLowerCase().includes('already exists')) {
        alert('A list with this name already exists. Please choose a different name.');
        // Clear the input field so user can enter a new name
        setNewListName('');
        // DON'T call setShowCreateList(false) - keep the form open
        return; // Exit early but keep the create list form open
      } else {
        alert(result.error || 'Failed to create list');
        // For other errors, also keep the form open
        return;
      }
    }

    // SUCCESS PATH - Only execute this if list creation was successful
    try {
      const listsRes = await authenticatedFetch(`${API_URL}/api/favourite/lists/${userId}`);
      if (listsRes && listsRes.ok) {
        const updatedLists = await listsRes.json();
        setUserLists(updatedLists);
        
        // Only call checkBookInLists if we successfully got the updated lists
        await checkBookInLists(updatedLists);
      }
    } catch (fetchError) {
      console.error('Error fetching updated lists:', fetchError);
      // Even if fetching fails, the list was created successfully
    }
    
    // Only reset form and close if successful
    setNewListName('');
    setShowCreateList(false); // Close the create list form
    setCreateListLoading(false);
    
    alert('List created successfully!');
    
  } catch (err) {
    console.error('Create list error:', err);
    setCreateListLoading(false);
    alert('Error creating list. Please try again.');
    // Don't close the form on network errors either
  }
};

  const handleModalOverlayClick = () => {
  // Don't close modal if we're in the middle of creating a list or saving changes
  if (createListLoading || savingChanges) {
    return;
  }
  setShowModal(false);
};

// Add these helper functions to better manage modal state
const handleCloseModal = () => {
  // Don't close if we're in the middle of operations
  if (createListLoading || savingChanges) {
    return;
  }
  
  // Reset create list form when closing modal
  setShowCreateList(false);
  setNewListName('');
  setShowModal(false);
};

const handleBackToLists = () => {
  // Don't go back if we're creating a list
  if (createListLoading) {
    return;
  }
  
  setShowCreateList(false);
  setNewListName('');
};

  const hasChanges = () => {
    return JSON.stringify(selectedLists.sort()) !== JSON.stringify(initialSelectedLists.sort());
  };

  //Store original content when data is available
useEffect(() => {
  // Wait for both book and author data to be available
  if (book && author && Object.keys(originalContent).length === 0) {
    logToTerminal('📚 Both book and author data available, storing original content');
    
    // Add a small delay to ensure all data is processed
    setTimeout(() => {
      storeOriginalContent();
    }, 200); // Increased delay
  }
  // Also handle case where author data comes later
  else if (book && !author && Object.keys(originalContent).length === 0) {
    logToTerminal('📚 Book data available but no author, storing partial original content');
    setTimeout(() => {
      storeOriginalContent();
    }, 100);
  }
  // Update original content when author becomes available
  else if (book && author && originalContent.title && !originalContent.authorBio) {
    logToTerminal('🔄 Author data now available, updating original content with biography');
    setTimeout(() => {
      storeOriginalContent();
    }, 100);
  }
}, [book, author, googleBook, storeOriginalContent, originalContent]);

  // Update original content when publisher data becomes available
  useEffect(() => {
    if (originalContent.title && !originalContent.publisher) {
      const currentPublisher = getPublisherValue();
      if (currentPublisher) {
        console.log('🔄 Updating original content with new publisher data:', currentPublisher);
        setOriginalContent(prev => ({
          ...prev,
          publisher: currentPublisher
        }));
      }
    }
  }, [originalContent, getPublisherValue]);

  // Reset translation when language changes
  useEffect(() => {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedContent({});
    }
  }, [translationLanguage]);

  // Initialize authentication on component mount
  useEffect(() => {
    const initAuth = () => {
      if (!checkAuth()) {
        return;
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  // Check bookmark status after authentication is complete
  useEffect(() => {
    if (!isAuthLoading && userId && bookKey && token) {
      console.log('🔍 Authentication complete, checking bookmark status');
      checkBookmarkStatus();
    }
  }, [isAuthLoading, userId, bookKey, token, checkBookmarkStatus]);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      const decodedKey = decodeURIComponent(bookKey);
      try {
        console.log('📖 Fetching book details for:', decodedKey);
        const res = await fetch(`https://openlibrary.org${decodedKey}.json`);
        const data = await res.json();
        console.log('📚 Book data loaded:', data);
        setBook(data);

        if (data.authors && data.authors[0]?.author?.key) {
          const authorKey = data.authors[0].author.key;
          console.log('👤 Fetching author data for:', authorKey);
          const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
          const authorData = await authorRes.json();
          console.log('👨‍🎓 Author data loaded:', authorData);
          setAuthor(authorData);

          const worksRes = await fetch(`https://openlibrary.org${authorKey}/works.json`);
          const worksData = await worksRes.json();
          setRelatedBooks(worksData.entries.slice(0, 5));
        } else {
          console.log('❌ No author data found');
          setAuthor(null);
          setRelatedBooks([]);
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
      }
    };
    fetchBookDetails();
  }, [bookKey]);

  // Fetch Google Book info
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
          const googleBookInfo = googleData.items[0].volumeInfo;
          console.log('📖 Google Books data loaded:', googleBookInfo);
          setGoogleBook(googleBookInfo);
        } else {
          setGoogleBook({});
        }
      } catch (err) {
        console.error('Error fetching Google Book info:', err);
      }
    };
    fetchGoogleBook();
  }, [book?.title, author?.name]);

  if (isAuthLoading) {
    return <div className="book_details_container"><p>{getUIText('loading')}</p></div>;
  }

  if (!book) {
    return <div className="book_details_container"><p>{getUIText('loadingBookDetails')}</p></div>;
  }

  const displayContent = getDisplayContent();

  return (
    <div className="book_details_container">
      <div className="cover-section">
        {book.covers?.[0] && (
          <img
            src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`}
            alt={displayContent.title}
          />
        )}
        <h2>
          {displayContent.title}
          {isTranslated && (
            <span className="translation-indicator">
              {' '}({availableLanguages.find(l => l.code === translationLanguage)?.name})
            </span>
          )}
        </h2>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <div className={`addtolist-icon ${bookmarked ? 'bookmarked' : ''}`} onClick={handleAddToList}>
          {bookmarked ? <FaCheck /> : <FaPlus />}
        </div>
        
        <div className="translate-section">
          <label htmlFor="language-select">{getUIText('translateTo')}</label>
          <select 
            id="language-select"
            value={translationLanguage} 
            onChange={(e) => setTranslationLanguage(e.target.value)}
            className="language-select"
            disabled={translationLoading}
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          
          <button 
            className={`translate-btn ${isTranslated ? 'translated' : ''}`}
            onClick={handleInPlaceTranslation}
            disabled={translationLoading}
          >
            {translationLoading ? (
              <>
                <FaSpinner className="spinning" />
                {getUIText('translating')}
              </>
            ) : isTranslated ? (
              <>
                <FaUndo />
                {getUIText('showOriginal')}
              </>
            ) : (
              <>
                <FaLanguage />
                {getUIText('translate')}
              </>
            )}
          </button>
        </div>
      </div>

      {translationError && (
        <div className="translation-error">
          <p>❌ {getUIText('translationFailed')}</p>
        </div>
      )}

      {/* Lists Modal */}
      {showModal && (
  <div className="modal-overlay" onClick={handleCloseModal}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{getUIText('manageListsTitle')}</h3>
        <button className="close-btn" onClick={handleCloseModal}>
          <FaTimes />
        </button>
      </div>

            <div className="modal-body">
              {!showCreateList ? (
                <>
                  <div className="lists-section">
                    <h4>{getUIText('selectLists')}:</h4>
                    <p className="instructions">✓ = {getUIText('bookInList')} | ✗ = {getUIText('bookWillBeRemoved')}</p>
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
                                        <span className="in-list"> ({getUIText('currentlyInList')})</span> : 
                                        <span className="will-remove"> ({getUIText('willBeRemoved')})</span>
                                      }
                                    </span>
                                  )}
                                  {!initialSelectedLists.includes(list._id) && selectedLists.includes(list._id) && (
                                    <span className="will-add"> ({getUIText('willBeAdded')})</span>
                                  )}
                                </h5>
                                {list.description && <p>{list.description}</p>}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{getUIText('noListsFound')}</p>
                    )}

                    {userLists.length > 0 && (
                      <div className="selected-info">
                        <p>{getUIText('bookWillBeIn')} {selectedLists.length} {getUIText('listsAfterSaving')}</p>
                        {hasChanges() && <p className="changes-indicator">⚠ {getUIText('unsavedChanges')}</p>}
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
                  {savingChanges ? getUIText('saving') : hasChanges() ? getUIText('saveChanges') : getUIText('noChangesToSave')}
                </button>
              )}

              <button 
                className="create-list-btn"
                onClick={() => setShowCreateList(true)}
                disabled={savingChanges}
              >
                {getUIText('createNewList')}
              </button>
            </div>
          </>
        ) : (
          <div className="create-list-form">
            <h4>{getUIText('createNewList')}</h4>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label htmlFor="listName">{getUIText('listName')}:</label>
                <input
                  type="text"
                  id="listName"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder={getUIText('listNamePlaceholder')}
                  maxLength="50"
                  required
                  disabled={createListLoading}
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={handleBackToLists}
                  className="cancel-btn"
                  disabled={createListLoading}
                >
                  {getUIText('cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={createListLoading || !newListName.trim()}
                  className="submit-btn"
                >
                  {createListLoading ? getUIText('creating') : getUIText('createList')}
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
  <p><strong>{getUIText('isbn10')}:</strong> {displayContent.isbn10 || getUIText('notAvailable')}</p>
  
  <p><strong>{getUIText('publishDate')}:</strong> {displayContent.publishDate || getUIText('notAvailable')}</p>
  
  <p><strong>{getUIText('publisher')}:</strong> {displayContent.publisher}</p>
  
  <p><strong>{getUIText('pages')}:</strong> {displayContent.pages || getUIText('notAvailable')}</p>

  {googleBook.averageRating && (
    <p><strong>{getUIText('rating')}:</strong> {googleBook.averageRating} ⭐</p>
  )}

  {googleBook.previewLink && (
    <p>
      <strong>{getUIText('preview')}:</strong>{' '}
      <a href={googleBook.previewLink} target="_blank" rel="noopener noreferrer">
        {getUIText('viewOnGoogleBooks')}
      </a>
    </p>
  )}

  <p><strong>{getUIText('language')}:</strong> {displayContent.language}</p>
  
  <p><strong>{getUIText('description')}:</strong> {displayContent.description}</p>

  {displayContent.authorName && (
    <>
      <h3>{getUIText('author')}</h3>
      <p><strong>{getUIText('name')}:</strong> {displayContent.authorName}</p>
      {displayContent.authorBio && (
        <>
          <p><strong>{getUIText('biography')}:</strong></p>
          <p>{displayContent.authorBio}</p>
        </>
      )}
    </>
  )}


        {relatedBooks.length > 0 && (
          <>
            <h3>{getUIText('relatedBooks')}</h3>
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
          {getUIText('backToHome')}
        </Link>
      </div>
    </div>
  );
}