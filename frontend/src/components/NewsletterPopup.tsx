import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost } from "@/lib/api";
import type { ActionResponse } from "@/lib/types";
import { toast } from "sonner";

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { if (localStorage.getItem("mmp-newsletter-dismissed")) return; const timer = window.setTimeout(() => setVisible(true), 4500); return () => window.clearTimeout(timer); }, []);
  const close = () => { localStorage.setItem("mmp-newsletter-dismissed", "1"); setVisible(false); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!email.includes("@")) return; try { await apiPost<ActionResponse>("/subscribers", { email, consent: true }); } catch { /* static preview continues without backend */ } setSubmitted(true); toast.success("Welcome in. Your offer is ready."); };
  if (!visible) return null;
  return <div className="newsletter-layer" data-testid="newsletter-popup"><div className="newsletter-card"><Button variant="ghost" size="icon" className="newsletter-close" onClick={close} aria-label="Dismiss offer" data-testid="newsletter-close-button"><X /></Button><p className="eyebrow">A small welcome</p>{submitted ? <><h2>Your 10% is waiting.</h2><p>Use <strong>PREPAID10</strong> at checkout on your first prepaid order.</p><Button className="full-button" onClick={close} data-testid="newsletter-continue-button">Continue browsing</Button></> : <><h2>Take 10% off<br /><em>your first ritual.</em></h2><p>Occasional notes from our studio, plus a welcome offer for your next bottle.</p><form onSubmit={submit}><Input type="email" required placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email address" data-testid="newsletter-email-input" /><Button type="submit" className="full-button" data-testid="newsletter-submit-button">Unlock my 10%</Button></form><small>By subscribing, you agree to receive occasional fragrance notes. Unsubscribe anytime.</small></>}</div></div>;
}
