import ContactSection from "../components/site/ContactSection";
import SiteFooter from "../components/site/SiteFooter";
import PageHeader from "../components/site/PageHeader";
import { useTitle } from "../lib/useTitle";

export default function ContactPage() {
  useTitle("Contact — Hotel");
  return (
    <div className="font-jost">
      <PageHeader />

      <ContactSection />
      <SiteFooter />
    </div>
  );
}
