const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
app.use(express.json());

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

// ── AI Cookbook endpoint ───────────────────────────────────────────────────────
// Fetches Mealie's AI config then calls the OpenAI-compatible endpoint server-side
app.post("/ai-cookbook", async (req, res) => {
  const { mealieUrl, token, recipes, cookbooks, prompt } = req.body;
  if (!mealieUrl || !token) return res.status(400).json({ error: "Missing mealieUrl or token" });

  try {
    // 1. Fetch Mealie's AI provider config from admin endpoint
    const cfgRes = await fetch(`${mealieUrl}/admin/ai-providers`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    let aiBaseUrl = "https://api.openai.com/v1";
    let apiKey = null;
    let model = "gpt-4o";

    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      // Find the default/chat provider
      const providers = Array.isArray(cfg) ? cfg : (cfg.items || []);
      const defaultProvider = providers.find(p => p.isDefault) || providers[0];
      if (defaultProvider) {
        apiKey = defaultProvider.apiKey;
        model = defaultProvider.model || model;
        if (defaultProvider.baseUrl) aiBaseUrl = defaultProvider.baseUrl.replace(/\/$/, "");
      }
    }

    // Fallback: try the older single-provider endpoint
    if (!apiKey) {
      const oldCfgRes = await fetch(`${mealieUrl}/admin/server-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (oldCfgRes.ok) {
        const info = await oldCfgRes.json();
        if (info.openaiApiKey) {
          apiKey = info.openaiApiKey;
          model = info.openaiModel || model;
          if (info.openaiBaseUrl) aiBaseUrl = info.openaiBaseUrl.replace(/\/$/, "");
        }
      }
    }

    if (!apiKey) {
      return res.status(503).json({ error: "No AI provider configured in Mealie. Set up OpenAI in Mealie's admin settings first." });
    }

    // 2. Build prompt
    const recipeList = recipes.map(r => {
      const cats = (r.recipeCategory || []).map(c => c.name).join(", ");
      const tags = (r.tags || []).map(t => t.name).join(", ");
      return `- ${r.name}${cats ? ` [${cats}]` : ""}${tags ? ` #${tags}` : ""}`;
    }).join("\n");

    const existingCbs = (cookbooks || []).map(c => c.name).join(", ");

    const systemMsg = `You are a helpful cookbook organizer. Analyze a recipe collection and suggest meaningful cookbook groupings. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

    const userMsg = `I have ${recipes.length} recipes:\n${recipeList}\n\n${existingCbs ? `Existing cookbooks (avoid exact duplicates): ${existingCbs}\n\n` : ""}${prompt ? `User request: ${prompt}\n\n` : ""}Suggest 3-5 cookbooks. Respond with a JSON array where each item has: name (string), description (string, 1-2 sentences), recipeNames (array of recipe name strings from my list). Example format: [{"name":"Quick Weeknight Dinners","description":"Fast recipes ready in 30 minutes or less.","recipeNames":["Pasta Carbonara","Stir Fry Chicken"]}]`;

    // 3. Call the AI
    const aiRes = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI API error ${aiRes.status}: ${err}`);
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
