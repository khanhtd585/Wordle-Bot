const grid = document.getElementById("wordle-grid");
const ROWS = 6, COLS = 5;
let guesses = [];
let statusGrid = [];
let currentGuess = [];
let currentStatus = Array(COLS).fill("white");
const colorOrder = ["white", "black", "yellow", "green"];

// Best starting words based on entropy calculation
const FIRST_GUESSES = ["crane", "slate", "adieu", "raise", "trace", "crate", "stare", "irate"];

function createGrid() {
  grid.innerHTML = "";
  
  // Display guessed rows with their API-provided status
  for (let r = 0; r < guesses.length; r++) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell " + (statusGrid[r]?.[c] || "white");
      cell.textContent = guesses[r][c] ? guesses[r][c].toUpperCase() : "";
      cell.id = `cell-${r}-${c}`;
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
  
  // Display current row for input (if attempts remain)
  if (guesses.length < ROWS) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell white"; // Always white for input row
      cell.textContent = currentGuess[c] ? currentGuess[c].toUpperCase() : "";
      cell.id = `cell-${guesses.length}-${c}`;
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

// Evaluate the guess against the answer and return status array
function getFeedback(guess, answer) {
  const res = Array(5).fill("black");
  
  // Check for exact matches (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      res[i] = "green";
    }
  }
  
  // Check for correct letters in wrong positions (yellow)
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

  if (currentGuess.length !== COLS) {
    botEl.textContent = "Please enter a 5-letter word";
    return;
  }

  botEl.innerHTML = '<span style="color:#888">Validating word...</span> <span class="loader"></span>';
  
  try {
    const word = currentGuess.join('').toLowerCase();
    const apiRes = await callWordleApi(word);
    
    if (!apiRes?.length === COLS) {
      throw new Error('Invalid API response');
    }
    
    const colors = apiRes.map(r => mapApiResultToColor(r.result));
    guesses.push([...currentGuess]);
    statusGrid.push(colors);
    currentGuess = [];
    currentStatus = Array(COLS).fill("white");
    createGrid();

    if (colors.every(c => c === 'green')) {
      congratsEl.style.display = "block";
      botEl.innerHTML = `<span style='color:#22c55e'>Correct! The answer is <b>${word.toUpperCase()}</b></span>`;
      return;
    }

    botEl.innerHTML = '<span style="color:#888">Analyzing next moves...</span> <span class="loader"></span>';

    const possible = filterWords(WORDS, guesses, statusGrid);
    if (possible.length === 0) {
      botEl.textContent = "No valid words match the pattern";
      return;
    }

    const scored = possible
      .map(word => ({
        word,
        entropy: calcEntropy(word, possible),
      }))
      .sort((a, b) => b.entropy - a.entropy);

    renderSuggestions(scored.map(s => s.word), false);

  } catch (error) {
    console.error('Error:', error);
    botEl.textContent = "Error: Could not validate word";
  }
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
// Global variable to track current mode
let currentMode = 'daily';
let customWord = '';
let currentSeed = 1; // Track current seed for random mode

