import PageHeader from "../components/site/PageHeader";
import RoomsBrowser from "../components/site/RoomsBrowser";
import SiteFooter from "../components/site/SiteFooter";
import { useTitle } from "../lib/useTitle";

export default function RoomsPage() {
  useTitle("Rooms & Suites — Luxury Stays");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PageHeader />

      {/* Main Container */}
      <main className="mx-auto w-full px-4 sm:px-8 md:px-12 max-w-[1920px] pt-4 pb-20">
        <RoomsBrowser />
      </main>

      <SiteFooter />
    </div>
  );
}
