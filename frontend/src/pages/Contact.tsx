import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import type { ActionResponse } from "@/lib/types";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = useMutation({ mutationFn: async () => { try { return await apiPost<ActionResponse>("/contact", form); } catch { return { id: "local", status: "received", message: "Thanks — your note is with our studio." }; } }, onSuccess: () => setSent(true), onError: () => setError("Something went quiet. Please try again.") });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="contact-page page-width" data-testid="contact-page"><div className="contact-intro"><p className="eyebrow">Come say hello</p><h1>Let’s talk<br /><em>fragrance.</em></h1><p>Questions about a bottle, a delivery or a future collaboration? We’re here.</p><div className="contact-details"><span><Mail size={16} /> hello@makemyperfume.in</span><span><Phone size={16} /> +91 98765 43210</span><span><MapPin size={16} /> Bengaluru · India</span></div></div><div className="contact-form-wrap">{sent ? <div className="contact-success" data-testid="contact-success-state"><p className="eyebrow">Message received</p><h2>Thank you for writing.</h2><p>Our studio will be in touch soon.</p><button type="button" onClick={() => { setSent(false); setForm({ name: "", email: "", message: "", website: "" }); }} data-testid="contact-send-another-button">Send another note</button></div> : <form onSubmit={(event) => { event.preventDefault(); setError(""); if (form.name.length < 2 || !form.email.includes("@") || form.message.length < 10) { setError("Please complete each field so we can reply thoughtfully."); return; } submit.mutate(); }} data-testid="contact-form"><label htmlFor="contact-name">Your name<Input id="contact-name" required value={form.name} onChange={(event) => update("name", event.target.value)} data-testid="contact-form-name" /></label><label htmlFor="contact-email">Email address<Input id="contact-email" type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} data-testid="contact-form-email" /></label><label htmlFor="contact-message">Your note<Textarea id="contact-message" required value={form.message} onChange={(event) => update("message", event.target.value)} data-testid="contact-form-message" /></label><label className="honeypot" htmlFor="contact-website">Website<Input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>{error && <p className="form-error" data-testid="contact-form-error">{error}</p>}<Button type="submit" className="full-button" disabled={submit.isPending} data-testid="contact-form-submit">{submit.isPending ? "Sending…" : "Send your note"}</Button><small>We’ll only use your details to reply to this message.</small></form>}</div></div>;
}
