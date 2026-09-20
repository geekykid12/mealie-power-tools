import { useState, useEffect, useCallback, useRef } from "react";

// ─── Version ─────────────────────────────────────────────────────────────────
const VERSION = "1.0.0";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f14",
  surface: "#151820",
  surfaceAlt: "#1c2030",
  border: "#252a38",
  accent: "#f97316",      // orange – mealie's warmth
  accentDim: "#7c3a0e",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  text: "#e8eaf0",
  muted: "#8890a4",
  card: "#181c27",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: ${C.bg}; color: ${C.text}; font-family: 'Sora', sans-serif; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${C.surface}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.accent}; }

  .mono { font-family: 'Space Mono', monospace; }

  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(249,115,22,.4); }
    70% { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
    100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .fade-up { animation: fadeUp .3s ease forwards; }

  .skeleton {
    background: linear-gradient(90deg, ${C.surface} 25%, ${C.surfaceAlt} 50%, ${C.surface} 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 4px;
  }

  input, textarea, select {
    background: ${C.surfaceAlt};
    border: 1px solid ${C.border};
    color: ${C.text};
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color .2s;
    width: 100%;
  }
  input:focus, textarea:focus, select:focus { border-color: ${C.accent}; }

  button {
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    transition: all .2s;
  }
  button:disabled { opacity: .4; cursor: not-allowed; }

  .btn-primary {
    background: ${C.accent};
    color: #fff;
    padding: 8px 18px;
  }
  .btn-primary:hover:not(:disabled) { background: #ea6c0a; transform: translateY(-1px); }

  .btn-ghost {
    background: transparent;
    color: ${C.muted};
    padding: 8px 14px;
    border: 1px solid ${C.border};
  }
  .btn-ghost:hover:not(:disabled) { border-color: ${C.accent}; color: ${C.accent}; }

  .btn-danger {
    background: #2a1010;
    color: ${C.red};
    padding: 8px 14px;
    border: 1px solid #3a1616;
  }
  .btn-danger:hover:not(:disabled) { background: #3a1616; }

  .btn-success {
    background: #0f2a18;
    color: ${C.green};
    padding: 8px 14px;
    border: 1px solid #1a3a22;
  }
  .btn-success:hover:not(:disabled) { background: #1a3a22; }

  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
    letter-spacing: .04em;
  }
  .tag-orange { background: #2a1a08; color: ${C.accent}; border: 1px solid #4a2a10; }
  .tag-green  { background: #0a1f12; color: ${C.green};  border: 1px solid #14341e; }
  .tag-red    { background: #1f0a0a; color: ${C.red};    border: 1px solid #341414; }
  .tag-blue   { background: #0a1020; color: ${C.blue};   border: 1px solid #142040; }
  .tag-muted  { background: ${C.surfaceAlt}; color: ${C.muted}; border: 1px solid ${C.border}; }

  .card {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 14px;
    padding: 20px;
  }

  .progress-bar {
    height: 6px; border-radius: 999px; background: ${C.surfaceAlt};
    overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 999px; background: ${C.accent};
    transition: width .4s ease;
  }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .08em;
       color: ${C.muted}; text-transform: uppercase; padding: 10px 14px;
       border-bottom: 1px solid ${C.border}; }
  td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid ${C.border}20; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${C.surfaceAlt}20; }

  .log-entry {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 3px;
  }
  .log-info  { color: ${C.blue};  background: #0a1020; }
  .log-ok    { color: ${C.green}; background: #0a1f12; }
  .log-warn  { color: ${C.yellow}; background: #1a1608; }
  .log-error { color: ${C.red};   background: #1f0a0a; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <div style={{
    width: size, height: size, border: `2px solid ${C.border}`,
    borderTopColor: C.accent, borderRadius: "50%",
    animation: "spin .7s linear infinite", display: "inline-block",
  }} />
);

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    recipe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
    parse: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
    household: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    cookbook: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z",
    settings: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    refresh: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    stats: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
    bolt: "M7 2v11h3v9l7-12h-4l4-8z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={icons[name] || icons.bolt} />
    </svg>
  );
};

// ─── API Client ───────────────────────────────────────────────────────────────
function makeApi(baseUrl, token) {
  const headers = {
    "Content-Type": "application/json",
    "X-Mealie-Url": baseUrl.trim(),
    ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
  };
  const req = async (method, path, body) => {
    const r = await fetch(`/api${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    if (r.status === 204) return null;
    return r.json();
  };
  return {
    get: (p) => req("GET", p),
    post: (p, b) => req("POST", p, b),
    put: (p, b) => req("PUT", p, b),
    patch: (p, b) => req("PATCH", p, b),
    delete: (p) => req("DELETE", p),
    _base: baseUrl,
  };
}

// ─── Connection Setup ─────────────────────────────────────────────────────────
function ConnectPanel({ onConnect }) {
  const [url, setUrl] = useState("http://127.0.0.1:9925/api");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const test = async () => {
    setLoading(true); setErr("");
    try {
      const api = makeApi(url, token);
      const user = await api.get("/users/self");
      onConnect({ url, token, user, api });
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg,
      backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, ${C.accentDim}30, transparent)`,
    }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}44)`,
            border: `1px solid ${C.accent}44`, marginBottom: 20,
            animation: "pulse-ring 2s infinite",
          }}>
            <Icon name="bolt" size={32} color={C.accent} />
          </div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>
            mealie<span style={{ color: C.accent }}>·powertools</span>
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
            Admin-grade control for your Mealie server
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Mealie URL
            </label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="http://<mealie-ip>:9925/api" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
              API Token
            </label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)}
              placeholder="Bearer token from Mealie profile" />
          </div>
          {err && (
            <div style={{ background: "#1f0a0a", border: "1px solid #3a1616", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 12 }}>
              ⚠ {err}
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%", padding: "12px" }} onClick={test} disabled={loading || !token}>
            {loading ? <Spinner size={14} /> : "Connect →"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
          Mealie URL format: <span style={{ color: C.accent, fontFamily: "monospace" }}>http://&lt;mealie-ip&gt;:&lt;port&gt;/api</span><br />
          Generate an API token in Mealie → Profile → API Tokens
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>{label}</div>
      <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: accent || C.text }}>{value ?? <Spinner />}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Log Panel ───────────────────────────────────────────────────────────────
function LogPanel({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div ref={ref} style={{ height: 200, overflowY: "auto", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
      {logs.length === 0
        ? <div style={{ color: C.muted, fontSize: 12, textAlign: "center", paddingTop: 80 }}>No activity yet</div>
        : logs.map((l, i) => (
          <div key={i} className={`log-entry log-${l.type}`}>{l.ts} › {l.msg}</div>
        ))
      }
    </div>
  );
}

// ─── SECTION: Recipes ─────────────────────────────────────────────────────────
function RecipesSection({ api, addLog, cache, onCache }) {
  const [recipes, setRecipes] = useState(cache?.recipes || null);
  const [search, setSearch] = useState(cache?.search || "");
  const [page, setPage] = useState(cache?.page || 1);
  const [total, setTotal] = useState(cache?.total || 0);
  const [loading, setLoading] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [editFull, setEditFull] = useState(null);
  const [saving, setSaving] = useState(false);
  const [parsingSlug, setParsingSlug] = useState(null);
  const PER = 20;

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, perPage: PER, ...(q ? { search: q } : {}) });
      const data = await api.get(`/recipes?${params}`);
      const items = data.items || [];
      const full = await Promise.all(
        items.map(r => api.get(`/recipes/${r.slug}`).catch(() => r))
      );
      setRecipes(full);
      setTotal(data.total || 0);
      setPage(p);
      onCache({ recipes: full, total: data.total || 0, page: p, search: q });
    } catch (e) { addLog("error", `Load recipes: ${e.message}`); }
    setLoading(false);
  }, [api]);

  useEffect(() => { if (!cache?.recipes) load(1, ""); }, [load]);

  const del = async (slug, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/recipes/${slug}`);
      addLog("ok", `Deleted recipe: ${name}`);
      load(page, search);
    } catch (e) { addLog("error", e.message); }
  };

  const openEdit = (r) => {
    setEditRecipe(r);
    // r is already a full recipe object (load() fetches full details)
    setEditFull(r);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/recipes/${editFull.slug}`, {
        name: editFull.name,
        description: editFull.description,
        recipeServings: editFull.recipeServings,
        prepTime: editFull.prepTime,
        cookTime: editFull.cookTime,
        totalTime: editFull.totalTime,
        recipeYield: editFull.recipeYield,
        orgURL: editFull.orgURL,
        rating: editFull.rating,
        recipeIngredient: (editFull.recipeIngredient || []).map(ing => ({
          ...ing,
          food: ing.food ? { id: ing.food.id, name: ing.food.name } : null,
          unit: ing.unit ? { id: ing.unit.id, name: ing.unit.name } : null,
        })),
        recipeInstructions: editFull.recipeInstructions,
        notes: editFull.notes,
      });
      addLog("ok", `Updated: ${editFull.name}`);
      setEditRecipe(null);
      setEditFull(null);
      load(page, search);
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  const setField = (key, val) => setEditFull(f => ({ ...f, [key]: val }));

  const pages = Math.ceil(total / PER);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color={C.muted} />
          </div>
          <input style={{ paddingLeft: 32 }} placeholder="Search recipes…" value={search}
            onChange={e => { setSearch(e.target.value); load(1, e.target.value); }} />
        </div>
        <button className="btn-ghost" onClick={() => load(page, search)} disabled={loading}>
          {loading ? <Spinner size={13} /> : <Icon name="refresh" size={14} />}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Total Recipes" value={total} accent={C.accent} />
        <StatCard label="Page" value={`${page}/${pages || 1}`} sub={`${PER} per page`} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Categories</th>
                <th>Ingredients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(recipes || []).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td>
                    {(r.recipeCategory || []).slice(0, 3).map(c => (
                      <span key={c.id} className="tag tag-orange" style={{ marginRight: 4 }}>{c.name}</span>
                    ))}
                  </td>
                  <td>
                    {(() => {
                      const ings = r.recipeIngredient || [];
                      if (ings.length === 0) return <span className="tag tag-muted">none</span>;
                      const parsed = ings.filter(i => i.food || i.unit).length;
                      const all = parsed === ings.length;
                      const none = parsed === 0;
                      return (
                        <span className={`tag ${all ? "tag-green" : none ? "tag-red" : "tag-orange"}`}>
                          {all ? "✓ parsed" : none ? "✗ unparsed" : `${parsed}/${ings.length}`}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ padding: "5px 10px" }}
                        title="Run ingredient parser"
                        disabled={parsingSlug === r.slug}
                        onClick={async () => {
                          setParsingSlug(r.slug);
                          try {
                            const full = await api.get(`/recipes/${r.slug}`);
                            const ings = (full.recipeIngredient || []).map(i => i.display || i.note || "");
                            if (ings.length) {
                              const parsed = await api.post("/parser/ingredients", {
                                ingredients: ings.map(i => ({ ingredient: i })), parser: "nlp"
                              });
                              const updated = full.recipeIngredient.map((ing, idx) => ({
                                ...ing, ...(parsed[idx] ? {
                                  food: parsed[idx].ingredient?.food,
                                  unit: parsed[idx].ingredient?.unit,
                                  quantity: parsed[idx].ingredient?.quantity,
                                } : {})
                              }));
                              await api.patch(`/recipes/${r.slug}`, {
                                recipeIngredient: updated.map(ing => ({
                                  ...ing,
                                  food: ing.food ? { id: ing.food.id, name: ing.food.name } : null,
                                  unit: ing.unit ? { id: ing.unit.id, name: ing.unit.name } : null,
                                }))
                              });
                              addLog("ok", `Parsed: ${r.name}`);
                              load(page, search);
                            }
                          } catch(e) { addLog("error", e.message); }
                          setParsingSlug(null);
                        }}>
                        {parsingSlug === r.slug ? <Spinner size={13} /> : <Icon name="parse" size={13} />}
                      </button>
                      <button className="btn-ghost" style={{ padding: "5px 10px" }}
                        title="Edit recipe"
                        onClick={() => openEdit(r)}>
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="btn-danger" style={{ padding: "5px 10px" }} onClick={() => del(r.slug, r.name)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn-ghost" onClick={() => load(page - 1, search)} disabled={page <= 1}>←</button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} style={{
              padding: "6px 12px", borderRadius: 8, border: "none",
              background: p === page ? C.accent : C.surfaceAlt,
              color: p === page ? "#fff" : C.muted,
              fontWeight: p === page ? 700 : 400, fontSize: 13,
            }} onClick={() => load(p, search)}>{p}</button>
          );
        })}
        <button className="btn-ghost" onClick={() => load(page + 1, search)} disabled={page >= pages}>→</button>
      </div>

      {/* Edit Modal */}
      {editRecipe && (
        <div style={{
          position: "fixed", inset: 0, background: "#000c",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          padding: 20,
        }}>
          <div className="card fade-up" style={{ width: 720, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Edit Recipe</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => { setEditRecipe(null); setEditFull(null); }}>
                <Icon name="close" size={14} />
              </button>
            </div>

            {editFull ? (
              <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name + Source */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Name</label>
                    <input value={editFull.name || ""} onChange={e => setField("name", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Source URL</label>
                    <input value={editFull.orgURL || ""} onChange={e => setField("orgURL", e.target.value)} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Description</label>
                  <textarea value={editFull.description || ""} onChange={e => setField("description", e.target.value)} rows={3} />
                </div>

                {/* Times + Servings */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Prep Time", key: "prepTime", placeholder: "30 min" },
                    { label: "Cook Time", key: "cookTime", placeholder: "1 hr" },
                    { label: "Total Time", key: "totalTime", placeholder: "1.5 hr" },
                    { label: "Servings", key: "recipeServings", placeholder: "4", type: "number" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type || "text"} placeholder={f.placeholder}
                        value={editFull[f.key] ?? ""}
                        onChange={e => setField(f.key, f.type === "number" ? +e.target.value : e.target.value)} />
                    </div>
                  ))}
                </div>

                {/* Rating + Yield */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Rating (0–5)</label>
                    <input type="number" min={0} max={5} value={editFull.rating ?? ""}
                      onChange={e => setField("rating", +e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Yield</label>
                    <input value={editFull.recipeYield || ""} onChange={e => setField("recipeYield", e.target.value)} />
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Ingredients ({(editFull.recipeIngredient || []).length})
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() =>
                        setField("recipeIngredient", [...(editFull.recipeIngredient || []), { note: "", display: "", quantity: null, unit: null, food: null, title: "", referenceId: crypto.randomUUID() }])
                      }>+ Ingredient</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px", color: C.blue, borderColor: C.blue + "66" }} onClick={() =>
                        setField("recipeIngredient", [...(editFull.recipeIngredient || []), { note: "", display: "", quantity: null, unit: null, food: null, title: "Section Header", isHeader: true, referenceId: crypto.randomUUID() }])
                      }>+ Header</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(editFull.recipeIngredient || []).map((ing, idx) => (
                      <div key={ing.referenceId || idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {ing.isHeader || ing.title ? (
                          <>
                            <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0 }}>§</div>
                            <input style={{ flex: 1, fontWeight: 600, color: C.blue, borderColor: C.blue + "44", background: C.blue + "0a" }}
                              placeholder="Section header…"
                              value={ing.title || ""}
                              onChange={e => {
                                const updated = [...editFull.recipeIngredient];
                                updated[idx] = { ...ing, title: e.target.value, display: "", note: "" };
                                setField("recipeIngredient", updated);
                              }} />
                          </>
                        ) : (
                          <>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: (ing.food || ing.unit) ? C.green : C.red }} />
                            <input style={{ flex: 1 }} value={ing.display || ing.note || ""}
                              onChange={e => {
                                const updated = [...editFull.recipeIngredient];
                                updated[idx] = { ...ing, display: e.target.value, note: e.target.value };
                                setField("recipeIngredient", updated);
                              }} />
                          </>
                        )}
                        <button className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0 }}
                          onClick={() => setField("recipeIngredient", editFull.recipeIngredient.filter((_, i) => i !== idx))}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Instructions ({(editFull.recipeInstructions || []).filter(s => !s.isHeader && s.text).length} steps)
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() =>
                        setField("recipeInstructions", [...(editFull.recipeInstructions || []), { text: "", title: "", id: crypto.randomUUID() }])
                      }>+ Step</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px", color: C.blue, borderColor: C.blue + "66" }} onClick={() =>
                        setField("recipeInstructions", [...(editFull.recipeInstructions || []), { text: "", title: "Section Header", isHeader: true, id: crypto.randomUUID() }])
                      }>+ Header</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(() => {
                      let stepNum = 0;
                      return (editFull.recipeInstructions || []).map((step, idx) => {
                        const isHeader = step.isHeader || (!step.text && step.title && !(editFull.recipeInstructions[idx - 1]?.text));
                        if (!isHeader) stepNum++;
                        return (
                          <div key={step.id || idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            {isHeader ? (
                              <>
                                <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0, marginTop: 8 }}>§</div>
                                <input style={{ flex: 1, fontWeight: 600, color: C.blue, borderColor: C.blue + "44", background: C.blue + "0a" }}
                                  placeholder="Section header…"
                                  value={step.title || ""}
                                  onChange={e => {
                                    const updated = [...editFull.recipeInstructions];
                                    updated[idx] = { ...step, title: e.target.value, text: "" };
                                    setField("recipeInstructions", updated);
                                  }} />
                              </>
                            ) : (
                              <>
                                <div style={{
                                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                  background: C.surfaceAlt, border: `1px solid ${C.border}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 11, color: C.muted, marginTop: 6,
                                }}>{stepNum}</div>
                                <textarea style={{ flex: 1 }} rows={2} value={step.text || ""}
                                  onChange={e => {
                                    const updated = [...editFull.recipeInstructions];
                                    updated[idx] = { ...step, text: e.target.value };
                                    setField("recipeInstructions", updated);
                                  }} />
                              </>
                            )}
                            <button className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0, marginTop: 4 }}
                              onClick={() => setField("recipeInstructions", editFull.recipeInstructions.filter((_, i) => i !== idx))}>
                              <Icon name="trash" size={12} />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
                  {(editFull.notes || []).map((note, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <textarea style={{ flex: 1 }} rows={2} value={note.text || ""}
                        onChange={e => {
                          const updated = [...editFull.notes];
                          updated[idx] = { ...note, text: e.target.value };
                          setField("notes", updated);
                        }} />
                      <button className="btn-danger" style={{ padding: "4px 8px" }}
                        onClick={() => setField("notes", editFull.notes.filter((_, i) => i !== idx))}>
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 12px", marginTop: 4 }}
                    onClick={() => setField("notes", [...(editFull.notes || []), { text: "", title: "" }])}>
                    + Add Note
                  </button>
                </div>

              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              <button className="btn-ghost" onClick={() => { setEditRecipe(null); setEditFull(null); }}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !editFull}>
                {saving ? <Spinner size={13} /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Ingredient Parser ───────────────────────────────────────────────
function ParserSection({ api, addLog }) {
  const [mode, setMode] = useState("unparsed");
  const [reviewMode, setReviewMode] = useState(true); // show review step before saving
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [parser, setParser] = useState("nlp");
  const [batchSize, setBatchSize] = useState(10);
  const abortRef = useRef(false);

  // Review state
  const [reviewItems, setReviewItems] = useState([]); // [{recipe, original, parsed, approved}]
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });

  const addParserLog = (type, msg) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(l => [...l.slice(-200), { type, msg, ts }]);
    addLog(type, msg);
  };

  const getAllRecipes = async () => {
    let all = [], page = 1;
    while (true) {
      const d = await api.get(`/recipes?page=${page}&perPage=100`);
      all = [...all, ...(d.items || [])];
      if (all.length >= d.total) break;
      page++;
    }
    return all;
  };

  const needsParsing = (recipe) => {
    const ings = recipe.recipeIngredient || [];
    if (ings.length === 0) return false;
    return ings.some(ing => !ing.food && !ing.unit);
  };

  const callParser = async (recipe) => {
    const ingredients = (recipe.recipeIngredient || []).map(i => i.display || i.note || "");
    if (!ingredients.length) return null;
    const parsed = await api.post("/parser/ingredients", {
      ingredients: ingredients.map(i => ({ ingredient: i })),
      parser,
    });
    return parsed;
  };

  const buildUpdated = (recipe, parsed) =>
    recipe.recipeIngredient.map((ing, idx) => ({
      ...ing, ...(parsed[idx] ? {
        food: parsed[idx].ingredient?.food,
        unit: parsed[idx].ingredient?.unit,
        quantity: parsed[idx].ingredient?.quantity,
      } : {}),
    }));

  const saveRecipe = async (recipe, updatedIngredients) => {
    await api.patch(`/recipes/${recipe.slug}`, {
      recipeIngredient: updatedIngredients.map(ing => ({
        ...ing,
        food: ing.food ? { id: ing.food.id, name: ing.food.name } : null,
        unit: ing.unit ? { id: ing.unit.id, name: ing.unit.name } : null,
      })),
    });
  };

  const run = async () => {
    abortRef.current = false;
    setRunning(true); setLogs([]); setProgress({ done: 0, total: 0 });
    setReviewItems([]);

    addParserLog("info", `Starting parse (${parser} engine, ${reviewMode ? "review mode" : "auto-save"})…`);

    try {
      const allRecipes = await getAllRecipes();
      // Need full recipe details for ingredient list
      addParserLog("info", `Fetching full details for ${allRecipes.length} recipes…`);
      const fullRecipes = await Promise.all(
        allRecipes.map(r => api.get(`/recipes/${r.slug}`).catch(() => r))
      );

      const targets = mode === "all"
        ? fullRecipes
        : fullRecipes.filter(r => needsParsing(r));

      addParserLog("info", `${targets.length} recipes queued`);
      setProgress({ done: 0, total: targets.length });

      const collected = [];

      for (let i = 0; i < targets.length; i += batchSize) {
        if (abortRef.current) { addParserLog("warn", "Aborted"); break; }
        const batch = targets.slice(i, i + batchSize);

        await Promise.all(batch.map(async recipe => {
          try {
            const parsed = await callParser(recipe);
            if (!parsed) return;

            if (reviewMode) {
              // Collect for review — pair each original ingredient with its parse result
              const items = recipe.recipeIngredient.map((ing, idx) => {
                const p = parsed[idx]?.ingredient;
                const hasResult = p?.food || p?.unit;
                const changed = hasResult && (
                  (p?.food?.name !== ing.food?.name) ||
                  (p?.unit?.name !== ing.unit?.name) ||
                  (p?.quantity !== ing.quantity && p?.quantity != null)
                );
                return {
                  original: { display: ing.display || ing.note || "", food: ing.food?.name, unit: ing.unit?.name, qty: ing.quantity },
                  parsed: p ? { food: p.food?.name, unit: p.unit?.name, qty: p.quantity } : null,
                  changed,
                  approved: changed, // default approve changed ones
                  parsedRaw: parsed[idx],
                  ingRaw: ing,
                };
              });
              collected.push({ recipe, items, allUpdated: buildUpdated(recipe, parsed) });
              addParserLog("ok", `✓ ${recipe.name} — ${items.filter(i => i.changed).length}/${items.length} changed`);
            } else {
              // Auto-save immediately
              await saveRecipe(recipe, buildUpdated(recipe, parsed));
              addParserLog("ok", `✓ Saved: ${recipe.name}`);
            }
          } catch (e) {
            addParserLog("error", `✗ ${recipe.name}: ${e.message}`);
          }
        }));

        setProgress({ done: Math.min(i + batchSize, targets.length), total: targets.length });
      }

      if (reviewMode && collected.length > 0) {
        setReviewItems(collected);
        setReviewing(true);
        addParserLog("info", `Ready to review ${collected.length} recipes`);
      } else {
        addParserLog("ok", "Parse complete!");
      }
    } catch (e) {
      addParserLog("error", `Fatal: ${e.message}`);
    }
    setRunning(false);
  };

  const saveApproved = async () => {
    setSaving(true);
    setSaveProgress({ done: 0, total: reviewItems.length });
    let saved = 0, skipped = 0;

    for (const item of reviewItems) {
      try {
        // Build updated ingredients respecting per-ingredient approval
        const updatedIngredients = item.recipe.recipeIngredient.map((ing, idx) => {
          const reviewIng = item.items[idx];
          if (!reviewIng || !reviewIng.approved || !reviewIng.parsedRaw) return ing;
          const p = reviewIng.parsedRaw.ingredient;
          return {
            ...ing,
            food: p?.food || ing.food,
            unit: p?.unit || ing.unit,
            quantity: p?.quantity ?? ing.quantity,
          };
        });
        const anyApproved = item.items.some(i => i.approved);
        if (anyApproved) {
          await saveRecipe(item.recipe, updatedIngredients);
          addParserLog("ok", `Saved: ${item.recipe.name}`);
          saved++;
        } else {
          skipped++;
        }
      } catch (e) {
        addParserLog("error", `${item.recipe.name}: ${e.message}`);
      }
      setSaveProgress(p => ({ ...p, done: p.done + 1 }));
    }

    addParserLog("ok", `Done — ${saved} saved, ${skipped} skipped`);
    setSaving(false);
    setReviewing(false);
    setReviewItems([]);
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const savePct = saveProgress.total ? Math.round((saveProgress.done / saveProgress.total) * 100) : 0;

  // ── Review Modal ─────────────────────────────────────────────────────────────
  if (reviewing && reviewItems.length > 0) {
    const totalChanged = reviewItems.reduce((s, r) => s + r.items.filter(i => i.changed).length, 0);
    const totalApproved = reviewItems.reduce((s, r) => s + r.items.filter(i => i.approved).length, 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Review Parse Results</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {reviewItems.length} recipes · {totalChanged} ingredients changed · {totalApproved} approved
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={() => {
              // Approve all
              setReviewItems(items => items.map(r => ({
                ...r, items: r.items.map(i => ({ ...i, approved: i.changed }))
              })));
            }}>✓ Approve All Changed</button>
            <button className="btn-ghost" onClick={() => {
              setReviewItems(items => items.map(r => ({
                ...r, items: r.items.map(i => ({ ...i, approved: false }))
              })));
            }}>✗ Reject All</button>
            <button className="btn-ghost" onClick={() => { setReviewing(false); setReviewItems([]); }}>
              Cancel
            </button>
            <button className="btn-primary" style={{ padding: "8px 20px" }}
              onClick={saveApproved} disabled={saving || totalApproved === 0}>
              {saving
                ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={13} /> {savePct}%</span>
                : `💾 Save ${totalApproved} Changes`}
            </button>
          </div>
        </div>

        {/* Per-recipe review cards */}
        {reviewItems.map((item, rIdx) => {
          const changedCount = item.items.filter(i => i.changed).length;
          const approvedCount = item.items.filter(i => i.approved).length;
          if (changedCount === 0) return null; // skip recipes with no changes

          return (
            <div key={item.recipe.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surfaceAlt }}>
                <div style={{ fontWeight: 600 }}>{item.recipe.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="tag tag-orange">{changedCount} changed</span>
                  <span className="tag tag-green">{approvedCount} approved</span>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }}
                    onClick={() => setReviewItems(items => items.map((r, ri) => ri !== rIdx ? r : {
                      ...r, items: r.items.map(i => ({ ...i, approved: i.changed }))
                    }))}>Approve all</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }}
                    onClick={() => setReviewItems(items => items.map((r, ri) => ri !== rIdx ? r : {
                      ...r, items: r.items.map(i => ({ ...i, approved: false }))
                    }))}>Reject all</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>✓</th>
                    <th>Original Text</th>
                    <th>Was</th>
                    <th>Now Detected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {item.items.map((ing, iIdx) => {
                    if (!ing.changed && !ing.parsed) return null;
                    return (
                      <tr key={iIdx} style={{ background: ing.approved ? `${C.green}08` : undefined }}>
                        <td>
                          <input type="checkbox" checked={!!ing.approved}
                            onChange={e => setReviewItems(items => items.map((r, ri) => ri !== rIdx ? r : {
                              ...r, items: r.items.map((x, xi) => xi !== iIdx ? x : { ...x, approved: e.target.checked })
                            }))} />
                        </td>
                        <td style={{ fontSize: 12 }}>{ing.original.display || "—"}</td>
                        <td style={{ fontSize: 11, color: C.muted }}>
                          {[ing.original.qty, ing.original.unit, ing.original.food].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {ing.parsed ? (
                            <span style={{ color: C.green }}>
                              {[ing.parsed.qty, ing.parsed.unit, ing.parsed.food].filter(Boolean).join(" ") || "—"}
                            </span>
                          ) : <span style={{ color: C.muted }}>no change</span>}
                        </td>
                        <td>
                          {!ing.changed
                            ? <span className="tag tag-muted">unchanged</span>
                            : ing.approved
                              ? <span className="tag tag-green">✓ approved</span>
                              : <span className="tag tag-red">✗ rejected</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Main Parser UI ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Parser Configuration</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Mode</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "unparsed", label: "Unparsed Only", icon: "⚡", sub: "Skip already-parsed" },
                { id: "all", label: "All Recipes", icon: "🔄", sub: "Force re-parse everything" },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: `2px solid`,
                  borderColor: mode === m.id ? C.accent : C.border,
                  background: mode === m.id ? `${C.accent}15` : C.surfaceAlt,
                  color: mode === m.id ? C.accent : C.muted,
                  textAlign: "left", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                  <div style={{ fontSize: 11, opacity: .7 }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Parser Engine</label>
            <select value={parser} onChange={e => setParser(e.target.value)}>
              <option value="nlp">NLP (default)</option>
              <option value="brute">Brute Force</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Batch Size</label>
            <input type="number" min={1} max={50} value={batchSize} onChange={e => setBatchSize(+e.target.value)} />
          </div>
        </div>

        {/* Review mode toggle */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{
              width: 40, height: 22, borderRadius: 11, transition: "background .2s",
              background: reviewMode ? C.accent : C.border, position: "relative",
              cursor: "pointer",
            }} onClick={() => setReviewMode(r => !r)}>
              <div style={{
                position: "absolute", top: 3, left: reviewMode ? 20 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left .2s",
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Review before saving</div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {reviewMode
                  ? "Parser results shown for approval — nothing saved until you confirm"
                  : "Auto-save mode — results saved immediately without review"}
              </div>
            </div>
          </label>
        </div>
      </div>

      {running && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>
              {reviewMode ? "Parsing for review" : "Parsing & saving"}… {progress.done}/{progress.total}
            </span>
            <span className="mono" style={{ color: C.accent, fontSize: 18, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-primary" style={{ flex: 1, padding: 14, fontSize: 15 }}
          onClick={run} disabled={running}>
          {running
            ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Spinner size={16} /> Parsing…</span>
            : `▶ ${reviewMode ? "Parse & Review" : "Parse & Save"} — ${mode === "all" ? "All Recipes" : "Unparsed Only"}`}
        </button>
        {running && (
          <button className="btn-danger" style={{ padding: "14px 20px" }}
            onClick={() => { abortRef.current = true; }}>■ Stop</button>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Activity Log</span>
          {logs.length > 0 && <button className="btn-ghost" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setLogs([])}>Clear</button>}
        </div>
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

// ─── SECTION: Households ──────────────────────────────────────────────────────
function HouseholdsSection({ api, addLog }) {
  const [groups, setGroups] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", fullName: "", admin: false });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, h, u] = await Promise.all([
        api.get("/admin/groups?perPage=100").catch(() => ({ items: [] })),
        api.get("/admin/households?perPage=100").catch(() => ({ items: [] })),
        api.get("/admin/users?perPage=100").catch(() => ({ items: [] })),
      ]);
      setGroups(g.items || []);
      setHouseholds(h.items || []);
      setUsers(u.items || []);
      if ((h.items || []).length > 0 && !selectedHousehold)
        setSelectedHousehold(h.items[0]);
      addLog("ok", `Loaded ${(h.items||[]).length} households, ${(u.items||[]).length} users`);
    } catch (e) { addLog("error", e.message); }
    setLoading(false);
  }, [api]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleAdmin = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { ...user, admin: !user.admin });
      setUsers(u => u.map(x => x.id === user.id ? { ...x, admin: !x.admin } : x));
      addLog("ok", `${user.username} admin: ${!user.admin}`);
    } catch (e) { addLog("error", e.message); }
  };

  const toggleEnabled = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { ...user, enabled: !(user.enabled !== false) });
      setUsers(u => u.map(x => x.id === user.id ? { ...x, enabled: !(x.enabled !== false) } : x));
      addLog("ok", `${user.username} ${!(user.enabled !== false) ? "enabled" : "disabled"}`);
    } catch (e) { addLog("error", e.message); }
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(u => u.filter(x => x.id !== user.id));
      addLog("ok", `Deleted: ${user.username}`);
    } catch (e) { addLog("error", e.message); }
  };

  const createUser = async () => {
    setSaving(true);
    try {
      await api.post("/admin/users", { ...newUser,
        householdId: selectedHousehold?.id,
        group: groups.find(g => g.id === selectedHousehold?.groupId)?.name,
      });
      addLog("ok", `Created user: ${newUser.username}`);
      setCreating(false);
      setNewUser({ username: "", email: "", password: "", fullName: "", admin: false });
      loadAll();
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  const saveEditUser = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, editUser);
      setUsers(u => u.map(x => x.id === editUser.id ? editUser : x));
      addLog("ok", `Updated: ${editUser.username}`);
      setEditUser(null);
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><Spinner size={32} /></div>;

  const householdUsers = selectedHousehold
    ? users.filter(u => u.householdId === selectedHousehold.id)
    : users;

  const hColors = [C.accent, C.blue, C.green, "#a855f7", C.yellow];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="Groups" value={groups.length} accent={C.accent} sub="Top-level groups" />
        <StatCard label="Households" value={households.length} accent={C.blue} sub="Across all groups" />
        <StatCard label="Total Users" value={users.length} accent={C.green} sub="Server-wide" />
      </div>

      {households.length > 0 && (
        <div style={{ display: "flex", gap: 20 }}>
          {/* Household list */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Households</div>
            {households.map((h, i) => {
              const color = hColors[i % hColors.length];
              const isSelected = selectedHousehold?.id === h.id;
              const memberCount = users.filter(u => u.householdId === h.id).length;
              return (
                <div key={h.id} onClick={() => setSelectedHousehold(h)} style={{
                  background: isSelected ? `${color}18` : C.card,
                  border: `1px solid ${isSelected ? color : C.border}`,
                  borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all .2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4, paddingLeft: 16 }}>
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedHousehold && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              {/* Household details */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="household" size={16} color={C.accent} />
                  {selectedHousehold.name} — Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["ID", selectedHousehold.id],
                    ["Slug", selectedHousehold.slug],
                    ["Group", groups.find(g => g.id === selectedHousehold.groupId)?.name || selectedHousehold.groupId],
                    ["Private", selectedHousehold.preferences?.privateHousehold ? "Yes" : "No"],
                    ["Recipes Public", selectedHousehold.preferences?.recipePublic ? "Yes" : "No"],
                    ["Show Nutrition", selectedHousehold.preferences?.recipeShowNutrition ? "Yes" : "No"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{k}</div>
                      <div className="mono" style={{ fontSize: 12, color: C.text }}>{v ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members with management */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="household" size={15} color={C.blue} />
                    Members ({householdUsers.length})
                  </div>
                  <button className="btn-primary" style={{ padding: "5px 14px", fontSize: 12 }}
                    onClick={() => setCreating(true)}>+ Add User</button>
                </div>
                <table>
                  <thead>
                    <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {householdUsers.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${C.accent}44, ${C.blue}44)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: C.accent,
                            }}>{(m.fullName || m.username || "?")[0].toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{m.fullName || m.username}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{m.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: C.muted, fontSize: 12 }}>{m.email}</td>
                        <td>
                          <button onClick={() => toggleAdmin(m)}
                            className={`tag ${m.admin ? "tag-orange" : "tag-muted"}`}
                            style={{ cursor: "pointer", border: "none" }}>
                            {m.admin ? "admin" : "user"}
                          </button>
                        </td>
                        <td>
                          <button onClick={() => toggleEnabled(m)}
                            className={`tag ${m.enabled !== false ? "tag-green" : "tag-red"}`}
                            style={{ cursor: "pointer", border: "none" }}>
                            {m.enabled !== false ? "active" : "disabled"}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn-ghost" style={{ padding: "4px 10px" }}
                              onClick={() => setEditUser({ ...m })}>
                              <Icon name="edit" size={13} />
                            </button>
                            <button className="btn-danger" style={{ padding: "4px 10px" }}
                              onClick={() => deleteUser(m)}>
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {householdUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: C.muted, padding: 24 }}>No members</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create user modal */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card fade-up" style={{ width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>Add User to {selectedHousehold?.name}</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setCreating(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Full Name", key: "fullName", placeholder: "Jane Smith" },
                { label: "Username", key: "username", placeholder: "janesmith" },
                { label: "Email", key: "email", placeholder: "jane@example.com", type: "email" },
                { label: "Password", key: "password", placeholder: "••••••••", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newUser[f.key]} onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={newUser.admin}
                  onChange={e => setNewUser(u => ({ ...u, admin: e.target.checked }))} />
                Make admin
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button className="btn-primary" onClick={createUser}
                  disabled={saving || !newUser.username || !newUser.email || !newUser.password}>
                  {saving ? <Spinner size={13} /> : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card fade-up" style={{ width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>Edit User — {editUser.username}</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setEditUser(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Full Name", key: "fullName" },
                { label: "Username", key: "username" },
                { label: "Email", key: "email", type: "email" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type || "text"} value={editUser[f.key] || ""}
                    onChange={e => setEditUser(u => ({ ...u, [f.key]: e.target.value }))} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={!!editUser.admin}
                  onChange={e => setEditUser(u => ({ ...u, admin: e.target.checked }))} />
                Admin
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
                <button className="btn-primary" onClick={saveEditUser} disabled={saving}>
                  {saving ? <Spinner size={13} /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── SECTION: Cookbooks ───────────────────────────────────────────────────────
function CookbooksSection({ api, addLog }) {
  const [cookbooks, setCookbooks] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cbRecipes, setCbRecipes] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cb = await api.get("/households/cookbooks?perPage=100");
      setCookbooks(cb.items || []);
      const r = await api.get("/recipes?page=1&perPage=100");
      setAllRecipes(r.items || []);
    } catch (e) { addLog("error", e.message); }
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const selectCookbook = async (cb) => {
    setSelected(cb);
    try {
      const params = new URLSearchParams({ cookBooks: cb.id, perPage: 100 });
      const r = await api.get(`/recipes?${params}`);
      setCbRecipes(r.items || []);
    } catch { setCbRecipes([]); }
  };

  const deleteCookbook = async (id, name) => {
    if (!confirm(`Delete cookbook "${name}"?`)) return;
    try {
      await api.delete(`/households/cookbooks/${id}`);
      addLog("ok", `Deleted cookbook: ${name}`);
      if (selected?.id === id) setSelected(null);
      load();
    } catch (e) { addLog("error", e.message); }
  };

  const createCookbook = async () => {
    setSaving(true);
    try {
      await api.post("/households/cookbooks", { name: newName, description: newDesc, public: false });
      addLog("ok", `Created cookbook: ${newName}`);
      setNewName(""); setNewDesc(""); setCreating(false);
      load();
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><Spinner size={32} /></div>;

  // Colors for cookbook cards
  const cbColors = [C.accent, C.blue, C.green, C.yellow, "#a855f7", "#ec4899"];

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* Left: cookbook list */}
      <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>Cookbooks ({cookbooks?.length ?? 0})</div>
          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setCreating(true)}>
            + New
          </button>
        </div>

        {cookbooks?.map((cb, i) => {
          const color = cbColors[i % cbColors.length];
          const isSelected = selected?.id === cb.id;
          return (
            <div key={cb.id} onClick={() => selectCookbook(cb)} style={{
              background: isSelected ? `${color}18` : C.card,
              border: `1px solid ${isSelected ? color : C.border}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer",
              transition: "all .2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: color, marginBottom: 8,
                  }} />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cb.name}</div>
                  {cb.description && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                      {cb.description.slice(0, 60)}{cb.description.length > 60 ? "…" : ""}
                    </div>
                  )}
                </div>
                <button className="btn-danger" style={{ padding: "4px 8px", marginLeft: 8 }}
                  onClick={e => { e.stopPropagation(); deleteCookbook(cb.id, cb.name); }}>
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {cookbooks?.length === 0 && (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            No cookbooks yet.<br />Create one to get started.
          </div>
        )}
      </div>

      {/* Right: detail */}
      <div style={{ flex: 1 }}>
        {selected ? (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{selected.name}</div>
              {selected.description && (
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>{selected.description}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <span className="tag tag-muted">ID: {selected.id.slice(0, 8)}…</span>
                <span className={`tag ${selected.public ? "tag-green" : "tag-muted"}`}>
                  {selected.public ? "Public" : "Private"}
                </span>
              </div>
            </div>

            <div style={{ fontWeight: 600, marginTop: 4 }}>Recipes in this Cookbook ({cbRecipes.length})</div>
            {cbRecipes.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: C.muted, padding: 40 }}>
                No recipes matched this cookbook's filters.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {cbRecipes.map(r => (
                  <div key={r.id} className="card" style={{ padding: 14 }}>
                    {r.image && (
                      <img src={`${api._base}/media/recipes/${r.id}/images/min-original.webp`}
                        style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
                        onError={e => e.target.style.display = "none"} />
                    )}
                    <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.3 }}>{r.name}</div>
                    {(r.recipeCategory || []).slice(0, 2).map(c => (
                      <span key={c.id} className="tag tag-orange" style={{ marginRight: 4, marginTop: 6, display: "inline-block" }}>{c.name}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            height: 300, display: "flex", alignItems: "center", justifyContent: "center",
            color: C.muted, fontSize: 14, flexDirection: "column", gap: 12,
          }}>
            <Icon name="cookbook" size={48} color={C.border} />
            Select a cookbook to view its recipes
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div style={{
          position: "fixed", inset: 0, background: "#000b",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div className="card fade-up" style={{ width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>New Cookbook</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setCreating(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Weeknight Dinners" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Optional description…" />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button className="btn-primary" onClick={createCookbook} disabled={saving || !newName}>
                  {saving ? <Spinner size={13} /> : "Create Cookbook"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Dashboard ───────────────────────────────────────────────────────
function DashboardSection({ api, user, addLog, onNavigate }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [r, cb, u] = await Promise.all([
          api.get("/recipes?perPage=1"),
          api.get("/households/cookbooks?perPage=100"),
          api.get("/admin/users?perPage=100").catch(() => ({ items: [] })),
        ]);
        setStats({
          recipes: r.total,
          cookbooks: (cb.items || []).length,
          users: (u.items || []).length,
        });
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome */}
      <div style={{
        borderRadius: 16, padding: "24px 28px",
        background: `linear-gradient(135deg, ${C.accent}22, ${C.blue}11)`,
        border: `1px solid ${C.accent}33`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".1em" }}>
            Connected
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            Welcome back, {user?.fullName || user?.username || "Admin"}
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Mealie PowerTools — full server control
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${C.accent}22`, border: `1px solid ${C.accent}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="bolt" size={28} color={C.accent} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 100 }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <StatCard label="Total Recipes" value={stats.recipes} accent={C.accent} sub="In your Mealie" />
          <StatCard label="Cookbooks" value={stats.cookbooks} accent={C.blue} sub="Active cookbooks" />
          <StatCard label="Users" value={stats.users} accent={C.green} sub="Registered accounts" />
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { icon: "parse",     label: "Ingredient Parser", sub: "Run on unparsed recipes",   color: C.accent,   tab: "parser" },
            { icon: "recipe",    label: "Recipes",           sub: "Browse, edit & manage",      color: C.blue,     tab: "recipes" },
            { icon: "edit",      label: "Bulk Operations",   sub: "Tag, categorize, delete",    color: C.yellow,   tab: "bulk" },
            { icon: "cookbook",  label: "Tags & Categories", sub: "Manage taxonomy",            color: C.green,    tab: "taxonomy" },
            { icon: "search",    label: "Data Quality",      sub: "Audit your recipe library",  color: "#a855f7",  tab: "quality" },
            { icon: "recipe",    label: "Image Manager",     sub: "Fix missing images",         color: "#ec4899",  tab: "images" },
            { icon: "stats",     label: "Activity",          sub: "Recently added & cooked",    color: C.blue,     tab: "activity" },
            { icon: "settings",  label: "Admin",             sub: "Users & backups",             color: C.red,      tab: "admin" },
          ].map(a => (
            <div key={a.tab} className="card" style={{
              cursor: "pointer", padding: 16,
              background: `${a.color}0d`, border: `1px solid ${a.color}33`,
              transition: "all .2s",
            }}
              onClick={() => onNavigate(a.tab)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              <Icon name={a.icon} size={22} color={a.color} />
              <div style={{ fontWeight: 600, marginTop: 10, fontSize: 14 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [conn, setConn] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [globalLogs, setGlobalLogs] = useState([]);
  const [qualityResults, setQualityResults] = useState(null);
  const [recipeCache, setRecipeCache] = useState(null);

  const addLog = useCallback((type, msg) => {
    const ts = new Date().toLocaleTimeString();
    setGlobalLogs(l => [...l.slice(-500), { type, msg, ts }]);
  }, []);

  const handleConnect = ({ url, token, user, api }) => {
    api._base = url;
    api._token = token;
    setConn({ url, token, user, api });
    addLog("ok", `Connected to ${url} as ${user?.username}`);
  };

  if (!conn) return <ConnectPanel onConnect={handleConnect} />;

  const tabs = [
    { id: "dashboard",   label: "Dashboard",    icon: "stats" },
    { id: "recipes",     label: "Recipes",      icon: "recipe" },
    { id: "parser",      label: "Ing. Parser",  icon: "parse" },
    { id: "bulk",        label: "Bulk Ops",     icon: "edit" },
    { id: "taxonomy",    label: "Tags & Cats",  icon: "cookbook" },
    { id: "cookbooks",   label: "Cookbooks",    icon: "cookbook" },
    { id: "quality",     label: "Data Quality", icon: "search" },
    { id: "images",      label: "Images",       icon: "recipe" },
    { id: "activity",    label: "Activity",     icon: "stats" },
    { id: "households",  label: "Households",   icon: "household" },
    { id: "admin",       label: "Admin",        icon: "settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{css}</style>

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${C.accent}22`, border: `1px solid ${C.accent}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="bolt" size={20} color={C.accent} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: C.accent }}>Power</span>Tools
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>Mealie Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {[
            { group: "Overview" },
            { id: "dashboard",  label: "Dashboard",    icon: "stats" },
            { group: "Recipes" },
            { id: "recipes",    label: "Recipes",      icon: "recipe" },
            { id: "parser",     label: "Ing. Parser",  icon: "parse" },
            { id: "bulk",       label: "Bulk Ops",     icon: "edit" },
            { id: "cookbooks",  label: "Cookbooks",    icon: "cookbook" },
            { group: "Library" },
            { id: "taxonomy",   label: "Tags & Cats",  icon: "cookbook" },
            { id: "quality",    label: "Data Quality", icon: "search" },
            { id: "images",     label: "Images",       icon: "recipe" },
            { id: "activity",   label: "Activity",     icon: "stats" },
            { group: "Admin" },
            { id: "households", label: "Households",   icon: "household" },
            { id: "admin",      label: "Admin",        icon: "settings" },
          ].map((t, i) => t.group ? (
            <div key={i} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: ".12em",
              color: C.muted, textTransform: "uppercase",
              padding: "10px 12px 4px", opacity: .6,
            }}>{t.group}</div>
          ) : (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, border: "none",
              background: tab === t.id ? `${C.accent}18` : "transparent",
              color: tab === t.id ? C.accent : C.muted,
              fontWeight: tab === t.id ? 600 : 400, fontSize: 12,
              textAlign: "left", width: "100%", cursor: "pointer",
              transition: "all .2s",
            }}>
              <Icon name={t.icon} size={15} color={tab === t.id ? C.accent : C.muted} />
              {t.label}
              {tab === t.id && (
                <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: C.accent }} />
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.accent}44, ${C.blue}44)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: C.accent,
            }}>
              {(conn.user?.fullName || conn.user?.username || "?")[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {conn.user?.fullName || conn.user?.username}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{conn.user?.admin ? "admin" : "user"}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ width: "100%", marginTop: 10, fontSize: 11, padding: "6px" }}
            onClick={() => setConn(null)}>
            Disconnect
          </button>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: C.muted, opacity: .5 }}>
            v{VERSION}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, padding: "28px 32px", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {tabs.find(t => t.id === tab)?.label}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {conn.url} · PowerTools on port 3000
            </div>
          </div>

          {/* Content */}
          <div className="fade-up">
            {tab === "dashboard"  && <DashboardSection  api={conn.api} user={conn.user} addLog={addLog} onNavigate={setTab} />}
            {tab === "recipes"    && <RecipesSection    api={conn.api} addLog={addLog} cache={recipeCache} onCache={setRecipeCache} />}
            {tab === "parser"     && <ParserSection     api={conn.api} addLog={addLog} />}
            {tab === "bulk"       && <BulkSection       api={conn.api} addLog={addLog} />}
            {tab === "taxonomy"   && <TaxonomySection   api={conn.api} addLog={addLog} />}
            {tab === "cookbooks"  && <CookbooksSection  api={conn.api} addLog={addLog} />}
            {tab === "quality"    && <DataQualitySection api={conn.api} addLog={addLog} savedResults={qualityResults} onSaveResults={setQualityResults} />}
            {tab === "images"     && <ImageSection      api={conn.api} addLog={addLog} />}
            {tab === "activity"   && <ActivitySection   api={conn.api} addLog={addLog} />}
            {tab === "households" && <HouseholdsSection api={conn.api} addLog={addLog} />}
            {tab === "admin"      && <AdminSection      api={conn.api} addLog={addLog} />}
          </div>

          {/* Global log footer */}
          {globalLogs.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Activity Log</div>
              <LogPanel logs={globalLogs.slice(-30)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: Bulk Operations ─────────────────────────────────────────────────
function BulkSection({ api, addLog }) {
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cookbooks, setCookbooks] = useState([]);
  const [assignTag, setAssignTag] = useState("");
  const [assignCat, setAssignCat] = useState("");
  const [assignCb, setAssignCb] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let all = [], page = 1;
        while (true) {
          const d = await api.get(`/recipes?page=${page}&perPage=100`);
          all = [...all, ...(d.items || [])];
          if (all.length >= d.total) break;
          page++;
        }
        setRecipes(all);
        const [t, c, cb] = await Promise.all([
          api.get("/organizers/tags?perPage=500"),
          api.get("/organizers/categories?perPage=500"),
          api.get("/households/cookbooks?perPage=100"),
        ]);
        setTags(t.items || []);
        setCategories(c.items || []);
        setCookbooks(cb.items || []);
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api]);

  const filtered = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); filtered.forEach(r => n.delete(r.id)); return n; });
    else setSelected(s => { const n = new Set(s); filtered.forEach(r => n.add(r.id)); return n; });
  };

  const run = async (action) => {
    if (selected.size === 0) return;
    setRunning(true);
    const slugs = recipes.filter(r => selected.has(r.id)).map(r => r.slug);
    try {
      if (action === "tag" && assignTag) {
        const tag = tags.find(t => t.id === assignTag);
        for (const slug of slugs) {
          const full = await api.get(`/recipes/${slug}`);
          const existing = full.tags || [];
          if (!existing.find(t => t.id === assignTag)) {
            await api.patch(`/recipes/${slug}`, { tags: [...existing, { id: tag.id, name: tag.name }] });
          }
        }
        addLog("ok", `Tag "${tag?.name}" assigned to ${slugs.length} recipes`);
      } else if (action === "cat" && assignCat) {
        const cat = categories.find(c => c.id === assignCat);
        for (const slug of slugs) {
          const full = await api.get(`/recipes/${slug}`);
          const existing = full.recipeCategory || [];
          if (!existing.find(c => c.id === assignCat)) {
            await api.patch(`/recipes/${slug}`, { recipeCategory: [...existing, { id: cat.id, name: cat.name }] });
          }
        }
        addLog("ok", `Category "${cat?.name}" assigned to ${slugs.length} recipes`);
      } else if (action === "delete") {
        if (!confirm(`Permanently delete ${selected.size} recipes?`)) { setRunning(false); return; }
        for (const slug of slugs) { await api.delete(`/recipes/${slug}`); }
        setSelected(new Set());
        addLog("ok", `Deleted ${slugs.length} recipes`);
        const d = await api.get("/recipes?page=1&perPage=100");
        setRecipes(d.items || []);
      }
    } catch (e) { addLog("error", e.message); }
    setRunning(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Total Recipes" value={recipes.length} accent={C.accent} />
        <StatCard label="Selected" value={selected.size} accent={selected.size > 0 ? C.blue : C.muted} sub="Click rows to select" />
      </div>

      {/* Actions toolbar */}
      <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Assign Tag</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={assignTag} onChange={e => setAssignTag(e.target.value)} style={{ flex: 1 }}>
              <option value="">Select tag…</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button className="btn-success" onClick={() => run("tag")} disabled={running || !assignTag || selected.size === 0}>
              Apply to {selected.size}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Assign Category</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={assignCat} onChange={e => setAssignCat(e.target.value)} style={{ flex: 1 }}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-success" onClick={() => run("cat")} disabled={running || !assignCat || selected.size === 0}>
              Apply to {selected.size}
            </button>
          </div>
        </div>
        <button className="btn-danger" onClick={() => run("delete")} disabled={running || selected.size === 0}
          style={{ alignSelf: "flex-end" }}>
          🗑 Delete {selected.size > 0 ? selected.size : ""} Selected
        </button>
      </div>

      {/* Search + table */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
          <Icon name="search" size={14} color={C.muted} />
        </div>
        <input style={{ paddingLeft: 32 }} placeholder="Filter recipes…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div> : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th>Name</th>
                <th>Tags</th>
                <th>Categories</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                  style={{ cursor: "pointer", background: selected.has(r.id) ? `${C.blue}12` : undefined }}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={() => setSelected(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td>{(r.tags || []).map(t => <span key={t.id} className="tag tag-blue" style={{ marginRight: 3 }}>{t.name}</span>)}</td>
                  <td>{(r.recipeCategory || []).map(c => <span key={c.id} className="tag tag-orange" style={{ marginRight: 3 }}>{c.name}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── SECTION: Tags & Categories ───────────────────────────────────────────────
function TaxonomySection({ api, addLog }) {
  const [activeType, setActiveType] = useState("tags");
  const [items, setItems] = useState([]);
  const [recipeCounts, setRecipeCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const endpoint = activeType === "tags" ? "/organizers/tags" : "/organizers/categories";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(`${endpoint}?perPage=500`);
      const list = d.items || [];
      setItems(list);
      // Count recipes per item
      const counts = {};
      await Promise.all(list.map(async item => {
        try {
          const param = activeType === "tags" ? "tags" : "categories";
          const r = await api.get(`/recipes?${param}=${item.id}&perPage=1`);
          counts[item.id] = r.total || 0;
        } catch { counts[item.id] = 0; }
      }));
      setRecipeCounts(counts);
    } catch (e) { addLog("error", e.message); }
    setLoading(false);
  }, [api, activeType]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.post(endpoint, { name: newName.trim() });
      addLog("ok", `Created ${activeType.slice(0, -1)}: ${newName}`);
      setNewName("");
      load();
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  const update = async () => {
    setSaving(true);
    try {
      await api.put(`${endpoint}/${editItem.id}`, { name: editName });
      addLog("ok", `Renamed to: ${editName}`);
      setEditItem(null);
      load();
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  const del = async (item) => {
    if (!confirm(`Delete "${item.name}"? It will be removed from all recipes.`)) return;
    try {
      await api.delete(`${endpoint}/${item.id}`);
      addLog("ok", `Deleted: ${item.name}`);
      load();
    } catch (e) { addLog("error", e.message); }
  };

  const unused = items.filter(i => !recipeCounts[i.id]);

  const deleteAllUnused = async () => {
    if (!confirm(`Delete ${unused.length} unused ${activeType}?`)) return;
    for (const item of unused) {
      try { await api.delete(`${endpoint}/${item.id}`); } catch {}
    }
    addLog("ok", `Deleted ${unused.length} unused ${activeType}`);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Type switcher */}
      <div style={{ display: "flex", gap: 8 }}>
        {["tags", "categories"].map(type => (
          <button key={type} onClick={() => setActiveType(type)} style={{
            padding: "8px 20px", borderRadius: 8, border: `2px solid`,
            borderColor: activeType === type ? C.accent : C.border,
            background: activeType === type ? `${C.accent}18` : C.surfaceAlt,
            color: activeType === type ? C.accent : C.muted,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label={`Total ${activeType}`} value={items.length} accent={C.accent} />
        <StatCard label="Unused" value={unused.length} accent={unused.length > 0 ? C.red : C.green}
          sub="Not on any recipe" />
      </div>

      {/* Create new */}
      <div className="card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder={`New ${activeType.slice(0, -1)} name…`}
          onKeyDown={e => e.key === "Enter" && create()}
          style={{ flex: 1 }} />
        <button className="btn-primary" onClick={create} disabled={saving || !newName.trim()}>
          {saving ? <Spinner size={13} /> : `+ Create`}
        </button>
        {unused.length > 0 && (
          <button className="btn-danger" onClick={deleteAllUnused}>
            🗑 Delete {unused.length} Unused
          </button>
        )}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div> : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Recipes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.sort((a, b) => (recipeCounts[b.id] || 0) - (recipeCounts[a.id] || 0)).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>
                    <span className="mono" style={{ color: C.muted, fontSize: 12 }}>
                      {recipeCounts[item.id] ?? "…"}
                    </span>
                  </td>
                  <td>
                    <span className={`tag ${recipeCounts[item.id] ? "tag-green" : "tag-red"}`}>
                      {recipeCounts[item.id] ? "in use" : "unused"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ padding: "4px 10px" }}
                        onClick={() => { setEditItem(item); setEditName(item.name); }}>
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="btn-danger" style={{ padding: "4px 10px" }} onClick={() => del(item)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editItem && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card fade-up" style={{ width: 400 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Rename {activeType.slice(0, -1)}</div>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && update()} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn-primary" onClick={update} disabled={saving}>
                {saving ? <Spinner size={13} /> : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Data Quality ─────────────────────────────────────────────────────
function DataQualitySection({ api, addLog, savedResults, onSaveResults }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(savedResults || null);
  const [checking, setChecking] = useState("");
  const [expanded, setExpanded] = useState({});
  const sectionRefs = useRef({});

  const runAudit = async () => {
    setLoading(true);
    setResults(null);
    setExpanded({});
    addLog("info", "Starting data quality audit…");
    try {
      let all = [], page = 1;
      while (true) {
        setChecking(`Loading recipes (page ${page})…`);
        const d = await api.get(`/recipes?page=${page}&perPage=100`);
        all = [...all, ...(d.items || [])];
        if (all.length >= d.total) break;
        page++;
      }
      setChecking("Fetching full recipe details…");
      const full = await Promise.all(all.map(r => api.get(`/recipes/${r.slug}`).catch(() => r)));

      setChecking("Analyzing…");
      const nameMap = {};
      full.forEach(r => {
        const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!nameMap[key]) nameMap[key] = [];
        nameMap[key].push(r);
      });
      const duplicates = Object.values(nameMap).filter(g => g.length > 1);
      const noImage = full.filter(r => !r.image);
      const noDesc = full.filter(r => !r.description || r.description.trim() === "");
      const noIngredients = full.filter(r => !r.recipeIngredient || r.recipeIngredient.length === 0);
      const noInstructions = full.filter(r => !r.recipeInstructions || r.recipeInstructions.length === 0);
      const noTime = full.filter(r => !r.prepTime && !r.cookTime && !r.totalTime);
      const noTags = full.filter(r => (!r.tags || r.tags.length === 0) && (!r.recipeCategory || r.recipeCategory.length === 0));
      const unparsed = full.filter(r =>
        (r.recipeIngredient || []).length > 0 &&
        (r.recipeIngredient || []).every(i => !i.food && !i.unit)
      );
      const noSource = full.filter(r => !r.orgURL || r.orgURL.trim() === "");
      const noRating = full.filter(r => !r.rating || r.rating === 0);

      const auditResults = { total: full.length, duplicates, noImage, noDesc, noIngredients, noInstructions, noTime, noTags, unparsed, noSource, noRating, recipes: full };
      setResults(auditResults);
      onSaveResults(auditResults);
      addLog("ok", `Audit complete — ${full.length} recipes checked`);
    } catch (e) { addLog("error", e.message); }
    setLoading(false);
    setChecking("");
  };

  const scoreColor = (pct) => pct >= 80 ? C.green : pct >= 50 ? C.yellow : C.red;

  const scrollTo = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Recipe Data Quality Audit</div>
          <div style={{ fontSize: 13, color: C.muted }}>Scans all recipes for missing fields, duplicates, unparsed ingredients, and more.</div>
        </div>
        <button className="btn-primary" style={{ padding: "12px 24px", fontSize: 14 }} onClick={runAudit} disabled={loading}>
          {loading
            ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={14} /> {checking}</span>
            : results ? "↻ Re-run Audit" : "▶ Run Audit"}
        </button>
      </div>

      {results && (() => {
        const checks = [
          { key: "noImage",        label: "Image",            bad: results.noImage,        icon: "🖼️",  repair: null },
          { key: "noDesc",         label: "Description",      bad: results.noDesc,         icon: "📝",  repair: null },
          { key: "noIngredients",  label: "Ingredients",      bad: results.noIngredients,  icon: "🥕",  repair: null },
          { key: "noInstructions", label: "Instructions",     bad: results.noInstructions, icon: "📋",  repair: null },
          { key: "noTime",         label: "Time Info",        bad: results.noTime,         icon: "⏱️",  repair: null },
          { key: "noTags",         label: "Tags / Categories", bad: results.noTags,        icon: "🏷️",  repair: null },
          { key: "unparsed",       label: "Parsed Ingredients", bad: results.unparsed,     icon: "⚡",
            repair: async (r) => {
              const ings = (r.recipeIngredient || []).map(i => i.display || i.note || "");
              if (!ings.length) return;
              const parsed = await api.post("/parser/ingredients", {
                ingredients: ings.map(i => ({ ingredient: i })), parser: "nlp"
              });
              const updated = r.recipeIngredient.map((ing, idx) => ({
                ...ing, ...(parsed[idx] ? {
                  food: parsed[idx].ingredient?.food,
                  unit: parsed[idx].ingredient?.unit,
                  quantity: parsed[idx].ingredient?.quantity,
                } : {})
              }));
              await api.patch(`/recipes/${r.slug}`, {
                recipeIngredient: updated.map(ing => ({
                  ...ing,
                  food: ing.food ? { id: ing.food.id, name: ing.food.name } : null,
                  unit: ing.unit ? { id: ing.unit.id, name: ing.unit.name } : null,
                }))
              });
              addLog("ok", `Parsed: ${r.name}`);
            }
          },
          { key: "noSource",       label: "Source URL",       bad: results.noSource,       icon: "🔗",  repair: null },
          { key: "noRating",       label: "Rating",           bad: results.noRating,       icon: "⭐",  repair: null },
        ];

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score overview — clickable to scroll */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
              {checks.map(c => {
                const good = results.total - c.bad.length;
                const pct = results.total ? Math.round((good / results.total) * 100) : 100;
                const hasBad = c.bad.length > 0;
                return (
                  <div key={c.key} className="card" style={{
                    padding: 14, cursor: hasBad ? "pointer" : "default",
                    border: `1px solid ${hasBad ? scoreColor(pct) + "44" : C.border}`,
                    transition: "all .2s",
                  }}
                    onClick={() => hasBad && scrollTo(c.key)}
                    onMouseEnter={e => hasBad && (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => hasBad && (e.currentTarget.style.transform = "none")}
                    title={hasBad ? `Click to jump to ${c.label} issues` : ""}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{c.icon} {c.label}</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: scoreColor(pct) }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: scoreColor(pct) }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                      {hasBad ? `${c.bad.length} need attention ${hasBad ? "↓" : ""}` : "All good ✓"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Duplicates */}
            {results.duplicates.length > 0 && (
              <div className="card" ref={el => sectionRefs.current["duplicates"] = el}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: C.yellow }}>
                  ⚠ Possible Duplicate Recipes ({results.duplicates.length} groups)
                </div>
                {results.duplicates.map((group, i) => (
                  <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                    {group.map(r => (
                      <div key={r.id} style={{ fontSize: 13, padding: "2px 0" }}>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Detail tables */}
            {checks.filter(c => c.bad.length > 0).map(c => {
              const showAll = expanded[c.key];
              const displayed = showAll ? c.bad : c.bad.slice(0, 10);
              return (
                <div key={c.key} className="card" style={{ padding: 0, overflow: "hidden" }}
                  ref={el => sectionRefs.current[c.key] = el}>
                  <div style={{ padding: "12px 16px", fontWeight: 600, borderBottom: `1px solid ${C.border}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{c.icon} Missing {c.label}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {c.repair && (
                        <button className="btn-success" style={{ fontSize: 11, padding: "4px 12px" }}
                          onClick={async () => {
                            addLog("info", `Repairing ${c.bad.length} recipes for: ${c.label}…`);
                            for (const r of c.bad) {
                              try { await c.repair(r); }
                              catch (e) { addLog("error", `${r.name}: ${e.message}`); }
                            }
                            addLog("ok", `Done repairing ${c.label}`);
                            runAudit();
                          }}>
                          ⚡ Auto-Repair All
                        </button>
                      )}
                      <span className="tag tag-red">{c.bad.length} recipes</span>
                    </div>
                  </div>
                  <table>
                    <thead><tr><th>Recipe</th>{c.repair && <th style={{ width: 120 }}>Action</th>}</tr></thead>
                    <tbody>
                      {displayed.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          {c.repair && (
                            <td>
                              <button className="btn-success" style={{ fontSize: 11, padding: "3px 10px" }}
                                onClick={async () => {
                                  try { await c.repair(r); addLog("ok", `Fixed: ${r.name}`); runAudit(); }
                                  catch(e) { addLog("error", `${r.name}: ${e.message}`); }
                                }}>⚡ Fix</button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {c.bad.length > 10 && (
                        <tr>
                          <td colSpan={c.repair ? 2 : 1} style={{ textAlign: "center", padding: 10 }}>
                            <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 16px" }}
                              onClick={() => setExpanded(e => ({ ...e, [c.key]: !e[c.key] }))}>
                              {showAll
                                ? "Show less ↑"
                                : `Show ${c.bad.length - 10} more ↓`}
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })()}

      {!results && !loading && (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          Run the audit to see a full quality report for all your recipes.
        </div>
      )}
    </div>
  );
}


// ─── SECTION: Admin ────────────────────────────────────────────────────────────
function AdminSection({ api, addLog }) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupRunning, setBackupRunning] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", fullName: "", admin: false });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const u = await api.get("/admin/users?perPage=100");
        setUsers(u.items || []);
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api]);

  const toggleAdmin = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { ...user, admin: !user.admin });
      setUsers(u => u.map(x => x.id === user.id ? { ...x, admin: !x.admin } : x));
      addLog("ok", `${user.username} admin: ${!user.admin}`);
    } catch (e) { addLog("error", e.message); }
  };

  const toggleEnabled = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { ...user, enabled: !user.enabled });
      setUsers(u => u.map(x => x.id === user.id ? { ...x, enabled: !x.enabled } : x));
      addLog("ok", `${user.username} ${!user.enabled ? "enabled" : "disabled"}`);
    } catch (e) { addLog("error", e.message); }
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(u => u.filter(x => x.id !== user.id));
      addLog("ok", `Deleted user: ${user.username}`);
    } catch (e) { addLog("error", e.message); }
  };

  const createUser = async () => {
    setSaving(true);
    try {
      await api.post("/admin/users", newUser);
      addLog("ok", `Created user: ${newUser.username}`);
      setCreating(false);
      setNewUser({ username: "", email: "", password: "", fullName: "", admin: false });
      const u = await api.get("/admin/users?perPage=100");
      setUsers(u.items || []);
    } catch (e) { addLog("error", e.message); }
    setSaving(false);
  };

  const runBackup = async () => {
    setBackupRunning(true);
    try {
      addLog("info", "Triggering backup…");
      await api.post("/admin/backups/export/run", {});
      addLog("ok", "Backup created successfully");
    } catch (e) { addLog("error", `Backup failed: ${e.message}`); }
    setBackupRunning(false);
  };

  const adminTabs = ["users", "backups"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {adminTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "8px 20px", borderRadius: 8, border: `2px solid`,
            borderColor: activeTab === t ? C.accent : C.border,
            background: activeTab === t ? `${C.accent}18` : C.surfaceAlt,
            color: activeTab === t ? C.accent : C.muted,
            fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={() => setCreating(true)}>+ New User</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div> : (
              <table>
                <thead>
                  <tr><th>User</th><th>Email</th><th>Household</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${C.accent}44, ${C.blue}44)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, color: C.accent,
                          }}>{(u.fullName || u.username || "?")[0].toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{u.fullName || u.username}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: C.muted }}>{u.email}</td>
                      <td style={{ fontSize: 12 }}>{u.household || "—"}</td>
                      <td>
                        <button onClick={() => toggleAdmin(u)} className={`tag ${u.admin ? "tag-orange" : "tag-muted"}`}
                          style={{ cursor: "pointer", border: "none" }}>
                          {u.admin ? "admin" : "user"}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => toggleEnabled(u)} className={`tag ${u.enabled !== false ? "tag-green" : "tag-red"}`}
                          style={{ cursor: "pointer", border: "none" }}>
                          {u.enabled !== false ? "active" : "disabled"}
                        </button>
                      </td>
                      <td>
                        <button className="btn-danger" style={{ padding: "4px 10px" }} onClick={() => deleteUser(u)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Backups tab */}
      {activeTab === "backups" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Create Backup</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              Triggers a full server backup. The backup file will be saved to Mealie's data directory.
            </div>
            <button className="btn-primary" style={{ padding: "10px 24px" }} onClick={runBackup} disabled={backupRunning}>
              {backupRunning ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={14} /> Running…</span> : "🗄 Create Backup Now"}
            </button>
          </div>
          <div className="card" style={{ background: `${C.yellow}0d`, border: `1px solid ${C.yellow}33` }}>
            <div style={{ fontWeight: 600, color: C.yellow, marginBottom: 6 }}>⚠ Restore</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              To restore from a backup, use the Mealie admin panel directly at your Mealie URL → Admin → Backups.
              Restore requires file access that PowerTools cannot provide securely via the API.
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card fade-up" style={{ width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>Create New User</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setCreating(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Full Name", key: "fullName", placeholder: "Jane Smith" },
                { label: "Username", key: "username", placeholder: "janesmith" },
                { label: "Email", key: "email", placeholder: "jane@example.com", type: "email" },
                { label: "Password", key: "password", placeholder: "••••••••", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newUser[f.key]} onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={newUser.admin}
                  onChange={e => setNewUser(u => ({ ...u, admin: e.target.checked }))} />
                Make admin
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button className="btn-primary" onClick={createUser} disabled={saving || !newUser.username || !newUser.email || !newUser.password}>
                  {saving ? <Spinner size={13} /> : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Image Manager ────────────────────────────────────────────────────
function ImageSection({ api, addLog }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("missing");
  const [fetchUrl, setFetchUrl] = useState({});
  const [fetching, setFetching] = useState({});
  const [uploadMode, setUploadMode] = useState({}); // slug -> "url" | "upload"
  const fileInputRefs = useRef({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let all = [], page = 1;
        while (true) {
          const d = await api.get(`/recipes?page=${page}&perPage=100`);
          all = [...all, ...(d.items || [])];
          if (all.length >= d.total) break;
          page++;
        }
        setRecipes(all);
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api]);

  const getMode = (slug) => uploadMode[slug] || "url";
  const setMode = (slug, mode) => setUploadMode(m => ({ ...m, [slug]: mode }));

  const setByUrl = async (slug) => {
    const url = fetchUrl[slug];
    if (!url) return;
    setFetching(f => ({ ...f, [slug]: true }));
    try {
      await api.post(`/recipes/${slug}/image`, { url, fileName: "original" });
      addLog("ok", `Image set for: ${slug}`);
      setRecipes(r => r.map(x => x.slug === slug ? { ...x, image: url } : x));
      setFetchUrl(f => ({ ...f, [slug]: "" }));
    } catch (e) { addLog("error", `URL image failed for ${slug}: ${e.message}`); }
    setFetching(f => ({ ...f, [slug]: false }));
  };

  const uploadFile = async (slug, file) => {
    if (!file) return;
    setFetching(f => ({ ...f, [slug]: true }));
    try {
      // Read file as base64 data URL then post as multipart
      const formData = new FormData();
      formData.append("image", file);
      formData.append("extension", file.name.split(".").pop());
      // Use fetch directly with FormData (our api helper sets Content-Type: application/json)
      const mealieUrl = document.cookie; // not used — we grab from header
      const r = await fetch(`/api/recipes/${slug}/image`, {
        method: "POST",
        headers: {
          "X-Mealie-Url": api._base,
          "Authorization": `Bearer ${api._token}`,
        },
        body: formData,
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      addLog("ok", `Image uploaded for: ${slug}`);
      setRecipes(rs => rs.map(x => x.slug === slug ? { ...x, image: file.name } : x));
    } catch (e) { addLog("error", `Upload failed for ${slug}: ${e.message}`); }
    setFetching(f => ({ ...f, [slug]: false }));
  };

  const missing = recipes.filter(r => !r.image);
  const hasImage = recipes.filter(r => r.image);
  const displayed = filter === "missing" ? missing : filter === "has" ? hasImage : recipes;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="Total Recipes" value={recipes.length} accent={C.accent} />
        <StatCard label="Missing Image" value={missing.length} accent={missing.length > 0 ? C.red : C.green} />
        <StatCard label="Has Image" value={hasImage.length} accent={C.green} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {[["missing", "Missing Images"], ["has", "Has Images"], ["all", "All Recipes"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "7px 16px", borderRadius: 8, border: `2px solid`,
            borderColor: filter === v ? C.accent : C.border,
            background: filter === v ? `${C.accent}18` : C.surfaceAlt,
            color: filter === v ? C.accent : C.muted,
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 60 }}><Spinner size={32} /></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map(r => (
            <div key={r.id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
              {/* Thumbnail */}
              <div style={{
                width: 64, height: 64, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {r.image
                  ? <img src={`${api._base}/media/recipes/${r.id}/images/min-original.webp`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => e.target.style.display = "none"} />
                  : <span style={{ fontSize: 28 }}>🍽️</span>
                }
              </div>

              {/* Name + input */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>{r.name}</div>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: 0, marginBottom: 8, borderRadius: 7, overflow: "hidden", border: `1px solid ${C.border}`, width: "fit-content" }}>
                  {["url", "upload"].map(m => (
                    <button key={m} onClick={() => setMode(r.slug, m)} style={{
                      padding: "4px 14px", fontSize: 11, fontWeight: 600, border: "none",
                      background: getMode(r.slug) === m ? C.accent : C.surfaceAlt,
                      color: getMode(r.slug) === m ? "#fff" : C.muted,
                      cursor: "pointer", textTransform: "capitalize",
                    }}>{m === "url" ? "🔗 URL" : "📁 Upload"}</button>
                  ))}
                </div>

                {getMode(r.slug) === "url" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="https://example.com/image.jpg"
                      value={fetchUrl[r.slug] || ""}
                      onChange={e => setFetchUrl(f => ({ ...f, [r.slug]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && setByUrl(r.slug)}
                      style={{ flex: 1, fontSize: 12, padding: "5px 10px" }} />
                    <button className="btn-success" style={{ fontSize: 12, padding: "5px 14px", flexShrink: 0 }}
                      onClick={() => setByUrl(r.slug)} disabled={!fetchUrl[r.slug] || fetching[r.slug]}>
                      {fetching[r.slug] ? <Spinner size={12} /> : "Set"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => fileInputRefs.current[r.slug] = el}
                      style={{ display: "none" }}
                      onChange={e => uploadFile(r.slug, e.target.files[0])}
                    />
                    <button className="btn-ghost" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={() => fileInputRefs.current[r.slug]?.click()}
                      disabled={fetching[r.slug]}>
                      {fetching[r.slug] ? <Spinner size={12} /> : "Choose File…"}
                    </button>
                    <span style={{ fontSize: 11, color: C.muted }}>JPG, PNG, WebP</span>
                  </div>
                )}
              </div>

              <span className={`tag ${r.image ? "tag-green" : "tag-red"}`} style={{ flexShrink: 0 }}>
                {r.image ? "✓" : "✗"}
              </span>
            </div>
          ))}
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              {filter === "missing" ? "🎉 All recipes have images!" : "No recipes found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Activity Feed ────────────────────────────────────────────────────
function ActivitySection({ api, addLog }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dateUpdated");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get(`/recipes?page=1&perPage=50&orderBy=${sort}&orderDirection=desc`);
        setRecipes(d.items || []);
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api, sort]);

  const fmt = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const timeAgo = (dt) => {
    if (!dt) return "—";
    const diff = Date.now() - new Date(dt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.muted }}>Sort by:</span>
        {[["dateUpdated", "Last Modified"], ["dateAdded", "Date Added"], ["lastMade", "Last Cooked"]].map(([v, l]) => (
          <button key={v} onClick={() => setSort(v)} style={{
            padding: "6px 14px", borderRadius: 8, border: `2px solid`,
            borderColor: sort === v ? C.accent : C.border,
            background: sort === v ? `${C.accent}18` : C.surfaceAlt,
            color: sort === v ? C.accent : C.muted,
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 60 }}><Spinner size={32} /></div> : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Recipe</th>
                <th>Added</th>
                <th>Last Modified</th>
                <th>Last Cooked</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {(r.recipeCategory || []).slice(0, 2).map(c => (
                        <span key={c.id} className="tag tag-orange" style={{ marginRight: 3 }}>{c.name}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: C.muted }}>{fmt(r.dateAdded)}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{timeAgo(r.dateUpdated)}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{fmt(r.dateUpdated)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: r.lastMade ? C.text : C.muted }}>
                    {r.lastMade ? timeAgo(r.lastMade) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
