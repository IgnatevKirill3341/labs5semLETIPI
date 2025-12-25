"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var API_BASE = 'https://localhost:3443/api';

// Default placeholder photo URL
var DEFAULT_PHOTO = 'https://ui-avatars.com/api/?size=150&background=0d6efd&color=fff';

// Generate avatar URL from user name
function generateAvatarUrl(firstName, lastName, middleName) {
  var name = [lastName, firstName, middleName].filter(Boolean).join('+');
  return "https://ui-avatars.com/api/?name=".concat(encodeURIComponent(name), "&size=150&background=0d6efd&color=fff");
}

// Validate email format
function validateEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if user is 18 years or older
function isAdult(dateOfBirth) {
  if (!dateOfBirth) return false;
  var birthDate = new Date(dateOfBirth);
  var today = new Date();
  var age = today.getFullYear() - birthDate.getFullYear();
  var monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
    age--;
  }
  return age >= 18;
}

// Load users on page load
document.addEventListener('DOMContentLoaded', function () {
  loadUsers();
  setupEventListeners();
});
function setupEventListeners() {
  // Setup form submit handler
  var form = document.getElementById('userForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveUser();
    });
  }

  // Setup reset button
  var resetBtn = document.querySelector('button[onclick="resetForm()"]');
  if (resetBtn) {
    resetBtn.onclick = resetForm;
  }

  // Setup save button
  var saveBtn = document.querySelector('button[onclick="saveUser()"]');
  if (saveBtn) {
    saveBtn.onclick = saveUser;
  }
}
function loadUsers() {
  return _loadUsers.apply(this, arguments);
}
function _loadUsers() {
  _loadUsers = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var response, data, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return fetch("".concat(API_BASE, "/users"), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        case 1:
          response = _context.v;
          if (response.ok) {
            _context.n = 2;
            break;
          }
          throw new Error('Failed to load users');
        case 2:
          _context.n = 3;
          return response.json();
        case 3:
          data = _context.v;
          displayUsers(data.users);
          _context.n = 5;
          break;
        case 4:
          _context.p = 4;
          _t = _context.v;
          console.error('Error loading users:', _t);
          alert('Ошибка загрузки пользователей');
        case 5:
          return _context.a(2);
      }
    }, _callee, null, [[0, 4]]);
  }));
  return _loadUsers.apply(this, arguments);
}
function displayUsers(users) {
  var tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';
  users.forEach(function (user) {
    var row = document.createElement('tr');
    var fullName = "".concat(user.lastName, " ").concat(user.firstName, " ").concat(user.middleName || '').trim();
    var roleText = user.role === 'admin' ? 'Администратор' : 'Пользователь';
    var statusText = getStatusText(user.status);
    var statusClass = getStatusClass(user.status);
    var photoUrl = user.photo || generateAvatarUrl(user.firstName, user.lastName, user.middleName);
    row.innerHTML = "\n            <td><img src=\"".concat(photoUrl, "\" alt=\"Photo\" class=\"user-photo\"></td>\n            <td>").concat(fullName, "</td>\n            <td>").concat(user.email, "</td>\n            <td>").concat(roleText, "</td>\n            <td><span class=\"badge bg-").concat(statusClass, "\">").concat(statusText, "</span></td>\n            <td>\n                <button class=\"btn btn-sm btn-primary edit-btn\" data-user-id=\"").concat(user.id, "\">\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button>\n                <button class=\"btn btn-sm btn-danger delete-btn\" data-user-id=\"").concat(user.id, "\">\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button>\n            </td>\n        ");

    // Add event listeners
    var editBtn = row.querySelector('.edit-btn');
    var deleteBtn = row.querySelector('.delete-btn');
    editBtn.addEventListener('click', function () {
      return editUser(user.id);
    });
    deleteBtn.addEventListener('click', function () {
      return deleteUser(user.id);
    });
    tbody.appendChild(row);
  });
}
function getStatusText(status) {
  var statusMap = {
    'unconfirmed': 'Не подтверждённый',
    'active': 'Активный',
    'blocked': 'Заблокированный'
  };
  return statusMap[status] || status;
}
function getStatusClass(status) {
  var classMap = {
    'unconfirmed': 'warning',
    'active': 'success',
    'blocked': 'danger'
  };
  return classMap[status] || 'secondary';
}
function formatDate(dateString) {
  if (!dateString) return '';
  var date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}
