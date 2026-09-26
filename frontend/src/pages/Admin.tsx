import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Edit2, Eye, EyeOff, Lock, LogOut, Package, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiGet, apiPost, apiPut, apiDelete, getAdminToken, setAdminToken, clearAdminToken } from "@/lib/api";
import { toast } from "sonner";

const SIZES = ["6ml", "12ml", "30ml", "50ml", "100ml"] as const;

interface StockItem {
  id: string;
  barcode: string | null;
  brand: string;
  fragrance: string;
  price_6ml: number | null;
  price_12ml: number | null;
  price_30ml: number | null;
  price_50ml: number | null;
  price_100ml: number | null;
  qty_6ml: number;
  qty_12ml: number;
  qty_30ml: number;
  qty_50ml: number;
  qty_100ml: number;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface StockListResponse {
  items: StockItem[];
  total: number;
}

const emptyForm: Omit<StockItem, "id" | "created_at" | "updated_at"> = {
  barcode: "",
  brand: "",
  fragrance: "",
  price_6ml: null,
  price_12ml: null,
  price_30ml: null,
  price_50ml: null,
  price_100ml: null,
  qty_6ml: 0,
  qty_12ml: 0,
  qty_30ml: 0,
  qty_50ml: 0,
  qty_100ml: 0,
  in_stock: true,
};

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiPost<{ token: string }>("/admin/login", { email, password });
      setAdminToken(res.token);
      onSuccess();
    } catch (err) {
      const detail = err instanceof ApiError ? (err.body as { detail?: string })?.detail : null;
      setError(detail || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-login-icon"><Lock size={22} /></div>
        <h1>Admin Sign In</h1>
        <p>Stock management is restricted to store administrators.</p>
        <label>
          <span>Email</span>
          <Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <div className="admin-password-field">
            <Input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error && <p className="admin-login-error">{error}</p>}
        <Button type="submit" className="full-button" disabled={busy}>
          {busy ? "Signing in..." : "Sign In"}
        </Button>
        <Link to="/" className="admin-login-back">Back to store</Link>
      </form>
    </div>
  );
}

