const WORDS = ["APPLE", "BRICK", "CHAIR", "PLANT", "STONE", "GRAPE"];

const game = {
  targetWord: "",
  currentRow: 0,
  currentCol: 0,
  guesses: ["", "", "", "", "", ""],
  feedback: [null, null, null, null, null, null],
  state: "playing"
};

const board = document.getElementById("board");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function createBoard() {
  board.innerHTML = "";

  for (let row = 0; row < 6; row++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";

    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${row}-${col}`;
      rowEl.appendChild(tile);
    }

    board.appendChild(rowEl);
  }
}

function evaluateGuess(guess, target) {
  const result = ["absent", "absent", "absent", "absent", "absent"];
  const targetLetters = target.split("");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetLetters[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;

    const foundIndex = targetLetters.indexOf(guess[i]);
    if (foundIndex !== -1) {
      result[i] = "present";
      targetLetters[foundIndex] = null;
    }
  }

  return result;
}

function renderGame() {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const tile = document.getElementById(`tile-${row}-${col}`);
      tile.textContent = game.guesses[row][col] || "";
      tile.className = "tile";

      if (game.feedback[row]) {
        tile.classList.add(game.feedback[row][col]);
      }
    }
  }

  if (game.state === "playing") {
    statusText.textContent = "Game in progress";
  } else if (game.state === "win") {
    statusText.textContent = "You win!";
  } else if (game.state === "lose") {
    statusText.textContent = `You lose! The word was ${game.targetWord}`;
  }
}

function submitGuess() {
  const guess = game.guesses[game.currentRow];

  if (guess.length !== 5) {
    statusText.textContent = "Enter a 5-letter word.";
    return;
  }

  game.feedback[game.currentRow] = evaluateGuess(guess, game.targetWord);

  if (guess === game.targetWord) {
    game.state = "win";
  } else if (game.currentRow === 5) {
    game.state = "lose";
  } else {
    game.currentRow++;
    game.currentCol = 0;
  }
}

function processInput(key) {
  if (game.state !== "playing") return;

  if (/^[A-Z]$/.test(key)) {
    if (game.currentCol < 5) {
      game.guesses[game.currentRow] += key;
      game.currentCol++;
    }
  } else if (key === "BACKSPACE") {
    if (game.currentCol > 0) {
      game.guesses[game.currentRow] = game.guesses[game.currentRow].slice(0, -1);
      game.currentCol--;
    }
  } else if (key === "ENTER") {
    submitGuess();
  }
}

function restartGame() {
  game.targetWord = getRandomWord();
  game.currentRow = 0;
  game.currentCol = 0;
  game.guesses = ["", "", "", "", "", ""];
  game.feedback = [null, null, null, null, null, null];
  game.state = "playing";
  statusText.textContent = "";
  renderGame();
}

document.addEventListener("keydown", (event) => {
  processInput(event.key.toUpperCase());
  renderGame();
});

restartBtn.addEventListener("click", () => {
  restartGame();
});

createBoard();
restartGame();
