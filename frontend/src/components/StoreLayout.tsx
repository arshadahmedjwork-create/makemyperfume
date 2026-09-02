import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import NewsletterPopup from "@/components/NewsletterPopup";

export default function StoreLayout() {
  return <div className="storefront"><Header /><main><Outlet /></main><Footer /><CartDrawer /><NewsletterPopup /></div>;
}
