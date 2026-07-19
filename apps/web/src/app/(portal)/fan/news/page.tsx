'use client';

import { Newspaper, Clock, ArrowRight, Zap, Trophy, Globe2 } from 'lucide-react';

const NEWS_ARTICLES = [
  {
    id: 1,
    category: 'World Cup 2026',
    title: 'France & Spain Set for Epic Group Stage Showdown at MetLife Stadium',
    summary: 'The two European giants meet in what promises to be the match of the tournament so far, with both sides boasting perfect records heading into the clash.',
    time: '2h ago',
    image: 'FR vs SP',
    hot: true,
  },
  {
    id: 2,
    category: 'AI & Football',
    title: 'How AI is Transforming the Stadium Experience for 80,000 Fans',
    summary: 'StadiumMind\'s AI platform helps organisers react in real-time to crowd density, incidents, and transport — making matches safer and more enjoyable for everyone.',
    time: '4h ago',
    image: 'AI',
    hot: true,
  },
  {
    id: 3,
    category: 'Match Preview',
    title: 'Brazil vs Argentina: The Greatest Rivalry Returns to the World Stage',
    summary: 'El Clásico of South America promises fireworks as two of the sport\'s most decorated nations face off in the group stage.',
    time: '6h ago',
    image: 'BR vs AR',
    hot: false,
  },
  {
    id: 4,
    category: 'Stadium News',
    title: 'MetLife Stadium Achieves Record Sustainability Score for World Cup',
    summary: 'The New Jersey venue became the first to hit a perfect 100 sustainability score after deploying AI-driven energy management systems.',
    time: '8h ago',
    image: 'ECO',
    hot: false,
  },
  {
    id: 5,
    category: 'Transfer News',
    title: 'Summer Transfer Window: Top 10 Moves That Could Shape Next Season',
    summary: 'With the World Cup in full swing, clubs are already positioning for summer signings. Here are the deals most likely to go through.',
    time: '12h ago',
    image: 'TRF',
    hot: false,
  },
  {
    id: 6,
    category: 'Champions League',
    title: 'Bayern Munich Cruise to Champions League Semi-Final with 3-1 Win Over PSG',
    summary: 'A clinical performance from the German giants ended PSG\'s European dream once again, with Müller and Kane both finding the net.',
    time: '1d ago',
    image: 'UCL',
    hot: false,
  },
];

const CATEGORIES = ['All', 'World Cup 2026', 'AI & Football', 'Match Preview', 'Transfer News', 'Champions League'];

export default function FanNewsPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-ink" />
              </div>
              Sports News
            </h1>
            <p className="text-slate-500 font-medium mt-2">Latest stories from football and beyond</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  cat === 'All'
                    ? 'bg-ink text-lime shadow-ink/20'
                    : 'bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 hover:border-lime hover:bg-lime-50 hover:text-ink hover:-translate-y-0.5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Banner */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-slate-900 via-ink-800 to-ink rounded-[2rem] p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-2xl hover:shadow-ink/20 transition-shadow cursor-pointer">
          <div className="absolute right-0 top-0 w-96 h-96 bg-lime-500/20 blur-3xl rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3 group-hover:bg-lime-500/30 group-hover:scale-110 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black text-yellow-400 uppercase tracking-widest mb-3 bg-yellow-500/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Trending Now
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 group-hover:text-lime-200 transition-colors">
                France vs Spain — Group Stage · MetLife Stadium
              </h2>
              <p className="text-slate-300/80 font-medium">Match kicks off in 3 hours · 78,000 fans expected</p>
            </div>
          </div>
          
          <div className="relative z-10 w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-ink transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS_ARTICLES.map((article) => (
            <article
              key={article.id}
              className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-ink/5 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
            >
              {/* Article Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-ink to-ink-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                <div className="text-4xl font-black text-white/30 transform group-hover:scale-110 transition-transform duration-700">{article.image}</div>
                {article.hot && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full z-20 shadow-md">
                    🔥 HOT
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-10" />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink bg-lime-50 border border-lime px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {article.time}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug mb-3 group-hover:text-ink transition-colors tracking-tight">
                  {article.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                  {article.summary}
                </p>
                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-ink opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center pt-4">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-xl text-sm font-bold text-slate-700 hover:border-lime hover:text-ink hover:bg-lime-50 hover:-translate-y-0.5 transition-all shadow-sm">
            Load more articles
          </button>
        </div>
      </div>
    </>
  );
}
