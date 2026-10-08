import { ArrowRight } from "./icons";

// "YOUR EVENT AT THE NILS" — a white stadium-shaped card with a navy crescent
// bulging from its right end, headline + copy on the left and an outlined
// "Plan your event" pill.
export default function EventCTA() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-[60px] bg-white sm:rounded-[90px]">
        {/* Navy crescent peeking from the right edge */}
        <div className="pointer-events-none absolute right-[-160px] top-1/2 aspect-square h-[160%] -translate-y-1/2 rounded-full bg-navy" />

        <div className="relative z-10 flex flex-col gap-10 px-8 py-14 sm:px-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:pr-40">
          <div className="max-w-xl">
            <h2 className="font-display uppercase leading-[1.02] text-navy text-[clamp(36px,5vw,64px)]">
              Your event at the Hotel
            </h2>
            <p className="mt-6 max-w-md font-jost text-[17px] leading-relaxed text-navy/85">
              Whether it&rsquo;s a conference, a wedding, or a private or
              corporate gathering at Lake Neusiedl, the Hotel is the perfect venue
              for your special occasion.
            </p>
          </div>

          <button
            type="button"
            className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-brand px-8 py-4 font-jost text-[16px] text-white transition-opacity hover:opacity-90 lg:self-auto"
          >
            <ArrowRight className="h-5 w-5" />
            Plan your event
          </button>
        </div>
      </div>
    </div>
  );
}
