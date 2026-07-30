const test = require('node:test');
const assert = require('node:assert/strict');
const { signUpUser, signInUser } = require('../src/scripts/auth.js');

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test('signUpUser stores a new account for later sign-in', () => {
  const storage = new MemoryStorage();
  const user = signUpUser({ email: 'Hero@Example.com', password: 'secret123' }, storage);

  assert.equal(user.email, 'hero@example.com');
  assert.equal(user.password, 'secret123');
  assert.equal(signInUser({ email: 'Hero@Example.com', password: 'secret123' }, storage).email, 'hero@example.com');
});

test('signInUser rejects the wrong password', () => {
  const storage = new MemoryStorage();
  signUpUser({ email: 'player@example.com', password: 'abc123' }, storage);

  assert.equal(signInUser({ email: 'player@example.com', password: 'wrong' }, storage), null);
});
