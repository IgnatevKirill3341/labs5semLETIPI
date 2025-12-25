// Load books on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  
  // Set max date for release date input (today)
  const today = new Date().toISOString().split('T')[0];
  const releaseDateInput = document.getElementById('addReleaseDate');
  if (releaseDateInput) {
    releaseDateInput.setAttribute('max', today);
  }
  
  // Event listeners
  document.getElementById('addBookBtn').addEventListener('click', () => {
    // Reset max date when opening modal
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addReleaseDate').setAttribute('max', today);
    document.getElementById('addBookModal').showModal();
  });
  
  document.getElementById('closeAddModal').addEventListener('click', () => {
    document.getElementById('addBookModal').close();
  });
  
  document.getElementById('filterSelect').addEventListener('change', (e) => {
    filterBooks(e.target.value);
  });
  
  document.getElementById('addBookForm').addEventListener('submit', handleAddBook);
  
  document.getElementById('closeDeleteModal').addEventListener('click', () => {
    document.getElementById('deleteModal').close();
  });
  
  document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').close();
  });
  
  document.getElementById('confirmDelete').addEventListener('click', handleDeleteBook);
  
  // Close modal on backdrop click
  document.getElementById('addBookModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.close();
    }
  });
  
  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.close();
    }
  });
});

// Load all books
async function loadBooks(filter = 'all') {
  try {
    const url = filter === 'all' ? '/api/books' : `/api/books?filter=${filter}`;
    const response = await fetch(url);
    const books = await response.json();
    renderBooks(books);
  } catch (error) {
    console.error('Error loading books:', error);
    alert('Ошибка при загрузке книг');
  }
}

// Filter books using AJAX
async function filterBooks(filter) {
  try {
    const url = filter === 'all' ? '/api/books' : `/api/books?filter=${filter}`;
    const response = await fetch(url);
    const books = await response.json();
    renderBooks(books);
  } catch (error) {
    console.error('Error filtering books:', error);
    alert('Ошибка при фильтрации книг');
  }
}

// Render books to the grid
function renderBooks(books) {
  const grid = document.getElementById('booksGrid');
  
  if (books.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">Книги не найдены</p>';
    return;
  }
  
  grid.innerHTML = books.map(book => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = !book.isAvailable && book.returnDate && book.returnDate < today;
    
    let statusHtml = '';
    if (book.isAvailable) {
      statusHtml = `
        <span class="status-badge available">
          <i class="fas fa-check-circle"></i> В наличии
        </span>
      `;
    } else {
      statusHtml = `
        <span class="status-badge borrowed">
          <i class="fas fa-exclamation-circle"></i> Выдана
        </span>
        ${book.returnDate ? `
          <p class="borrower-info ${isOverdue ? 'overdue' : ''}">
            <i class="fas fa-user"></i> ${book.borrowedBy}<br>
            <i class="fas fa-clock"></i> Вернуть до: ${book.returnDate}
            ${isOverdue ? `
              <span class="overdue-badge">
                <i class="fas fa-exclamation-triangle"></i> Просрочено
              </span>
            ` : ''}
          </p>
        ` : ''}
      `;
    }
    
    const coverHtml = book.coverImage 
      ? `<div class="book-cover"><img src="${book.coverImage}" alt="${book.title}"></div>`
      : `<div class="book-cover placeholder"><i class="fas fa-book"></i></div>`;
    
    return `
      <div class="book-card" data-id="${book.id}">
        ${coverHtml}
        <div class="book-info">
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-author">
            <i class="fas fa-user-edit"></i> ${escapeHtml(book.author)}
          </p>
          <p class="book-release">
            <i class="fas fa-calendar"></i> ${book.releaseDate}
          </p>
          <div class="book-status">
            ${statusHtml}
          </div>
        </div>
        <div class="book-actions">
          <a href="/books/${book.id}" class="btn btn-sm btn-primary">
            <i class="fas fa-eye"></i> Открыть
          </a>
          <button class="btn btn-sm btn-danger delete-book" data-id="${book.id}" data-title="${escapeHtml(book.title)}">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach delete event listeners
  document.querySelectorAll('.delete-book').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bookId = e.target.closest('.delete-book').dataset.id;
      const bookTitle = e.target.closest('.delete-book').dataset.title;
      showDeleteModal(bookId, bookTitle);
    });
  });
}

// Handle add book form submission
async function handleAddBook(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const releaseDate = formData.get('releaseDate');
  
  // Валидация даты на клиенте
  if (releaseDate) {
    const today = new Date().toISOString().split('T')[0];
    if (releaseDate > today) {
      alert('Дата выпуска не может быть из будущего');
      return;
    }
  }
  
  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    releaseDate: releaseDate
  };
  
  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });
    
    if (response.ok) {
      document.getElementById('addBookModal').close();
      e.target.reset();
      loadBooks(document.getElementById('filterSelect').value);
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка при добавлении книги');
    }
  } catch (error) {
    console.error('Error adding book:', error);
    alert('Ошибка при добавлении книги');
  }
}

// Show delete confirmation modal
function showDeleteModal(bookId, bookTitle) {
  document.getElementById('deleteBookTitle').textContent = bookTitle;
  document.getElementById('deleteModal').dataset.bookId = bookId;
  document.getElementById('deleteModal').showModal();
}

// Handle delete book
async function handleDeleteBook() {
  const bookId = document.getElementById('deleteModal').dataset.bookId;
  
  try {
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      document.getElementById('deleteModal').close();
      loadBooks(document.getElementById('filterSelect').value);
    } else {
      alert('Ошибка при удалении книги');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    alert('Ошибка при удалении книги');
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
