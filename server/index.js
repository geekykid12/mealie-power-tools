const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));

// ── Proxy cache ────────────────────────────────────────────────────────────────
const proxyCache = new Map();
function getProxy(target) {
  if (!proxyCache.has(target)) {
    proxyCache.set(target, createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (err, req, res) => {
          console.error(`[proxy error] ${err.message}`);
          if (!res.headersSent) res.status(502).json({ error: `Proxy error: ${err.message}` });
        },
        proxyRes: (proxyRes, req) => {
          console.log(`[proxy res] ${proxyRes.statusCode} ${req.method} ${req.url}`);
        },
      },
    }));
  }
  return proxyCache.get(target);
}

// ── Static frontend ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../dist")));

// ── AI config check ────────────────────────────────────────────────────────────
// Probes Mealie's admin server-info endpoint to determine if OpenAI is configured
app.post("/ai-check", async (req, res) => {
  const { mealieUrl, token } = req.body;
  if (!mealieUrl || !token) return res.status(400).json({ error: "Missing params" });

  try {
    // Try admin/server-info which may contain openai config in some versions
    const infoRes = await fetch(`${mealieUrl}/admin/server-info`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (infoRes.ok) {
      const info = await infoRes.json();
      // Mealie exposes openaiEnabled in some versions via server-info
      const enabled = !!(
        info.openaiEnabled ||
        info.openaiApiKey ||
        info.enableOpenai
      );
      if (enabled) return res.json({ enabled: true, source: "server-info" });
    }

    // Fallback: probe the parser with a trivial ingredient using openai parser
    // If OpenAI isn't configured Mealie returns a 400 or specific error message
    const probeRes = await fetch(`${mealieUrl}/parser/ingredients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: ["1 cup flour"], parser: "openai" }),
    });

    if (probeRes.ok) {
      return res.json({ enabled: true, source: "probe" });
    }

    // Check if error says "not configured" vs generic error
    const errText = await probeRes.text().catch(() => "");
    const notConfigured = errText.toLowerCase().includes("openai") &&
      (errText.toLowerCase().includes("not configured") ||
       errText.toLowerCase().includes("disabled") ||
       errText.toLowerCase().includes("no api key"));

    return res.json({ enabled: !notConfigured && probeRes.status !== 500, source: "probe", status: probeRes.status });
  } catch (e) {
    console.error("[ai-check]", e.message);
    res.json({ enabled: false, error: e.message });
  }
});

// ── AI Cookbook endpoint ───────────────────────────────────────────────────────
// Makes the OpenAI call server-side using Mealie's configured credentials
app.post("/ai-cookbook", async (req, res) => {
  const { mealieUrl, token, recipes, cookbooks, prompt } = req.body;
  if (!mealieUrl || !token) return res.status(400).json({ error: "Missing mealieUrl or token" });

  try {
    // Fetch AI provider config from Mealie admin endpoint
    let apiKey = null;
    let aiBaseUrl = "https://api.openai.com/v1";
    let model = "gpt-4o-mini";

    const infoRes = await fetch(`${mealieUrl}/admin/server-info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (infoRes.ok) {
      const info = await infoRes.json();
      if (info.openaiApiKey) apiKey = info.openaiApiKey;
      if (info.openaiBaseUrl) aiBaseUrl = info.openaiBaseUrl.replace(/\/$/, "");
      if (info.openaiModel) model = info.openaiModel;
    }

    // Try newer multi-provider endpoint
    if (!apiKey) {
      const provRes = await fetch(`${mealieUrl}/admin/ai-providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (provRes.ok) {
        const prov = await provRes.json();
        const providers = Array.isArray(prov) ? prov : (prov.items || []);
        const p = providers.find(x => x.isDefault) || providers[0];
        if (p) {
          apiKey = p.apiKey;
          if (p.baseUrl) aiBaseUrl = p.baseUrl.replace(/\/$/, "");
          if (p.model) model = p.model;
        }
      }
    }

    if (!apiKey) {
      return res.status(503).json({
        error: "OpenAI is not configured in Mealie. Add OPENAI_API_KEY to your Mealie environment variables and restart."
      });
    }

    // Build prompt
    const recipeList = recipes.map(r => {
      const cats = (r.recipeCategory || []).map(c => c.name).join(", ");
      const tags = (r.tags || []).map(t => t.name).join(", ");
      return `- ${r.name}${cats ? ` [${cats}]` : ""}${tags ? ` #${tags}` : ""}`;
    }).join("\n");

    const existingCbs = (cookbooks || []).map(c => c.name).join(", ");

    const messages = [
      {
        role: "system",
        content: "You are a helpful cookbook organizer. Analyze a recipe collection and suggest meaningful cookbook groupings. Return ONLY valid JSON — no markdown, no explanation, no code fences."
      },
      {
        role: "user",
        content: `I have ${recipes.length} recipes:\n${recipeList}\n\n${existingCbs ? `Existing cookbooks (avoid exact duplicates, suggest merging if similar): ${existingCbs}\n\n` : ""}${prompt ? `User request: ${prompt}\n\n` : ""}Suggest 3-5 cookbooks. Respond with a JSON array where each item has: name (string), description (string, 1-2 sentences), recipeNames (array of exact recipe name strings from my list that belong in this cookbook). Example: [{"name":"Quick Weeknight Dinners","description":"Fast recipes ready in 30 minutes.","recipeNames":["Pasta Carbonara","Stir Fry Chicken"]}]`
      }
    ];

    const aiRes = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: 2000, temperature: 0.7, messages }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI API ${aiRes.status}: ${err.slice(0, 300)}`);
    }

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(clean);
    res.json({ suggestions, model });
  } catch (e) {
    console.error("[ai-cookbook]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Image proxy — serve Mealie media through the proxy ────────────────────────
// Images are loaded with /api/media/... but that goes through the Mealie proxy
// which requires X-Mealie-Url header. Since <img> tags can't set headers,
// we need a separate image proxy endpoint that reads the URL from a query param.
app.get("/img", async (req, res) => {
  const { src, mealie } = req.query;
  if (!src || !mealie) return res.status(400).send("Missing src or mealie param");
  try {
    const url = `${decodeURIComponent(mealie)}/${src.replace(/^\//, "")}`;
    const token = req.query.token || "";
    const imgRes = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!imgRes.ok) return res.status(imgRes.status).send("Image fetch failed");
    res.set("Content-Type", imgRes.headers.get("content-type") || "image/webp");
    res.set("Cache-Control", "public, max-age=3600");
    imgRes.body.pipe(res);
  } catch (e) {
    console.error("[img proxy]", e.message);
    res.status(502).send("Image proxy error");
  }
});

// ── Mealie API proxy ───────────────────────────────────────────────────────────
app.use("/api", (req, res, next) => {
  const mealieUrl = req.headers["x-mealie-url"];
  if (!mealieUrl) return res.status(400).json({ error: "Missing X-Mealie-Url header" });
  console.log(`[proxy] ${req.method} ${mealieUrl}${req.url}`);
  getProxy(mealieUrl)(req, res, next);
});

// ── SPA fallback ───────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Mealie PowerTools running on http://0.0.0.0:3000");
});
