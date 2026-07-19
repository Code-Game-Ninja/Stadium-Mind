'use client';

import Link from 'next/link';
import { Megaphone, Star, Tag, Clock, ArrowRight, Zap, Gift, Percent, Ticket } from 'lucide-react';

const PROMOS = [
  {
    id: 1,
    badge: '🎁 Exclusive',
    title: 'World Cup 2026 Collector Kit',
    desc: 'Get the official tournament merchandise bundle including jersey, scarf, and limited-edition ball — delivered to your seat.',
    discount: '20% OFF',
    expires: '2 days left',
    color: 'from-ink to-ink-800',
    cta: 'Claim Offer',
  },
  {
    id: 2,
    badge: '⚡ Flash Deal',
    title: 'Half-Time Food & Drink Bundle',
    desc: 'Order food and drinks for half-time delivery to your section. Beat the queues and enjoy the break!',
    discount: 'FREE Delivery',
    expires: '4h left',
    color: 'from-orange-500 to-red-600',
    cta: 'Order Now',
  },
  {
    id: 3,
    badge: '🌟 VIP Upgrade',
    title: 'Premium Seat Upgrade',
    desc: 'Upgrade to a hospitality box for the second half. Includes premium catering and dedicated host.',
    discount: 'Limited',
    expires: 'Match day only',
    color: 'from-purple-600 to-pink-600',
    cta: 'Upgrade Now',
  },
];

const PARTNER_DEALS = [
  { name: 'Adidas Fan Zone', icon: '👟', deal: '30% off all World Cup merchandise', code: 'WC2026FAN' },
  { name: 'McDonald\'s Stadium', icon: '🍔', deal: 'Buy 1 Get 1 Free on combo meals', code: 'MCSTADIUM' },
  { name: 'Uber / Taxi', icon: '🚗', deal: '15% off rides to/from the stadium', code: 'STADRIDE15' },
  { name: 'Marriott Hotels', icon: '🏨', deal: 'Special match day stay packages', code: 'WORLDCUP26' },
];

export default function FanPromotionsPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-ink" />
            </div>
            Promotions
          </h1>
          <p className="text-slate-500 font-medium mt-2">Exclusive deals and offers for StadiumMind fans</p>
        </div>

        {/* Featured Promos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROMOS.map((promo) => (
            <div
              key={promo.id}
              className={`bg-gradient-to-br ${promo.color} rounded-[2rem] p-8 text-white flex flex-col justify-between gap-8 shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden group cursor-pointer`}
            >
              {/* Subtle background glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-widest bg-white/20 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                    {promo.badge}
                  </span>
                  <span className="text-xs font-bold text-white/80 flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5" /> {promo.expires}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight group-hover:text-white/90 transition-colors">{promo.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed font-medium line-clamp-3">{promo.desc}</p>
              </div>
              
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <div className="text-3xl font-black tracking-tighter">{promo.discount}</div>
                <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-900 font-bold hover:scale-110 hover:bg-slate-50 transition-all shadow-lg group-hover:shadow-xl">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Partner Deals */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100/60 flex items-center gap-3 bg-white/40">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Partner Deals</h2>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Special offers from our partners</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100/60 flex-1">
              {PARTNER_DEALS.map((deal) => (
                <div key={deal.name} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      {deal.icon}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-lg tracking-tight mb-0.5 group-hover:text-ink transition-colors">{deal.name}</div>
                      <div className="text-sm font-medium text-slate-500">{deal.deal}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block text-xs font-black font-mono bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200/60 tracking-wider">
                      {deal.code}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:bg-ink group-hover:border-lime group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="bg-gradient-to-br from-slate-900 via-ink-800 to-ink rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-64 h-64 bg-lime-500/20 blur-3xl rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Star className="w-7 h-7 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight group-hover:text-yellow-400 transition-colors">StadiumMind Rewards</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">Earn points at every match</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Ticket, label: 'Matches Attended', value: '1' },
                  { icon: Zap, label: 'Points Earned', value: '250' },
                  { icon: Gift, label: 'Rewards Available', value: '3' },
                  { icon: Star, label: 'Current Tier', value: 'Silver' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5 text-slate-500 mb-2" />
                      <div className="text-2xl font-black tracking-tight">{s.value}</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white tracking-tight">Progress to Gold Tier</span>
                <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">25%</span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 p-0.5">
                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full relative overflow-hidden" style={{ width: '25%' }}>
                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12" />
                </div>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-3 text-right">750 pts remaining</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-slate-500 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4 text-slate-600" />
          </div>
          Promotions and discounts are subject to availability. Prices shown are indicative for demo purposes only.
        </div>
      </div>
    </>
  );
}