function resetForm() {
  var formTitle = document.getElementById('formTitle');
  var formTitleCard = document.getElementById('formTitleCard');
  var addUserBtn = document.getElementById('addUserBtn');
  if (formTitle) formTitle.textContent = 'Добавить пользователя';
  if (formTitleCard) formTitleCard.textContent = 'Добавить пользователя';
  if (addUserBtn) addUserBtn.style.display = 'none';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
}
function editUser(_x) {
  return _editUser.apply(this, arguments);
}
function _editUser() {
  _editUser = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(userId) {
    var response, user, formTitle, formTitleCard, addUserBtn, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return fetch("".concat(API_BASE, "/users/").concat(userId), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        case 1:
          response = _context2.v;
          if (response.ok) {
            _context2.n = 2;
            break;
          }
          throw new Error('Failed to load user');
        case 2:
          _context2.n = 3;
          return response.json();
        case 3:
          user = _context2.v;
          formTitle = document.getElementById('formTitle');
          formTitleCard = document.getElementById('formTitleCard');
          addUserBtn = document.getElementById('addUserBtn');
          if (formTitle) formTitle.textContent = 'Редактировать пользователя';
          if (formTitleCard) formTitleCard.textContent = 'Редактировать пользователя';
          if (addUserBtn) addUserBtn.style.display = 'block';
          document.getElementById('userId').value = user.id;
          document.getElementById('firstName').value = user.firstName;
          document.getElementById('lastName').value = user.lastName;
          document.getElementById('middleName').value = user.middleName || '';
          document.getElementById('dateOfBirth').value = user.dateOfBirth;
          document.getElementById('email').value = user.email;
          document.getElementById('role').value = user.role;
          document.getElementById('status').value = user.status;

          // Прокрутить к форме
          document.querySelector('.user-form-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          _context2.n = 5;
          break;
        case 4:
          _context2.p = 4;
          _t2 = _context2.v;
          console.error('Error loading user:', _t2);
          alert('Ошибка загрузки пользователя');
        case 5:
          return _context2.a(2);
      }
    }, _callee2, null, [[0, 4]]);
  }));
  return _editUser.apply(this, arguments);
}
function saveUser() {
  return _saveUser.apply(this, arguments);
}
function _saveUser() {
  _saveUser = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var userId, firstName, lastName, middleName, email, dateOfBirth, hasErrors, photo, userData, url, method, response, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          userId = document.getElementById('userId').value;
          firstName = document.getElementById('firstName').value.trim();
          lastName = document.getElementById('lastName').value.trim();
          middleName = document.getElementById('middleName').value.trim();
          email = document.getElementById('email').value.trim();
          dateOfBirth = document.getElementById('dateOfBirth').value; // Clear previous error messages
          document.getElementById('emailError').textContent = '';
          document.getElementById('ageError').textContent = '';
          document.getElementById('email').classList.remove('is-invalid');
          document.getElementById('dateOfBirth').classList.remove('is-invalid');
          hasErrors = false; // Validate email
          if (!validateEmail(email)) {
            document.getElementById('emailError').textContent = 'Введите корректный email адрес';
            document.getElementById('email').classList.add('is-invalid');
            hasErrors = true;
          }

          // Validate age (only for new users, not when editing)
          if (!userId && !isAdult(dateOfBirth)) {
            document.getElementById('ageError').textContent = 'Пользователь должен быть старше 18 лет';
            document.getElementById('dateOfBirth').classList.add('is-invalid');
            hasErrors = true;
          }
          if (!hasErrors) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          // Generate avatar from name (photo field removed from form)
          photo = generateAvatarUrl(firstName, lastName, middleName);
          userData = {
            firstName: firstName,
            lastName: lastName,
            middleName: middleName,
            dateOfBirth: dateOfBirth,
            email: email,
            photo: photo,
            role: document.getElementById('role').value,
            status: document.getElementById('status').value
          };
          _context3.p = 2;
          url = userId ? "".concat(API_BASE, "/users/").concat(userId) : "".concat(API_BASE, "/users");
          method = userId ? 'PUT' : 'POST';
          _context3.n = 3;
          return fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
          });
        case 3:
          response = _context3.v;
          if (response.ok) {
            _context3.n = 4;
            break;
          }
          throw new Error('Failed to save user');
        case 4:
          // Сбросить форму после успешного сохранения
          resetForm();
          loadUsers();
          _context3.n = 6;
          break;
        case 5:
          _context3.p = 5;
          _t3 = _context3.v;
          console.error('Error saving user:', _t3);
          alert('Ошибка сохранения пользователя');
        case 6:
          return _context3.a(2);
      }
    }, _callee3, null, [[2, 5]]);
  }));
  return _saveUser.apply(this, arguments);
}
function deleteUser(_x2) {
  return _deleteUser.apply(this, arguments);
} // Make functions globally available for onclick handlers
function _deleteUser() {
  _deleteUser = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(userId) {
    var response, _t4;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            _context4.n = 1;
            break;
          }
          return _context4.a(2);
        case 1:
          _context4.p = 1;
          _context4.n = 2;
          return fetch("".concat(API_BASE, "/users/").concat(userId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        case 2:
          response = _context4.v;
          if (response.ok) {
            _context4.n = 3;
            break;
          }
          throw new Error('Failed to delete user');
        case 3:
          loadUsers();
          _context4.n = 5;
          break;
        case 4:
          _context4.p = 4;
          _t4 = _context4.v;
          console.error('Error deleting user:', _t4);
          alert('Ошибка удаления пользователя');
        case 5:
          return _context4.a(2);
      }
    }, _callee4, null, [[1, 4]]);
  }));
  return _deleteUser.apply(this, arguments);
}
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.resetForm = resetForm;