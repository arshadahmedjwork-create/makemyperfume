import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost } from "@/lib/api";
import { mockCalculate } from "@/lib/mockData";
import { useCart, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { CheckoutPreviewResponse, OrderCreateResponse, PaymentMethod } from "@/lib/types";

interface CheckoutForm { name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; }
interface CheckoutLocation { directItem?: CartItem; }
const blankForm: CheckoutForm = { name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" };

export default function Checkout() {
  const location = useLocation();
  const { items: cartItems, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const directItem = (location.state as CheckoutLocation | null)?.directItem;
  const items = directItem ? [directItem] : cartItems;
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid");
  const [promo, setPromo] = useState("PREPAID10");
  const [order, setOrder] = useState<OrderCreateResponse | null>(null);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
        city: prev.city || user.city || "",
        state: prev.state || user.state || "",
        pincode: prev.pincode || user.pincode || ""
      }));
    }
  }, [user]);

  const checkoutItems = useMemo(() => items.map((item) => ({ product_id: item.product.id, name: item.product.name, size_ml: item.sizeMl, quantity: item.quantity, unit_price: item.unitPrice })), [items]);
  const { data: preview } = useQuery({ queryKey: ["checkout-preview", checkoutItems, paymentMethod, promo], enabled: checkoutItems.length > 0, queryFn: async () => { try { return await apiPost<CheckoutPreviewResponse>("/checkout/preview", { items: checkoutItems, payment_method: paymentMethod, promo_code: promo }); } catch { return mockCalculate(checkoutItems, paymentMethod, promo); } } });
  const placeOrder = useMutation({ mutationFn: async () => { const body = { ...form, customer_name: form.name, items: checkoutItems, payment_method: paymentMethod, promo_code: promo, idempotency_key: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}` }; try { return await apiPost<OrderCreateResponse>("/orders/mock", body); } catch { return { order_id: `MMP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, status: paymentMethod === "prepaid" ? "payment_confirmed" : "cod_pending", message: paymentMethod === "prepaid" ? "Payment confirmed in demo mode." : "Order reserved. Pay on delivery.", payable_total: preview?.total ?? 0, payment_provider: "mocked_razorpay_boundary", checkout_mode: "mocked" } as OrderCreateResponse; } } });
  const validate = () => { const next: Partial<CheckoutForm> = {}; if (form.name.trim().length < 2) next.name = "Enter your full name"; if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email"; if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""))) next.phone = "Enter a 10-digit Indian mobile number"; if (form.address.trim().length < 8) next.address = "Add your complete delivery address"; if (form.city.trim().length < 2) next.city = "Enter your city"; if (form.state.trim().length < 2) next.state = "Enter your state"; if (!/^[1-9]\d{5}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit PIN code"; setErrors(next); return Object.keys(next).length === 0; };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || items.length === 0) return;
    placeOrder.mutate(undefined, {
      onSuccess: (result) => {
        setOrder(result);
        sendOrderConfirmationEmail({
          email: form.email,
          customer_name: form.name,
          order_id: result.order_id,
          payable_total: result.payable_total,
          status: result.status,
          items: items,
          address: form.address,
          city: form.city,
          pincode: form.pincode
        });
        if (!directItem) clearCart();
      }
    });
  };

  if (order) return <div className="confirmation page-width" data-testid="order-confirmation"><div className="confirmation-mark"><Check /></div><p className="eyebrow">{order.status === "payment_confirmed" ? "Payment confirmed" : "Order reserved"}</p><h1>Thank you, <em>{form.name.split(" ")[0]}.</em></h1><p className="confirmation-copy">{order.message} Your reference is <strong>{order.order_id}</strong>.</p><div className="confirmation-card"><span>Amount payable</span><strong>₹{order.payable_total.toLocaleString("en-IN")}</strong><small>{order.checkout_mode === "mocked" ? "Demo checkout · Razorpay integration boundary ready" : "Razorpay"}</small></div><Link to="/collection" className="button button-dark" data-testid="confirmation-continue-shopping">Continue shopping <ArrowRight size={16} /></Link></div>;
  if (items.length === 0) return <div className="empty-checkout page-width" data-testid="checkout-empty-state"><p className="eyebrow">Nothing selected</p><h1>Your cart is <em>quiet.</em></h1><p>Choose a fragrance to begin your ritual.</p><Link to="/collection" className="button button-dark" data-testid="empty-checkout-shop-link">Explore collection <ArrowRight size={16} /></Link></div>;
  return (
    <div className="checkout-page page-width" data-testid="checkout-page">
      <div className="checkout-top">
        <Link to="/collection" className="back-link" data-testid="checkout-back-link"><ArrowLeft size={15} /> Back to collection</Link>
        <span className="checkout-step"><strong>01</strong> Checkout</span>
      </div>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submit} noValidate>
          <div className="checkout-heading">
            <p className="eyebrow">Your details</p>
            <h1>Almost <em>yours.</em></h1>
            {user ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300" data-testid="checkout-auth-banner">
                <span className="flex items-center gap-1.5"><UserCheck size={16} /> Signed in as <strong>{user.email}</strong> (Saved address loaded)</span>
                <button type="button" onClick={openAuthModal} className="font-semibold underline hover:text-foreground">My Orders & Profile</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground" data-testid="checkout-guest-banner">
                <span>Already have an account?</span>
                <button type="button" onClick={openAuthModal} className="font-semibold text-primary underline hover:text-primary/80">Sign in to auto-fill address</button>
              </div>
            )}
          </div>
          <div className="form-section">
            <div className="form-section-head"><span>01</span><h2>Delivery address</h2></div>
            <div className="form-grid">
              <Field label="Full name" name="name" value={form.name} error={errors.name} onChange={(value) => setForm({ ...form, name: value })} testId="checkout-form-name" />
              <Field label="Email address" name="email" type="email" value={form.email} error={errors.email} onChange={(value) => setForm({ ...form, email: value })} testId="checkout-form-email" />
              <Field label="Mobile number" name="phone" type="tel" value={form.phone} error={errors.phone} onChange={(value) => setForm({ ...form, phone: value })} testId="checkout-form-phone" />
              <Field label="Address" name="address" value={form.address} error={errors.address} onChange={(value) => setForm({ ...form, address: value })} wide testId="checkout-form-address" />
              <Field label="City" name="city" value={form.city} error={errors.city} onChange={(value) => setForm({ ...form, city: value })} testId="checkout-form-city" />
              <Field label="State" name="state" value={form.state} error={errors.state} onChange={(value) => setForm({ ...form, state: value })} testId="checkout-form-state" />
              <Field label="PIN code" name="pincode" value={form.pincode} error={errors.pincode} onChange={(value) => setForm({ ...form, pincode: value })} testId="checkout-form-pincode" />
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-head"><span>02</span><h2>Payment method</h2></div>
            <div className="payment-options">
              <PaymentOption method="prepaid" title="Online payment" description="UPI, cards & net banking" selected={paymentMethod} onSelect={setPaymentMethod} discount="Save 10%" testId="payment-method-prepaid" />
              <PaymentOption method="cod" title="Cash on delivery" description="Pay when your order arrives" selected={paymentMethod} onSelect={setPaymentMethod} discount="+ ₹80 fee" testId="payment-method-cod" />
            </div>
          </div>
          <Button type="submit" className="place-order-button" disabled={placeOrder.isPending} data-testid="checkout-place-order-button">{placeOrder.isPending ? "Preparing your order…" : paymentMethod === "prepaid" ? "Continue to secure payment" : "Place COD order"}<ArrowRight size={16} /></Button>
          <p className="checkout-reassurance"><LockKeyhole size={14} /> Secure checkout · Your details are private · India only</p>
        </form>
        <aside className="order-summary" data-testid="checkout-order-summary">
          <div className="summary-sticky">
            <p className="eyebrow">Your selection</p>
            <h2>Order summary</h2>
            <div className="summary-products">{items.map((item) => <div key={`${item.product.id}-${item.sizeMl}`} className="summary-product"><img src={item.product.image_url} alt="" /><div><strong>{item.product.name}</strong><span>{item.sizeMl} ml · Qty {item.quantity}</span></div><b>₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</b></div>)}</div>
            <div className="summary-promo"><Input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Promo code" aria-label="Promo code" data-testid="checkout-promo-input" /><span>{preview?.promo_applied ? "Applied" : ""}</span></div>
            <div className="summary-lines"><SummaryLine label="Subtotal" value={preview?.subtotal} /><SummaryLine label="Shipping" value={preview?.shipping} free={preview?.shipping === 0} />{paymentMethod === "prepaid" && <SummaryLine label="Prepaid savings" value={preview?.discount} minus />}{paymentMethod === "cod" && <SummaryLine label="COD handling fee" value={preview?.cod_fee} />}</div>
            {preview && preview.free_shipping_remaining > 0 && <div className="summary-callout">Add ₹{preview.free_shipping_remaining.toLocaleString("en-IN")} more for free shipping</div>}
            <div className="summary-total"><span>Total</span><strong>₹{(preview?.total ?? 0).toLocaleString("en-IN")}</strong></div>
            <div className="summary-trust"><ShieldCheck size={16} /><span>Transparent pricing<br /><small>No hidden charges at confirmation</small></span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, error, onChange, wide, testId }: { label: string; name: string; type?: string; value: string; error?: string; onChange: (value: string) => void; wide?: boolean; testId: string }) { return <label className={`form-field ${wide ? "wide" : ""}`} htmlFor={name}><span>{label}</span><Input id={name} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} data-testid={testId} />{error && <small>{error}</small>}</label>; }
function PaymentOption({ method, title, description, selected, onSelect, discount, testId }: { method: PaymentMethod; title: string; description: string; selected: PaymentMethod; onSelect: (value: PaymentMethod) => void; discount: string; testId: string }) { return <button type="button" className={`payment-option ${selected === method ? "active" : ""}`} onClick={() => onSelect(method)} data-testid={testId}><span className="radio-mark">{selected === method && <span />}</span><span><strong>{title}</strong><small>{description}</small></span><b>{discount}</b></button>; }
function SummaryLine({ label, value = 0, free = false, minus = false }: { label: string; value?: number; free?: boolean; minus?: boolean }) { return <div><span>{label}</span><strong>{free ? "Free" : `${minus ? "−" : ""}₹${value.toLocaleString("en-IN")}`}</strong></div>; }
