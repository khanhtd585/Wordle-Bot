const grid = document.getElementById("wordle-grid");
const ROWS = 6, COLS = 5;
let guesses = [];
let statusGrid = [];
let currentGuess = [];
let currentStatus = Array(COLS).fill("white");
const colorOrder = ["white", "black", "yellow", "green"];

// Suggested first guesses (by entropy or popularity)
const FIRST_GUESSES = [
  "crane",
  "slate",
  "adieu",
  "raise",
  "trace",
  "crate",
  "slant",
  "carte",
  "react",
  "later",
  "table",
  "least",
  "stare",
  "tears",
  "rates",
  "table",
  "arise",
  "irate",
  "alone",
  "audio",
];

function createGrid() {
  grid.innerHTML = "";
  // Display guessed rows
  for (let r = 0; r < guesses.length; r++) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell " + (statusGrid[r]?.[c] || "white");
      cell.textContent = guesses[r][c] ? guesses[r][c].toUpperCase() : "";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.dataset.status = statusGrid[r]?.[c] || "white";
      cell.addEventListener("click", function () {
        let idx = colorOrder.indexOf(cell.dataset.status);
        idx = (idx + 1) % colorOrder.length;
        cell.dataset.status = colorOrder[idx];
        cell.className = "wordle-cell " + colorOrder[idx];
        statusGrid[r][c] = colorOrder[idx];
      });
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
  // Display current row (if attempts remain)
  if (guesses.length < ROWS) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell " + currentStatus[c];
      cell.textContent = currentGuess[c] ? currentGuess[c].toUpperCase() : "";
      cell.dataset.row = guesses.length;
      cell.dataset.col = c;
      cell.dataset.status = currentStatus[c];
      cell.addEventListener("click", function () {
        if (!currentGuess[c]) return;
        let idx = colorOrder.indexOf(cell.dataset.status);
        idx = (idx + 1) % colorOrder.length;
        cell.dataset.status = colorOrder[idx];
        cell.className = "wordle-cell " + colorOrder[idx];
        currentStatus[c] = colorOrder[idx];
      });
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}

function handleKey(e) {
  if (guesses.length >= ROWS) return;
  if (/^[a-zA-Z]$/.test(e.key)) {
    if (currentGuess.length < COLS) {
      currentGuess.push(e.key.toLowerCase());
      createGrid();
    }
  } else if (e.key === "Backspace") {
    currentGuess.pop();
    currentStatus[currentGuess.length] = "white";
    createGrid();
  } else if (e.key === "Enter") {
    if (currentGuess.length === COLS) {
      guesses.push([...currentGuess]);
      statusGrid.push([...currentStatus]);
      currentGuess = [];
      currentStatus = Array(COLS).fill("white");
      createGrid();
    }
  }
}

window.addEventListener("keydown", handleKey);

// Compare guess status with answer
function getFeedback(guess, answer) {
  // Return array of status: 'green', 'yellow', 'black' for each letter
  const res = Array(5).fill("black");
  // Mark green
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      res[i] = "green";
    }
  }
  // Mark yellow: if character exists anywhere in answer and is not already green
  for (let i = 0; i < 5; i++) {
    if (res[i] === "green") continue;
    if (answer.includes(guess[i])) {
      res[i] = "yellow";
    }
  }
  return res;
}

// Filter possible words based on guesses and status
function filterWords(words, guesses, statusGrid) {
  return words.filter((word) => {
    for (let g = 0; g < guesses.length; g++) {
      const feedback = getFeedback(guesses[g], word);
      for (let i = 0; i < 5; i++) {
        if (feedback[i] !== statusGrid[g][i]) return false;
      }
    }
    return true;
  });
}

