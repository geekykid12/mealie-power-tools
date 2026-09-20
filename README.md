# 🔧 Mealie PowerTools

A self-hosted admin dashboard for your [Mealie](https://github.com/mealie-recipes/mealie) recipe server. PowerTools gives you capabilities that go beyond Mealie's built-in UI — bulk operations, data quality auditing, full recipe editing, ingredient parser review, and server-wide admin controls.

## Features

| Section | What you can do |
|---|---|
| **Dashboard** | Live stats, quick navigation |
| **Recipes** | Search, full edit (ingredients, instructions, times, notes), delete, per-recipe ingredient parse |
| **Ingredient Parser** | Bulk-parse unparsed or all recipes, with a review step to approve/reject each detected change before saving |
| **Bulk Operations** | Select multiple recipes and bulk-assign tags, categories, or bulk-delete |
| **Tags & Categories** | Create, rename, delete — with usage counts and one-click "delete all unused" |
| **Cookbooks** | Visualize, create, delete cookbooks and browse their recipes |
| **Data Quality** | Full audit: images, descriptions, ingredients, instructions, times, tags, parsed status, duplicates — with per-recipe and bulk auto-repair |
| **Image Manager** | Find recipes missing images, set images by URL or file upload |
| **Activity** | Recently added, modified, or cooked recipes |
| **Households** | View all households, manage members, create/edit/disable users per household |
| **Admin** | Create users, manage roles, trigger backups |

---

## Requirements

- Docker
- A running [Mealie](https://github.com/mealie-recipes/mealie) instance (v3.x)
- A Mealie API token (admin recommended for full access)

---

## Installation

There are three ways to run PowerTools depending on your setup.

### Option 1 — Docker Run (simplest)

No compose file needed. Just pull and run:

```bash
docker run -d \
  --name mealie-powertools \
  --restart unless-stopped \
  -p 3000:3000 \
  ghcr.io/geekykid12/mealie-powertools:latest
```

Open `http://<your-server-ip>:3000` in your browser.

> This works regardless of how Mealie is running. PowerTools doesn't need to be on the same Docker network as Mealie — it proxies API calls server-side using whatever URL you enter in the connection screen.

---

### Option 2 — Docker Compose, attach to existing Mealie (recommended)

Use this if Mealie is already running. Putting PowerTools on the same Docker network as Mealie lets you use the internal container hostname instead of an IP address.

**1. Clone the repo:**
```bash
git clone https://github.com/geekykid12/mealie-powertools.git
cd mealie-powertools
```

**2. Find your Mealie network name:**
```bash
docker inspect mealie --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
```

**3. Edit `docker-compose.attach.yml`** — replace `mealie_default` with your network name (it appears twice in the file).

**4. Start PowerTools:**
```bash
docker compose -f docker-compose.attach.yml up -d
```

PowerTools starts on port 3000. In the connection screen, use `http://mealie:9000/api` as the Mealie URL (internal hostname) or `http://<mealie-ip>:<port>/api` if you prefer the IP.

---

### Option 3 — Docker Compose, fresh install (Mealie + PowerTools together)

Use this if you don't have Mealie running yet and want to start both together.

> **Important:** The directory must be named `mealie-power-tools` (with hyphens) to avoid Docker project name conflicts.

```bash
git clone https://github.com/geekykid12/mealie-powertools.git mealie-power-tools
cd mealie-power-tools
docker compose up -d
```

This starts both Mealie (port 9000) and PowerTools (port 3000). Default Mealie login: `changeme@example.com` / `MyPassword`.

In the PowerTools connection screen, use `http://mealie:9000/api` as the Mealie URL.

---

## Updating

```bash
docker pull ghcr.io/geekykid12/mealie-powertools:latest
docker compose -f docker-compose.attach.yml up -d   # restarts with new image
```

Or for Docker Run:
```bash
docker pull ghcr.io/geekykid12/mealie-powertools:latest
docker stop mealie-powertools && docker rm mealie-powertools
docker run -d --name mealie-powertools --restart unless-stopped -p 3000:3000 \
  ghcr.io/geekykid12/mealie-powertools:latest
```

---

## Connecting to Mealie

1. Open PowerTools at `http://<your-server-ip>:3000`
2. Enter your Mealie URL — format: `http://<mealie-ip>:<port>/api`
   - Same Docker network: `http://mealie:9000/api`
   - Different machine or reverse proxy: `http://192.168.1.154:9925/api`
3. Enter your Mealie API token
   - Generate one in Mealie → Profile → API Tokens
   - An admin token is recommended for full PowerTools access

> **How it works:** PowerTools runs a proxy server internally. Your browser talks to PowerTools on port 3000, and PowerTools forwards API calls to Mealie server-side. This means there are no CORS issues regardless of where each service is hosted, and you never need to expose the Mealie API port directly to your browser.

---

## Tested With

- Mealie v3.27.0
- Docker 24+

---

## License

MIT
