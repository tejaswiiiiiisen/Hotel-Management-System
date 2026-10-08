
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiArrowRight, FiTag } from "react-icons/fi";

// Hotel deals — the coupons/offers a guest can apply to a stay.


function OfferCard({ tag, title, desc, code, saving, valid }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_6px_20px_rgba(31,34,51,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(31,34,51,0.12)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-steel">
          <FiTag className="h-3.5 w-3.5" /> {tag}
        </span>
        <span className="text-sm font-bold text-emerald-600">Save {saving}</span>
      </div>

      <h3 className="mt-3 text-lg font-bold text-navy">{title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{desc}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="rounded-md border border-dashed border-slate-300 px-3 py-1 font-mono text-sm font-semibold text-navy">
          {code}
        </span>
        <Link
          to={`/booking?offer=${code}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Get Deal <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="mt-2 text-xs text-slate-400">Valid till {valid}</p>
    </div>
  );
}

import { apiFetch } from "../../lib/api";

export default function OffersContent() {
  const [query, setQuery] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/offers?activeOnly=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Map backend offer format to frontend format
          const mappedOffers = data.map(o => ({
            tag: o.room_type || o.branch_id || "Stay",
            title: o.name,
            desc: `Enjoy this special offer! Valid for min ${o.min_nights} nights.`,
            code: o.coupon_code,
            saving: o.discount_type === 'percent' ? `${o.discount_value}%` : `₹${o.discount_value}`,
            valid: o.valid_to ? new Date(o.valid_to).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Ongoing",
          }));
          setOffers(mappedOffers);
        }
      })
      .catch((err) => console.error("Failed to load offers:", err))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? offers.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.tag.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q)
      )
    : offers;

  return (
    <div className="bg-cream">
      {/* Hero + search */}
      <section className="px-4 pb-10 pt-10 text-center sm:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-steel">
            <FiTag className="h-3.5 w-3.5" /> Offers & Coupons
          </span>
          <h1 className="mt-5 text-[clamp(38px,6vw,64px)] font-extrabold tracking-tight text-navy">
            We have a deal for your stay!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500">
            With <span className="font-semibold text-navy">{offers.length}</span>{" "}
            live offers across rooms, dining and spa, there&rsquo;s a coupon to
            save you an average of{" "}
            <span className="font-semibold text-steel">₹1500</span> on your next
            lakeside escape.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_10px_30px_rgba(31,34,51,0.10)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center text-slate-400">
              <FiSearch className="h-5 w-5" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. spa, breakfast, weekend…"
              className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder-slate-400"
            />
            <button
              type="button"
              onClick={() => setQuery(query)}
              className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            e.g. Spa, Dining, Weekend, Family, Suite, Stay
          </p>
        </div>
      </section>

      {/* Offer cards */}
      <section className="px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-lg font-bold text-navy">
            {q ? `Results for “${query}”` : "Today's popular offers"}
          </h2>

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-14 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                No offers match “{query}”. Try “spa”, “weekend” or clear the
                search.
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Show all offers
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((o) => (
                <OfferCard key={o.code} {...o} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter / referral band */}
      <section className="px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-navy px-8 py-14 sm:px-16 sm:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/60">
                Never miss a deal
              </p>
              <h2 className="mt-3 text-[clamp(26px,4vw,40px)] font-extrabold leading-[1.1] text-white">
                Get exclusive offers in your inbox
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Join our list for members-only rates, seasonal packages and early
                access to the best lakeside deals.
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white placeholder-white/50 outline-none focus:border-white/50"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
