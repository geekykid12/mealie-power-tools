# 🔧 Mealie PowerTools

Admin-grade control panel for your [Mealie](https://github.com/mealie-recipes/mealie) self-hosted recipe server.

## Features

- **Dashboard** — live stats (recipes, cookbooks, users)
- **Recipe Manager** — paginated search, edit, delete
- **Ingredient Parser** — bulk-run the NLP/Brute/OpenAI parser on unparsed or all recipes, with progress tracking and abort
- **Cookbooks** — visualize, create, delete cookbooks and browse their recipes
- **Household** — view members, roles, and household preferences

---

## Setup

### Option A — Fresh install (Mealie + PowerTools together)

```bash
git clone <this-repo>
cd mealie-powertools
docker compose up -d
```

- Mealie:      http://X.X.X.X:9000
- PowerTools:  http://X.X.X.X:3000

Default Mealie login: `changeme@example.com` / `MyPassword`

---

### Option B — Attach to an existing Mealie container

1. Find your Mealie network:
   ```bash
   docker inspect mealie --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
   ```

2. Edit `docker-compose.attach.yml` — replace `mealie_default` with your network name (appears twice).

3. Start PowerTools:
   ```bash
   docker compose -f docker-compose.attach.yml up -d
   ```

- PowerTools:  http://X.X.X.X:3000

---

## Getting an API Token

1. Log in to Mealie
2. Go to **Profile → API Tokens**
3. Create a new token and copy it
4. Paste it into the PowerTools connection screen

In the **Mealie URL** field, use:
- `http://<mealie IP>:9925/api`

---

## Development (without Docker)

```bash
npm install
npm run dev
```

App runs at http://X.X.X.X:3000

---

## Architecture

```
mealie-powertools/
├── Dockerfile                  # Multi-stage: Node build → nginx serve
├── docker-compose.yml          # Full stack (Mealie + PowerTools)
├── docker-compose.attach.yml   # PowerTools only (attach to existing Mealie)
├── nginx.conf                  # SPA routing config
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx                 # Full single-file React app
```

The app talks directly to your Mealie API from the browser — no backend proxy needed. CORS must be enabled on your Mealie instance (it is by default).
