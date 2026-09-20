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

## Quick Start

### Option 1 — Docker Run

```bash
docker run -d \
  --name mealie-powertools \
  --restart unless-stopped \
  -p 3000:3000 \
  ghcr.io/geekykid12/mealie-powertools:latest
```

Then open `http://<your-server-ip>:3000` in your browser.

### Option 2 — Docker Compose (alongside existing Mealie)

Create a `docker-compose.yml`:

```yaml
services:
  powertools:
    image: ghcr.io/geekykid12/mealie-powertools:latest
    container_name: mealie-powertools
    restart: unless-stopped
    ports:
      - "3000:3000"
    networks:
      - mealie_default   # replace with your Mealie network name

networks:
  mealie_default:
    external: true
```

Find your Mealie network name:
```bash
docker inspect mealie --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
```

Then start it:
```bash
docker compose up -d
```

### Updating to the latest release

```bash
docker pull ghcr.io/geekykid12/mealie-powertools:latest
docker compose up -d   # or: docker stop mealie-powertools && docker run ...
```

---

## Connecting to Mealie

1. Open PowerTools at `http://<your-server-ip>:3000`
2. Enter your Mealie URL in the format: `http://<mealie-ip>:<port>/api`
   - Example: `http://192.168.1.154:9925/api`
3. Enter your Mealie API token
   - Generate one in Mealie → Profile → API Tokens
   - Admin token recommended for full PowerTools access

> **Note:** PowerTools runs a proxy server internally, so your browser never makes direct requests to Mealie. This means there are no CORS issues regardless of where each service is hosted.

---

## Network Setup

PowerTools is accessed via your **server's IP address** on port 3000:
```
http://<powertools-server-ip>:3000
```

The Mealie URL you enter can be on the same machine or a different one on your network. Both work fine.

---

## Tested With

- Mealie v3.27.0
- Docker 24+

---

## License

MIT
