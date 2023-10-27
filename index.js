import * as fs from 'node:fs';
import input from './cont.js';
import { config, update } from './config.js';
export let updatedContent,
  cursorPosition = { row: 0, col: 0 },
  selectionStart = null,
  selectionEnd = null,
  visibleTopRow = 0,
  inp = process.argv[2],
  selection = { start: null, end: null }
if (inp == undefined) {
  console.log("Use \"node jimExec.js <filename> to open it!\"");
  process.exit();
}
export let change = (type, value) => {
  if (type == 1) visibleTopRow = value
  if (type == 2) selection.start = value
  if (type == 3) selection.end = value
}
/**Main jIM process... */
function read() {
  fs.readFile(inp, 'utf8', (err, data) => {
    if (err) {
      if (err.errno == -4058) console.log(inp + " apparently dosen't exist...");
      else console.error(err);
      process.exit();
    }
    console.clear();
    updatedContent = data.split('\n')
    startEditing();
  });
}
let applyColors = (text, bgColor, fgColor) => { return `\x1b[${bgColor};${fgColor}m${text}\x1b[0m` };

function startEditing() {
  input();
  console.log("Enter text. Press Ctrl+C to exit.");
}

function applyTemporaryColor(row) {
  const list = {
    keywords: ["=>", "const", "let", "var", "function", "if", "else", "return", "{", "}", "import", "as", "from", "for"],
    commentMarkers: ["//", "/**", "*/"],
    clr: [34, 34, 34, 34, 35, 35, 35, 35, 36, 36, 36, 36, 37, 37, 35, 35, 33, 38, 35],
    functionColors: {},
    stringColor: 33, // Orange color
    numberColor: 32, // Green color for numbers
  };

  const keywordPattern = new RegExp(`(?:${list.keywords.join('|')})`);
  const functionPattern = /\b\w+(?=\s*\()/g;
  const stringPattern = /(`[^`]*`|"[^"]*"|'[^']*')/g;
  const numberPattern = /\b\d+(\.\d+)?\b/g;
  const kw = /(?<=\s)|(?<=[{}();.])/;

  const originalLine = updatedContent[row];
  let lineWithColors = '';

  originalLine.split(stringPattern).forEach((part, index) => {
    if (index % 2 === 0) {
      // Even index parts are not strings, apply keyword, function, and number colors
      part.split(kw).forEach((word) => {
        const keywordMatch = word.match(keywordPattern);
        const functionMatch = word.match(functionPattern);
        const numberMatch = word.match(numberPattern);
        const commentMarkerIndex = list.commentMarkers.indexOf(word);

        if (keywordMatch) {
          const keyword = keywordMatch[0];
          const keywordIndex = list.keywords.indexOf(keyword);
          lineWithColors += `\x1b[${list.clr[keywordIndex]}m${word}\x1b[0m`;
        } else if (functionMatch) {
          const functionName = functionMatch[0];
          if (!list.functionColors[functionName]) {
            list.functionColors[functionName] = 96;
          }
          const colorCode = list.functionColors[functionName];
          const uncoloredFunctionName = functionName.replace(/^\((.*)$/, "$1");
          lineWithColors += `\x1b[${colorCode}m${uncoloredFunctionName}\x1b[0m(`;
        } else if (numberMatch) {
          // Apply green color to numbers
          lineWithColors += `\x1b[${list.numberColor}m${word}\x1b[0m`;
        } else if (commentMarkerIndex !== -1) {
          lineWithColors += `\x1b[32m${word}\x1b[0m`;
        } else {
          lineWithColors += word;
        }
      });
    } else {
      // Odd index parts are strings, apply string color to the entire part
      lineWithColors += `\x1b[${list.stringColor}m${part}\x1b[0m`;
    }
  });

  process.stdout.write(lineWithColors);
  return lineWithColors;
}

let ticks = 0
export function displayContent() {
  if (ticks < 10) {
    console.clear();
    ticks = 0;
    update();
  }
  ticks++;
  let derr = '';
  let visibleContent = updatedContent;
  for (let row = visibleTopRow; row < Math.min(updatedContent.length, visibleTopRow + config.editorH); row++) {
    let line = visibleContent[row];

    if (row === cursorPosition.row) {
      const beforeCursor = line.substring(0, cursorPosition.col);
      const afterCursor = line.substring(cursorPosition.col);
      process.stdout.write(beforeCursor);
      process.stdout.write('\x1b[47m\x1b[30m' + afterCursor.charAt(0) + '\x1b[0m'); // Colored cursor
      process.stdout.write(afterCursor.substring(1));
      if (derr !== '') process.stdout.write('\n');
    } else {
      // Apply temporary color to keywords in the line
      try {
        line = applyTemporaryColor(row); // Apply colors and get the modified line
      } catch (err) {
        derr = err;
      }
      try {
        process.stdout.write(line);
      } catch { }
    }

    if (row < Math.min(updatedContent.length, visibleTopRow + config.editorH) - 1) {
      process.stdout.write('\n');
    }
  }

  // Move the cursor to the last row and column
  process.stdout.write(`\u001b[${config.editorH};1H`);
}

read();
const a = 0;