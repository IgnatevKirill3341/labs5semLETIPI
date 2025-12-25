"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var API_BASE = 'https://localhost:3443/api';
var allUsers = [];
document.addEventListener('DOMContentLoaded', function () {
  loadUsers();
});
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
          allUsers = data.users;
          populateUserSelect();
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
function populateUserSelect() {
  var select = document.getElementById('userSelect');
  select.innerHTML = '<option value="">Выберите пользователя</option>';
  allUsers.forEach(function (user) {
    var option = document.createElement('option');
    option.value = user.id;
    option.textContent = "".concat(user.lastName, " ").concat(user.firstName, " ").concat(user.middleName || '').trim();
    select.appendChild(option);
  });
}
function loadFriends() {
  return _loadFriends.apply(this, arguments);
}
function _loadFriends() {
  _loadFriends = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var userId, response, data, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          userId = document.getElementById('userSelect').value;
          if (userId) {
            _context2.n = 1;
            break;
          }
          document.getElementById('friendsContainer').innerHTML = '<div class="alert alert-info">Выберите пользователя для просмотра списка друзей</div>';
          return _context2.a(2);
        case 1:
          _context2.p = 1;
          _context2.n = 2;
          return fetch("".concat(API_BASE, "/friends/").concat(userId), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        case 2:
          response = _context2.v;
          if (response.ok) {
            _context2.n = 3;
            break;
          }
          throw new Error('Failed to load friends');
        case 3:
          _context2.n = 4;
          return response.json();
        case 4:
          data = _context2.v;
          displayFriends(data.friends, userId);
          _context2.n = 6;
          break;
        case 5:
          _context2.p = 5;
          _t2 = _context2.v;
          console.error('Error loading friends:', _t2);
          alert('Ошибка загрузки друзей');
        case 6:
          return _context2.a(2);
      }
    }, _callee2, null, [[1, 5]]);
  }));
  return _loadFriends.apply(this, arguments);
}
function displayFriends(friendIds, currentUserId) {
  var container = document.getElementById('friendsContainer');
  if (friendIds.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">У этого пользователя пока нет друзей</div>';
    return;
  }
  var friends = allUsers.filter(function (user) {
    return friendIds.includes(user.id);
  });
  var currentUser = allUsers.find(function (u) {
    return u.id === parseInt(currentUserId);
  });
  var html = "\n        <div class=\"mb-3\">\n            <h3>\u0414\u0440\u0443\u0437\u044C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F: ".concat(currentUser.lastName, " ").concat(currentUser.firstName, "</h3>\n        </div>\n        <div class=\"row\">\n    ");
  friends.forEach(function (friend) {
    var fullName = "".concat(friend.lastName, " ").concat(friend.firstName, " ").concat(friend.middleName || '').trim();
    html += "\n            <div class=\"col-md-4 mb-3\">\n                <div class=\"card\">\n                    <div class=\"card-body\">\n                        <div class=\"d-flex align-items-center\">\n                            <img src=\"".concat(friend.photo || 'https://via.placeholder.com/80', "\" \n                                 alt=\"Photo\" \n                                 class=\"friend-photo me-3\">\n                            <div>\n                                <h5 class=\"card-title\">").concat(fullName, "</h5>\n                                <p class=\"card-text mb-1\">").concat(friend.email, "</p>\n                                <p class=\"card-text\">\n                                    <small class=\"text-muted\">").concat(formatDate(friend.dateOfBirth), "</small>\n                                </p>\n                            </div>\n                        </div>\n                        <button class=\"btn btn-sm btn-danger mt-2\" \n                                onclick=\"removeFriend(").concat(currentUserId, ", ").concat(friend.id, ")\">\n                            \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0438\u0437 \u0434\u0440\u0443\u0437\u0435\u0439\n                        </button>\n                    </div>\n                </div>\n            </div>\n        ");
  });
  html += '</div>';
  container.innerHTML = html;
}
function formatDate(dateString) {
  if (!dateString) return '';
  var date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}
function removeFriend(_x, _x2) {
  return _removeFriend.apply(this, arguments);
}
function _removeFriend() {
  _removeFriend = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(userId1, userId2) {
    var response, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (confirm('Вы уверены, что хотите удалить этого пользователя из друзей?')) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          _context3.p = 1;
          _context3.n = 2;
          return fetch("".concat(API_BASE, "/friends/").concat(userId1, "/").concat(userId2), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        case 2:
          response = _context3.v;
          if (response.ok) {
            _context3.n = 3;
            break;
          }
          throw new Error('Failed to remove friend');
        case 3:
          loadFriends();
          _context3.n = 5;
          break;
        case 4:
          _context3.p = 4;
          _t3 = _context3.v;
          console.error('Error removing friend:', _t3);
          alert('Ошибка удаления друга');
        case 5:
          return _context3.a(2);
      }
    }, _callee3, null, [[1, 4]]);
  }));
  return _removeFriend.apply(this, arguments);
}