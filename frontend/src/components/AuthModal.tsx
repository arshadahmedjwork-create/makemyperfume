import { useState, useEffect } from "react";
import { X, ArrowRight, Package, MapPin, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type CustomerOrder } from "@/lib/auth";

export default function AuthModal() {
  const {
    user,
    authModalOpen,
    closeAuthModal,
    checkEmail,
    login,
    register,
    updateProfile,
    logout,
    fetchMyOrders
  } = useAuth();

  const [step, setStep] = useState<"email" | "password" | "dashboard">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "address">("orders");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Address form state for dashboard
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setStep("dashboard");
      setAddressForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || ""
      });
      loadOrders();
    } else {
      setStep("email");
    }
  }, [user, authModalOpen]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    const data = await fetchMyOrders();
    setOrders(data);
    setOrdersLoading(false);
  };

  if (!authModalOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const exists = await checkEmail(email.trim());
      setIsExisting(exists);
      setStep("password");
    } catch {
      setError("Failed to check email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    try {
      if (isExisting) {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          name: name.trim() || undefined
        });
      }
      setStep("dashboard");
    } catch (err: any) {
      setError(err?.body?.detail || "Authentication failed. Check your password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    try {
      await updateProfile(addressForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="auth-modal-overlay">
      <div className="auth-modal-card relative w-full max-w-lg overflow-hidden rounded-2xl bg-background border border-border shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close popup"
          data-testid="auth-modal-close"
        >
          <X size={18} />
        </button>

        {/* STEP 1: EMAIL ENTRY */}
        {step === "email" && !user && (
          <form onSubmit={handleEmailSubmit} className="space-y-4" data-testid="auth-email-form">
            <div className="space-y-1 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Portal</span>
              <h2 className="text-2xl font-serif font-bold text-foreground">Welcome to Make My Perfume</h2>
              <p className="text-sm text-muted-foreground">Enter your email address to sign in, track your orders, and load your delivery address.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 text-left">
              <label htmlFor="auth-email" className="text-xs font-medium text-foreground">Email address</label>
              <Input
                id="auth-email"
                type="email"
                autoFocus
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="auth-email-input"
              />
            </div>

            <Button type="submit" className="w-full justify-between" disabled={loading} data-testid="auth-email-submit">
              <span>{loading ? "Checking..." : "Continue"}</span>
              <ArrowRight size={16} />
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              By continuing, you agree to Make My Perfume privacy policy.
            </p>
          </form>
        )}

        {/* STEP 2: PASSWORD ENTRY */}
        {step === "password" && !user && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4" data-testid="auth-password-form">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="text-left">
                <span className="text-[11px] text-muted-foreground">Signing in as</span>
                <p className="text-sm font-semibold text-foreground">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-xs text-primary underline hover:text-primary/80"
              >
                Change
              </button>
            </div>

            <div className="space-y-1 text-left">
              <h2 className="text-xl font-serif font-bold text-foreground">
                {isExisting ? "Enter your password" : "Create your password"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isExisting
                  ? "Welcome back! Enter password to access your orders & address."
                  : "New around here? Enter password to set up your account."}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {!isExisting && (
              <div className="space-y-1 text-left">
                <label htmlFor="auth-name" className="text-xs font-medium text-foreground">Full Name (Optional)</label>
                <Input
                  id="auth-name"
                  placeholder="e.g. Aarav Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="auth-name-input"
                />
              </div>
            )}

            <div className="space-y-1 text-left">
              <label htmlFor="auth-password" className="text-xs font-medium text-foreground">Password</label>
              <Input
                id="auth-password"
                type="password"
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="auth-password-input"
              />
            </div>

            <Button type="submit" className="w-full justify-between" disabled={loading} data-testid="auth-password-submit">
              <span>{loading ? "Authenticating..." : isExisting ? "Sign In" : "Create Account"}</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        )}

        {/* STEP 3: DASHBOARD */}
        {user && (
          <div className="space-y-5 text-left" data-testid="auth-dashboard">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{user.name || "Fragrance Enthusiast"}</h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-muted-foreground hover:text-destructive gap-1" data-testid="auth-logout-button">
                <LogOut size={14} /> Sign out
              </Button>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab("orders")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                  tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-orders"
              >
                <Package size={15} /> Order History ({orders.length})
              </button>
              <button
                onClick={() => setTab("address")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                  tab === "address" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-address"
              >
                <MapPin size={15} /> Saved Address
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {tab === "orders" && (
              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1" data-testid="orders-list">
                {ordersLoading ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Package className="mx-auto text-muted-foreground/40" size={32} />
                    <p className="text-sm font-medium text-foreground">No orders found yet</p>
                    <p className="text-xs text-muted-foreground">Orders placed with {user.email} will automatically show up here.</p>
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.order_id} className="rounded-xl border border-border bg-card p-3 sm:p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-foreground">{ord.order_id}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ord.status === "payment_confirmed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {ord.status === "payment_confirmed" ? "Payment Confirmed" : "COD Pending"}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between">
                        <span>{new Date(ord.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <b className="text-foreground text-sm font-semibold">₹{ord.payable_total.toLocaleString("en-IN")}</b>
                      </div>
                      {ord.items && ord.items.length > 0 && (
                        <div className="border-t border-border pt-2 space-y-1 text-muted-foreground">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.name} ({it.size_ml}ml) × {it.quantity}</span>
                              <span>₹{(it.unit_price * it.quantity).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: SAVED ADDRESS */}
            {tab === "address" && (
              <form onSubmit={handleSaveAddress} className="space-y-3" data-testid="address-form">
                {saveSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={15} />
                    <span>Delivery address saved! It will auto-fill at checkout.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Full Name</label>
                    <Input
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="e.g. Aarav Patel"
                      data-testid="address-form-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Mobile Phone</label>
                    <Input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="9876543210"
                      data-testid="address-form-phone"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Street Address</label>
                  <Input
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    placeholder="Flat / Building / Street"
                    data-testid="address-form-address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">City</label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="Mumbai"
                      data-testid="address-form-city"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">State</label>
                    <Input
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      data-testid="address-form-state"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">PIN Code</label>
                    <Input
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      placeholder="400001"
                      data-testid="address-form-pincode"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2" data-testid="save-address-button">
                  {loading ? "Saving..." : "Save Delivery Address"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
