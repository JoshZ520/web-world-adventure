(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof root !== 'undefined') {
    root.CSSDungeonAuth = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'css-dungeon-users';
  const SESSION_KEY = 'css-dungeon-session';

  function getStorage(storage) {
    return storage || (typeof window !== 'undefined' ? window.localStorage : null);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function readUsers(storage = getStorage()) {
    if (!storage) {
      return [];
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeUsers(users, storage = getStorage()) {
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function getSession(storage = getStorage()) {
    if (!storage) {
      return null;
    }

    const raw = storage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setSession(user, storage = getStorage()) {
    if (!storage) {
      return;
    }

    storage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession(storage = getStorage()) {
    if (!storage) {
      return;
    }

    storage.removeItem(SESSION_KEY);
  }

  function signUpUser({ email, password }, storage = getStorage()) {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers(storage);

    if (!normalizedEmail || !password) {
      return null;
    }

    const existing = users.find((user) => user.email === normalizedEmail);
    if (existing) {
      return null;
    }

    const user = { email: normalizedEmail, password };
    users.push(user);
    writeUsers(users, storage);
    setSession(user, storage);
    return user;
  }

  function signInUser({ email, password }, storage = getStorage()) {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers(storage);
    const user = users.find((entry) => entry.email === normalizedEmail && entry.password === password);

    if (!user) {
      return null;
    }

    setSession(user, storage);
    return user;
  }

  function signOut(storage = getStorage()) {
    clearSession(storage);
  }

  return {
    STORAGE_KEY,
    SESSION_KEY,
    normalizeEmail,
    readUsers,
    writeUsers,
    getSession,
    setSession,
    clearSession,
    signUpUser,
    signInUser,
    signOut,
  };
});
