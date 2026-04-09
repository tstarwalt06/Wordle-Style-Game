"use strict";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const WORD_BANK = [
  "APPLE",
  "BRAVE",
  "CLOUD",
  "DREAM",
  "FLAME",
  "GRAPE",
  "HOUSE",
  "LIGHT",
  "MANGO",
  "OCEAN",
  "PLANT",
  "QUEST",
  "RIVER",
  "SOLAR",
  "TIGER",
  "WATER"
];

const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

const STATUS_PRIORITY = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3
};

const elements = {
  board: document.querySelector("#board"),
  keyboard: document.querySelector("#keyboard"),
  restartButton: document.querySelector("#restart-button"),
  status: document.querySelector("#status")
};

let game = createInitialGame();

buildBoard();
buildKeyboard();
renderGame();

document.addEventListener("keydown", handleKeyDown);
elements.keyboard.addEventListener("click", handleKeyboardClick);
elements.restartButton.addEventListener("click", () => {
  restartGame();
  renderGame();
});

function createInitialGame() {
  return {
    targetWord: pickRandomWord(),
    currentRow: 0,
    currentCol: 0,
    guesses: Array(MAX_GUESSES).fill(""),
    feedback: Array(MAX_GUESSES).fill(null),
    keyStatuses: {},
    state: "playing",
    statusMessage: "Type a five-letter word to begin.",
    statusTone: "info"
  };
}

function pickRandomWord() {
  const randomIndex = Math.floor(Math.random() * WORD_BANK.length);
  return WORD_BANK[randomIndex];
}

function buildBoard() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < MAX_GUESSES; row += 1) {
    const rowElement = document.createElement("div");
    rowElement.className = "board-row";
    rowElement.dataset.row = String(row);
    rowElement.setAttribute("role", "row");

    for (let col = 0; col < WORD_LENGTH; col += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = String(row);
      tile.dataset.col = String(col);
      tile.setAttribute("role", "gridcell");
      rowElement.append(tile);
    }

    fragment.append(rowElement);
  }

  elements.board.setAttribute("role", "grid");
  elements.board.append(fragment);
}

function buildKeyboard() {
  const fragment = document.createDocumentFragment();

  KEYBOARD_LAYOUT.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "keyboard-row";

    row.forEach((key) => {
      const button = document.createElement("button");
      const isWideKey = key === "ENTER" || key === "BACKSPACE";

      button.className = `key${isWideKey ? " key--wide" : ""}`;
      button.dataset.key = key;
      button.type = "button";
      button.textContent = key === "BACKSPACE" ? "Backspace" : key;

      rowElement.append(button);
    });

    fragment.append(rowElement);
  });

  elements.keyboard.append(fragment);
}

function handleKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const normalizedKey = normalizeKey(event.key);

  if (!normalizedKey) {
    return;
  }

  event.preventDefault();
  processInput(normalizedKey);
  renderGame();
}

function handleKeyboardClick(event) {
  const keyButton = event.target.closest("button[data-key]");

  if (!keyButton) {
    return;
  }

  processInput(keyButton.dataset.key);
  renderGame();
}

function normalizeKey(key) {
  if (/^[a-z]$/i.test(key)) {
    return key.toUpperCase();
  }

  if (key === "Backspace") {
    return "BACKSPACE";
  }

  if (key === "Enter") {
    return "ENTER";
  }

  return null;
}

function processInput(key) {
  if (game.state !== "playing") {
    return;
  }

  if (/^[A-Z]$/.test(key)) {
    addLetter(key);
    return;
  }

  if (key === "BACKSPACE") {
    removeLetter();
    return;
  }

  if (key === "ENTER") {
    submitGuess();
  }
}

function addLetter(letter) {
  if (game.currentCol >= WORD_LENGTH) {
    setStatus("That row is full. Press Enter to submit or Backspace to edit.", "warning");
    return;
  }

  game.guesses[game.currentRow] += letter;
  game.currentCol += 1;
  setStatus(`Building guess ${game.currentRow + 1} of ${MAX_GUESSES}.`, "info");
}

