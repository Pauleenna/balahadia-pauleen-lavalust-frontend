import { useEffect, useMemo, useState } from "react";
import api, { getTokens, saveTokens, clearTokens } from "./api";
import "./App.css";

const BRAND = "Binderhaus";
const TAGLINE = "Every product has a place.";
const emptyForm = { product_name: "", description: "", price: "", quantity: "" };

const peso = (n) =>
  "₱" +
  Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const errorText = (err) => {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).join(" ");
  return data?.error || err.message || "Something went wrong.";
};

function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="7" y="3" width="27" height="34" rx="5" fill="#b6f26b" />
      <rect x="7" y="3" width="8" height="34" rx="4" fill="#2f9e63" />
      <circle cx="11" cy="12" r="2" fill="#12372a" />
      <circle cx="11" cy="20" r="2" fill="#12372a" />
      <circle cx="11" cy="28" r="2" fill="#12372a" />
      <rect x="19" y="12" width="11" height="3" rx="1.5" fill="#12372a" />
      <rect x="19" y="19" width="8" height="3" rx="1.5" fill="#12372a" opacity=".55" />
    </svg>
  );
}

/* ---------------------------- Sign in / Sign up ---------------------------- */

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isSignup = mode === "signup";

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup) {
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (isSignup) {
        await api.post("/api/register", {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }
      const res = await api.post("/api/login", {
        username: form.username.trim(),
        password: form.password,
      });
      saveTokens(res.data.tokens);
      onLogin(res.data.user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="binder">
        <div className="binder-tabs">
          <button type="button" className={!isSignup ? "btab active" : "btab"} onClick={() => switchMode("login")}>
            Sign in
          </button>
          <button type="button" className={isSignup ? "btab active" : "btab"} onClick={() => switchMode("signup")}>
            Sign up
          </button>
        </div>

        <form className="sheet" onSubmit={submit}>
          <div className="rings" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>

          <div className="sheet-body">
            <div className="brand">
              <Logo />
              <span>{BRAND}</span>
            </div>

            <h1>{isSignup ? "Open a new binder" : "Welcome back"}</h1>
            <p className="muted">
              {isSignup ? "Create an account to start filing products." : "Sign in to open your inventory."}
            </p>

            <label>{isSignup ? "Username" : "Username or email"}</label>
            <input
              name="username"
              value={form.username}
              onChange={change}
              placeholder={isSignup ? "Pick a username" : "Username or email"}
              autoComplete="username"
              required
            />

            {isSignup && (
              <>
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </>
            )}

            <label>Password</label>
            <div className="pw">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={change}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            {isSignup && (
              <>
                <label>Confirm password</label>
                <input
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  value={form.confirm}
                  onChange={change}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  required
                />
              </>
            )}

            {error && <p className="notice error">{error}</p>}

            <button className="btn solid block" disabled={loading}>
              {loading ? "One moment… (server may be waking up)" : isSignup ? "Create account" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="auth-tag">{TAGLINE}</p>
      </div>
    </div>
  );
}

/* ------------------------------ Add / Edit drawer ------------------------------ */

function Drawer({ product, onClose, onSaved }) {
  const editing = !!product;
  const [form, setForm] = useState(
    product
      ? {
          product_name: product.product_name,
          description: product.description || "",
          price: product.price,
          quantity: product.quantity,
        }
      : emptyForm
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/products/${product.id}`, form);
      } else {
        await api.post("/api/products", form);
      }
      onSaved(editing ? "Changes saved." : "Product filed.");
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{editing ? "Edit product" : "New product"}</h2>
            <p className="muted">{editing ? `Editing #${product.id}` : "File a new item in your inventory."}</p>
          </div>
          <button type="button" className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          <label>Product name</label>
          <input name="product_name" value={form.product_name} onChange={change} placeholder="e.g. Coconut jam" required />

          <label>Description</label>
          <input name="description" value={form.description} onChange={change} placeholder="Optional" />

          <div className="two">
            <div>
              <label>Price (₱)</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={change} placeholder="0.00" required />
            </div>
            <div>
              <label>Quantity</label>
              <input name="quantity" type="number" min="0" value={form.quantity} onChange={change} placeholder="0" required />
            </div>
          </div>

          {error && <p className="notice error">{error}</p>}

          <div className="drawer-actions">
            <button type="button" className="btn line" onClick={onClose}>
              Cancel
            </button>
            <button className="btn solid" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "File product"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

/* --------------------------------- Inventory --------------------------------- */

function Inventory({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null); // null | { product: obj|null }
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/api/products");
      setProducts(res.data.data);
      setError("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const units = products.reduce((s, p) => s + Number(p.quantity || 0), 0);
    const value = products.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0);
    const low = products.filter((p) => Number(p.quantity) <= 5).length;
    const max = Math.max(1, ...products.map((p) => Number(p.quantity || 0)));
    return { count: products.length, units, value, low, max };
  }, [products]);

  const shown = products.filter((p) =>
    `${p.product_name} ${p.description || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const remove = async (p) => {
    setBusyId(p.id);
    try {
      await api.delete(`/api/products/${p.id}`);
      setConfirmId(null);
      setToast("Product removed.");
      load();
    } catch (err) {
      setError(errorText(err));
      setConfirmId(null);
    } finally {
      setBusyId(null);
    }
  };

  const level = (q) => {
    q = Number(q);
    if (q === 0) return "out";
    if (q <= 5) return "low";
    return "ok";
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand light">
          <Logo />
          <span>{BRAND}</span>
        </div>

        <nav className="side-nav">
          <span className="nav-item active">▤ Inventory</span>
        </nav>

        <div className="side-foot">
          <div className="who">
            <b>{(user?.username || "U").charAt(0).toUpperCase()}</b>
            <span>{user?.username || "Signed in"}</span>
          </div>
          <button className="btn ghost-light" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="main-head">
          <div>
            <h1>Inventory</h1>
            <p className="muted">{TAGLINE}</p>
          </div>
          <div className="head-tools">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
            />
            <button className="btn solid" onClick={() => setDrawer({ product: null })}>
              + New product
            </button>
          </div>
        </header>

        <section className="strip">
          <div>
            <span>Products</span>
            <strong>{stats.count}</strong>
          </div>
          <div>
            <span>Units on hand</span>
            <strong>{stats.units}</strong>
          </div>
          <div>
            <span>Total value</span>
            <strong>{peso(stats.value)}</strong>
          </div>
          <div>
            <span>Running low</span>
            <strong className={stats.low ? "warn" : ""}>{stats.low}</strong>
          </div>
        </section>

        {error && <p className="notice error">{error}</p>}

        <section className="ledger">
          <div className="ledger-head">
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span />
          </div>

          {loading ? (
            <p className="ledger-empty">Opening your binder… (the server may be waking up)</p>
          ) : shown.length === 0 ? (
            <p className="ledger-empty">
              {products.length === 0 ? "Nothing filed yet. Add your first product." : "No products match your search."}
            </p>
          ) : (
            shown.map((p) => (
              <div className="lrow" key={p.id}>
                <div className="cell-name">
                  <i>{p.product_name.charAt(0).toUpperCase()}</i>
                  <div>
                    <strong>{p.product_name}</strong>
                    <small>{p.description || "No description"}</small>
                  </div>
                </div>

                <div className="cell-price">{peso(p.price)}</div>

                <div className="cell-stock">
                  <div className="stock-top">
                    <span>{p.quantity} units</span>
                    <em className={`tag ${level(p.quantity)}`}>
                      {level(p.quantity) === "out" ? "Out" : level(p.quantity) === "low" ? "Low" : "OK"}
                    </em>
                  </div>
                  <div className="bar">
                    <div
                      className={`fill ${level(p.quantity)}`}
                      style={{ width: `${Math.max(4, (Number(p.quantity) / stats.max) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="cell-actions">
                  {confirmId === p.id ? (
                    <div className="confirm">
                      <span>Delete?</span>
                      <button className="btn tiny danger" onClick={() => remove(p)} disabled={busyId === p.id}>
                        {busyId === p.id ? "…" : "Yes"}
                      </button>
                      <button className="btn tiny line" onClick={() => setConfirmId(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button className="btn tiny line" onClick={() => setDrawer({ product: p })}>
                        Edit
                      </button>
                      <button className="btn tiny danger-line" onClick={() => setConfirmId(p.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {drawer && (
        <Drawer
          product={drawer.product}
          onClose={() => setDrawer(null)}
          onSaved={(msg) => {
            setDrawer(null);
            setToast(msg);
            load();
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ----------------------------------- App ----------------------------------- */

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getTokens().access);
  const [user, setUser] = useState(null);

  const logout = async () => {
    try {
      await api.post("/api/logout", { refresh_token: getTokens().refresh });
    } catch {
      // ignore: we clear local tokens either way
    }
    clearTokens();
    setUser(null);
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <Auth
        onLogin={(u) => {
          setUser(u);
          setLoggedIn(true);
        }}
      />
    );
  }

  return <Inventory user={user} onLogout={logout} />;
}
