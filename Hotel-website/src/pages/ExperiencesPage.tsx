import ExperienceSection from "../components/site/ExperienceSection";
import SiteFooter from "../components/site/SiteFooter";
import PageHeader from "../components/site/PageHeader";
import { useTitle } from "../lib/useTitle";

export default function ExperiencesPage() {
  useTitle("Experiences — Hotel");
  return (
    <div className="font-jost">
      <PageHeader />

      <ExperienceSection />
      <SiteFooter />
    </div>
  );
}
