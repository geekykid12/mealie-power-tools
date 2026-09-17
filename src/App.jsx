import { useState, useEffect, useCallback, useRef } from "react";

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
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="http://127.0.0.1:9925/api" />
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
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.muted }}>
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
function RecipesSection({ api, addLog }) {
  const [recipes, setRecipes] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [editFull, setEditFull] = useState(null);   // full recipe detail
  const [saving, setSaving] = useState(false);
  const PER = 20;

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, perPage: PER, ...(q ? { search: q } : {}) });
      const data = await api.get(`/recipes?${params}`);
      const items = data.items || [];
      // Fetch full details in parallel (for ingredient parsed status)
      const full = await Promise.all(
        items.map(r => api.get(`/recipes/${r.slug}`).catch(() => r))
      );
      setRecipes(full);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) { addLog("error", `Load recipes: ${e.message}`); }
    setLoading(false);
  }, [api]);

  useEffect(() => { load(1, ""); }, [load]);

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
                <th>Slug</th>
                <th>Categories</th>
                <th>Ingredients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(recipes || []).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td><span className="mono" style={{ fontSize: 11, color: C.muted }}>{r.slug}</span></td>
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
                    <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() =>
                      setField("recipeIngredient", [...(editFull.recipeIngredient || []), { note: "", display: "", quantity: null, unit: null, food: null, title: "", referenceId: crypto.randomUUID() }])
                    }>+ Add</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(editFull.recipeIngredient || []).map((ing, idx) => (
                      <div key={ing.referenceId || idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: (ing.food || ing.unit) ? C.green : C.red,
                        }} />
                        <input style={{ flex: 1 }} value={ing.display || ing.note || ""}
                          onChange={e => {
                            const updated = [...editFull.recipeIngredient];
                            updated[idx] = { ...ing, display: e.target.value, note: e.target.value };
                            setField("recipeIngredient", updated);
                          }} />
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
                      Instructions ({(editFull.recipeInstructions || []).length} steps)
                    </label>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() =>
                      setField("recipeInstructions", [...(editFull.recipeInstructions || []), { text: "", title: "", id: crypto.randomUUID() }])
                    }>+ Add Step</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(editFull.recipeInstructions || []).map((step, idx) => (
                      <div key={step.id || idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          background: C.surfaceAlt, border: `1px solid ${C.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: C.muted, marginTop: 6,
                        }}>{idx + 1}</div>
                        <textarea style={{ flex: 1 }} rows={2} value={step.text || ""}
                          onChange={e => {
                            const updated = [...editFull.recipeInstructions];
                            updated[idx] = { ...step, text: e.target.value };
                            setField("recipeInstructions", updated);
                          }} />
                        <button className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0, marginTop: 4 }}
                          onClick={() => setField("recipeInstructions", editFull.recipeInstructions.filter((_, i) => i !== idx))}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    ))}
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
  const [mode, setMode] = useState("unparsed"); // "unparsed" | "all"
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [batchSize, setBatchSize] = useState(10);
  const [parser, setParser] = useState("nlp");
  const abortRef = useRef(false);

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

  // A recipe needs parsing if ANY ingredient is missing both food AND unit objects
  // (parsed ingredients always have at least one of these populated)
  const needsParsing = (recipe) => {
    const ings = recipe.recipeIngredient || [];
    if (ings.length === 0) return false;
    return ings.some(ing => !ing.food && !ing.unit);
  };

  // Count parsed vs unparsed ingredients in a recipe
  const parsedCount = (recipe) => {
    const ings = recipe.recipeIngredient || [];
    const parsed = ings.filter(ing => ing.food || ing.unit).length;
    return { parsed, total: ings.length };
  };

  const parseRecipe = async (slug) => {
    const recipe = await api.get(`/recipes/${slug}`);
    const ingredients = (recipe.recipeIngredient || []).map(i => i.display || i.note || "");
    if (!ingredients.length) return false;
    const parsed = await api.post("/parser/ingredients", {
      ingredients: ingredients.map(i => ({ ingredient: i })),
      parser,
    });
    const updated = recipe.recipeIngredient.map((ing, idx) => ({
      ...ing, ...(parsed[idx] ? {
        food: parsed[idx].ingredient?.food,
        unit: parsed[idx].ingredient?.unit,
        quantity: parsed[idx].ingredient?.quantity,
      } : {}),
    }));
    await api.patch(`/recipes/${slug}`, { recipeIngredient: updated });
    return true;
  };

  const run = async () => {
    abortRef.current = false;
    setRunning(true); setLogs([]); setProgress({ done: 0, total: 0 });
    addParserLog("info", `Starting ${mode === "all" ? "full" : "unparsed"} ingredient parse with ${parser} parser…`);

    try {
      const allRecipes = await getAllRecipes();
      addParserLog("info", `Found ${allRecipes.length} total recipes`);

      const targets = mode === "all"
        ? allRecipes
        : allRecipes.filter(r => needsParsing(r));

      addParserLog("info", `${targets.length} recipes queued for parsing`);
      setProgress({ done: 0, total: targets.length });

      for (let i = 0; i < targets.length; i += batchSize) {
        if (abortRef.current) { addParserLog("warn", "Aborted by user"); break; }
        const batch = targets.slice(i, i + batchSize);
        await Promise.all(batch.map(async r => {
          try {
            await parseRecipe(r.slug);
            addParserLog("ok", `✓ ${r.name}`);
          } catch (e) {
            addParserLog("error", `✗ ${r.name}: ${e.message}`);
          }
        }));
        setProgress({ done: Math.min(i + batchSize, targets.length), total: targets.length });
      }

      addParserLog("ok", `Parse complete!`);
    } catch (e) {
      addParserLog("error", `Fatal: ${e.message}`);
    }
    setRunning(false);
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

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
      </div>

      {running && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>Running… {progress.done}/{progress.total}</span>
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
          {running ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Spinner size={16} /> Parsing…</span>
            : `▶ Run Parser — ${mode === "all" ? "All Recipes" : "Unparsed Only"}`}
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Use admin endpoints to get everything server-wide
        const [g, h, u] = await Promise.all([
          api.get("/admin/groups?perPage=100").catch(() => ({ items: [] })),
          api.get("/admin/households?perPage=100").catch(() => ({ items: [] })),
          api.get("/admin/users?perPage=100").catch(() => ({ items: [] })),
        ]);
        setGroups(g.items || []);
        setHouseholds(h.items || []);
        setUsers(u.items || []);
        if ((h.items || []).length > 0) setSelectedHousehold(h.items[0]);
        addLog("ok", `Loaded ${(h.items||[]).length} households, ${(u.items||[]).length} users`);
      } catch (e) { addLog("error", e.message); }
      setLoading(false);
    })();
  }, [api]);

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><Spinner size={32} /></div>;

  const householdUsers = selectedHousehold
    ? users.filter(u => u.householdId === selectedHousehold.id)
    : users;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="Groups" value={groups.length} accent={C.accent} sub="Top-level groups" />
        <StatCard label="Households" value={households.length} accent={C.blue} sub="Across all groups" />
        <StatCard label="Total Users" value={users.length} accent={C.green} sub="Server-wide" />
      </div>

      {/* Household selector + detail */}
      {households.length > 0 && (
        <div style={{ display: "flex", gap: 20 }}>
          {/* Household list */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Households</div>
            {households.map((h, i) => {
              const hColors = [C.accent, C.blue, C.green, "#a855f7", C.yellow];
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

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
                  <Icon name="household" size={15} color={C.blue} />
                  Members ({householdUsers.length})
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {householdUsers.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${C.accent}44, ${C.blue}44)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: C.accent,
                            }}>{(m.fullName || m.username || "?")[0].toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{m.fullName || m.username}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{m.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: C.muted, fontSize: 12 }}>{m.email}</td>
                        <td>
                          <span className={`tag ${m.admin ? "tag-orange" : "tag-muted"}`}>
                            {m.admin ? "admin" : "user"}
                          </span>
                        </td>
                        <td>
                          <span className={`tag ${m.enabled !== false ? "tag-green" : "tag-red"}`}>
                            {m.enabled !== false ? "active" : "disabled"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {householdUsers.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: C.muted, padding: 24 }}>No members</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All users table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
          <Icon name="household" size={15} color={C.green} />
          All Users — Server Wide ({users.length})
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Household</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.accent}44, ${C.blue}44)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: C.accent,
                    }}>{(m.fullName || m.username || "?")[0].toUpperCase()}</div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.fullName || m.username}</div>
                  </div>
                </td>
                <td style={{ color: C.muted, fontSize: 12 }}>{m.email}</td>
                <td style={{ fontSize: 12 }}>{m.household || "—"}</td>
                <td>
                  <span className={`tag ${m.admin ? "tag-orange" : "tag-muted"}`}>
                    {m.admin ? "admin" : "user"}
                  </span>
                </td>
                <td>
                  <span className={`tag ${m.enabled !== false ? "tag-green" : "tag-red"}`}>
                    {m.enabled !== false ? "active" : "disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
                      <img src={`${api._base}/api/media/recipes/${r.id}/images/min-original.webp`}
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
          api.get("/households/members?perPage=100"),
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
            { icon: "parse", label: "Run Ingredient Parser", sub: "Unparsed recipes only", color: C.accent, tab: "parser" },
            { icon: "recipe", label: "Browse Recipes", sub: "Search & manage", color: C.blue, tab: "recipes" },
            { icon: "cookbook", label: "View Cookbooks", sub: "Organize & visualize", color: C.green, tab: "cookbooks" },
            { icon: "household", label: "Household Info", sub: "Members & settings", color: "#a855f7", tab: "households" },
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

  const addLog = useCallback((type, msg) => {
    const ts = new Date().toLocaleTimeString();
    setGlobalLogs(l => [...l.slice(-500), { type, msg, ts }]);
  }, []);

  const handleConnect = ({ url, token, user, api }) => {
    // Attach base URL to api for image loading
    api._base = url;
    setConn({ url, token, user, api });
    addLog("ok", `Connected to ${url} as ${user?.username}`);
  };

  if (!conn) return <ConnectPanel onConnect={handleConnect} />;

  const tabs = [
    { id: "dashboard",   label: "Dashboard",   icon: "stats" },
    { id: "recipes",     label: "Recipes",     icon: "recipe" },
    { id: "parser",      label: "Ing. Parser", icon: "parse" },
    { id: "cookbooks",   label: "Cookbooks",   icon: "cookbook" },
    { id: "households",  label: "Household",   icon: "household" },
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
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none",
              background: tab === t.id ? `${C.accent}18` : "transparent",
              color: tab === t.id ? C.accent : C.muted,
              fontWeight: tab === t.id ? 600 : 400, fontSize: 13,
              textAlign: "left", width: "100%", cursor: "pointer",
              transition: "all .2s",
            }}>
              <Icon name={t.icon} size={16} color={tab === t.id ? C.accent : C.muted} />
              {t.label}
              {tab === t.id && (
                <div style={{
                  marginLeft: "auto", width: 4, height: 4,
                  borderRadius: "50%", background: C.accent,
                }} />
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
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{conn.url}</div>
          </div>

          {/* Content */}
          <div className="fade-up">
            {tab === "dashboard"  && <DashboardSection  api={conn.api} user={conn.user} addLog={addLog} onNavigate={setTab} />}
            {tab === "recipes"    && <RecipesSection    api={conn.api} addLog={addLog} />}
            {tab === "parser"     && <ParserSection     api={conn.api} addLog={addLog} />}
            {tab === "cookbooks"  && <CookbooksSection  api={conn.api} addLog={addLog} />}
            {tab === "households" && <HouseholdsSection api={conn.api} addLog={addLog} />}
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
