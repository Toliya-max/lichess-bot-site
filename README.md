# Lichess Bot Controller — Landing

Static landing site for **Lichess Bot Controller** — a Windows desktop app that runs Stockfish 18 on a Lichess BOT account with an auto-challenger, Chess960 support, a visual profile editor, and on-site / Telegram checkout.

## Stack

- Vanilla HTML5 + CSS + ES2020 (no framework, no build step)
- 32 chess boards rendered from `data-fen / data-mini / data-pieces / data-strip` via `script.js`
- `checkout.js` for on-site license purchase (polls a Cloudflare Tunnel endpoint)

## Auto-deploy

Hosted on **Cloudflare Pages** (`chessbot.pages.dev`), wired to the
`Toliya-max/toliya-max.github.io` repo. The release pipeline (`release.py`)
copies the built installer into the gh-pages worktree and pushes that repo;
Cloudflare rebuilds automatically.
