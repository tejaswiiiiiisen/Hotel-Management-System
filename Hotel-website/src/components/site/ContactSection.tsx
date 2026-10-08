import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiMessageSquare,
  FiHelpCircle,
  FiChevronDown,
  FiArrowRight,
} from "react-icons/fi";

// Small square icon chip used by the contact-detail card.
function InfoChip({ icon: Icon }) {
  return (
    <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-sm">
      <Icon className="h-4 w-4" />
    </span>
  );
}

// A single contact-detail card — mirrors the About page's team cards (white,
// soft border + shadow), centred with an icon chip and stacked values.
function InfoCard({ icon, lines }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#ececf3] bg-white p-6 text-center shadow-[0_4px_18px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_26px_rgba(102,126,234,0.15)]">
      <InfoChip icon={icon} />
      {lines.map((l) => (
        <div key={l} className="text-sm text-[#5b6472]">
          {l}
        </div>
      ))}
    </div>
  );
}

// A labelled text input with a leading icon, styled to match the admin panel.
function Field({ label, required = false, icon: Icon, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-navy">
        {label}
        {required && <span className="text-brand-start"> *</span>}
      </label>
      <div className="relative">
        {Icon && (
          <FiIconSlot>
            <Icon className="h-4 w-4" />
          </FiIconSlot>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#dcdce4] bg-white py-3 pl-10 pr-4 text-sm text-[#333] placeholder-[#9aa0ad] outline-none transition focus:border-brand-start focus:ring-2 focus:ring-brand-start/20"
        />
      </div>
    </div>
  );
}

// Labelled native select with a leading icon and a custom chevron.
function SelectField({ label, required = false, icon: Icon, options }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-navy">
        {label}
        {required && <span className="text-brand-start"> *</span>}
      </label>
      <div className="relative">
        {Icon && (
          <FiIconSlot>
            <Icon className="h-4 w-4" />
          </FiIconSlot>
        )}
        <select
          defaultValue=""
          className="w-full appearance-none rounded-lg border border-[#dcdce4] bg-white py-3 pl-10 pr-10 text-sm text-[#333] outline-none transition focus:border-brand-start focus:ring-2 focus:ring-brand-start/20"
        >
          <option value="" disabled>
            Choose one option...
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0ad]" />
      </div>
    </div>
  );
}

// Absolutely-positioned leading icon slot shared by inputs and selects.
function FiIconSlot({ children }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa0ad]">
      {children}
    </span>
  );
}

export default function ContactSection() {
  return (
    <section className="bg-cream px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
        {/* Hero band — soft brand-tinted gradient, matching the About page */}
        <div className="rounded-[24px] bg-gradient-to-br from-brand-start/12 via-white to-brand-end/12 px-6 py-16 text-center sm:py-20">
          <h1 className="text-[clamp(40px,6vw,64px)] font-extrabold tracking-tight text-navy">
            Let&rsquo;s Get In Touch
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#6b7280]">
            Questions, reservations or special requests — we&rsquo;re here for
            all of it.
            <br />
            Reach us directly, or drop a note below.
          </p>
        </div>

        {/* Contact details — centred cards, like the About team cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <InfoCard
            icon={FiPhone}
            lines={["+123 45 789 000", "+123 45 789 000"]}
          />
          <InfoCard
            icon={FiMail}
            lines={["inquiry@hotel.com", "help@hotel.com"]}
          />
          <InfoCard
            icon={FiMapPin}
            lines={["221b Elementary Street", "New York, NY"]}
          />
        </div>

        <hr className="my-12 border-[#e2e2ea]" />

        <h2 className="text-center text-[clamp(22px,3vw,30px)] font-extrabold text-navy">
          Or fill out the form below
        </h2>

        <form className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <SelectField
            label="Inquiry Purpose"
            required
            icon={FiHelpCircle}
            options={["Reservation", "Event", "Feedback", "Other"]}
          />
          <SelectField
            label="Description that fits you"
            required
            icon={FiBriefcase}
            options={["Guest", "Travel agent", "Corporate", "Press"]}
          />

          <Field
            label="Full Name"
            icon={FiUser}
            placeholder="Enter your full name..."
          />
          <Field
            label="Email Address"
            type="email"
            icon={FiMail}
            placeholder="Enter your email address..."
          />

          <Field
            label="Address"
            icon={FiMapPin}
            placeholder="Enter your address..."
          />
          <Field
            label="Phone Number"
            type="tel"
            icon={FiPhone}
            placeholder="Enter your phone number..."
          />

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[13px] font-semibold text-navy">
              Message <span className="text-brand-start">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-3.5 text-[#9aa0ad]">
                <FiMessageSquare className="h-4 w-4" />
              </span>
              <textarea
                rows={5}
                placeholder="Enter your message here..."
                className="w-full resize-y rounded-lg border border-[#dcdce4] bg-white py-3 pl-10 pr-4 text-sm text-[#333] placeholder-[#9aa0ad] outline-none transition focus:border-brand-start focus:ring-2 focus:ring-brand-start/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-brand px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Submit Form
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
