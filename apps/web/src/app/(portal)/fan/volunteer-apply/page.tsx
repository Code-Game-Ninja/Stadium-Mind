'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { onAuthStateChanged, type Session } from '@/lib/auth';

const ROLE_OPTIONS = [
  'Usher / Seating Guide',
  'Ticketing & Entry',
  'Fan Zone Assistant',
  'Accessibility Support',
  'Merchandise Staff',
  'General Event Crew',
];

export default function VolunteerApplyPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session | null>(null);

  const [essay, setEssay] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(setSession);
    return () => unsubscribe();
  }, []);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Apply to the fan's active match, falling back to the first scheduled match.
      let matchId = typeof window !== 'undefined' ? localStorage.getItem('stadiummind:active_match_id') : null;
      if (!matchId) {
        const { matches } = await api.getMatches();
        matchId = matches[0]?.id;
      }
      if (!matchId) throw new Error('No match available to apply for.');

      await api.applyVolunteer({
        matchId,
        name: session?.displayName || 'Fan Volunteer',
        email: session?.email,
        skills: selectedRoles.length ? selectedRoles : ['General Event Crew'],
        applicationRole: selectedRoles[0] || 'General Event Crew',
        note: `${essay}${available === false ? ' (Not available this weekend — future matches only.)' : ''}`,
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Application Received!</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Thank you for volunteering. An admin will review your application and you'll be notified of the status shortly.
            </p>
          </div>
          <button
            onClick={() => router.push('/fan/dashboard')}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </>
    );
  }

  return (
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => router.push('/fan/dashboard')} 
            className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/60 flex items-center justify-center text-slate-600 shadow-sm hover:bg-white hover:text-ink hover:-translate-x-1 transition-all group"
          >
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:scale-110 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Volunteer Application</h1>
            <p className="text-slate-500 font-medium mt-1">Help out at upcoming matches and become part of the crew.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-xl shadow-ink/5 p-8 sm:p-10 space-y-10 relative overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/5 blur-3xl rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-ink" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Why do you want to volunteer?</h2>
            </div>
            <textarea
              required
              rows={4}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm px-5 py-4 text-slate-700 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-lime/30 focus:border-lime outline-none transition-all resize-none shadow-inner"
              placeholder="Tell us a bit about yourself and why you're interested in helping out on match day..."
            />
          </div>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Preferred Roles</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLE_OPTIONS.map(role => (
                <label key={role} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm hover:border-lime hover:bg-lime-50/50 cursor-pointer transition-all group shadow-sm">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 checked:border-lime checked:bg-ink focus:ring-2 focus:ring-lime/40 focus:outline-none transition-all cursor-pointer"
                    />
                    <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-ink transition-colors">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Availability</h2>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Are you available for the upcoming match this weekend?</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex-1 flex items-center gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm hover:border-lime hover:bg-lime-50/50 cursor-pointer transition-all group shadow-sm">
                <div className="relative flex items-center justify-center">
                  <input type="radio" name="availability" required checked={available === true} onChange={() => setAvailable(true)} className="peer appearance-none w-5 h-5 rounded-full border-2 border-slate-300 checked:border-lime focus:ring-2 focus:ring-lime/40 focus:outline-none transition-all cursor-pointer" />
                  <div className="w-2.5 h-2.5 rounded-full bg-ink absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-ink transition-colors">Yes, I&apos;m available</span>
              </label>
              <label className="flex-1 flex items-center gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer transition-all group shadow-sm">
                <div className="relative flex items-center justify-center">
                  <input type="radio" name="availability" required checked={available === false} onChange={() => setAvailable(false)} className="peer appearance-none w-5 h-5 rounded-full border-2 border-slate-300 checked:border-slate-600 focus:ring-2 focus:ring-slate-600/20 focus:outline-none transition-all cursor-pointer" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600 absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">No, maybe next time</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-semibold relative z-10">{error}</p>
          )}

          <div className="pt-8 border-t border-slate-100/60 flex justify-end relative z-10">
            <button 
              type="submit" 
              disabled={loading}
              className={cn(
                "px-10 py-4 bg-ink hover:bg-ink-800 text-lime font-black rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-ink/20 flex items-center justify-center min-w-[200px] hover:-translate-y-0.5",
                loading && "opacity-70 cursor-not-allowed transform-none hover:shadow-none"
              )}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
  );
}
