import { CSS_ASSIST_LIBRARY, QUEST_UI_CONFIG } from './constants.js';

function getCaretCoordinatesInTextarea(textarea, cursorIndex) {
  const mirror = document.createElement('div');
  const mirrorStyle = mirror.style;
  const computed = window.getComputedStyle(textarea);
  const styleProps = [
    'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontFamily',
    'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textIndent',
    'wordSpacing', 'tabSize'
  ];

  mirrorStyle.position = 'absolute';
  mirrorStyle.visibility = 'hidden';
  mirrorStyle.whiteSpace = 'pre-wrap';
  mirrorStyle.wordWrap = 'break-word';
  mirrorStyle.top = '0';
  mirrorStyle.left = '-9999px';

  styleProps.forEach((prop) => {
    mirrorStyle[prop] = computed[prop];
  });

  mirror.textContent = textarea.value.slice(0, cursorIndex);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(cursorIndex, cursorIndex + 1) || ' ';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const caret = {
    left: marker.offsetLeft - textarea.scrollLeft,
    top: marker.offsetTop - textarea.scrollTop,
    lineHeight: Number.parseFloat(computed.lineHeight) || 18
  };

  document.body.removeChild(mirror);
  return caret;
}

function parseCurrentCssContext(sourceCode, cursorIndex) {
  const lineStart = sourceCode.lastIndexOf('\n', cursorIndex - 1) + 1;
  const lineEndIndex = sourceCode.indexOf('\n', cursorIndex);
  const lineEnd = lineEndIndex === -1 ? sourceCode.length : lineEndIndex;
  const line = sourceCode.slice(lineStart, lineEnd);
  const cursorInLine = cursorIndex - lineStart;
  const lineBeforeCursor = line.slice(0, cursorInLine);
  const colonIndex = lineBeforeCursor.indexOf(':');

  if (colonIndex === -1) {
    return {
      mode: 'property',
      lineStart,
      line,
      query: lineBeforeCursor.trim().toLowerCase()
    };
  }

  const property = lineBeforeCursor.slice(0, colonIndex).trim().toLowerCase();
  const rawValuePart = lineBeforeCursor.slice(colonIndex + 1);
  const query = rawValuePart.trim().toLowerCase();
  const valueStartInLine = colonIndex + 1 + (rawValuePart.match(/^\s*/) || [''])[0].length;

  return {
    mode: 'value',
    lineStart,
    line,
    property,
    query,
    valueStartInLine,
    valueEndInLine: line.length
  };
}

function getCssAssistSuggestions(context) {
  if (context.mode === 'property') {
    const query = context.query;
    const matches = CSS_ASSIST_LIBRARY.properties.filter((property) => property.startsWith(query));
    return (query ? matches : CSS_ASSIST_LIBRARY.properties).slice(0, 8).map((value) => ({
      kind: 'property',
      value
    }));
  }

  const propertyValues = CSS_ASSIST_LIBRARY.valuesByProperty[context.property] || [];
  const pool = [...propertyValues, ...CSS_ASSIST_LIBRARY.genericValues];
  const deduped = [...new Set(pool)];
  const query = context.query;
  const matches = deduped.filter((value) => value.toLowerCase().startsWith(query));

  return (query ? matches : deduped).slice(0, 8).map((value) => ({
    kind: 'value',
    value
  }));
}

function applyCssAssistSuggestion(textarea, context, suggestion) {
  const source = textarea.value;

  if (suggestion.kind === 'property') {
    const lineStart = context.lineStart;
    const lineEnd = lineStart + context.line.length;
    const indent = (context.line.match(/^\s*/) || [''])[0];
    const nextLine = `${indent}${suggestion.value}: ;`;
    textarea.value = `${source.slice(0, lineStart)}${nextLine}${source.slice(lineEnd)}`;
    const cursor = lineStart + nextLine.length - 1;
    textarea.setSelectionRange(cursor, cursor);
    return;
  }

  const valueStart = context.lineStart + context.valueStartInLine;
  const valueEnd = context.lineStart + context.valueEndInLine;
  textarea.value = `${source.slice(0, valueStart)}${suggestion.value}${source.slice(valueEnd)}`;
  const cursor = valueStart + suggestion.value.length;
  textarea.setSelectionRange(cursor, cursor);
}

