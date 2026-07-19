'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, ShieldCheck, Users, Activity, Ticket,
  Brain, Zap, Building2, Megaphone, Sparkles, Star, X,
  Twitter, Instagram, Github, PlayCircle, Globe2, MapPin,
} from 'lucide-react';
import gsap from 'gsap';

/* ---------------------------------------------------------------- */
/*  Neo-brutalist landing — cream canvas, black ink, lime highlight  */
/* ---------------------------------------------------------------- */

function Highlight({ children, tone = 'lime' }: { children: React.ReactNode; tone?: 'lime' | 'white' | 'ink' }) {
  const tones = {
    lime: 'bg-[#B9FF66] text-[#191A23]',
    white: 'bg-white text-[#191A23]',
    ink: 'bg-[#191A23] text-white',
  };
  return (
    <span className={`${tones[tone]} rounded-lg px-2 py-0.5 box-decoration-clone leading-snug`}>
      {children}
    </span>
  );
}

// Role Selection Modal for Staff Portal
function StaffPortalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191A23]/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border-2 border-[#191A23] shadow-[6px_6px_0_0_#191A23] max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-[#191A23]">Staff Portal</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full border-2 border-[#191A23] flex items-center justify-center text-[#191A23] hover:bg-[#B9FF66] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Link href="/organizer" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#191A23] hover:bg-[#B9FF66] transition-colors group">
            <div className="p-3 bg-[#191A23] text-[#B9FF66] rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-[#191A23]">Organizer / Admin</div>
              <div className="text-xs text-slate-500 group-hover:text-[#191A23]/70 font-medium">Manage stadium operations &amp; staff</div>
            </div>
          </Link>
          <Link href="/volunteer" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#191A23] hover:bg-[#B9FF66] transition-colors group">
            <div className="p-3 bg-[#191A23] text-[#B9FF66] rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-[#191A23]">Volunteer Staff</div>
              <div className="text-xs text-slate-500 group-hover:text-[#191A23]/70 font-medium">Access SOPs and on-ground tasks</div>
            </div>
          </Link>
        </div>
        <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Not a volunteer yet? <Link href="/volunteer" className="font-black text-[#191A23] underline decoration-[#B9FF66] decoration-2 underline-offset-2">Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* Doodle-style decorative megaphone cluster for the hero */
function HeroDoodle() {
  return (
    <div className="relative w-full max-w-[440px] aspect-square mx-auto">
      {/* Orbit rings */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full text-[#191A23]" fill="none">
        <ellipse cx="200" cy="200" rx="185" ry="70" stroke="currentColor" strokeWidth="2.5" transform="rotate(-18 200 200)" />
        <ellipse cx="200" cy="200" rx="150" ry="52" stroke="currentColor" strokeWidth="2.5" transform="rotate(-18 200 200)" strokeDasharray="6 8" />
      </svg>

      {/* Center stadium mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-40 h-40 rounded-3xl bg-[#191A23] border-2 border-[#191A23] shadow-[8px_8px_0_0_#B9FF66] flex items-center justify-center rotate-[-6deg] gsap-hero-image">
          <Building2 className="w-16 h-16 text-[#B9FF66]" strokeWidth={1.5} />
          <Megaphone className="absolute -top-5 -right-5 w-12 h-12 text-[#191A23] bg-[#B9FF66] rounded-2xl p-2.5 border-2 border-[#191A23] rotate-12" />
        </div>
      </div>

      {/* Floating chips along the orbit */}
      <div className="absolute top-[6%] right-[16%] w-12 h-12 rounded-full bg-[#191A23] flex items-center justify-center gsap-float">
        <Ticket className="w-5 h-5 text-[#B9FF66]" />
      </div>
      <div className="absolute top-[30%] right-[2%] w-12 h-12 rounded-full bg-[#191A23] flex items-center justify-center gsap-float">
        <PlayCircle className="w-5 h-5 text-white" />
      </div>
      <div className="absolute bottom-[24%] right-[10%] w-12 h-12 rounded-full bg-[#B9FF66] border-2 border-[#191A23] flex items-center justify-center gsap-float">
        <MapPin className="w-5 h-5 text-[#191A23]" />
      </div>
      <div className="absolute bottom-[8%] left-[18%] w-12 h-12 rounded-full bg-white border-2 border-[#191A23] flex items-center justify-center gsap-float">
        <Users className="w-5 h-5 text-[#191A23]" />
      </div>
      <div className="absolute top-[18%] left-[8%] gsap-float">
        <Star className="w-9 h-9 text-[#191A23] fill-[#B9FF66]" />
      </div>
      <div className="absolute bottom-[38%] left-[0%] gsap-float">
        <Sparkles className="w-8 h-8 text-[#191A23]" />
      </div>
    </div>
  );
}

const SERVICES = [
  {
    title: ['Fan Hub &', 'Live Match Center'],
    icon: Ticket,
    href: '/login',
    linkLabel: 'Learn more',
    theme: 'white' as const, // white card, lime title
    desc: 'Tickets, live scores & AI journeys',
  },
  {
    title: ['Digital Twin', 'Command Center'],
    icon: Brain,
    href: null, // opens staff modal
    linkLabel: 'Learn more',
    theme: 'ink' as const, // black card, white title
    desc: 'Real-time crowd ops for admins',
  },
  {
    title: ['Volunteer', 'Toolkit'],
    icon: Users,
    href: '/volunteer',
    linkLabel: 'Learn more',
    theme: 'white' as const,
    desc: 'AI SOPs & zone assignments',
  },
  {
    title: ['AI Match', 'Intelligence'],
    icon: Zap,
    href: '/match-hub',
    linkLabel: 'Learn more',
    theme: 'ink' as const,
    desc: 'Commentary, what-ifs & reports',
  },
];

const CASE_STUDIES = [
  {
    text: 'During a sold-out derby, the Digital Twin flagged a concourse bottleneck 12 minutes early — volunteers were re-dispatched and queues cleared before halftime.',
    link: 'Learn more',
  },
  {
    text: 'AI-generated SOPs cut volunteer incident response time in half across three stadiums, keeping 100k+ fans moving safely on match day.',
    link: 'Learn more',
  },
  {
    text: 'Fans using the smart journey planner reached their seats 30% faster, driving record merchandise sales before kickoff.',
    link: 'Learn more',
  },
];

export default function LandingPage() {
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const smoothScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.gsap-hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 })
      .fromTo('.gsap-hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
      .fromTo('.gsap-hero-cta', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.3')
      .fromTo('.gsap-hero-image', { opacity: 0, scale: 0.8, rotate: -14 }, { opacity: 1, scale: 1, rotate: -6, duration: 1, ease: 'elastic.out(1, 0.7)' }, '-=0.5')
      .fromTo('.gsap-float', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(2)' }, '-=0.7');

    // Gentle idle float on the chips
    gsap.to('.gsap-float', {
      y: -8,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.3, yoyoEase: true },
      delay: 1.2,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target.querySelectorAll('.gsap-rise'),
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.gsap-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#191A23] font-sans overflow-x-hidden selection:bg-[#B9FF66] selection:text-[#191A23]">
      {/* ---------- NAV ---------- */}
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-[#191A23] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#B9FF66]" />
          </span>
          StadiumMind
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a
            href="#about"
            onClick={(e) => { e.preventDefault(); smoothScrollTo('about'); }}
            className="hover:underline underline-offset-4 decoration-[#B9FF66] decoration-2"
          >
            About us
          </a>
          <a
            href="#services"
            onClick={(e) => { e.preventDefault(); smoothScrollTo('services'); }}
            className="hover:underline underline-offset-4 decoration-[#B9FF66] decoration-2"
          >
            Services
          </a>
          <a
            href="#cases"
            onClick={(e) => { e.preventDefault(); smoothScrollTo('cases'); }}
            className="hover:underline underline-offset-4 decoration-[#B9FF66] decoration-2"
          >
            Case Study
          </a>
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="hover:underline underline-offset-4 decoration-[#B9FF66] decoration-2"
          >
            Staff Portal
          </button>
        </div>
        <Link
          href="/login"
          className="px-6 py-3 rounded-2xl border-2 border-[#191A23] text-sm font-bold hover:bg-[#191A23] hover:text-[#B9FF66] transition-colors"
        >
          Fan Login
        </Link>
      </nav>

      {/* ---------- HERO ---------- */}
      <header className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.08] tracking-tight gsap-hero-title">
            Navigating the <br />
            match day landscape <br />
            for <Highlight>success</Highlight>
          </h1>
          <p className="mt-6 text-slate-600 text-base md:text-lg font-medium leading-relaxed max-w-md gsap-hero-desc">
            Our AI-powered platform helps stadiums run flawless events through a
            digital twin, live fan engagement, volunteer coordination, and real-time
            operations intelligence.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 gsap-hero-cta">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#191A23] text-white text-sm font-bold hover:bg-[#B9FF66] hover:text-[#191A23] transition-colors shadow-[4px_4px_0_0_#B9FF66] hover:shadow-[4px_4px_0_0_#191A23]"
            >
              Book your match day <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border-2 border-[#191A23] text-sm font-bold hover:bg-white transition-colors"
            >
              Staff Portal
            </button>
          </div>
        </div>
        <HeroDoodle />
      </header>

      {/* ---------- PARTNER / TRUST STRIP ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-20" id="about">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 opacity-80">
          {['FIFA 2026', 'MetLife Arena', 'Azteca', 'BMO Field', 'SoFi Stadium', 'Estadio BBVA'].map((n) => (
            <span key={n} className="font-black text-lg sm:text-xl tracking-tight text-[#191A23]/80 italic">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 gsap-section" id="services">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 gsap-rise">
          <h2 className="text-3xl font-black shrink-0">
            <Highlight>Services</Highlight>
          </h2>
          <p className="text-sm font-medium text-slate-600 max-w-xl">
            One intelligent ecosystem for everyone in the stadium — fans, volunteers,
            and organizers. These experiences include:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const isInk = s.theme === 'ink';
            const inner = (
              <>
                <div className="flex items-start justify-between gap-6">
                  <h3 className="text-2xl font-black leading-snug">
                    {s.title.map((line) => (
                      <span key={line} className="block w-max max-w-full">
                        <Highlight tone={isInk ? 'white' : 'lime'}>{line}</Highlight>
                      </span>
                    ))}
                  </h3>
                  <div
                    className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-300 ${
                      isInk ? 'border-[#B9FF66]/40 bg-white/5 text-[#B9FF66]' : 'border-[#191A23] bg-[#F3F3F3] text-[#191A23]'
                    }`}
                  >
                    <Icon className="w-10 h-10" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 mt-10">
                  <span className={`inline-flex items-center gap-3 text-sm font-bold ${isInk ? 'text-white' : 'text-[#191A23]'}`}>
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center ${isInk ? 'bg-white text-[#191A23]' : 'bg-[#191A23] text-[#B9FF66]'}`}>
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                    {s.linkLabel}
                  </span>
                  <span className={`text-xs font-medium hidden sm:block ${isInk ? 'text-white/60' : 'text-slate-500'}`}>
                    {s.desc}
                  </span>
                </div>
              </>
            );

            const cardClass = `group block rounded-[2.5rem] border-2 border-[#191A23] p-8 sm:p-10 shadow-[0_6px_0_0_#191A23] hover:shadow-[0_2px_0_0_#191A23] hover:translate-y-1 transition-all duration-200 gsap-rise ${
              isInk ? 'bg-[#191A23] text-white' : 'bg-white text-[#191A23]'
            }`;

            return s.href ? (
              <Link key={s.title.join()} href={s.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <button key={s.title.join()} onClick={() => setIsStaffModalOpen(true)} className={`${cardClass} text-left w-full`}>
                {inner}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- CTA BAND ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 gsap-section">
        <div className="relative rounded-[2.5rem] bg-[#E8E8E8] border-2 border-transparent p-10 sm:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 overflow-hidden gsap-rise">
          <div className="max-w-lg relative z-10">
            <h3 className="text-3xl font-black mb-4">Let&apos;s make match day happen</h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-8">
              Sign in to explore how StadiumMind&apos;s digital twin, live match center,
              and AI copilots can help your event run safer, smarter, and smoother.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#191A23] text-white text-sm font-bold hover:bg-[#B9FF66] hover:text-[#191A23] transition-colors"
            >
              Get your free access <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Playful shapes */}
          <div className="relative w-56 h-40 shrink-0 hidden sm:block">
            <div className="absolute right-16 top-0 w-28 h-28 rounded-full bg-[#191A23] flex items-center justify-center gap-3">
              <span className="w-3.5 h-6 rounded-full bg-[#B9FF66]" />
              <span className="w-3.5 h-6 rounded-full bg-[#B9FF66]" />
            </div>
            <Star className="absolute right-0 bottom-2 w-16 h-16 text-[#B9FF66] fill-[#B9FF66]" />
            <Star className="absolute left-0 bottom-0 w-10 h-10 text-slate-400 fill-slate-300" />
          </div>
        </div>
      </section>

      {/* ---------- CASE STUDY ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 gsap-section" id="cases">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 gsap-rise">
          <h2 className="text-3xl font-black shrink-0">
            <Highlight>Case Study</Highlight>
          </h2>
          <p className="text-sm font-medium text-slate-600 max-w-xl">
            Explore real examples of how StadiumMind transformed match day operations
            through AI-driven intelligence.
          </p>
        </div>

        <div className="rounded-[2.5rem] bg-[#191A23] text-white p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 md:divide-x md:divide-white/20 gsap-rise">
          {CASE_STUDIES.map((c, i) => (
            <div key={i} className="md:px-6 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-6">
              <p className="text-sm leading-relaxed text-white/85 font-medium">{c.text}</p>
              <span className="inline-flex items-center gap-2 text-[#B9FF66] text-sm font-bold">
                {c.link} <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 gsap-section">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: '3', label: 'Live Stadiums' },
            { n: '24/7', label: 'Real-time Sync' },
            { n: '100k+', label: 'Capacity Managed' },
            { n: 'AI', label: 'Driven Operations' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[2rem] bg-white border-2 border-[#191A23] p-6 text-center shadow-[0_5px_0_0_#191A23] gsap-rise"
            >
              <div className="text-4xl font-black mb-1">
                <Highlight>{s.n}</Highlight>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="max-w-7xl mx-auto px-6 md:px-12 pb-10">
        <div className="rounded-t-[2.5rem] bg-[#191A23] text-white px-8 sm:px-14 pt-14 pb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/15">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tight">
              <span className="w-9 h-9 rounded-xl bg-[#B9FF66] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#191A23]" />
              </span>
              StadiumMind
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-medium">
              <Link href="/login" className="underline underline-offset-4 decoration-transparent hover:decoration-[#B9FF66] transition-colors">Fan Hub</Link>
              <button onClick={() => setIsStaffModalOpen(true)} className="underline underline-offset-4 decoration-transparent hover:decoration-[#B9FF66] transition-colors">Admin Dashboard</button>
              <Link href="/volunteer" className="underline underline-offset-4 decoration-transparent hover:decoration-[#B9FF66] transition-colors">Volunteer Toolkit</Link>
              <Link href="/about" className="underline underline-offset-4 decoration-transparent hover:decoration-[#B9FF66] transition-colors">About</Link>
            </div>
            <div className="flex gap-3">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#191A23] hover:bg-[#B9FF66] transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
            <div>
              <span className="inline-block bg-[#B9FF66] text-[#191A23] font-black text-sm px-3 py-1 rounded-lg mb-4">
                Contact us:
              </span>
              <p className="text-sm text-white/70 font-medium leading-relaxed">
                Email: team@stadiummind.ai <br />
                FIFA World Cup 2026 · North America
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col sm:flex-row gap-3 items-stretch self-center w-full">
              <input
                placeholder="Email"
                className="flex-1 h-12 px-4 rounded-xl bg-transparent border border-white/25 text-sm text-white placeholder:text-white/40 focus:border-[#B9FF66] focus:outline-none transition-colors"
              />
              <button className="h-12 px-6 rounded-xl bg-[#B9FF66] text-[#191A23] text-sm font-black hover:bg-white transition-colors">
                Subscribe to updates
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 font-medium">
            <span>© {new Date().getFullYear()} StadiumMind AI. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" /> Made for FIFA World Cup 2026
            </span>
          </div>
        </div>
      </footer>

      <StaffPortalModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />
    </div>
  );
}
