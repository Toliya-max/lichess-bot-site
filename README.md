# Lichess Bot Controller — Landing

Static site for **Lichess Bot Controller** — a Windows desktop app that runs Stockfish 18 on a Lichess BOT account with an auto-challenger, Chess960 support, a visual profile editor, and on-site / Telegram checkout.

Live: <https://lichess-bot-controller.netlify.app>

## Stack

- Vanilla HTML5 + CSS + ES2020 (no framework, no build step)
- 32 chess boards rendered from `data-fen / data-mini / data-pieces / data-strip` via `script.js`
- `checkout.js` for on-site license purchase (polls a Cloudflare Tunnel endpoint)

## Auto-deploy

Every push to `main` triggers `.github/workflows/netlify-deploy.yml`, which zips the site and uploads it to Netlify via REST API. No laptop needed.

Required repo secrets:
- `NETLIFY_AUTH_TOKEN` — personal access token from <https://app.netlify.com/user/applications>
- `NETLIFY_SITE_ID` — site ID from Netlify → Site settings → General
