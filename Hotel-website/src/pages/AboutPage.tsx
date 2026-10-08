import AboutSection from "../components/site/AboutSection";
import SiteFooter from "../components/site/SiteFooter";
import PageHeader from "../components/site/PageHeader";
import { useTitle } from "../lib/useTitle";

export default function AboutPage() {
  useTitle("About — Hotel");
  return (
    <div className="font-jost">
      <PageHeader />

      <AboutSection />
      <SiteFooter />
    </div>
  );
}
