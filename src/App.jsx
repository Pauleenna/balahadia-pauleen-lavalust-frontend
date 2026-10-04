import { useEffect, useState } from "react";
import api, { getTokens, saveTokens, clearTokens } from "./api";
import "./App.css";

const emptyForm = { product_name: "", description: "", price: "", quantity: "" };

const errorText = (err) => {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).join(" ");
  return data?.error || err.message || "Something went wrong.";
};

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/login", { username, password });
      saveTokens(res.data.tokens);
      onLogin(res.data.user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card login">
      <h1>Product Management</h1>
      <p className="muted">Log in to manage products.</p>
      <form onSubmit={submit}>
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? "Logging in... (server may be waking up)" : "Login"}</button>
      </form>
    </div>
  );
}

function Products({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/api/products");
      setProducts(res.data.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, form);
        setMessage("Product updated.");
      } else {
        await api.post("/api/products", form);
        setMessage("Product added.");
      }
      reset();
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      product_name: p.product_name,
      description: p.description || "",
      price: p.price,
      quantity: p.quantity,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/api/products/${p.id}`);
      setMessage("Product deleted.");
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className="wrap">
      <header>
        <h1>Product Management</h1>
        <div>
          <span className="muted">Signed in as {user?.username || "user"} </span>
          <button className="secondary" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="card">
        <h2>{editingId ? "Edit product" : "Add product"}</h2>
        <form onSubmit={submit} className="grid">
          <input name="product_name" placeholder="Product name" value={form.product_name} onChange={change} required />
          <input name="price" type="number" step="0.01" min="0" placeholder="Price" value={form.price} onChange={change} required />
          <input name="quantity" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={change} required />
          <input name="description" placeholder="Description" value={form.description} onChange={change} />
          <div className="actions">
            <button>{editingId ? "Save changes" : "Add product"}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </div>

      <div className="card">
        <h2>Products</h2>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : products.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.product_name}</td>
                  <td>{p.description}</td>
                  <td>{Number(p.price).toFixed(2)}</td>
                  <td>{p.quantity}</td>
                  <td className="actions">
                    <button className="secondary" onClick={() => edit(p)}>Edit</button>
                    <button className="danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

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
      <Login
        onLogin={(u) => {
          setUser(u);
          setLoggedIn(true);
        }}
      />
    );
  }

  return <Products user={user} onLogout={logout} />;
}
