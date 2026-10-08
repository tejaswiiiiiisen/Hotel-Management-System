import Hero from "../components/site/Hero";
import HomeIntro from "../components/site/HomeIntro";
import RoomsCarousel from "../components/site/RoomsCarousel";
import ImpressionGallery from "../components/site/ImpressionGallery";
import MarqueeBand from "../components/site/MarqueeBand";
import SocialWall from "../components/site/SocialWall";
import EventCTA from "../components/site/EventCTA";
import SiteFooter from "../components/site/SiteFooter";
import BookingBar from "../components/site/BookingBar";
import { useTitle } from "../lib/useTitle";

export default function HomePage() {
  useTitle("Hotel");
  return (
    <div className="font-jost">
      <Hero />

      {/* Intro + discover circles + rooms and suites */}
      <HomeIntro />

      {/* Rooms carousel */}
      <RoomsCarousel />

      {/* Impression gallery band */}
      <ImpressionGallery />

      {/* Packages intro + scrolling marquee band */}
      <MarqueeBand />

      {/* Social media wall */}
      <SocialWall />

      {/* Event CTA on the cream page — extra bottom padding leaves room for the
          discover cards to straddle into the footer below. */}
      <section className="bg-cream pt-24 pb-[170px]">
        <EventCTA />
      </section>

      <SiteFooter />

      {/* Fixed booking bar shared across the whole site */}
      <BookingBar />
    </div>
  );
}
