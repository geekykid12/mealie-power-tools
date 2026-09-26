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

// ── Helper ─────────────────────────────────────────────────────────────────────
async function mealieJson(url, token) {
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const text = await r.text();
  if (text.trimStart().startsWith("<")) throw new Error(`Route not found: ${url}`);
  return JSON.parse(text);
}

// ── Static frontend ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../dist")));

// ── AI provider info ───────────────────────────────────────────────────────────
// Returns whether AI is configured and the default provider's baseUrl + model
// The API key is never exposed by Mealie so the user must supply it separately
app.post("/ai-info", async (req, res) => {
  const { mealieUrl, token } = req.body;
  if (!mealieUrl || !token) return res.status(400).json({ error: "Missing params" });

  try {
    // 1. Get settings — tells us aiEnabled + defaultProviderId + groupId indirectly
    const settings = await mealieJson(`${mealieUrl}/groups/ai-providers/settings`, token);
    if (!settings.aiEnabled || !settings.defaultProviderId) {
      return res.json({ aiEnabled: false });
    }

    // 2. Get the user's group to find the groupId
    const group = await mealieJson(`${mealieUrl}/groups/self`, token);
    const groupId = group.id;

    // 3. Fetch the default provider's config via admin endpoint (no apiKey returned)
    let providerName = "", baseUrl = "", model = "";
    try {
      const provider = await mealieJson(
        `${mealieUrl}/admin/groups/${groupId}/ai-providers/providers/${settings.defaultProviderId}`,
        token
      );
      providerName = provider.name || "";
      baseUrl = provider.baseUrl || "";
      model = provider.model || provider.name || "";
    } catch {
      // Admin endpoint failed — use name from settings list as fallback
      const p = (settings.providers || []).find(p => p.id === settings.defaultProviderId);
      providerName = p?.name || "";
      model = p?.name || "";
    }

    res.json({ aiEnabled: true, providerName, baseUrl, model });
  } catch (e) {
    console.error("[ai-info]", e.message);
    res.json({ aiEnabled: false, error: e.message });
  }
});

// ── AI Cookbook endpoint ───────────────────────────────────────────────────────

// Robustly extract a JSON array from an AI response that may include
// surrounding text, markdown fences, or explanation before/after the JSON.
function extractJsonArray(text) {
  let s = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  // Try direct parse
  try { const r = JSON.parse(s); if (Array.isArray(r)) return r; } catch {}
  // Find first [ and last ]
  const start = s.indexOf("[");
  const end   = s.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try { const r = JSON.parse(s.slice(start, end + 1)); if (Array.isArray(r)) return r; } catch {}
  }
  // Regex scan for array
  const match = s.match(/\[[\s\S]*\]/);
  if (match) {
    try { const r = JSON.parse(match[0]); if (Array.isArray(r)) return r; } catch {}
  }
  throw new Error("Could not extract JSON array from AI response. Raw: " + text.slice(0, 200));
}

