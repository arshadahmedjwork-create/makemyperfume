// EmailJS integration for Make My Perfume
// Configure VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY in your .env if using live credentials.

interface OrderEmailParams {
  email: string;
  customer_name: string;
  order_id: string;
  payable_total: number;
  status: string;
  items: Array<{ product: { name: string }; sizeMl: number; quantity: number; unitPrice: number }>;
  address?: string;
  city?: string;
  pincode?: string;
}

export async function sendOrderConfirmationEmail(params: OrderEmailParams): Promise<boolean> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_pwoe4om";
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_7iq9bjf";
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "azkhbJcGxsheqCWkc";


  const itemsSummary = params.items
    .map(i => `${i.product.name} (${i.sizeMl}ml) x${i.quantity} - ₹${(i.unitPrice * i.quantity).toLocaleString("en-IN")}`)
    .join("\n");

  const templateParams = {
    to_email: params.email,
    customer_name: params.customer_name,
    order_id: params.order_id,
    payable_total: `₹${params.payable_total.toLocaleString("en-IN")}`,
    order_status: params.status === "payment_confirmed" ? "Payment Confirmed" : "COD Order Reserved",
    items_summary: itemsSummary,
    shipping_address: [params.address, params.city, params.pincode].filter(Boolean).join(", ") || "Provided at checkout"
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams
      })
    });

    if (res.ok) {
      console.log("Order confirmation email sent via EmailJS!");
      return true;
    } else {
      const txt = await res.text();
      console.warn("EmailJS info (configure live keys in .env):", txt);
      return false;
    }
  } catch (err) {
    console.warn("EmailJS trigger skipped (demo mode or offline):", err);
    return false;
  }
}
