import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import EventRegistrationModal from "@/components/EventRegistrationModal";

const YAADEIN_IMG =
  "https://images.unsplash.com/photo-1541508159146-2ab9c877e804?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function formatDate(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function sessionLabel(title) {
  if (/lunch/i.test(title)) return "Lunch";
  if (/dinner/i.test(title)) return "Dinner";
  return "";
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [active, setActive] = useState(null);
  const [reload, setReload] = useState(0);
  const [prices, setPrices] = useState({ veg: 2500, nonveg: 2800 });

  useEffect(() => {
    api
      .get("/events", { params: { upcoming: true } })
      .then((r) => setEvents(r.data || []))
      .catch(() => setEvents([]));
  }, [reload]);

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => setPrices({ veg: r.data?.price_veg ?? 2500, nonveg: r.data?.price_nonveg ?? 2800 }))
      .catch(() => {});
  }, []);

  return (
    <section
      id="events"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 border-t border-[#2D1D1A]"
      data-testid="events-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-14">
          <div className="lg:col-span-8">
            <p className="text-overline">03 — Upcoming Suppers</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              Reserve a{" "}
              <span className="italic text-[#D9772B]">seat at the table.</span>
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[#B5A79E] leading-relaxed">
              Eight seats per evening. (Up to ten for private gatherings.) Menus revealed at the table. Bring someone who eats slowly.
            </p>
            <Link to="/events" className="text-overline inline-flex items-center gap-2 mt-5 hover:text-[#D9772B] transition-colors" data-testid="events-view-archive-link">
              See past chapters <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {(() => {
          const regular = events.filter((e) => !e.coming_soon);
          const yaadein = events.filter((e) => e.coming_soon);
          const yaadeinDesc = yaadein[0]?.description;
          return (
        <>
        {regular.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-[#2D1D1A] bg-[#140A09] p-10 sm:p-16 text-center"
            data-testid="no-events"
          >
            <p className="font-display text-3xl text-[#F3EFE7]">
              The next supper is being plated.
            </p>
            <p className="mt-4 text-[#B5A79E]">
              Join the newsletter below or follow{" "}
              <a href="https://www.instagram.com/biraajo_/" target="_blank" rel="noreferrer" className="text-[#D9772B] underline-offset-4 hover:underline">
                @biraajo_
              </a>{" "}
              — drops happen there first.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2D1D1A]">
            {regular.map((ev, i) => {
              const seatsLeft = ev.seats_total - (ev.seats_booked || 0);
              const soldOut = seatsLeft <= 0;
              return (
                <motion.article
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.8, delay: i * 0.08 }}
                  className="bg-[#0A0504] p-7 sm:p-9 hover-lift flex flex-col"
                  data-testid={`event-card-${ev.id}`}
                >
                  {ev.image_url && (
                    <div className="img-zoom relative aspect-[4/3] mb-7 overflow-hidden">
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
                      {ev.tag && (
                        <span className="absolute top-4 left-4 bg-[#0A0504]/80 backdrop-blur-sm px-3 py-1 text-overline text-[#F3EFE7]">
                          {ev.tag}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="font-display text-3xl text-[#F3EFE7] tracking-tight leading-tight">
                    {ev.title}
                  </h3>

                  <div className="mt-5 space-y-2 text-sm text-[#B5A79E]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#D9772B]" />
                      <span>{formatDate(ev.date)}</span>
                      <span className="opacity-50">·</span>
                      <Clock size={14} className="text-[#D9772B]" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#D9772B]" />
                      <span>{ev.venue}</span>
                    </div>
                  </div>

                  <p className="mt-5 text-[#B5A79E] text-sm leading-relaxed line-clamp-3">
                    {ev.description}
                  </p>

                  <div className="mt-7 flex items-end justify-between pt-5 border-t border-[#2D1D1A]">
                    <div>
                      <p className="text-overline">Per seat</p>
                      {(() => {
                        const veg = Number(ev.price_veg ?? prices.veg);
                        const nonveg = Number(ev.price_nonveg ?? prices.nonveg);
                        return veg === nonveg ? (
                          <p className="font-display text-2xl text-[#F3EFE7] mt-1 leading-tight">
                            ₹{veg.toLocaleString("en-IN")} <span className="text-sm text-[#B5A79E]">veg & non-veg</span>
                          </p>
                        ) : (
                          <>
                            <p className="font-display text-2xl text-[#F3EFE7] mt-1 leading-tight">
                              ₹{veg.toLocaleString("en-IN")} <span className="text-sm text-[#B5A79E]">veg</span>
                            </p>
                            <p className="font-display text-2xl text-[#F3EFE7] leading-tight">
                              ₹{nonveg.toLocaleString("en-IN")} <span className="text-sm text-[#B5A79E]">non-veg</span>
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <p className="text-overline">{soldOut ? "Sold out" : "Seats left"}</p>
                      <p className="font-display text-2xl text-[#D9772B] mt-1">
                        {soldOut ? "—" : seatsLeft}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => !soldOut && setActive(ev)}
                    disabled={soldOut}
                    data-testid="event-register-button"
                    className={`mt-6 w-full px-6 py-4 tracking-[0.18em] uppercase text-[11px] transition-all duration-500 ${
                      soldOut
                        ? "border border-[#2D1D1A] text-[#B5A79E] cursor-not-allowed"
                        : "bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504]"
                    }`}
                  >
                    {soldOut ? "Sold out" : "Reserve my seat"}
                  </button>
                </motion.article>
              );
            })}
          </div>
        )}

        {yaadein.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8 }}
            className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-2 border border-[#2D1D1A] bg-[#140A09] overflow-hidden"
            data-testid="yaadein-box"
          >
            <div className="img-zoom relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden">
              <img
                src={YAADEIN_IMG}
                alt="Yaadein — next series"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#140A09] via-[#140A09]/30 to-transparent" />
              <span className="absolute top-5 left-5 bg-[#0A0504]/80 backdrop-blur-sm px-3 py-1 text-overline text-[#F3EFE7]">
                Yaadein
              </span>
            </div>

            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <p className="text-overline text-[#D9772B]">Next series · Coming soon</p>
              <h3 className="font-display text-4xl sm:text-5xl text-[#F3EFE7] mt-4 tracking-tight leading-[1.05]">
                Yaadein
              </h3>
              <p className="mt-5 text-[#B5A79E] leading-relaxed">
                {yaadeinDesc}
              </p>

              <div className="mt-8 pt-6 border-t border-[#2D1D1A]">
                <p className="text-overline mb-4">Dates</p>
                <ul className="space-y-3" data-testid="yaadein-dates">
                  {yaadein.map((ev) => (
                    <li key={ev.id} className="flex items-center gap-3 text-sm text-[#B5A79E]">
                      <Calendar size={14} className="text-[#D9772B] shrink-0" />
                      <span className="text-[#F3EFE7]">{formatDate(ev.date)}</span>
                      {sessionLabel(ev.title) && (
                        <span className="text-[11px] tracking-[0.18em] uppercase text-[#6E625B]">
                          {sessionLabel(ev.title)}
                        </span>
                      )}
                      <span className="opacity-40">·</span>
                      <Clock size={13} className="text-[#D9772B] shrink-0" />
                      <span>{ev.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-8 text-[11px] tracking-[0.22em] uppercase text-[#6E625B]">
                Bookings open soon
              </p>
            </div>
          </motion.div>
        )}
        </>
          );
        })()}
      </div>

      {active && (
        <EventRegistrationModal
          event={active}
          onClose={() => setActive(null)}
          onSuccess={() => {
            setActive(null);
            setReload((n) => n + 1);
          }}
        />
      )}
    </section>
  );
}

