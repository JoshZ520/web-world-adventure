import { QUEST_PROGRESS_KEY, QUEST_UI_CONFIG } from '../src/scripts/quest/constants.js';
import { validateChallengeSection, validateCssSection, validateHtmlSection } from '../src/scripts/quest/validation.js';
import { createCssAssistController } from '../src/scripts/quest/cssAssist.js';

function isQuestPage() {
  return Boolean(document.getElementById('code-input'));
}

function getCssPreviewMarkup() {
  return `
<main class="character-card">
  <h1>Aria Dawnbrook</h1>
  <p class="character-class">Mage</p>
  <p class="character-bio">A determined spellcaster who studies ancient runes and helps villages recover lost knowledge.</p>
  <h2>Character Stats</h2>
  <ul class="character-stats">
    <li>Strength: 5</li>
    <li>Wisdom: 9</li>
    <li>Dex (Dexterity): 7</li>
  </ul>
</main>
`;
}

function getLearnerHtmlPreviewMarkup(progress, quest) {
  const htmlSection = (quest.sections || []).find((section) => section.type === 'html');
  if (!htmlSection) {
    return getCssPreviewMarkup();
  }

  const draftCode = progress.drafts[htmlSection.id];
  if (typeof draftCode === 'string' && draftCode.trim()) {
    return draftCode;
  }

  if (typeof htmlSection.starterCode === 'string' && htmlSection.starterCode.trim()) {
    return htmlSection.starterCode;
  }

  return getCssPreviewMarkup();
}

