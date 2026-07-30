export const QUEST_PROGRESS_KEY = 'css-dungeon.quest-1.progress';

export const QUEST_UI_CONFIG = {
  autoSwitchToPreviewOnRun: true,
  defaultTab: 'code',
  enableCssAssist: true
};

export const CSS_ASSIST_LIBRARY = {
  properties: [
    'background-color',
    'font-family',
    'max-width',
    'padding',
    'border',
    'border-radius',
    'margin',
    'text-align',
    'color',
    'font-weight',
    'line-height',
    'list-style',
    'list-style-type'
  ],
  valuesByProperty: {
    'background-color': [
      'white', 'whitesmoke', 'gainsboro', 'silver', 'lightgray', 'gray', 'dimgray', 'black',
      'aliceblue', 'azure', 'beige', 'bisque', 'blanchedalmond', 'cornsilk', 'floralwhite',
      'ghostwhite', 'honeydew', 'ivory', 'lavender', 'lavenderblush', 'lightblue', 'lightcyan',
      'lightgoldenrodyellow', 'lightpink', 'lightsalmon', 'lightyellow', 'linen', 'mintcream',
      'mistyrose', 'oldlace', 'papayawhip', 'seashell', 'snow', 'antiquewhite', 'moccasin',
      'peachpuff', 'powderblue', 'skyblue', 'lightskyblue', 'paleturquoise', 'palegreen',
      'lightgreen', 'lightseagreen', 'thistle', 'plum', 'orchid', 'pink', 'khaki', 'wheat'
    ],
    color: [
      'black', 'white', 'gray', 'dimgray', 'slategray', 'darkslategray', 'navy', 'midnightblue',
      'steelblue', 'royalblue', 'dodgerblue', 'deepskyblue', 'teal', 'darkcyan', 'seagreen',
      'forestgreen', 'green', 'olive', 'darkolivegreen', 'goldenrod', 'darkgoldenrod', 'orange',
      'darkorange', 'tomato', 'coral', 'orangered', 'crimson', 'firebrick', 'maroon', 'indigo',
      'rebeccapurple', 'purple', 'blueviolet', 'darkviolet', 'orchid', 'hotpink', 'deeppink',
      'sienna', 'chocolate', 'peru', 'tan', 'saddlebrown'
    ],
    'font-family': ['Georgia, serif', '"Trebuchet MS", sans-serif', '"Times New Roman", serif', 'Verdana, sans-serif', 'system-ui, sans-serif'],
    'max-width': ['320px', '420px', '640px', '80ch'],
    padding: ['8px', '12px', '16px', '24px', '1rem'],
    border: ['1px solid gray', '2px solid slategray', '2px dashed steelblue', 'none'],
    'border-radius': ['8px', '12px', '16px', '999px'],
    margin: ['0', '0 auto', '24px auto', '40px auto'],
    'text-align': ['left', 'center', 'right'],
    'font-weight': ['400', '500', '700', 'bold'],
    'line-height': ['1.4', '1.5', '1.6', '2'],
    'list-style': ['none', 'disc', 'square'],
    'list-style-type': ['none', 'disc', 'square']
  },
  genericValues: ['0', '4px', '8px', '12px', '16px', '1rem', '2rem', 'auto', 'inherit']
};

export const CHALLENGE_BASELINE = {
  stats: {
    Strength: '6',
    Wisdom: '8',
    'Dex (Dexterity)': '9'
  },
  css: {
    'body.background-color': 'aliceblue',
    '.character-card.background-color': 'white',
    '.character-card h1.color': 'slategray'
  }
};
