import React from 'react';
import { 
  Siren, Bot, PhoneCall, ShieldAlert, ArrowRight, 
  MapPin, Clock, HeartPulse, Sparkles, Navigation 
} from 'lucide-react';
import { Hospital } from '../types.ts';

interface HeroEmergencyProps {
  onTriggerSOS: () => void;
  onOpenResq: () => void;
  nearestHospital: Hospital | null;
  city: string;
  isDark?: boolean;
}

export const HeroEmergency: React.FC<HeroEmergencyProps> = ({
  onTriggerSOS,
  onOpenResq,
  nearestHospital,
  city,
  isDark = true,
}) => {
  const estMins = nearestHospital
    ? Math.max(2, Math.round((nearestHospital.distance_km || 2) * 2.2))
    : 4;

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all shadow-xl ${
      isDark
        ? 'bg-gradient-to-br from-[#180a15] via-[#0d1426] to-[#070b15] border-rose-900/40 text-white'
        : 'bg-gradient-to-br from-rose-50/90 via-white to-red-50/60 border-red-200/90 text-slate-900 shadow-rose-500/5'
    }`}>
      {/* Ambient background glow accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6 lg:p-7 space-y-5">
        {/* Top Telemetry & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-rose-950/30 dark:border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5">
              <span>National CAD 108 & 112 Active</span>
              <span className="opacity-40">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium lowercase">metro grid in {city}</span>
            </span>
          </div>

          {nearestHospital && (
            <div className="flex items-center gap-2 text-[11px] font-medium bg-red-500/10 dark:bg-rose-950/40 border border-red-500/20 px-3 py-1 rounded-full">
              <span className="text-rose-600 dark:text-rose-400 font-bold">Fastest ER:</span>
              <span className="truncate max-w-[200px] font-semibold">{nearestHospital.name}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">~{estMins} min</span>
            </div>
          )}
        </div>

        {/* Hero Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Main Primary Trigger Button (1-Tap Emergency SOS) */}
          <div className="lg:col-span-8">
            <button
              onClick={onTriggerSOS}
              aria-label="One-tap emergency ambulance dispatch"
              className="w-full h-full min-h-[96px] p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white shadow-xl shadow-red-600/30 border border-red-400/40 flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform">
                  <Siren className="w-8 h-8 sm:w-9 sm:h-9 text-white animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/30 border border-white/20">
                      HIGH PRIORITY
                    </span>
                    <span className="text-xs font-mono opacity-80">Instant Live CAD</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    REQUEST EMERGENCY AMBULANCE
                  </h2>
                  <p className="text-xs sm:text-sm text-red-100/90 font-medium">
                    Transmit patient GPS & match nearest ALS/BLS crew in {city}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end shrink-0 pl-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-2 opacity-80">
                  Tap to Dispatch
                </span>
              </div>
            </button>
          </div>

          {/* Secondary Action: RESQ Crisis AI Chatbot */}
          <div className="lg:col-span-4">
            <button
              onClick={onOpenResq}
              aria-label="Open RESQ Emergency First Aid and Navigation Chatbot"
              className={`w-full h-full min-h-[96px] p-5 rounded-2xl border flex flex-col justify-between transition-all group text-left ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-white hover:border-rose-500/50 shadow-lg'
                  : 'bg-white hover:bg-rose-50/70 border-slate-200 text-slate-800 shadow-md hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-rose-600/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>24/7 AI Ready</span>
                </span>
              </div>

              <div className="mt-3">
                <div className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                  <span>RESQ Crisis Assistant</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Immediate CPR steps, choking Heimlich, bleeding control & safe hospital navigation.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
