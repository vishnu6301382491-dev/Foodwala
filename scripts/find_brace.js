const fs = require('fs');

const html = fs.readFileSync('D:/FoodWala_Eclipse_Project/login.html', 'utf8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
const scriptContent = scriptMatch[1];
const startLineInHtml = html.substring(0, scriptMatch.index).split('\n').length;

let stack = [];
let inSingle = false;
let inDouble = false;
let inBacktick = false;
let inSingleComment = false;
let inMultiComment = false;
let escape = false;

let line = startLineInHtml;
let col = 1;

for (let i = 0; i < scriptContent.length; i++) {
  const ch = scriptContent[i];
  const next = scriptContent[i + 1];

  if (ch === '\n') {
    line++;
    col = 1;
    inSingleComment = false;
    continue;
  } else {
    col++;
  }

  if (escape) {
    escape = false;
    continue;
  }
  if (ch === '\\') {
    escape = true;
    continue;
  }

  if (inSingleComment) continue;
  if (inMultiComment) {
    if (ch === '*' && next === '/') {
      inMultiComment = false;
      i++;
    }
    continue;
  }

  if (inSingle) {
    if (ch === '\'') inSingle = false;
    continue;
  }
  if (inDouble) {
    if (ch === '"') inDouble = false;
    continue;
  }
  if (inBacktick) {
    if (ch === '`') inBacktick = false;
    continue;
  }

  if (ch === '/' && next === '/') {
    inSingleComment = true;
    i++;
    continue;
  }
  if (ch === '/' && next === '*') {
    inMultiComment = true;
    i++;
    continue;
  }

  if (ch === '\'') { inSingle = true; continue; }
  if (ch === '"') { inDouble = true; continue; }
  if (ch === '`') { inBacktick = true; continue; }

  if (ch === '{' || ch === '(' || ch === '[') {
    stack.push({ ch, line, col });
  } else if (ch === '}' || ch === ')' || ch === ']') {
    const expected = ch === '}' ? '{' : ch === ')' ? '(' : '[';
    if (stack.length === 0) {
      console.log(`EXTRA CLOSING ${ch} at HTML line ${line}:${col}`);
    } else {
      const top = stack.pop();
      if (top.ch !== expected) {
        console.log(`MISMATCH: got ${ch} at HTML line ${line}:${col}, expected closing for ${top.ch} from HTML line ${top.line}:${top.col}`);
      }
    }
  }
}

console.log('Finished. Remaining unclosed in stack:', stack.length);
stack.forEach(item => {
  console.log(`Unclosed ${item.ch} opened at HTML line ${item.line}:${item.col}`);
});