async function callWordleApi(guess) {
  // Use the provided API URL based on current mode
  let url = '';
  if (currentMode === 'word') {
    url = `https://wordle.votee.dev:8000/word/${customWord}?guess=${guess}`; // word mode uses path parameter for target word
  } else if (currentMode === 'random' && currentSeed > 0) {
    url = `https://wordle.votee.dev:8000/random?guess=${guess}&seed=${currentSeed}`; // random mode with seed
  } else {
    url = `https://wordle.votee.dev:8000/${currentMode}?guess=${guess}`; // daily and random without seed
  }
  
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

// Event listener is added at the bottom of the file

// Add tab switching logic
function switchTab(mode) {
  // Update UI
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.borderBottom = '2px solid transparent';
    btn.style.color = '#6b7280';
  });
  document.getElementById(`tab-${mode}`).classList.add('active');
  document.getElementById(`tab-${mode}`).style.borderBottom = '2px solid #22c55e';
  document.getElementById(`tab-${mode}`).style.color = '#22c55e';

  // Reset game state
  currentMode = mode;
  guesses = [];
  statusGrid = [];
  currentGuess = [];
  currentStatus = Array(COLS).fill("white");
  createGrid();
  renderSuggestions(FIRST_GUESSES, true);
  document.getElementById("congrats").style.display = "none";
  
  const customWordDisplay = document.getElementById('custom-word-display');
  const seedDisplay = document.getElementById('seed-display');

  // Reset displays
  customWordDisplay.style.display = 'none';
  seedDisplay.style.display = 'none';
  customWord = '';
  currentSeed = 0;
  
  // Handle different modes
  if (mode === 'word') {
    const word = prompt('Enter a 5-letter word:');
    if (!word) {
      switchTab('daily');
      return;
    }
    if (word.length > 5) {
      alert('Word is too long! Please enter exactly 5 letters.');
      switchTab('daily');
      return;
    }
    if (word.length < 5) {
      alert('Word is too short! Please enter exactly 5 letters.');
      switchTab('daily');
      return;
    }
    if (!(/^[a-zA-Z]+$/.test(word))) {
      alert('Invalid word! Please use letters (A-Z) only.');
      switchTab('daily');
      return;
    }
    customWord = word.toLowerCase();
    customWordDisplay.innerHTML = `Custom Word: <span style="color: #22c55e; font-weight: 600;">${customWord.toUpperCase()}</span>`;
    customWordDisplay.style.display = 'block';
  } else if (mode === 'random') {
    const seed = prompt('Enter a seed number (must be greater than 0):');
    if (seed === null) {
      currentSeed = 0; // Use random without seed
      return;
    }
    if (seed.trim() === '') {
      currentSeed = 0; // Use random without seed when empty input
      return;
    }
    const seedNum = parseInt(seed);
    if (!isNaN(seedNum) && seedNum > 0) {
      currentSeed = seedNum;
      seedDisplay.innerHTML = `Current Seed: <span style="color: #22c55e; font-weight: 600;">${currentSeed}</span>`;
      seedDisplay.style.display = 'block';
    } else {
      alert('Invalid seed! Please enter a positive number (greater than 0).');
      currentSeed = 0; // Use random without seed
    }
  }
}

// Add event listeners for tabs
document.getElementById('tab-daily').addEventListener('click', () => switchTab('daily'));
document.getElementById('tab-random').addEventListener('click', () => switchTab('random'));
document.getElementById('tab-word').addEventListener('click', () => switchTab('word'));

// Auto-solve using the Wordle API
async function startBotAuto() {
  const botEl = document.getElementById("bot-suggestion");
  const congratsEl = document.getElementById("congrats");
  const startBtn = document.getElementById("start-bot-btn");

  // Initialize UI state
  startBtn.disabled = true;
  const oldBtnText = startBtn.textContent;
  startBtn.innerHTML = '<span class="loader"></span>Running...';
  
  // Reset game state
  guesses = [];
  statusGrid = [];
  currentGuess = [];
  currentStatus = Array(COLS).fill("white");
  createGrid();
  renderSuggestions(FIRST_GUESSES, true);
  congratsEl.style.display = "none";
  botEl.innerHTML = '<span style="color:#888">Analyzing possible solutions...</span>';

  try {
    let found = false;
    let guess = FIRST_GUESSES[Math.floor(Math.random() * FIRST_GUESSES.length)];
    
    for (let attempt = 0; attempt < ROWS; attempt++) {
      const apiRes = await callWordleApi(guess);
      if (!apiRes?.length === COLS) {
        throw new Error('Invalid API response');
      }

      const colors = apiRes.map(r => mapApiResultToColor(r.result));
      guesses.push(guess.split(""));
      statusGrid.push(colors);
      createGrid();
      
      await new Promise(r => setTimeout(r, 600));

      if (colors.every(c => c === "green")) {
        found = true;
        congratsEl.style.display = "block";
        botEl.innerHTML = `<span style='color:#22c55e'>Solution found: <b>${guess.toUpperCase()}</b></span>`;
        break;
      }

      let possible = filterWords(WORDS, guesses, statusGrid);
      if (possible.length === 0) break;

      let scored = possible.map(word => ({
        word,
        entropy: calcEntropy(word, possible),
      })).sort((a, b) => b.entropy - a.entropy);

      guess = scored[0].word;
    }

    if (!found) {
      botEl.innerHTML = '<span style="color:#eab308">Could not find solution within 6 attempts</span>';
    }
  } catch (error) {
    botEl.innerHTML = '<span style="color:red">Error: Could not complete auto-solve</span>';
    console.error(error);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = oldBtnText;
  }
}

document.getElementById("start-bot-btn").addEventListener("click", startBotAuto);

// Initialize game state
createGrid();
renderSuggestions(FIRST_GUESSES, true);