function removeLetter() {
  const currentGuess = game.guesses[game.currentRow];

  if (!currentGuess) {
    setStatus("There is nothing to remove from this row yet.", "warning");
    return;
  }

  game.guesses[game.currentRow] = currentGuess.slice(0, -1);
  game.currentCol -= 1;
  setStatus(`Editing guess ${game.currentRow + 1}.`, "info");
}

function submitGuess() {
  if (game.currentCol < WORD_LENGTH) {
    setStatus("Enter only works when the row has 5 letters.", "warning");
    return;
  }

  const guess = game.guesses[game.currentRow];
  const rowFeedback = evaluateGuess(guess, game.targetWord);

  game.feedback[game.currentRow] = rowFeedback;
  updateKeyboardStatuses(guess, rowFeedback);

  if (guess === game.targetWord) {
    game.state = "win";
    setStatus(`You win! "${game.targetWord}" was the hidden word.`, "win");
    return;
  }

  if (game.currentRow === MAX_GUESSES - 1) {
    game.state = "lose";
    setStatus(`No guesses left. The hidden word was "${game.targetWord}".`, "lose");
    return;
  }

  game.currentRow += 1;
  game.currentCol = 0;
  setStatus(`Not quite. Move on to guess ${game.currentRow + 1} of ${MAX_GUESSES}.`, "info");
}

function evaluateGuess(guess, targetWord) {
  const feedback = Array(WORD_LENGTH).fill("absent");
  const remainingLetters = {};

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const targetLetter = targetWord[index];
    const guessLetter = guess[index];

    if (guessLetter === targetLetter) {
      feedback[index] = "correct";
    } else {
      remainingLetters[targetLetter] = (remainingLetters[targetLetter] || 0) + 1;
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const guessLetter = guess[index];

    if (feedback[index] === "correct") {
      continue;
    }

    if (remainingLetters[guessLetter]) {
      feedback[index] = "present";
      remainingLetters[guessLetter] -= 1;
    }
  }

  return feedback;
}

function updateKeyboardStatuses(guess, feedback) {
  for (let index = 0; index < guess.length; index += 1) {
    const letter = guess[index];
    const nextStatus = feedback[index];
    const currentStatus = game.keyStatuses[letter] || "unused";

    if (STATUS_PRIORITY[nextStatus] > STATUS_PRIORITY[currentStatus]) {
      game.keyStatuses[letter] = nextStatus;
    }
  }
}

function setStatus(message, tone) {
  game.statusMessage = message;
  game.statusTone = tone;
}

function restartGame() {
  game = createInitialGame();
}

function renderGame() {
  renderBoard();
  renderKeyboard();
  renderStatus();
}

function renderBoard() {
  const rows = elements.board.querySelectorAll(".board-row");

  rows.forEach((rowElement, rowIndex) => {
    const guess = game.guesses[rowIndex];
    const rowFeedback = game.feedback[rowIndex];
    const isActiveRow = game.state === "playing" && rowIndex === game.currentRow;
    const tiles = rowElement.querySelectorAll(".tile");

    tiles.forEach((tile, colIndex) => {
      const letter = guess[colIndex] || "";
      const status = rowFeedback ? rowFeedback[colIndex] : "";
      const isCurrentLetterSlot = isActiveRow && colIndex === game.currentCol;

      tile.textContent = letter;
      tile.classList.toggle("tile--filled", Boolean(letter));
      tile.classList.toggle("tile--active", isCurrentLetterSlot);
      tile.classList.toggle("tile--correct", status === "correct");
      tile.classList.toggle("tile--present", status === "present");
      tile.classList.toggle("tile--absent", status === "absent");

      if (status) {
        tile.style.setProperty("--flip-delay", `${colIndex * 90}ms`);
      } else {
        tile.style.removeProperty("--flip-delay");
      }
    });
  });
}

function renderKeyboard() {
  const keys = elements.keyboard.querySelectorAll(".key");

  keys.forEach((keyElement) => {
    const value = keyElement.dataset.key;
    const status = game.keyStatuses[value];

    keyElement.classList.remove("key--correct", "key--present", "key--absent");

    if (status) {
      keyElement.classList.add(`key--${status}`);
    }
  });
}

function renderStatus() {
  elements.status.textContent = game.statusMessage;
  elements.status.className = `status status--${game.statusTone}`;
}
