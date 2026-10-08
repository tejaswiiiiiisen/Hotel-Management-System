const fs = require('fs');

let content = fs.readFileSync('src/pages/BookingPage.tsx', 'utf8');

// 1. Replace the Progress Stepper
const oldStepper = `{/* PROGRESS STEP BAR (STEPS 1 - 3) */}
        {step < 4 && (
          <div className="mb-10 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors \${
                  step === 1 ? "bg-amber-500 text-white" : "text-slate-500 hover:text-navy dark:hover:text-white"
                }\`}
              >
                <span>1. Dates &amp; Room</span>
              </button>

              <span className="text-slate-300">→</span>

              <button
                type="button"
                onClick={() => selectedRoom && setStep(2)}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors \${
                  step === 2 ? "bg-amber-500 text-white" : "text-slate-500 hover:text-navy dark:hover:text-white"
                }\`}
              >
                <span>2. Guest Details</span>
              </button>

              <span className="text-slate-300">→</span>

              <button
                type="button"
                onClick={() => selectedRoom && guestName && setStep(3)}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors \${
                  step === 3 ? "bg-amber-500 text-white" : "text-slate-500 hover:text-navy dark:hover:text-white"
                }\`}
              >
                <span>3. Payment &amp; Confirm</span>
              </button>
            </div>
          </div>
        )}`;

const newStepper = `{/* PROGRESS STEP BAR (STEPS 1 - 3) */}
        {step < 4 && (
          <div className="mb-6 lg:mb-10">
            {/* Mobile Compact Stepper */}
            <div className="lg:hidden flex flex-col gap-2 mb-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Step {step} of 3</div>
              <div className="text-lg font-bold text-navy dark:text-white">
                {step === 1 && "Dates & Room"}
                {step === 2 && "Guest Details"}
                {step === 3 && "Payment & Confirm"}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={\`h-1.5 flex-1 rounded-full transition-colors \${step >= 1 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}\`} />
                <div className={\`h-1.5 flex-1 rounded-full transition-colors \${step >= 2 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}\`} />
                <div className={\`h-1.5 flex-1 rounded-full transition-colors \${step >= 3 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}\`} />
              </div>
            </div>

            {/* Desktop Stepper */}
            <div className="hidden lg:flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 text-sm font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all \${
                  step === 1 ? "bg-amber-500 text-white shadow-md scale-105" : step > 1 ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "text-slate-500 hover:text-navy dark:hover:text-white"
                }\`}
              >
                {step > 1 ? <FiCheckCircle className="h-5 w-5" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px] bg-opacity-20">1</span>}
                <span>Dates &amp; Room</span>
              </button>

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-6" />

              <button
                type="button"
                onClick={() => selectedRoom && setStep(2)}
                className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all \${
                  step === 2 ? "bg-amber-500 text-white shadow-md scale-105" : step > 2 ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "text-slate-500 hover:text-navy dark:hover:text-white"
                } \${!selectedRoom ? "opacity-50 cursor-not-allowed" : ""}\`}
                disabled={!selectedRoom}
              >
                {step > 2 ? <FiCheckCircle className="h-5 w-5" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] text-inherit border border-current">2</span>}
                <span>Guest Details</span>
              </button>

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-6" />

              <button
                type="button"
                onClick={() => selectedRoom && guestName && setStep(3)}
                className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all \${
                  step === 3 ? "bg-amber-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-navy dark:hover:text-white"
                } \${(!selectedRoom || !guestName) ? "opacity-50 cursor-not-allowed" : ""}\`}
                disabled={!selectedRoom || !guestName}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] text-inherit border border-current">3</span>
                <span>Payment &amp; Confirm</span>
              </button>
            </div>
          </div>
        )}`;

content = content.replace(oldStepper, newStepper);


// 2. Dates & Guests Layout
const oldDates = `<div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-In Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={today}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-Out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Guests</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                    </select>
                  </div>
                </div>`;

const newDates = `<div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-In Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={today}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-Out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Guests</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                    </select>
                  </div>
                </div>`;
content = content.replace(oldDates, newDates);


// 3. Room Cards Layout
const oldCards = `<div
                          key={r.id}
                          onClick={() => !isOccupied && setSelectedRoom(r)}
                          className={\`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer \${
                            isOccupied
                              ? "opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed dark:bg-slate-800/40 dark:border-slate-800"
                              : isSelected
                              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 dark:bg-amber-950/40"
                              : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                          }\`}
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={r.image || "/images/rooms/room-1.avif"}
                              alt={r.name}
                              className="h-16 w-20 rounded-xl object-cover"
                            />
                            <div>
                              <h3 className="font-bold text-base text-navy dark:text-white flex items-center gap-2">
                                <span>{r.name}</span>
                                <span className={\`text-xs px-2.5 py-0.5 rounded-full font-bold \${
                                  isOccupied
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }\`}>
                                  {isOccupied ? "🔴 Occupied / Booked" : "🟢 Available"}
                                </span>
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {r.orgId === "AS435" ? "📍 Ashirwad Branch" : r.orgId === "CH560" ? "📍 Cheery Clothing Branch" : r.orgId === "MA330" ? "📍 Matcha Tea Branch" : "📍 Main Branch"}
                                </span>
                                <span className="text-xs text-slate-500">{r.type} · Up to {r.capacity} Guests</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-bold text-navy dark:text-white">
                              ₹{r.pricePerNight.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs text-slate-400 block">/ night</span>
                          </div>
                        </div>`;