app.post("/ai-cookbook", async (req, res) => {
  const { recipes, cookbooks, prompt, aiApiKey, aiBaseUrl, aiModel } = req.body;
  if (!aiApiKey) return res.status(400).json({ error: "Missing AI API key" });

  const baseUrl = (aiBaseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = aiModel || "gpt-4o-mini";

  try {
    const recipeList = recipes.map(r => {
      const cats = (r.recipeCategory || []).map(c => c.name).join(", ");
      const tags  = (r.tags || []).map(t => t.name).join(", ");
      return `- ${r.name}${cats ? ` [${cats}]` : ""}${tags ? ` #${tags}` : ""}`;
    }).join("\n");
    const existingCbs = (cookbooks || []).map(c => c.name).join(", ");

    const systemPrompt = `You are a personal recipe collection organizer. Your job is to group a user's actual saved recipes into meaningful CATEGORY-based collections (like "Quick Weeknight Dinners", "Soups & Stews", "Meal Prep", "Vegetarian", "Party Food", etc.). IMPORTANT RULES:
- Do NOT suggest real published cookbook titles (not "Jerusalem: A Cookbook", not "The Food Lab", etc.)
- Do NOT invent recipe names — only use recipes from the user's list
- Suggest 3-5 practical, themed categories that would actually help organize THEIR specific collection
- Each category name should be short and descriptive (2-5 words)
- You MUST respond with ONLY a valid JSON array. No explanation, no preamble, no markdown, no code fences. Start with [ and end with ].`;

    const userPrompt = `Here are my ${recipes.length} saved recipes:
${recipeList}
${existingCbs ? "\nI already have these collections (avoid duplicating): " + existingCbs + "\n" : ""}
${prompt ? "Special request: " + prompt + "\n" : ""}
Group these into 3-5 themed collections using ONLY the recipe names above. Return a JSON array where each item is: {"name":"Short Category Name","description":"One sentence about what unifies these recipes","recipeNames":["Exact Recipe Name From My List Above"]}

Remember: use only recipe names from my list above, and name the collections as practical categories, NOT published book titles.`;

    const body = {
      model,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    };

    // Gemini supports response_format to force JSON output
    const isGemini = baseUrl.includes("googleapis.com") || baseUrl.includes("generativelanguage");
    if (isGemini) body.response_format = { type: "json_object" };

    console.log("[ai-cookbook] calling", baseUrl, "model:", model);
    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiApiKey}` },
      body: JSON.stringify(body),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI API ${aiRes.status}: ${err.slice(0, 300)}`);
    }

    const aiData  = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    console.log("[ai-cookbook] raw response:", rawText.slice(0, 300));

    const suggestions = extractJsonArray(rawText);
    res.json({ suggestions, model });
  } catch (e) {
    console.error("[ai-cookbook]", e.message);
    res.status(500).json({ error: e.message });
  }
});
// ── AI Taxonomy endpoint ───────────────────────────────────────────────────────
app.post("/ai-taxonomy", async (req, res) => {
  const { recipes, existingItems, type, prompt, aiApiKey, aiBaseUrl, aiModel } = req.body;
  if (!aiApiKey) return res.status(400).json({ error: "Missing AI API key" });

  const baseUrl = (aiBaseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = aiModel || "gpt-4o-mini";

  const isCategory = type === "categories";
  const typeSingular = isCategory ? "category" : "tag";
  const typePlural = isCategory ? "categories" : "tags";

  const examples = isCategory
    ? "Breakfast, Lunch, Dinner, Appetizer, Soup, Salad, Dessert, Snack, Side Dish, Drinks, Baking, Vegetarian, Vegan, Gluten-Free"
    : "Quick, Easy, Healthy, Spicy, Comfort Food, Meal Prep, Kid-Friendly, Date Night, Holiday, Summer, Winter";

  try {
    const recipeList = recipes.map(r => `- ${r.name}`).join("\n");
    const existing = (existingItems || []).map(i => i.name).join(", ");

    const systemPrompt = `You are a recipe collection organizer. Your job is to suggest useful ${typePlural} to help organize a recipe collection. RULES:
- Suggest practical, short ${typePlural} (1-4 words each) that genuinely describe the recipes
- Do NOT suggest ${typePlural} that already exist
- Focus on ${isCategory ? "meal types, cuisine styles, and dietary categories" : "recipe characteristics and attributes"}
- Examples of good ${typePlural}: ${examples}
- You MUST respond with ONLY a valid JSON array. No explanation, no markdown. Start with [ and end with ].`;

    const userPrompt = `Here are my ${recipes.length} recipes:
${recipeList}
${existing ? "\nAlready have these ${typePlural} (do NOT suggest these): " + existing + "\n" : ""}
${prompt ? "User request: " + prompt + "\n" : ""}
Suggest 5-10 useful ${typePlural} for this collection. Return a JSON array where each item is:
{"name":"Category Name","description":"One sentence about which recipes this applies to","matchingRecipes":["Recipe Name 1","Recipe Name 2"]}

Only include recipe names that actually exist in my list above.`;

    const body = {
      model,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    };

    const isGemini = baseUrl.includes("googleapis.com") || baseUrl.includes("generativelanguage");
    if (isGemini) body.response_format = { type: "json_object" };

    console.log("[ai-taxonomy] calling", baseUrl, "model:", model, "type:", type);
    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiApiKey}` },
      body: JSON.stringify(body),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI API ${aiRes.status}: ${err.slice(0, 300)}`);
    }

    const aiData  = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    console.log("[ai-taxonomy] raw:", rawText.slice(0, 300));

    const suggestions = extractJsonArray(rawText);
    res.json({ suggestions, model });
  } catch (e) {
    console.error("[ai-taxonomy]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Image proxy ────────────────────────────────────────────────────────────────
app.get("/img", async (req, res) => {
  const { src, mealie, token } = req.query;
  if (!src || !mealie) return res.status(400).send("Missing src or mealie param");
  try {
    const url = `${decodeURIComponent(mealie)}/${src.replace(/^\//, "")}`;
    const imgRes = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {},
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
