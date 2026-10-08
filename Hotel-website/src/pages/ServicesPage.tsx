import PageHeader from "../components/site/PageHeader";
import SiteFooter from "../components/site/SiteFooter";
import ServicesContent from "../components/site/ServicesContent";
import { useTitle } from "../lib/useTitle";

export default function ServicesPage() {
  useTitle("Services — Hotel");
  return (
    <div className="min-h-screen bg-cream font-jost">
      <PageHeader />
      <ServicesContent />
      <SiteFooter />
    </div>
  );
}