const newCards = `<div
                          key={r.id}
                          onClick={() => !isOccupied && setSelectedRoom(r)}
                          className={\`flex flex-col sm:flex-row overflow-hidden rounded-2xl border transition-all cursor-pointer \${
                            isOccupied
                              ? "opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed dark:bg-slate-800/20 dark:border-slate-800"
                              : isSelected
                              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/30 shadow-md dark:bg-amber-950/40"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:border-slate-700"
                          }\`}
                        >
                          <div className="w-full sm:w-48 lg:w-56 flex-shrink-0 relative">
                            <img
                              src={r.image || "/images/rooms/room-1.avif"}
                              alt={r.name}
                              className="w-full h-full aspect-[16/9] sm:aspect-[4/3] object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                <FiCheck /> Selected
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="font-bold text-lg sm:text-base text-navy dark:text-white break-words">
                                  {r.name}
                                </h3>
                                <span className={\`text-[10px] sm:text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap \${
                                  isOccupied
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                }\`}>
                                  {isOccupied ? "Occupied" : "Available"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200/50 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50">
                                  {r.orgId === "AS435" ? "📍 Ashirwad Branch" : r.orgId === "CH560" ? "📍 Cheery Clothing" : r.orgId === "MA330" ? "📍 Matcha Tea" : "📍 Main Branch"}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{r.type} · Up to {r.capacity} Guests</span>
                              </div>
                            </div>

                            <div className="mt-4 sm:mt-0 flex items-end justify-between sm:justify-end sm:gap-6 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 dark:border-slate-800">
                              <div className="text-left sm:text-right">
                                <span className="text-xl sm:text-lg font-black text-navy dark:text-white block sm:inline">
                                  ₹{r.pricePerNight.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] sm:text-xs text-slate-400 ml-1">/ night</span>
                              </div>
                              
                              <button 
                                type="button"
                                className={\`sm:hidden px-4 py-2 rounded-xl text-sm font-bold transition-colors \${
                                  isOccupied ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : isSelected ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-900 text-white dark:bg-slate-700'
                                }\`}
                                disabled={isOccupied}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        </div>`;

content = content.replace(oldCards, newCards);


// 4. Summary Aside CTA
const oldContinueBtn = `<button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md hover:from-amber-600 hover:to-amber-700"
                    >
                      Continue to Guest Details →
                    </button>`;

const newContinueBtn = `<div className="hidden lg:block">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition-transform active:scale-95"
                      >
                        Continue to Guest Details →
                      </button>
                    </div>`;

content = content.replace(oldContinueBtn, newContinueBtn);

// 5. Mobile Sticky CTA for Step 1
const oldStep1Close = `</div>
            </div>
          </div>
        )}

        {/* STEP 2: GUEST DETAILS */}`;

const newStep1Close = `</div>
            </div>

            {/* MOBILE STICKY CTA */}
            {selectedRoom && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-40 dark:bg-slate-900 dark:border-slate-800 animate-slideUp">
                 <div className="max-w-5xl mx-auto flex gap-4 items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total for {nights} Night{nights>1?'s':''}</span>
                     <span className="text-xl font-black text-amber-600 leading-none">₹{totalAmount.toLocaleString("en-IN")}</span>
                   </div>
                   <button 
                     onClick={() => setStep(2)} 
                     className="flex-1 max-w-[200px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-transform"
                   >
                     Continue →
                   </button>
                 </div>
              </div>
            )}
            {/* ADD PADDING ON MOBILE SO STICKY CTA DOESNT COVER CONTENT */}
            {selectedRoom && <div className="h-24 lg:hidden" />}
          </div>
        )}

        {/* STEP 2: GUEST DETAILS */}`;

content = content.replace(oldStep1Close, newStep1Close);


// 6. Global page wrappers for mobile layout improvements
content = content.replace(
  `<main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">`,
  `<main className="mx-auto max-w-[1200px] px-4 py-6 sm:py-8 lg:py-12 sm:px-6 lg:px-8">`
);

// 7. Adjust Step 2 width for two-column desktop feel? No, user said:
// "Flexible two-column where appropriate... Desktop two column layout"
// Step 2 is just the guest details form, right now it is \`max-w-2xl mx-auto\`. That's fine because forms look bad if they are too wide.
// Let's refine Step 2 and 3 padding.
content = content.replace(
  `{step === 2 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">`,
  `{step === 2 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">`
);

content = content.replace(
  `{step === 3 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">`,
  `{step === 3 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">`
);

// Ensure the main outer div of booking page has pb-24 to prevent footer clipping on mobile
content = content.replace(
  "min-h-screen bg-cream font-jost text-navy dark:bg-slate-950 dark:text-white",
  "min-h-screen bg-cream font-jost text-navy dark:bg-slate-950 dark:text-white pb-10 sm:pb-0"
);

fs.writeFileSync('src/pages/BookingPage.tsx', content);
console.log("Refactoring complete");