export default function Admin() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("brand");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()));

  const signOut = () => {
    clearAdminToken();
    setAuthed(false);
    setItems([]);
  };

  // A rejected token means the session lapsed; drop straight back to the login form.
  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) {
      signOut();
      toast.error("Your session expired. Please sign in again.");
      return;
    }
    toast.error(fallback);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiGet<StockListResponse>(`/admin/stock${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      setItems(res.items);
    } catch (err) {
      handleError(err, "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Selection refers to rows currently listed, so a changed result set must reset it.
  useEffect(() => {
    if (!authed) return;
    setSelectedIds(new Set());
    fetchItems();
  }, [query, authed]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortField];
      const bv = (b as unknown as Record<string, unknown>)[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: StockItem) => {
    setForm({
      barcode: item.barcode || "",
      brand: item.brand,
      fragrance: item.fragrance,
      price_6ml: item.price_6ml,
      price_12ml: item.price_12ml,
      price_30ml: item.price_30ml,
      price_50ml: item.price_50ml,
      price_100ml: item.price_100ml,
      qty_6ml: item.qty_6ml ?? 0,
      qty_12ml: item.qty_12ml ?? 0,
      qty_30ml: item.qty_30ml ?? 0,
      qty_50ml: item.qty_50ml ?? 0,
      qty_100ml: item.qty_100ml ?? 0,
      in_stock: item.in_stock,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const saveItem = async () => {
    if (!form.brand.trim() || !form.fragrance.trim()) {
      toast.error("Brand and fragrance are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiPut(`/admin/stock/${editingId}`, form);
        toast.success("Stock item updated");
      } else {
        await apiPost("/admin/stock", form);
        toast.success("Stock item created");
      }
      setShowForm(false);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      handleError(err, "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("Delete this stock item?")) return;
    try {
      await apiDelete(`/admin/stock/${id}`);
      toast.success("Item deleted");
      fetchItems();
    } catch (err) {
      handleError(err, "Failed to delete item");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected items?`)) return;
    try {
      await apiPost("/admin/stock/bulk-delete", { ids: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} items deleted`);
      setSelectedIds(new Set());
      fetchItems();
    } catch (err) {
      handleError(err, "Failed to delete items");
    }
  };

  const toggleStock = async (item: StockItem) => {
    try {
      await apiPut(`/admin/stock/${item.id}`, { in_stock: !item.in_stock });
      toast.success(`${item.fragrance} marked as ${!item.in_stock ? "in stock" : "out of stock"}`);
      fetchItems();
    } catch (err) {
      handleError(err, "Failed to update stock status");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((i) => i.id)));
  };

  const updatePrice = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const updateQty = (field: string, value: string) => {
    const n = Math.floor(Number(value));
    setForm((prev) => ({ ...prev, [field]: value === "" || !Number.isFinite(n) || n < 0 ? 0 : n }));
  };

  const formatPrice = (v: number | null) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

  const totalUnits = (item: StockItem) =>
    SIZES.reduce((sum, s) => sum + (Number((item as unknown as Record<string, unknown>)[`qty_${s}`]) || 0), 0);

  const SortArrow = ({ field }: { field: string }) => (
    <span className="admin-sort-arrow">{sortField === field ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
  );

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  return (
    <div className="admin-page page-width">
      <div className="admin-header">
        <div className="admin-header-left">
          <Link to="/" className="admin-back"><ArrowLeft size={16} /> Back to Store</Link>
          <h1><Package size={28} /> Stock Management</h1>
          <p className="admin-subtitle">{items.length} products in inventory</p>
        </div>
        <div className="admin-header-actions">
          {selectedIds.size > 0 && (
            <Button variant="outline" className="admin-bulk-delete" onClick={bulkDelete}>
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </Button>
          )}
          <Button className="admin-add-btn" onClick={openAdd}>
            <Plus size={14} /> Add Product
          </Button>
          <Button variant="outline" onClick={signOut} title="Sign out">
            <LogOut size={14} /> Sign Out
          </Button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand or fragrance..."
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="admin-search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId ? "Edit Stock Item" : "Add New Stock Item"}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <label>
                  <span>Barcode</span>
                  <Input value={form.barcode || ""} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="e.g. MH0188" />
                </label>
                <label>
                  <span>Brand *</span>
                  <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="e.g. ARMAF" />
                </label>
                <label className="admin-form-wide">
                  <span>Fragrance *</span>
                  <Input value={form.fragrance} onChange={(e) => setForm((f) => ({ ...f, fragrance: e.target.value }))} placeholder="e.g. CLUB" />
                </label>
              </div>
              <div className="admin-form-prices">
                <h3>Prices by Size</h3>
                <div className="admin-price-grid">
                  {[
                    ["price_6ml", "6ml"],
                    ["price_12ml", "12ml"],
                    ["price_30ml", "30ml"],
                    ["price_50ml", "50ml"],
                    ["price_100ml", "100ml"],
                  ].map(([field, label]) => (
                    <label key={field}>
                      <span>{label}</span>
                      <Input
                        type="number"
                        value={String((form as unknown as Record<string, unknown>)[field] ?? "")}
                        onChange={(e) => updatePrice(field, e.target.value)}
                        placeholder="₹"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="admin-form-prices">
                <h3>Quantity in Stock</h3>
                <div className="admin-price-grid">
                  {SIZES.map((size) => (
                    <label key={size}>
                      <span>{size}</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={String((form as unknown as Record<string, unknown>)[`qty_${size}`] ?? 0)}
                        onChange={(e) => updateQty(`qty_${size}`, e.target.value)}
                        placeholder="0"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <label className="admin-stock-toggle">
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm((f) => ({ ...f, in_stock: e.target.checked }))} />
                <span>In Stock</span>
              </label>
            </div>
            <div className="admin-modal-footer">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveItem} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      {loading ? (
        <div className="admin-loading">Loading stock data...</div>
      ) : sorted.length === 0 ? (
        <div className="admin-empty">
          <Package size={48} />
          <h3>No stock items found</h3>
          <p>Try adjusting your search or add a new product.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-check-col">
                  <input type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} />
                </th>
                <th onClick={() => toggleSort("barcode")} className="admin-sortable">Barcode <SortArrow field="barcode" /></th>
                <th onClick={() => toggleSort("brand")} className="admin-sortable">Brand <SortArrow field="brand" /></th>
                <th onClick={() => toggleSort("fragrance")} className="admin-sortable">Fragrance <SortArrow field="fragrance" /></th>
                <th onClick={() => toggleSort("price_6ml")} className="admin-sortable admin-price-col">6ml <SortArrow field="price_6ml" /></th>
                <th onClick={() => toggleSort("price_12ml")} className="admin-sortable admin-price-col">12ml <SortArrow field="price_12ml" /></th>
                <th onClick={() => toggleSort("price_30ml")} className="admin-sortable admin-price-col">30ml <SortArrow field="price_30ml" /></th>
                <th onClick={() => toggleSort("price_50ml")} className="admin-sortable admin-price-col">50ml <SortArrow field="price_50ml" /></th>
                <th onClick={() => toggleSort("price_100ml")} className="admin-sortable admin-price-col">100ml <SortArrow field="price_100ml" /></th>
                <th className="admin-total-col">Units</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} className={selectedIds.has(item.id) ? "admin-row-selected" : ""}>
                  <td className="admin-check-col">
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="admin-barcode">{item.barcode || "—"}</td>
                  <td className="admin-brand">{item.brand}</td>
                  <td className="admin-fragrance">{item.fragrance}</td>
                  {SIZES.map((size) => {
                    const qty = Number((item as unknown as Record<string, unknown>)[`qty_${size}`]) || 0;
                    const price = (item as unknown as Record<string, number | null>)[`price_${size}`];
                    return (
                      <td className="admin-price-col" key={size}>
                        <span className="admin-price-value">{formatPrice(price)}</span>
                        <span className={`admin-qty ${qty === 0 ? "is-zero" : ""}`}>{qty} left</span>
                      </td>
                    );
                  })}
                  <td className="admin-total-col">{totalUnits(item)}</td>
                  <td>
                    <button type="button" className={`admin-stock-badge ${item.in_stock ? "in-stock" : "out-stock"}`} onClick={() => toggleStock(item)}>
                      {item.in_stock ? <><Eye size={12} /> In Stock</> : <><EyeOff size={12} /> Out</>}
                    </button>
                  </td>
                  <td className="admin-actions-col">
                    <button type="button" className="admin-action-btn edit" onClick={() => openEdit(item)} title="Edit"><Edit2 size={14} /></button>
                    <button type="button" className="admin-action-btn delete" onClick={() => deleteItem(item.id)} title="Delete"><Trash2 size={14} /></button>
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
