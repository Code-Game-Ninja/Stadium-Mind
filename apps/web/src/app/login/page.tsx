'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, applyForVolunteer, signUpFan } from '@/lib/auth';
import { ShieldCheck, Zap, ArrowLeft, ArrowRight, Ticket, Trophy, LayoutDashboard, HardHat } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEMO_CREDENTIALS } from '@stadiummind/shared';

type Mode = 'login' | 'signup-fan' | 'signup-volunteer';

const MODE_COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: 'Hi Fan',
    subtitle: 'Welcome back to StadiumMind',
    cta: 'Login',
  },
  'signup-fan': {
    title: 'Join Us',
    subtitle: 'Create your StadiumMind fan account',
    cta: 'Create Account',
  },
  'signup-volunteer': {
    title: 'Volunteer',
    subtitle: 'Apply to join the match day crew',
    cta: 'Submit Application',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<Mode>('login');
  const [signupName, setSignupName] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((s) => {
      if (s) {
        // Redirect to their actual role page
        if (s.role === 'admin') router.replace('/organizer');
        else if (s.role === 'volunteer') router.replace('/volunteer');
        else router.replace('/fan/dashboard');
      } else {
        setReady(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setSuccess('');
  }

  async function handleLogin() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'signup-volunteer') {
        if (!email || !signupName) {
          setError('Name and email required');
          return;
        }
        try {
          await applyForVolunteer(signupName, email);
          setSuccess('Application submitted! Wait for admin approval. Default password will be: volunteer123');
          setError('');
          setMode('login');
        } catch (e: any) {
          setError(e.message || 'Failed to apply.');
        }
        return;
      }

      if (mode === 'signup-fan') {
        if (!email || !signupName || !password) {
          setError('Name, email, and password required');
          return;
        }
        try {
          await signUpFan(signupName, email, password);
          // signUpFan will auto-login because it uses createUserWithEmailAndPassword
          setError('');
        } catch (e: any) {
          setError(e.message || 'Failed to sign up.');
        }
        return;
      }

      try {
        const { auth } = await import('@/lib/firebaseClient');
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        setError('');
      } catch (e: any) {
        setError(e.message || 'Invalid credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  const adminCred = DEMO_CREDENTIALS.admin;
  const volCred = DEMO_CREDENTIALS.volunteer;
  const fanCred = DEMO_CREDENTIALS.fan;
  const copy = MODE_COPY[mode];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/images/stadium-login.png"
          alt=""
          fill
          className="object-cover opacity-20 scale-110 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#191A23]/95 via-[#191A23]/80 to-[#191A23]/90" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-lime/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-lime/5 blur-[140px]" />
      </div>

      {/* Floating card */}
      <div className="relative z-10 w-full max-w-6xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[640px] animate-scale-in">
        {/* ---------- LEFT: image panel ---------- */}
        <div className="relative hidden lg:flex flex-col justify-between p-9 m-3 rounded-[2rem] overflow-hidden">
          {/* Crossfading imagery */}
          <div className="absolute inset-0 bg-slate-900">
            <Image
              src="/images/stadium-login.png"
              alt="Stadium at night"
              fill
              className={cn(
                'object-cover transition-all duration-700',
                mode === 'signup-volunteer' ? 'opacity-0 scale-105' : 'opacity-90 scale-100'
              )}
            />
            <Image
              src="/images/volunteer-login.png"
              alt="Volunteer concourse"
              fill
              className={cn(
                'object-cover transition-all duration-700',
                mode === 'signup-volunteer' ? 'opacity-90 scale-100' : 'opacity-0 scale-105'
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          </div>

          {/* Top row */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">
              Match Day Awaits
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => switchMode('signup-fan')}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200',
                  mode === 'signup-fan'
                    ? 'bg-white text-slate-900'
                    : 'text-white hover:bg-white/10'
                )}
              >
                Sign Up
              </button>
              <button
                onClick={() => switchMode('signup-volunteer')}
                className={cn(
                  'px-5 py-2 rounded-full text-xs font-bold border transition-all duration-200',
                  mode === 'signup-volunteer'
                    ? 'bg-white text-slate-900 border-white'
                    : 'border-white/60 text-white hover:bg-white/10'
                )}
              >
                Join Us
              </button>
            </div>
          </div>

          {/* Bottom row */}
          <div className="relative z-10 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#191A23] to-[#3A3B49] flex items-center justify-center text-lime shadow-lg ring-2 ring-white/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-bold text-sm drop-shadow">StadiumMind</div>
                <div className="text-white/70 text-xs font-medium">AI-Powered Match Day</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => switchMode('login')}
                title="Sign in"
                className={cn(
                  'w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200',
                  mode === 'login'
                    ? 'bg-white text-slate-900 border-white'
                    : 'border-white/50 text-white hover:bg-white/10'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => switchMode(mode === 'signup-fan' ? 'signup-volunteer' : 'signup-fan')}
                title="Next"
                className="w-9 h-9 rounded-full border border-white/50 text-white hover:bg-white/10 flex items-center justify-center transition-all duration-200"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: form panel ---------- */}
        <div className="relative flex flex-col p-6 sm:p-10 lg:p-12">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime shadow-sm">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                StadiumMind
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>

          {/* Form body */}
          <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto py-10">
            <div key={mode} className="animate-fade-in">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 text-center">
                {copy.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 text-center mt-3">{copy.subtitle}</p>
            </div>

            {success && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 font-bold flex items-center gap-2 animate-fade-in-fast">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="mt-8 space-y-3">
              {mode !== 'login' && (
                <input
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all animate-fade-in-fast"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Full Name"
                />
              )}
              <input
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
              {mode !== 'signup-volunteer' && (
                <input
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                />
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button className="text-xs font-semibold text-ink hover:text-lime-700 underline decoration-lime decoration-2 underline-offset-2 transition-colors">
                    Forgot password ?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 font-semibold animate-fade-in-fast">{error}</p>
              )}

              {/* Divider + demo access (login only) */}
              {mode === 'login' && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400">or</span>
                    <span className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    onClick={() => { setEmail(adminCred.email); setPassword(adminCred.password); }}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    Login as Admin <LayoutDashboard className="w-4 h-4 text-ink" />
                  </button>
                  <button
                    onClick={() => { setEmail(volCred.email); setPassword(volCred.password); }}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    Login as Volunteer <HardHat className="w-4 h-4 text-amber-500" />
                  </button>
                  {fanCred && (
                    <button
                      onClick={() => { setEmail(fanCred.email); setPassword(fanCred.password); }}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      Login as Fan <Ticket className="w-4 h-4 text-lime-500" />
                    </button>
                  )}
                </>
              )}

              {/* Primary CTA */}
              <button
                onClick={handleLogin}
                disabled={submitting}
                className="w-full h-12 rounded-full bg-ink hover:bg-lime disabled:opacity-60 text-sm font-bold text-white hover:text-ink shadow-lg shadow-black/25 hover:shadow-lime/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 !mt-5"
              >
                {submitting ? 'Please wait…' : copy.cta}
              </button>

              {/* Footer link */}
              <p className="text-center text-xs font-medium text-slate-500 pt-3">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => switchMode('signup-fan')}
                      className="font-bold text-ink hover:text-lime-700 underline decoration-lime decoration-2 underline-offset-2 transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => switchMode('login')}
                      className="font-bold text-ink hover:text-lime-700 underline decoration-lime decoration-2 underline-offset-2 transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Bottom quick links */}
          <div className="flex items-center justify-center gap-3">
            {[
              { icon: Trophy, title: 'Matches', onClick: () => switchMode('login') },
              { icon: Ticket, title: 'Fan Sign Up', onClick: () => switchMode('signup-fan') },
              { icon: ShieldCheck, title: 'Volunteer', onClick: () => switchMode('signup-volunteer') },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.title}
                  onClick={s.onClick}
                  title={s.title}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-ink hover:text-lime text-slate-500 flex items-center justify-center transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
