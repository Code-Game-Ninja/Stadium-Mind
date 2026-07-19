'use client';

import Link from 'next/link';
import {
  Brain,
  Shield,
  Zap,
  Globe2,
  Users,
  Trophy,
  ArrowRight,
  HeartHandshake,
  Radio,
  MapPin,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Intelligence',
    description:
      'Google Gemini AI analyses live crowd data, weather, incidents, and transport to generate real-time recommendations and prevent problems before they happen.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Radio,
    title: 'Live Match Center',
    description:
      'Real-time score updates, AI-generated commentary, player lineups, and match events — all in one place for every fan.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: MapPin,
    title: 'Smart Fan Journey',
    description:
      'Personalised step-by-step journey from your front door to your seat, factoring in your arrival method, accessibility needs, and live stadium conditions.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Shield,
    title: 'Ticket Verification',
    description:
      'Instant ticket verification against a secure database. Supports both ticket ID and QR code payloads, creating a guest profile for each verified fan.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Users,
    title: 'Volunteer Coordination',
    description:
      'Real-time volunteer management with AI-generated SOPs for any incident type — from lost children to medical emergencies.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Globe2,
    title: 'Global Matches',
    description:
      'Track matches from stadiums around the world. See live scores, fixtures, and stats from every major tournament simultaneously.',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

const stats = [
  { value: '80,000+', label: 'Fan capacity managed' },
  { value: '<2s', label: 'AI response time' },
  { value: '24/7', label: 'Real-time monitoring' },
  { value: '6', label: 'AI-powered modules' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              SM
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">StadiumMind</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Back to Hub <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300">
            <Trophy className="h-4 w-4" /> Built for the World Cup Era
          </div>
          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            The AI Brain Behind<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Every Great Stadium
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            StadiumMind is an AI-powered stadium operations platform that gives organisers real-time intelligence,
            gives fans personalised match-day experiences, and gives volunteers instant SOP guidance — all in one
            unified system.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-slate-900">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">Platform Features</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              Everything you need, powered by AI
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              From ticket verification to live AI commentary, StadiumMind covers every aspect of modern stadium operations.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">Built For Everyone</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Three portals, one platform</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'For Fans',
                desc: 'Verify your ticket, plan your journey, track live scores, chat with AI, and request help from volunteers — all from your phone.',
                href: '/',
                cta: 'Go to Fan Portal',
                color: 'bg-blue-600',
              },
              {
                icon: Brain,
                title: 'For Organisers',
                desc: 'Monitor the entire stadium in real time, manage AI recommendations, run what-if simulations, and control live match data.',
                href: '/organizer',
                cta: 'Go to Admin Panel',
                color: 'bg-slate-800',
              },
              {
                icon: HeartHandshake,
                title: 'For Volunteers',
                desc: 'Get instant AI-generated SOPs for any incident, translate messages to any language, and manage your assigned zone efficiently.',
                href: '/volunteer',
                cta: 'Go to Volunteer Portal',
                color: 'bg-teal-600',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  <Link
                    href={card.href}
                    className={`mt-5 inline-flex items-center gap-2 rounded-xl ${card.color} px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90`}
                  >
                    {card.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">Technology</p>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900">Built with modern tools</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Next.js 14', 'TypeScript', 'Google Gemini AI', 'Node.js', 'Turborepo', 'Tailwind CSS', 'Lucide Icons', 'Firebase'].map(
              (tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Zap className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
          <h2 className="mb-4 text-4xl font-black tracking-tight">Ready to experience it?</h2>
          <p className="mb-8 text-lg text-blue-200">
            Explore the live demo with real AI-powered match data, stadium maps, and ticket verification.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg transition-transform hover:scale-105"
          >
            Open StadiumMind <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} StadiumMind AI · Built for modern sports operations
        </div>
      </footer>
    </div>
  );
}