export function createCssAssistController(elements, getCurrentSection, onCodeChange) {
  const { codeInputEl, cssAssistEl, cssAssistLabelEl, cssAssistListEl } = elements;
  let activeCssAssistContext = null;
  let activeCssAssistSuggestions = [];

  const placePopupAtCaret = () => {
    if (!cssAssistEl || cssAssistEl.hidden) {
      return;
    }

    const editorBlock = codeInputEl.closest('.editor-block') || codeInputEl.parentElement;
    if (!editorBlock) {
      return;
    }

    const caret = getCaretCoordinatesInTextarea(codeInputEl, codeInputEl.selectionStart);
    const baseLeft = codeInputEl.offsetLeft + caret.left;
    const baseTop = codeInputEl.offsetTop + caret.top + caret.lineHeight + 6;
    const popupWidth = cssAssistEl.offsetWidth || 280;
    const popupHeight = cssAssistEl.offsetHeight || 120;

    const minLeft = codeInputEl.offsetLeft + 6;
    const maxLeft = codeInputEl.offsetLeft + codeInputEl.clientWidth - popupWidth - 6;
    let left = Math.min(Math.max(baseLeft, minLeft), Math.max(minLeft, maxLeft));

    const minTop = codeInputEl.offsetTop + 6;
    const maxTop = codeInputEl.offsetTop + codeInputEl.clientHeight - popupHeight - 6;
    let top = baseTop;

    if (top > maxTop) {
      top = codeInputEl.offsetTop + caret.top - popupHeight - 6;
    }

    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));
    left = Number.isFinite(left) ? left : minLeft;
    top = Number.isFinite(top) ? top : minTop;

    cssAssistEl.style.left = `${left}px`;
    cssAssistEl.style.top = `${top}px`;
  };

  const hideCssAssist = () => {
    activeCssAssistContext = null;
    activeCssAssistSuggestions = [];
    if (cssAssistEl) {
      cssAssistEl.hidden = true;
    }
    if (cssAssistListEl) {
      cssAssistListEl.innerHTML = '';
    }
  };

  const updateCssAssist = () => {
    if (!QUEST_UI_CONFIG.enableCssAssist || !cssAssistEl || !cssAssistListEl || !cssAssistLabelEl) {
      return;
    }

    const section = getCurrentSection();
    if (!section || section.type !== 'css') {
      hideCssAssist();
      return;
    }

    const context = parseCurrentCssContext(codeInputEl.value, codeInputEl.selectionStart);
    const suggestions = getCssAssistSuggestions(context);
    if (!suggestions.length) {
      hideCssAssist();
      return;
    }

    activeCssAssistContext = context;
    activeCssAssistSuggestions = suggestions;
    cssAssistEl.hidden = false;
    cssAssistLabelEl.textContent = context.mode === 'property'
      ? 'CSS property suggestions'
      : `Values for ${context.property}`;

    cssAssistListEl.innerHTML = '';
    suggestions.forEach((suggestion) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = suggestion.value;
      chip.setAttribute('aria-label', `Insert ${suggestion.value}`);
      chip.addEventListener('click', () => {
        applyCssAssistSuggestion(codeInputEl, activeCssAssistContext, suggestion);
        onCodeChange();
        updateCssAssist();
      });
      cssAssistListEl.appendChild(chip);
    });

    window.requestAnimationFrame(placePopupAtCaret);
  };

  const bind = () => {
    codeInputEl.addEventListener('click', updateCssAssist);
    codeInputEl.addEventListener('keyup', updateCssAssist);
    codeInputEl.addEventListener('input', updateCssAssist);
    codeInputEl.addEventListener('scroll', placePopupAtCaret);
    window.addEventListener('resize', placePopupAtCaret);
    codeInputEl.addEventListener('blur', () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        const clickedSuggestion = cssAssistListEl && cssAssistListEl.contains(activeElement);
        if (!clickedSuggestion) {
          hideCssAssist();
        }
      }, 0);
    });
  };

  return {
    bind,
    update: updateCssAssist,
    hide: hideCssAssist,
    hasSuggestions: () => activeCssAssistSuggestions.length > 0
  };
}
