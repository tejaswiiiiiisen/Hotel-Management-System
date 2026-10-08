import PageHeader from "../components/site/PageHeader";
import SiteFooter from "../components/site/SiteFooter";
import OffersContent from "../components/site/OffersContent";
import { useTitle } from "../lib/useTitle";

export default function OffersPage() {
  useTitle("Offers & Coupons — Hotel");
  return (
    <div className="min-h-screen bg-cream font-jost">
      <PageHeader />
      <OffersContent />
      <SiteFooter />
    </div>
  );
}
