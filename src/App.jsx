import { useEffect, useMemo, useState } from "react";
import api, { getTokens, saveTokens, clearTokens } from "./api";
import "./App.css";

const BRAND = "Binderhaus";
const TAGLINE = "Every product has a place.";
const emptyForm = { product_name: "", description: "", price: "", quantity: "" };
const SWATCHES = ["#ff7a59", "#2ec4b6", "#ffbf47", "#7c6cf0", "#ef6f9b", "#4ea8de"];

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

function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#1f2a44" />
      <rect x="8" y="9" width="7" height="12" rx="2" fill="#ff7a59" />
      <rect x="17" y="12" width="7" height="9" rx="2" fill="#ffbf47" />
      <rect x="26" y="7" width="6" height="14" rx="2" fill="#2ec4b6" />
      <rect x="6" y="24" width="28" height="3.5" rx="1.75" fill="#fff8f0" />
      <rect x="10" y="30" width="20" height="3" rx="1.5" fill="#fff8f0" opacity=".5" />
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
      <aside className="auth-art">
        <div className="brand light">
          <Logo />
          <span>{BRAND}</span>
        </div>
        <div className="art-copy">
          <h2>{TAGLINE}</h2>
          <p>Keep every product, price and stock count in one tidy place.</p>
        </div>
        <div className="shelf-art" aria-hidden="true">
          <div className="shelf-row">
            <i style={{ height: 70, background: "#ff7a59" }} />
            <i style={{ height: 52, background: "#ffbf47" }} />
            <i style={{ height: 84, background: "#2ec4b6" }} />
            <i style={{ height: 60, background: "#7c6cf0" }} />
          </div>
          <div className="plank" />
          <div className="shelf-row">
            <i style={{ height: 48, background: "#ef6f9b" }} />
            <i style={{ height: 76, background: "#4ea8de" }} />
            <i style={{ height: 56, background: "#ffbf47" }} />
          </div>
          <div className="plank" />
        </div>
      </aside>

      <main className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          <div className="brand mobile-only">
            <Logo />
            <span>{BRAND}</span>
          </div>

          <div className="tabs" role="tablist">
            <button type="button" className={!isSignup ? "tab active" : "tab"} onClick={() => switchMode("login")}>
              Sign in
            </button>
            <button type="button" className={isSignup ? "tab active" : "tab"} onClick={() => switchMode("signup")}>
              Sign up
            </button>
          </div>

          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="sub">
            {isSignup ? "Takes less than a minute. Then you're in." : "Sign in to manage your products."}
          </p>

          <label>{isSignup ? "Username" : "Username or email"}</label>
          <input
            name="username"
            value={form.username}
            onChange={change}
            placeholder={isSignup ? "e.g. pauleen" : "Username or email"}
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

          {error && <p className="alert error">{error}</p>}

          <button className="btn primary full" disabled={loading}>
            {loading
              ? "Please wait… (server may be waking up)"
              : isSignup
              ? "Create account"
              : "Sign in"}
          </button>

          <p className="switch">
            {isSignup ? "Already have an account? " : "New to Binderhaus? "}
            <button type="button" className="link" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}

/* ------------------------------ Add / Edit modal ------------------------------ */

function ProductModal({ product, onClose, onSaved }) {
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
      onSaved(editing ? "Product updated." : "Product added.");
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{editing ? "Edit product" : "Add a product"}</h2>
        <p className="sub">{editing ? "Update the details below." : "Add something new to your inventory."}</p>

        <label>Product name</label>
        <input name="product_name" value={form.product_name} onChange={change} placeholder="e.g. Banana chips" required />

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

        {error && <p className="alert error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------ Delete confirm ------------------------------ */

function ConfirmDelete({ product, onClose, onDeleted, onError }) {
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/products/${product.id}`);
      onDeleted();
    } catch (err) {
      onError(errorText(err));
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <h2>Delete this product?</h2>
        <p className="sub">
          <strong>{product.product_name}</strong> will be removed from your inventory. This can't be undone.
        </p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Keep it
          </button>
          <button className="btn danger" onClick={go} disabled={busy}>
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Products --------------------------------- */

function Products({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { product: obj|null }
  const [deleting, setDeleting] = useState(null);

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
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const units = products.reduce((s, p) => s + Number(p.quantity || 0), 0);
    const value = products.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0);
    return { count: products.length, units, value };
  }, [products]);

  const shown = products.filter((p) =>
    `${p.product_name} ${p.description || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const stockBadge = (q) => {
    if (Number(q) === 0) return <span className="badge out">Out of stock</span>;
    if (Number(q) <= 5) return <span className="badge low">Low stock</span>;
    return <span className="badge ok">In stock</span>;
  };

  return (
    <div className="app">
      <nav className="topbar">
        <div className="brand">
          <Logo />
          <span>{BRAND}</span>
        </div>
        <div className="topbar-right">
          <span className="chip">
            <b>{(user?.username || "U").charAt(0).toUpperCase()}</b>
            {user?.username || "Signed in"}
          </span>
          <button className="btn ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="content">
        <section className="hero">
          <div>
            <h1>Your inventory</h1>
            <p className="sub">{TAGLINE}</p>
          </div>
          <button className="btn primary" onClick={() => setModal({ product: null })}>
            + Add product
          </button>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Products</span>
            <strong>{stats.count}</strong>
          </div>
          <div className="stat">
            <span>Units in stock</span>
            <strong>{stats.units}</strong>
          </div>
          <div className="stat">
            <span>Inventory value</span>
            <strong>{peso(stats.value)}</strong>
          </div>
        </section>

        <div className="searchbar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
          />
        </div>

        {error && <p className="alert error">{error}</p>}

        {loading ? (
          <p className="empty">Loading your inventory… (the server may be waking up)</p>
        ) : shown.length === 0 ? (
          <div className="empty">
            <h3>{products.length === 0 ? "Nothing here yet" : "No matches"}</h3>
            <p>
              {products.length === 0
                ? "Add your first product to get started."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <section className="grid">
            {shown.map((p) => (
              <article className="product" key={p.id}>
                <div className="thumb" style={{ background: SWATCHES[p.id % SWATCHES.length] }}>
                  {p.product_name.charAt(0).toUpperCase()}
                </div>
                <div className="product-body">
                  <div className="row">
                    <h3>{p.product_name}</h3>
                    {stockBadge(p.quantity)}
                  </div>
                  <p className="desc">{p.description || "No description"}</p>
                  <div className="row meta">
                    <strong className="price">{peso(p.price)}</strong>
                    <span>Qty: {p.quantity}</span>
                  </div>
                  <div className="card-actions">
                    <button className="btn ghost sm" onClick={() => setModal({ product: p })}>
                      Edit
                    </button>
                    <button className="btn danger-ghost sm" onClick={() => setDeleting(p)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {modal && (
        <ProductModal
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null);
            setToast(msg);
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDelete
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setToast("Product deleted.");
            load();
          }}
          onError={(msg) => {
            setDeleting(null);
            setError(msg);
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

  return <Products user={user} onLogout={logout} />;
}