function wrapIntoDocument(bodyMarkup, cssCode = '', jsCode = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${cssCode}</style>
</head>
<body>
${bodyMarkup}
<script>${jsCode}<\/script>
</body>
</html>`;
}

function buildPreviewDocument(section, userCode, previewContext = {}) {
  if (section.type === 'html') {
    return wrapIntoDocument(userCode);
  }

  if (section.type === 'css') {
    const htmlMarkup = previewContext.htmlMarkup || getCssPreviewMarkup();
    return wrapIntoDocument(htmlMarkup, userCode);
  }

  if (section.type === 'javascript') {
    const markup = '<main><h1>JavaScript Quest</h1><p id="js-output">Run your script to update this text.</p></main>';
    return wrapIntoDocument(markup, '', userCode);
  }

  if (/<html[\s>]/i.test(userCode)) {
    return userCode;
  }

  return wrapIntoDocument(userCode);
}

function getInitialQuestProgress(sectionCount) {
  return {
    currentSectionIndex: 0,
    unlockedSectionIndexes: [0],
    completedSectionIds: [],
    drafts: {},
    sectionCount
  };
}

function loadQuestProgress(sectionCount) {
  try {
    const raw = localStorage.getItem(QUEST_PROGRESS_KEY);
    if (!raw) {
      return getInitialQuestProgress(sectionCount);
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return getInitialQuestProgress(sectionCount);
    }

    const fallback = getInitialQuestProgress(sectionCount);
    return {
      ...fallback,
      ...parsed,
      sectionCount
    };
  } catch (_err) {
    return getInitialQuestProgress(sectionCount);
  }
}

function saveQuestProgress(progress) {
  localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify(progress));
}

function getSectionByType(quest, type) {
  return (quest.sections || []).find((section) => section.type === type);
}

function getDraftOrStarter(progress, section) {
  if (!section) {
    return '';
  }

  const draft = progress.drafts[section.id];
  if (typeof draft === 'string' && draft.trim()) {
    return draft;
  }

  return section.starterCode || '';
}

function buildQuestCompletionDocument(progress, quest, fallbackSection, fallbackSource) {
  const htmlSection = getSectionByType(quest, 'html');
  const cssSection = getSectionByType(quest, 'css');
  const htmlSource = getDraftOrStarter(progress, htmlSection);
  const cssSource = getDraftOrStarter(progress, cssSection);

  if (htmlSource.trim()) {
    return wrapIntoDocument(htmlSource, cssSource);
  }

  return buildPreviewDocument(fallbackSection, fallbackSource, {
    htmlMarkup: getLearnerHtmlPreviewMarkup(progress, quest)
  });
}

function buildEditableFinalSource(progress, quest) {
  const htmlSection = getSectionByType(quest, 'html');
  const cssSection = getSectionByType(quest, 'css');
  const htmlSource = getDraftOrStarter(progress, htmlSection).trim();
  const cssSource = getDraftOrStarter(progress, cssSection).trim();

  if (!htmlSource && !cssSource) {
    return '';
  }

  if (!cssSource) {
    return htmlSource;
  }

  return `${htmlSource}\n\n<style>\n${cssSource}\n</style>`;
}

export async function initQuestPage() {
  if (!isQuestPage()) {
    return;
  }

  const sectionTitleEl = document.getElementById('section-title');
  const instructionsEl = document.getElementById('lesson-instructions');
  const codeInputEl = document.getElementById('code-input');
  const feedbackEl = document.getElementById('lesson-feedback');
  const previewFrameEl = document.getElementById('lesson-preview');
  const checkSolutionButton = document.getElementById('check-solution');
  const nextSectionButton = document.getElementById('next-section');
  const resetQuestButton = document.getElementById('reset-quest');
  const runPreviewButton = document.getElementById('run-preview');
  const tabButtons = Array.from(document.querySelectorAll('[data-tab-target]'));
  const tabPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));
  const cssAssistEl = document.getElementById('css-assist');
  const cssAssistLabelEl = document.getElementById('css-assist-label');
  const cssAssistListEl = document.getElementById('css-assist-list');
  const questCompletePanelEl = document.getElementById('quest-complete-panel');
  const editFinalResultButton = document.getElementById('edit-final-result');
  const saveToProfileButton = document.getElementById('save-to-profile');

  const dataResponse = await fetch('../../quest-data.json');
  const data = await dataResponse.json();
  const quest = (data.quests || []).find((item) => item.id === 'quest-1');

  if (!quest) {
    feedbackEl.textContent = 'Quest data for quest-1 was not found.';
    return;
  }

  const progress = loadQuestProgress(quest.sections.length);

  const setFeedback = (message, isError = false) => {
    feedbackEl.textContent = message;
    feedbackEl.style.color = isError ? '#8a1f1f' : '#1f6d2c';
  };

  const getCurrentSection = () => quest.sections[progress.currentSectionIndex];

  const persistCurrentDraft = () => {
    const section = getCurrentSection();
    progress.drafts[section.id] = codeInputEl.value;
    saveQuestProgress(progress);
  };

  const setActiveWorkbenchTab = (tabKey) => {
    tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-tab-target') === tabKey;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-tab-panel') === tabKey;
      panel.hidden = !isActive;
    });
  };

  const setQuestCompletePanelVisible = (isVisible) => {
    if (!questCompletePanelEl) {
      return;
    }

    questCompletePanelEl.hidden = !isVisible;
  };

  const isFinalSectionIndex = () => progress.currentSectionIndex === (quest.sections.length - 1);

  const cssAssist = createCssAssistController(
    { codeInputEl, cssAssistEl, cssAssistLabelEl, cssAssistListEl },
    getCurrentSection,
    persistCurrentDraft
  );

  const updatePreview = () => {
    const section = getCurrentSection();
    const sourceCode = codeInputEl.value;
    const previewContext = {
      htmlMarkup: getLearnerHtmlPreviewMarkup(progress, quest)
    };
    previewFrameEl.srcdoc = buildPreviewDocument(section, sourceCode, previewContext);
  };

  const renderCurrentSection = () => {
    const section = getCurrentSection();
    const isFinalSection = isFinalSectionIndex();

    if (isFinalSection) {
      if (!progress.completedSectionIds.includes(section.id)) {
        progress.completedSectionIds.push(section.id);
        saveQuestProgress(progress);
      }

      sectionTitleEl.textContent = `Quest Complete: ${quest.title}`;
      instructionsEl.textContent = 'Review your final result below. You can switch to code to keep refining your card.';
      codeInputEl.value = buildEditableFinalSource(progress, quest);
      codeInputEl.readOnly = true;

      const completionSource = codeInputEl.value;
      previewFrameEl.srcdoc = buildQuestCompletionDocument(progress, quest, section, completionSource);
      checkSolutionButton.disabled = true;
      nextSectionButton.disabled = true;
      setQuestCompletePanelVisible(true);
      setActiveWorkbenchTab('preview');
      cssAssist.hide();
      setFeedback('Quest 1 complete! This is your final card using your own work.', false);
      return;
    }

    const sectionNumber = progress.currentSectionIndex + 1;
    sectionTitleEl.textContent = `Section ${sectionNumber}: ${section.title}`;
    instructionsEl.textContent = section.instructions;

    const draftCode = progress.drafts[section.id];
    codeInputEl.value = typeof draftCode === 'string' ? draftCode : section.starterCode;
    codeInputEl.readOnly = false;
    checkSolutionButton.disabled = false;

    const hasNext = progress.currentSectionIndex < (quest.sections.length - 1);
    const currentIsCompleted = progress.completedSectionIds.includes(section.id);
    nextSectionButton.disabled = !(hasNext && currentIsCompleted);
    setQuestCompletePanelVisible(isFinalSection && currentIsCompleted);

    updatePreview();
    cssAssist.update();
    setFeedback('Make your changes, then click Check solution.', false);
  };

  const validateCurrentSection = () => {
    const section = getCurrentSection();
    const sourceCode = codeInputEl.value;

    if (section.type === 'html') {
      return validateHtmlSection(sourceCode, section.checkConfig || {});
    }

    if (section.type === 'css') {
      return validateCssSection(sourceCode, section.checkConfig || {});
    }

    return validateChallengeSection(sourceCode, section.checkConfig || {});
  };

  codeInputEl.addEventListener('input', () => {
    persistCurrentDraft();
    cssAssist.update();
  });

  cssAssist.bind();

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabKey = button.getAttribute('data-tab-target') || QUEST_UI_CONFIG.defaultTab;
      setActiveWorkbenchTab(tabKey);
    });
  });

  if (runPreviewButton) {
    runPreviewButton.addEventListener('click', () => {
      updatePreview();
      setFeedback('Preview updated.', false);

      if (QUEST_UI_CONFIG.autoSwitchToPreviewOnRun) {
        setActiveWorkbenchTab('preview');
      }
    });
  }

  if (editFinalResultButton) {
    editFinalResultButton.addEventListener('click', () => {
      codeInputEl.readOnly = false;
      setActiveWorkbenchTab('code');
      codeInputEl.focus();
      setFeedback('Edit your final code, then run preview again to review changes.', false);
    });
  }

  if (saveToProfileButton) {
    saveToProfileButton.addEventListener('click', () => {
      setFeedback('Save to Profile is locked until account features are enabled.', true);
    });
  }

  checkSolutionButton.addEventListener('click', () => {
    if (isFinalSectionIndex()) {
      previewFrameEl.srcdoc = buildQuestCompletionDocument(progress, quest, getCurrentSection(), codeInputEl.value);
      setActiveWorkbenchTab('preview');
      setQuestCompletePanelVisible(true);
      setFeedback('Quest 1 complete! This is your final card using your own work.', false);
      return;
    }

    const section = getCurrentSection();
    const result = validateCurrentSection();
    if (!result.pass) {
      setFeedback(result.messages[0] || 'Not quite yet. Keep going.', true);
      return;
    }

    if (!progress.completedSectionIds.includes(section.id)) {
      progress.completedSectionIds.push(section.id);
    }

    const nextIndex = progress.currentSectionIndex + 1;
    if (nextIndex < quest.sections.length && !progress.unlockedSectionIndexes.includes(nextIndex)) {
      progress.unlockedSectionIndexes.push(nextIndex);
    }

    saveQuestProgress(progress);
    const isFinalSection = progress.currentSectionIndex === (quest.sections.length - 1);

    if (isFinalSection) {
      previewFrameEl.srcdoc = buildQuestCompletionDocument(progress, quest, section, codeInputEl.value);
      setActiveWorkbenchTab('preview');
      setQuestCompletePanelVisible(true);
      setFeedback('Quest 1 complete! You can revisit this quest anytime to improve your solution.', false);
      nextSectionButton.disabled = true;
      return;
    }

    nextSectionButton.disabled = false;
    setFeedback('Great work. Section complete - continue to the next section.', false);
  });

  nextSectionButton.addEventListener('click', () => {
    const nextIndex = progress.currentSectionIndex + 1;
    if (!progress.unlockedSectionIndexes.includes(nextIndex)) {
      setFeedback('Complete this section before moving on.', true);
      return;
    }

    progress.currentSectionIndex = nextIndex;
    saveQuestProgress(progress);
    renderCurrentSection();
  });

  if (resetQuestButton) {
    resetQuestButton.addEventListener('click', () => {
      const freshProgress = getInitialQuestProgress(quest.sections.length);
      progress.currentSectionIndex = freshProgress.currentSectionIndex;
      progress.unlockedSectionIndexes = freshProgress.unlockedSectionIndexes;
      progress.completedSectionIds = freshProgress.completedSectionIds;
      progress.drafts = freshProgress.drafts;
      progress.sectionCount = freshProgress.sectionCount;

      saveQuestProgress(progress);
      renderCurrentSection();
      setFeedback('Quest progress reset. You are back at section 1.', false);
      setActiveWorkbenchTab(QUEST_UI_CONFIG.defaultTab);
      setQuestCompletePanelVisible(false);
    });
  }

  if (!progress.unlockedSectionIndexes.includes(progress.currentSectionIndex)) {
    progress.currentSectionIndex = 0;
    saveQuestProgress(progress);
  }

  renderCurrentSection();
  setActiveWorkbenchTab(QUEST_UI_CONFIG.defaultTab);
}
