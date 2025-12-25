document.addEventListener('DOMContentLoaded', () => {
  // Set max date for release date input (today)
  const today = new Date().toISOString().split('T')[0];
  const releaseDateInput = document.getElementById('editReleaseDate');
  if (releaseDateInput) {
    releaseDateInput.setAttribute('max', today);
  }
  
  // Event listeners
  document.getElementById('editBookForm').addEventListener('submit', handleEditBook);
  
  document.getElementById('borrowBtn')?.addEventListener('click', () => {
    document.getElementById('borrowModal').showModal();
  });
  
  document.getElementById('returnBtn')?.addEventListener('click', handleReturnBook);
  
  document.getElementById('closeBorrowModal').addEventListener('click', () => {
    document.getElementById('borrowModal').close();
  });
  
  document.getElementById('borrowForm').addEventListener('submit', handleBorrowBook);
  
  document.getElementById('coverInput').addEventListener('change', handleCoverUpload);
  
  // Close modal on backdrop click
  document.getElementById('borrowModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.close();
    }
  });
  
  // Set minimum return date to today
  const returnDateInput = document.getElementById('returnDate');
  if (returnDateInput) {
    const today = new Date().toISOString().split('T')[0];
    returnDateInput.setAttribute('min', today);
  }
});

// Handle edit book form submission
async function handleEditBook(e) {
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
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });
    
    if (response.ok) {
      alert('Книга успешно обновлена');
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка при обновлении книги');
    }
  } catch (error) {
    console.error('Error updating book:', error);
    alert('Ошибка при обновлении книги');
  }
}

// Handle borrow book form submission
async function handleBorrowBook(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const borrowData = {
    borrowedBy: formData.get('borrowedBy'),
    returnDate: formData.get('returnDate')
  };
  
  try {
    const response = await fetch(`/api/books/${bookId}/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(borrowData)
    });
    
    if (response.ok) {
      document.getElementById('borrowModal').close();
      e.target.reset();
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка при выдаче книги');
    }
  } catch (error) {
    console.error('Error borrowing book:', error);
    alert('Ошибка при выдаче книги');
  }
}

// Handle return book
async function handleReturnBook() {
  if (!confirm('Вы уверены, что хотите вернуть книгу в библиотеку?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/books/${bookId}/return`, {
      method: 'POST'
    });
    
    if (response.ok) {
      window.location.reload();
    } else {
      alert('Ошибка при возврате книги');
    }
  } catch (error) {
    console.error('Error returning book:', error);
    alert('Ошибка при возврате книги');
  }
}

// Handle cover upload
async function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Размер файла не должен превышать 5MB');
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите изображение');
    return;
  }
  
  const formData = new FormData();
  formData.append('cover', file);
  
  try {
    const response = await fetch(`/api/books/${bookId}/cover`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      // Update cover image
      const coverSection = document.querySelector('.book-cover-large');
      coverSection.className = 'book-cover-large';
      coverSection.innerHTML = `<img src="${data.coverImage}" alt="Обложка">`;
      alert('Обложка успешно загружена');
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка при загрузке обложки');
    }
  } catch (error) {
    console.error('Error uploading cover:', error);
    alert('Ошибка при загрузке обложки');
  }
}
