# AI for Recruitment — Demo SPA (No-Image Build)

A small, **organized** single-page web app to demonstrate your screens with clean structure and clear extension points.

## Structure
```
ai-recruitment-app-regen/
  index.html          # Entry
  styles/style.css    # Styles
  scripts/app.js      # Router + views
  assets/             # (empty; no images)
```
## How to run
Open `index.html` in any browser (no build step).

## Screens/Routes
- `#/login` – Login (uses **Username**)
- `#/signup` – Sign up (collects **Username** + validations)
- `#/` – Home (Sales/Recruitment entry)
- `#/sales` – Sales (guarded; requires login)
- `#/recruitment` – Recruitment with SVG icons (guarded)

## Features
- Username-based auth, validation, and simple session.
- Logout + tiny profile avatar in header.
- CSS-only design; no images required.
- Dependency-free SPA with clear extension points.


## New: AI-style JD Builder
- **Sales → “Build job description”** opens a conversational builder.
- It asks a series of questions, collects your answers, and generates a **job description**.
- The JD is saved to browser storage and appears in the **View** page (`#/jd-view`).
- From the View page you can copy or download as `.txt`.



## AI Integration
- Go to **Settings** and paste your **OpenAI API key** (and optionally change the model).
- The builder now sends your answers to OpenAI to generate a polished JD. If the call fails, it falls back to the local formatter.
- On the **View** page, open a JD, add instructions, and use **Polish with AI**. Then hit **Save Final** to store the refined version.

> ⚠️ Security note: Frontend-only API keys are visible to anyone with access to your browser session. For production, create a small backend proxy and keep your API key on the server.


## Secure AI via Backend Proxy (Recommended)
1) In `server/`, run:
```
cp .env.example .env
# put your OPENAI_API_KEY in .env
npm install
npm run start
```
2) In the app **Settings**, enable **Use Proxy** and confirm the **Proxy Base URL** (default: `http://localhost:8787`).  
3) The builder will call your backend for **Generate** and **Polish** instead of exposing your key in the browser.

Endpoints:
- `POST /api/generate` → builds a JD from your answers
- `POST /api/polish` → polishes a JD with your instructions
