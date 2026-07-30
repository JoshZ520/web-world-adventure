class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.render();
    window.addEventListener('auth:updated', () => this.render());
  }

  render() {
    const authApi = window.CSSDungeonAuth;
    const user = authApi?.getSession ? authApi.getSession() : null;
    const isLoggedIn = Boolean(user);

    this.innerHTML = `
      <header class="site-header">
        <nav class="top-nav" aria-label="Primary">
          <a href="/src/pages/index.html" class="brand">Logo</a>
          <ul class="nav-links">
            <li><a href="/src/pages/index.html">Home</a></li>
            <li><a href="/src/pages/about.html">About</a></li>
            <li><a href="/src/pages/app.html#map">Quest Map</a></li>
            <li><a href="/src/pages/app.html#profile">Profile</a></li>
            ${isLoggedIn ? '<li><a href="/src/pages/login.html">Account</a></li>' : '<li><a href="/src/pages/login.html">Login</a></li>'}
          </ul>
        </nav>
      </header>
    `;
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer" aria-label="Site footer">
        <p>CSS Dungeon | ${year}</p>
      </footer>
    `;
  }
}

function registerLayoutComponents() {
  if (!customElements.get('site-header')) {
    customElements.define('site-header', SiteHeader);
  }

  if (!customElements.get('site-footer')) {
    customElements.define('site-footer', SiteFooter);
  }
}

function getCurrentRoute() {
  const hash = window.location.hash.replace('#', '').trim().toLowerCase();
  return hash || 'home';
}

function renderHashRoute() {
  const appRoot = document.querySelector('[data-router="hash"]');
  if (!appRoot) {
    return;
  }

  const defaultRoute = appRoot.getAttribute('data-default-route') || 'home';
  const route = getCurrentRoute();
  const routeViews = appRoot.querySelectorAll('[data-route]');
  let hasMatch = false;

  routeViews.forEach((view) => {
    const isMatch = view.getAttribute('data-route') === route;
    view.hidden = !isMatch;
    if (isMatch) {
      hasMatch = true;
    }
  });

  if (!hasMatch) {
    routeViews.forEach((view) => {
      view.hidden = view.getAttribute('data-route') !== defaultRoute;
    });
  }
}

function initHashRouting() {
  renderHashRoute();
  window.addEventListener('hashchange', renderHashRoute);
}

function initAuthPage() {
  const authForm = document.getElementById('auth-form');
  const authMessage = document.getElementById('auth-message');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authToggle = document.querySelector('[data-auth-toggle]');
  const signOutButton = document.getElementById('sign-out-button');
  const authSubmit = document.querySelector('.auth-submit');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authTitle = document.getElementById('auth-title');
  const authApi = window.CSSDungeonAuth;

  if (!authForm || !authMessage || !authEmail || !authPassword || !authSubmit || !authToggle || !authApi) {
    return;
  }

  let mode = 'signin';

  function updateMode() {
    authSubmit.textContent = mode === 'signin' ? 'Sign in' : 'Create account';
    authToggle.textContent = mode === 'signin' ? 'Need an account?' : 'Already have an account?';
    authTitle.textContent = mode === 'signin' ? 'Enter the dungeon' : 'Create your adventurer profile';
    authSubtitle.textContent = mode === 'signin'
      ? 'Sign in to continue your adventure or create a new account.'
      : 'Create an account to save your progress and return later.';
  }

  function renderSessionState() {
    const user = authApi.getSession();
    if (user) {
      authMessage.textContent = `Welcome back, ${user.email}.`;
      authForm.querySelectorAll('input').forEach((input) => {
        input.disabled = true;
      });
      authSubmit.disabled = true;
      authToggle.hidden = true;
      signOutButton.hidden = false;
      authTitle.textContent = 'Welcome back';
      authSubtitle.textContent = 'You are already signed in and ready for your next quest.';
    } else {
      authForm.querySelectorAll('input').forEach((input) => {
        input.disabled = false;
      });
      authSubmit.disabled = false;
      authToggle.hidden = false;
      signOutButton.hidden = true;
      updateMode();
    }
  }

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    const result = mode === 'signin' ? authApi.signInUser({ email, password }) : authApi.signUpUser({ email, password });

    if (!result) {
      authMessage.textContent = mode === 'signin'
        ? 'That sign-in did not match our records.'
        : 'That email is already in use.';
      return;
    }

    authMessage.textContent = mode === 'signin'
      ? `Welcome back, ${result.email}.`
      : `Account created for ${result.email}.`;
    authForm.reset();
    window.dispatchEvent(new CustomEvent('auth:updated'));
    renderSessionState();
  });

  authToggle.addEventListener('click', () => {
    mode = mode === 'signin' ? 'signup' : 'signin';
    updateMode();
    authMessage.textContent = '';
  });

  signOutButton.addEventListener('click', () => {
    authApi.signOut();
    authForm.reset();
    authMessage.textContent = 'You have signed out.';
    window.dispatchEvent(new CustomEvent('auth:updated'));
    renderSessionState();
  });

  updateMode();
  renderSessionState();
}

export function initApp() {
  registerLayoutComponents();
  initHashRouting();
  initAuthPage();
  document.querySelectorAll('site-header').forEach((header) => {
    if (header.render) {
      header.render();
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
