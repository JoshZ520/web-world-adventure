import { CHALLENGE_BASELINE } from './constants.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSelectorBlock(cssSource, selector) {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'i');
  const match = cssSource.match(pattern);
  return match ? match[1] : '';
}

function hasCssProperty(blockContent, propertyName) {
  const pattern = new RegExp(`${escapeRegExp(propertyName)}\\s*:`, 'i');
  return pattern.test(blockContent);
}

function getCssPropertyValue(cssSource, selector, propertyName) {
  const selectorBlock = getSelectorBlock(cssSource, selector);
  if (!selectorBlock) {
    return '';
  }

  const propertyPattern = new RegExp(`${escapeRegExp(propertyName)}\\s*:\\s*([^;\\n}]+)`, 'i');
  const propertyMatch = selectorBlock.match(propertyPattern);
  return propertyMatch ? propertyMatch[1].trim() : '';
}

function normalizeColorValue(value) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function extractStyleCss(sourceCode) {
  const styleTagPattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let combinedCss = '';
  let match = styleTagPattern.exec(sourceCode);

  while (match) {
    combinedCss += `${match[1]}\n`;
    match = styleTagPattern.exec(sourceCode);
  }

  return combinedCss || sourceCode;
}

function parseStatValues(sourceCode) {
  const statPattern = /(Strength|Wisdom|Dex\s*\(Dexterity\)|Dex)\s*:\s*(\d+)/gi;
  const stats = {};
  let match = statPattern.exec(sourceCode);

  while (match) {
    const statName = /dex/i.test(match[1]) ? 'Dex (Dexterity)' : match[1];
    stats[statName] = match[2];
    match = statPattern.exec(sourceCode);
  }

  return stats;
}

export function validateHtmlSection(sourceCode, checkConfig) {
  const feedback = [];
  const parsedDocument = new DOMParser().parseFromString(sourceCode, 'text/html');

  (checkConfig.requiredElements || []).forEach((tagName) => {
    if (!parsedDocument.querySelector(tagName)) {
      feedback.push(`Add a <${tagName}> element.`);
    }
  });

  (checkConfig.requiredClasses || []).forEach((className) => {
    if (!parsedDocument.querySelector(`.${className}`)) {
      feedback.push(`Use the .${className} class where requested.`);
    }
  });

  Object.entries(checkConfig.minimumElementCounts || {}).forEach(([tagName, minimumCount]) => {
    const count = parsedDocument.querySelectorAll(tagName).length;
    if (count < minimumCount) {
      feedback.push(`Add at least ${minimumCount} <${tagName}> elements.`);
    }
  });

  (checkConfig.requiredNonEmptySelectors || []).forEach((selector) => {
    const element = parsedDocument.querySelector(selector);
    if (!element) {
      return;
    }

    const value = (element.textContent || '').trim();
    if (!value) {
      feedback.push(`Fill in ${selector}.`);
    }
  });

  (checkConfig.requiredStatValues || []).forEach((statLabel) => {
    const statPattern = new RegExp(`${escapeRegExp(statLabel)}\\s*:\\s*(.+)`, 'i');
    const statItems = Array.from(parsedDocument.querySelectorAll('.character-stats li'));
    const statItem = statItems.find((item) => statPattern.test((item.textContent || '').trim()));

    if (!statItem) {
      feedback.push(`Add ${statLabel} with a value in the stats list.`);
      return;
    }

    const content = (statItem.textContent || '').trim();
    const match = content.match(statPattern);
    const statValue = match && match[1] ? match[1].trim() : '';

    if (!statValue) {
      feedback.push(`Add a value for ${statLabel}.`);
    }
  });

  return {
    pass: feedback.length === 0,
    messages: feedback
  };
}

export function validateCssSection(sourceCode, checkConfig) {
  const feedback = [];
  const selectors = checkConfig.requiredSelectors || [];
  const requiredProperties = checkConfig.requiredProperties || {};
  const alternatives = checkConfig.propertyAlternatives || {};

  selectors.forEach((selector) => {
    if (!getSelectorBlock(sourceCode, selector)) {
      feedback.push(`Add a ${selector} selector block.`);
    }
  });

  Object.entries(requiredProperties).forEach(([selector, propertyList]) => {
    const selectorBlock = getSelectorBlock(sourceCode, selector);
    if (!selectorBlock) {
      return;
    }

    propertyList.forEach((propertyName) => {
      const altProperties = (alternatives[selector] && alternatives[selector][propertyName]) || [];
      const hasRequiredProperty = hasCssProperty(selectorBlock, propertyName)
        || altProperties.some((alt) => hasCssProperty(selectorBlock, alt));

      if (!hasRequiredProperty) {
        feedback.push(`Add ${propertyName} to ${selector}.`);
      }
    });
  });

  return {
    pass: feedback.length === 0,
    messages: feedback
  };
}

export function validateChallengeSection(sourceCode, checkConfig) {
  const feedback = [];

  (checkConfig.mustChangeText || []).forEach((lockedText) => {
    if (sourceCode.includes(lockedText)) {
      feedback.push(`Replace the original text: "${lockedText}".`);
    }
  });

  const stats = parseStatValues(sourceCode);
  const changedStats = Object.entries(CHALLENGE_BASELINE.stats).filter(([statName, baselineValue]) => {
    return stats[statName] && stats[statName] !== baselineValue;
  }).length;

  const minimumChangedStatValues = checkConfig.minimumChangedStatValues || 0;
  if (changedStats < minimumChangedStatValues) {
    feedback.push(`Change at least ${minimumChangedStatValues} stat values.`);
  }

  const cssSource = extractStyleCss(sourceCode);
  (checkConfig.mustChangeCssProperties || []).forEach((path) => {
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex < 0) {
      return;
    }

    const selector = path.slice(0, lastDotIndex);
    const property = path.slice(lastDotIndex + 1);
    const currentValue = normalizeColorValue(getCssPropertyValue(cssSource, selector, property));
    const baselineValue = normalizeColorValue(CHALLENGE_BASELINE.css[path] || '');

    if (!currentValue) {
      feedback.push(`Set ${property} in ${selector}.`);
      return;
    }

    if (currentValue === baselineValue) {
      feedback.push(`Change ${property} in ${selector} from the starter value.`);
    }
  });

  return {
    pass: feedback.length === 0,
    messages: feedback
  };
}
