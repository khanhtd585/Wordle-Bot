# Wordle Bot Web

A simple web-based Wordle bot that automatically solves the daily Wordle puzzle using entropy-based suggestions and interacts with a public API.

## Features
- Clean, modern Wordle UI (HTML/CSS/JS only, no frameworks)
- Manual play and bot automation mode
- Bot uses entropy to suggest optimal guesses
- Calls the `/daily` API at https://wordle.votee.dev:8000 for feedback
- Visualizes guesses and feedback with color-coded grid (green/yellow/black)
- Click-to-fill suggestions, reset, and win notification
- Responsive and easy to use

## How it works
1. The bot picks a random first guess from a curated list.
2. It calls the `/daily` API with the guess and receives feedback for each letter.
3. The bot filters possible words and calculates entropy to suggest the next guess.
4. The process repeats until the word is found or attempts run out.

## Usage
1. Clone or download this repository.
2. Open `index.html` in your browser.
3. Click **Start Bot** to watch the bot solve the daily puzzle automatically.
4. You can also play manually and use the bot's suggestions.

## File structure
- `index.html` — Main HTML structure
- `style.css` — Styling for the UI
- `script.js` — All game and bot logic
- `words.js` — Word list for suggestions

## API
- The bot uses the `/daily` endpoint at `https://wordle.votee.dev:8000/daily?guess=WORD`.
- The API returns an array of objects for each letter: `{ slot, guess, result }` where result is `absent`, `present`, or `correct`.

## Customization
- You can change the word list or tweak the entropy logic in `script.js`.
- To use a different API, update the URL in `callDailyApi`.

## License
MIT