// Calculate entropy for a word
function calcEntropy(word, possibleWords) {
  const map = {};
  for (const ans of possibleWords) {
    const fb = getFeedback(word, ans).join("");
    map[fb] = (map[fb] || 0) + 1;
  }
  let entropy = 0;
  const total = possibleWords.length;
  for (const count of Object.values(map)) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Find the word with the highest entropy
function suggestWord(possibleWords) {
  let best = possibleWords[0];
  let bestEntropy = -1;
  for (const word of possibleWords) {
    const ent = calcEntropy(word, possibleWords);
    if (ent > bestEntropy) {
      bestEntropy = ent;
      best = word;
    }
  }
  return best;
}

document.getElementById("submit-btn").addEventListener("click", async () => {
  const botEl = document.getElementById("bot-suggestion");
  const congratsEl = document.getElementById("congrats");
  congratsEl.style.display = "none";
  if (currentGuess.length === COLS) {
    if (currentStatus.some((s) => s === "white")) {
      botEl.textContent = "Please select a status for all letters!";
      return;
    }
    guesses.push([...currentGuess]);
    statusGrid.push([...currentStatus]);
    currentGuess = [];
    currentStatus = Array(COLS).fill("white");
    createGrid();
  }
  for (let row = 0; row < statusGrid.length; row++) {
    if (statusGrid[row].some((s) => s === "white")) {
      botEl.textContent =
        "Please select a status for all letters in row " + (row + 1) + "!";
      return;
    }
  }
  if (guesses.length === 0) {
    botEl.textContent = "Please enter at least one word!";
    return;
  }
  if (
    statusGrid.length > 0 &&
    statusGrid[statusGrid.length - 1].every((s) => s === "green")
  ) {
    congratsEl.style.display = "block";
    botEl.innerHTML = "";
    return;
  }
  // Loading effect
  botEl.innerHTML =
    '<span style="color:#888">Calculating suggestions...</span> <span class="loader" style="display:inline-block;width:1em;height:1em;border:2.5px solid #ccc;border-top:2.5px solid #22c55e;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;"></span>';
  await new Promise((r) => setTimeout(r, 50)); // Ensure loading is shown

  // Filter possible words
  let possible = filterWords(WORDS, guesses, statusGrid);
  if (possible.length === 0) {
    botEl.textContent = "No matching words left!";
    return;
  }
  // Calculate entropy for all possible words
  let scored = possible.map((word) => ({
    word,
    entropy: calcEntropy(word, possible),
  }));
  scored.sort((a, b) => b.entropy - a.entropy);
  // Show top 5 suggestions
  renderSuggestions(scored.map(s => s.word), false);
});

// Thêm hiệu ứng loading cho bot
const style = document.createElement("style");
style.innerHTML = `@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
document.head.appendChild(style);

function renderSuggestions(words, isFirst = true) {
  let el = document.getElementById("bot-suggestion");
  if (!el) return;
  let label = isFirst ? "<b>First word suggestions:</b> " : "<b>Suggestions:</b> ";
  el.innerHTML =
    label +
    words
      .slice(0, 5)
      .map(
        (w, idx) =>
          `<span class="suggest-word" data-word="${w}" style="display:inline-block;margin:0 0.3em;padding:0.2em 0.6em;border-radius:0.3em;background:#f3f3f3;color:#232526;border:1.5px solid #bbb;font-weight:500;cursor:pointer;">${w.toUpperCase()}</span>`
      )
      .join(" ");
  setTimeout(() => {
    Array.from(el.querySelectorAll(".suggest-word")).forEach(span => {
      span.onclick = () => {
        if (guesses.length < ROWS && currentGuess.length === 0) {
          const word = span.getAttribute('data-word');
          currentGuess = word.split('');
          createGrid();
        }
      };
    });
  }, 0);
}

document.getElementById("reset-btn").addEventListener("click", () => {
  guesses = [];
  statusGrid = [];
  currentGuess = [];
  currentStatus = Array(COLS).fill("white");
  createGrid();
  renderSuggestions(FIRST_GUESSES, true);
  document.getElementById("congrats").style.display = "none";
});

// --- Bot Automation ---
async function callDailyApi(guess) {
  // Use the provided API URL
  const url = `https://wordle.votee.dev:8000/daily?guess=${guess}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    return null;
  }
}

function mapApiResultToColor(result) {
  if (result === "correct") return "green";
  if (result === "present") return "yellow";
  if (result === "absent") return "black";
  return "white";
}

async function startBotAuto() {
  const botEl = document.getElementById("bot-suggestion");
  const congratsEl = document.getElementById("congrats");
  const startBtn = document.getElementById("start-bot-btn");

  // Set loading state for button immediately
  startBtn.disabled = true;
  const oldBtnText = startBtn.textContent;
  startBtn.innerHTML = '<span class="loader" style="display:inline-block;width:1em;height:1em;border:2.5px solid #fff;border-top:2.5px solid #22c55e;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:0.5em;"></span>Running...';
  // Force UI update before heavy logic
  await new Promise(r => setTimeout(r, 0));

  guesses = [];
  statusGrid = [];
  currentGuess = [];
  currentStatus = Array(COLS).fill("white");
  createGrid();
  renderSuggestions(FIRST_GUESSES, true);
  congratsEl.style.display = "none";
  botEl.innerHTML = '<span style="color:#888">Bot is guessing...</span>';

  let found = false;
  let guess = FIRST_GUESSES[Math.floor(Math.random() * FIRST_GUESSES.length)];
  for (let attempt = 0; attempt < ROWS; attempt++) {
    // 1. Call API with current guess
    const apiRes = await callDailyApi(guess);
    if (!apiRes || !Array.isArray(apiRes) || apiRes.length !== COLS) {
      botEl.innerHTML = '<span style="color:red">API error or invalid response.</span>';
      startBtn.disabled = false;
      startBtn.textContent = oldBtnText;
      return;
    }
    // 2. Parse API response
    const colors = apiRes.map(r => mapApiResultToColor(r.result));
    guesses.push(guess.split(""));
    statusGrid.push(colors);
    createGrid();
    await new Promise(r => setTimeout(r, 600)); // Show each step
    if (colors.every(c => c === "green")) {
      found = true;
      congratsEl.style.display = "block";
      botEl.innerHTML = `<span style='color:#22c55e;font-weight:600;'>Bot found the answer: <b>${guess.toUpperCase()}</b>!</span>`;
      break;
    }
    // 3. Filter words and calculate entropy for the next guess
    let possible = filterWords(WORDS, guesses, statusGrid);
    if (possible.length === 0) break;
    let scored = possible.map((word) => ({
      word,
      entropy: calcEntropy(word, possible),
    }));
    scored.sort((a, b) => b.entropy - a.entropy);
    let suggestions = scored.map(s => s.word);
    if (suggestions.length === 0) break;
    guess = suggestions[0];
  }
  if (!found) {
    botEl.innerHTML = '<span style="color:#eab308;font-weight:600;">Bot could not find the answer within the allowed attempts!</span>';
  }
  // Remove loading state
  startBtn.disabled = false;
  startBtn.textContent = oldBtnText;
}

document.getElementById("start-bot-btn").addEventListener("click", startBotAuto);
