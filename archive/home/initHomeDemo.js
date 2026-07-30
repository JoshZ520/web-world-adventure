const HOME_DEMO_STARTER = `<main class="character-card">
  <h1>Rowan Stormblade</h1>
  <p class="character-class">Ranger</p>
  <p class="character-bio">
    A careful explorer who maps forgotten trails and helps travelers find their way home.
  </p>

  <h2>Character Stats</h2>
  <ul class="character-stats">
    <li>Strength: 6</li>
    <li>Wisdom: 8</li>
    <li>Dex (Dexterity): 9</li>
  </ul>
</main>

<style>
body {
  background-color: aliceblue;
  font-family: Arial, sans-serif;
}

.character-card {
  max-width: 420px;
  padding: 24px;
  background-color: white;
  border: 2px solid slategray;
  border-radius: 12px;
  margin: 40px auto;
  text-align: center;
}

.character-card h1 {
  color: slategray;
}

.character-class {
  font-weight: bold;
}

.character-bio {
  line-height: 1.5;
}

.character-stats {
  list-style: none;
  padding: 0;
}
</style>`;

const HOME_DEMO_PLACEHOLDER = 'Try changing colors, text, spacing, or borders, then click Run preview.';

function isHomePage() {
  return Boolean(document.getElementById('home-demo-input'));
}

function buildPreviewDocument(content) {
  if (/<html[\s>]/i.test(content)) {
    return content;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
${content}
</body>
</html>`;
}

export function initHomeDemo() {
  if (!isHomePage()) {
    return;
  }

  const inputEl = document.getElementById('home-demo-input');
  const previewEl = document.getElementById('home-demo-preview');
  const runButton = document.getElementById('home-demo-run');
  const resetButton = document.getElementById('home-demo-reset');
  const feedbackEl = document.getElementById('home-demo-feedback');

  if (!inputEl || !previewEl || !runButton || !resetButton || !feedbackEl) {
    return;
  }

  const setFeedback = (message, isError = false) => {
    feedbackEl.textContent = message;
    feedbackEl.style.color = isError ? '#8a1f1f' : '#1f6d2c';
  };

  const runPreview = () => {
    const source = inputEl.value.trim();
    if (!source) {
      setFeedback('Add some code before running preview.', true);
      return;
    }

    previewEl.srcdoc = buildPreviewDocument(source);
    setFeedback('Preview updated. Keep experimenting!', false);
  };

  inputEl.value = HOME_DEMO_STARTER;
  previewEl.srcdoc = buildPreviewDocument(HOME_DEMO_STARTER);
  setFeedback(HOME_DEMO_PLACEHOLDER, false);

  runButton.addEventListener('click', runPreview);
  resetButton.addEventListener('click', () => {
    inputEl.value = HOME_DEMO_STARTER;
    previewEl.srcdoc = buildPreviewDocument(HOME_DEMO_STARTER);
    setFeedback('Reset to the original example.', false);
  });
}
