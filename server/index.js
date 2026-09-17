const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

// Cache proxy instances by target URL to avoid memory leak
const proxyCache = new Map();

function getProxy(target) {
  if (!proxyCache.has(target)) {
    proxyCache.set(target, createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (err, req, res) => {
          console.error(`[proxy error] ${err.message}`);
          if (!res.headersSent) {
            res.status(502).json({ error: `Proxy error: ${err.message}` });
          }
        },
        proxyRes: (proxyRes, req) => {
          console.log(`[proxy res] ${proxyRes.statusCode} ${req.method} ${req.url}`);
        },
      },
    }));
  }
  return proxyCache.get(target);
}

// Serve the React frontend static files
app.use(express.static(path.join(__dirname, "../dist")));

// Proxy /api/* to Mealie — target URL from X-Mealie-Url header
app.use("/api", (req, res, next) => {
  const mealieUrl = req.headers["x-mealie-url"];
  if (!mealieUrl) {
    return res.status(400).json({ error: "Missing X-Mealie-Url header" });
  }
  console.log(`[proxy] ${req.method} ${mealieUrl}${req.url}`);
  getProxy(mealieUrl)(req, res, next);
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Mealie PowerTools running on http://0.0.0.0:3000");
});
