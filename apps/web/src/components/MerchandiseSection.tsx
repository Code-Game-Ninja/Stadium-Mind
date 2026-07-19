'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { MerchandiseItem } from '@stadiummind/shared';

const DEMO_MATCH_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
import { SectionHeader } from '@/components/ui';
import { ShoppingBag, Check, X } from 'lucide-react';

export function MerchandiseSection({ matchId = DEMO_MATCH_ID }: { matchId?: string }) {
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);

  const fetchMerchandise = useCallback(async () => {
    try {
      const res = await api.getMerchandise(matchId);
      setMerchandise(res.merchandise);
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMerchandise();
    // Listen for updates from other tabs or admin
    const handleUpdate = () => {
      fetchMerchandise();
    };
    window.addEventListener('merch-updated', handleUpdate);
    return () => window.removeEventListener('merch-updated', handleUpdate);
  }, [fetchMerchandise]);

  return (
    <section id="merchandise" className="scroll-mt-20">
      <SectionHeader
        eyebrow="Official Gear"
        title="Stadium Store"
        description="Pick up official matchday merchandise before it sells out. Pick up in-stadium at Zone A."
      />
      
      <div className="flex gap-6 mt-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
        {merchandise.map((item) => {
          const inStock = item.stock > 0;
          return (
            <div key={item.id} className="min-w-[280px] sm:min-w-[300px] snap-start shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!inStock ? 'grayscale opacity-75' : ''}`}
                />
                {!inStock && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <span className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">Sold Out</span>
                  </div>
                )}
                {inStock && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
                    {item.stock} left
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 mb-1">{item.name}</h3>
                <p className="text-pitch-600 font-bold mb-4">${item.price}</p>
                <div className="mt-auto">
                  <button 
                    disabled={!inStock}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      inStock 
                        ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" /> 
                    {inStock ? 'Reserve Now' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
