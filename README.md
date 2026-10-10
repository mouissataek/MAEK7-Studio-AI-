<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/28bc896d-bc97-41d6-8b61-09a651ac5e8b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cost & access protection

- `ACCESS_TOKEN` (env): when set, generation/chat endpoints require the `x-access-token` header (the UI asks for it once).
- Per-IP rate limits and a daily budget (`DAILY_BUDGET_UNITS_PER_IP`, `DAILY_BUDGET_UNITS`) in relative cost units (`src/utils/cost.ts`).
- Models are whitelisted server-side (`IMAGE_MODELS`, see `.env.example`); the default image size is 1K and the UI shows the estimated cost before generating.
- Gallery is stored in IndexedDB (images and videos survive reloads and large files are fine).
- Set `TRUST_PROXY=1` behind a reverse proxy so limits use the real client IP.
