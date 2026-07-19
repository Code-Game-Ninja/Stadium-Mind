'use client';

import { useState } from 'react';
import {
  Settings,
  Bell,
  Globe2,
  Accessibility,
  Moon,
  Smartphone,
  Shield,
  ChevronRight,
  Check,
  Volume2,
} from 'lucide-react';

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-ink' : 'bg-slate-200'}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, label, sub, toggle, defaultOn }: {
  icon: typeof Settings;
  label: string;
  sub?: string;
  toggle?: boolean;
  defaultOn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 text-sm">{label}</div>
          {sub && <div className="text-xs text-slate-400">{sub}</div>}
        </div>
      </div>
      {toggle ? (
        <Toggle defaultOn={defaultOn} />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-300" />
      )}
    </div>
  );
}

const LANGUAGES = ['English', 'Español', 'Français', 'Deutsch', 'العربية', 'Português', '中文'];
const ACCESSIBILITY_OPTIONS = [
  { label: 'Standard', desc: 'No special requirements' },
  { label: 'Wheelchair', desc: 'Wheelchair accessible routes' },
  { label: 'Senior', desc: 'Slower pace, elevator priority' },
  { label: 'Low Walking', desc: 'Minimal walking distance' },
];

export default function FanSettingsPage() {
  const [lang, setLang] = useState('English');
  const [access, setAccess] = useState('Standard');

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-ink" />
            </div>
            Settings
          </h1>
          <p className="text-slate-500 font-medium mt-2">Preferences, notifications, and accessibility</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Notifications */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/60 bg-white/40">
              <h2 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-ink-700" /> Notifications
              </h2>
            </div>
            <div className="divide-y divide-slate-100/60 flex-1 p-2">
              <SettingRow icon={Bell} label="Match Alerts" sub="Goals, cards, and key events" toggle defaultOn />
              <SettingRow icon={Volume2} label="AI Commentary" sub="Receive AI-generated commentary" toggle defaultOn />
              <SettingRow icon={Smartphone} label="Push Notifications" sub="Alerts on your device" toggle />
            </div>
          </div>

          {/* Display */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/60 bg-white/40">
              <h2 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Moon className="w-5 h-5 text-indigo-500" /> Display & Privacy
              </h2>
            </div>
            <div className="divide-y divide-slate-100/60 flex-1 p-2">
              <SettingRow icon={Moon} label="Dark Mode" sub="Switch to dark theme" toggle />
              <SettingRow icon={Shield} label="Privacy Settings" sub="Data sharing preferences" />
              <SettingRow icon={Globe2} label="Data Region" sub="EU — GDPR Compliant" />
            </div>
          </div>

          {/* Accessibility */}
          <div className="md:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100/60 bg-white/40">
              <h2 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Accessibility className="w-5 h-5 text-green-500" /> Accessibility Profile
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Select a profile to customize your stadium experience</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ACCESSIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setAccess(opt.label)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                    access === opt.label
                      ? 'border-lime bg-lime-50/50 shadow-md scale-[1.02]'
                      : 'border-slate-200/60 bg-white/40 hover:border-lime hover:bg-slate-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    access === opt.label ? 'border-lime bg-ink' : 'border-slate-300'
                  }`}>
                    {access === opt.label && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="text-left">
                    <div className={`font-black text-sm tracking-tight mb-0.5 transition-colors ${access === opt.label ? 'text-ink' : 'text-slate-800'}`}>{opt.label}</div>
                    <div className="text-xs font-medium text-slate-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="md:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100/60 bg-white/40">
              <h2 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Globe2 className="w-5 h-5 text-purple-500" /> Language Preferences
              </h2>
            </div>
            <div className="p-6 flex flex-wrap gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                    lang === l
                      ? 'bg-ink border-lime text-white shadow-md shadow-ink/20 scale-105'
                      : 'bg-white/60 border-slate-200/60 text-slate-600 hover:border-lime hover:text-ink hover:bg-lime-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 text-center shadow-inner">
          <div className="text-sm font-black text-slate-400 tracking-widest uppercase mb-1">StadiumMind AI</div>
          <div className="text-xs font-medium text-slate-400">v1.0.0 · Built for FIFA World Cup 2026</div>
        </div>
      </div>
    </>
  );
}
