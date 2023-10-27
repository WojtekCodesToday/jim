import { displayContent, updatedContent, cursorPosition, visibleTopRow, change, inp, selection } from './index.js';
import readline from 'readline';
import * as fs from 'node:fs';
import { config } from './config.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let sY = 0;
let isSelecting = false;

function command() {
    //rl.question("> ", (e) => {
    //    console.log("string");
    //});
}

function input() {
    rl.input.on('keypress', (character, key) => {
        //rl.write("'\u001B[?25l'");
        if (key.ctrl && key.name === 'c') {
            if (isSelecting) {
                // Copy selected text to clipboard or an internal buffer
                const selectedText = getSelectedText();
                // Implement logic to copy the selected text
            } else {
                rl.close();
                process.exit();
            }
        } else if (key.ctrl && key.name === 'p') {
            fs.writeFileSync(inp, updatedContent.join("\n"));
        } else if (key.ctrl && key.name === 'up') {
            if (sY !== -1) sY = sY - 1;
            change(1, sY);
        } else if (key.ctrl && key.name === 'down') {
            if (sY !== updatedContent.length) sY = sY + 1;
            change(1, sY);
        } else if (key.ctrl && key.name === 'q') {
            command();
            rl.close();
        } else if (key.shift) {
            // Shift key is pressed
            if (!isSelecting) {
                isSelecting = true;
                selection.start = { row: cursorPosition.row, col: cursorPosition.col };
            }
        } else if (key.name === 'left') {
            cursorPosition.col = Math.max(config ? 0 : 3, cursorPosition.col - 1);
        } else if (key.name === 'right') {
            cursorPosition.col = Math.min(updatedContent[cursorPosition.row].length + 3, cursorPosition.col + 1);
        } else if (key.name === 'up') {
            if (cursorPosition.row > 0) {
                cursorPosition.row--;
                if (cursorPosition.row < visibleTopRow) {
                    sY = sY - 1;
                    change(1, sY);
                }
            }
            cursorPosition.col = Math.min(updatedContent[cursorPosition.row].length, cursorPosition.col);
        } else if (key.name === 'down') {
            if (cursorPosition.row < updatedContent.length - 1) {
                cursorPosition.row++;
                if (cursorPosition.row > visibleTopRow + config.editorH - 1) {
                    sY = sY + 1;
                    change(1, sY);
                }
            }
            cursorPosition.col = Math.min(updatedContent[cursorPosition.row].length, cursorPosition.col);
        } else if (key.name === 'backspace') {
            if (cursorPosition.col > 0) {
                const line = updatedContent[cursorPosition.row];
                updatedContent[cursorPosition.row] = line.slice(0, cursorPosition.col - 1) + line.slice(cursorPosition.col);
                cursorPosition.col--;
            } else if (cursorPosition.row > 0) {
                const line = updatedContent[cursorPosition.row];
                const prevLine = updatedContent[cursorPosition.row - 1];
                updatedContent[cursorPosition.row - 1] = prevLine + line;
                updatedContent.splice(cursorPosition.row, 1);
                cursorPosition.row--;
                cursorPosition.col = prevLine.length;
            }
        } else if (key.name === 'return') {
            const line = updatedContent[cursorPosition.row];
            const beforeCursor = line.substring(0, cursorPosition.col);
            const afterCursor = line.substring(cursorPosition.col);

            updatedContent[cursorPosition.row] = beforeCursor;
            updatedContent.splice(cursorPosition.row + 1, 0, afterCursor);
            cursorPosition.row++;
            cursorPosition.col = 3;
        } else if (key.sequence === "`") {
            recur("``");
        } else if (key.sequence === '"') {
            recur(`""`);
        } else if (key.sequence === "'") {
            recur("''");
        } else if (key.sequence === '[') {
            recur("[]");
        } else if (key.sequence === '{') {
            recur("{}");
        } else if (character) {
            type(character);
            cursorPosition.col++;
        } else {
            if (isSelecting) {
                isSelecting = false;
            }
        }

        function recur(tch) {
            type(tch[0]);
            cursorPosition.col++;
            type(tch[1]);
        }

        function type(char) {
            const line = updatedContent[cursorPosition.row];
            updatedContent[cursorPosition.row] = line.slice(0, cursorPosition.col) + char + line.slice(cursorPosition.col);
        }

        displayContent(selection);
    });
}

export default input;
