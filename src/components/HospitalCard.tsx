import React, { useState } from 'react';
import { 
  Building2, Phone, Navigation, Activity, Wind, HeartPulse, 
  Droplet, CheckCircle, ShieldAlert, ArrowUpRight, Share2, Copy, Check
} from 'lucide-react';
import { Hospital } from '../types.ts';

interface HospitalCardProps {
  hospital: Hospital;
  isSelected: boolean;
  onSelect: () => void;
  onTargetForSos: () => void;
  theme?: 'light' | 'dark';
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  isSelected,
  onSelect,
  onTargetForSos,
  theme = 'light',
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const icuPercent = Math.round((hospital.capacity.icu_available / hospital.capacity.icu_total) * 100);
  const genPercent = Math.round((hospital.capacity.general_available / hospital.capacity.general_total) * 100);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${hospital.name}\n${hospital.address}\nPhone: ${hospital.phone}\nER Status: ${hospital.emergency_status}\nICU Free: ${hospital.capacity.icu_available}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusDisplay = () => {
    switch (hospital.emergency_status) {
      case 'OPEN':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ER OPEN · Immediate Admission</span>
          </div>
        );
      case 'ON_DIVERSION':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>DIVERSION · Elevated Wait</span>
          </div>
        );
      case 'CRITICAL_CAPACITY':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CRITICAL CAPACITY</span>
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border ${
        isSelected
          ? isDark
            ? 'bg-slate-900 border-red-500 shadow-md ring-1 ring-red-500/40'
            : 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20'
          : isDark
            ? 'bg-[#0f172a] hover:bg-[#131d35] border-slate-800'
            : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-sm hover:shadow'
      }`}
    >
      {/* Accent selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600" />
      )}

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Header: Title, distance, ETA */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isDark ? 'bg-slate-800 text-red-400' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <h3 className={`font-bold text-sm sm:text-base tracking-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {hospital.name}
              </h3>
            </div>
            <p className={`text-xs pl-9 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {hospital.address}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {hospital.distance_km !== undefined ? `${hospital.distance_km} km` : '—'}
            </div>
            <div className={`text-[11px] font-mono flex items-center justify-end gap-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>~{hospital.drive_time_mins || 5} min ETA</span>
            </div>
          </div>
        </div>

        {/* Status Line with Emergency Contact & Share */}
        <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>{getStatusDisplay()}</div>
          
          <div className="flex items-center gap-3">
            <a
              href={`tel:${hospital.phone}`}
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 transition-colors font-mono font-medium ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-red-600'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>{hospital.phone}</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              title="Copy hospital info"
              className={`p-1 rounded transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quantitative Tactical Metric Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          {/* ICU Beds */}
          <div className={`border p-2.5 rounded-lg ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Activity className="w-3 h-3 text-red-600" />
                <span>ICU Beds</span>
              </span>
              <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {hospital.capacity.icu_available}<span className="text-slate-400 font-normal">/{hospital.capacity.icu_total}</span>
              </span>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full rounded-full transition-all ${
                  icuPercent < 20 ? 'bg-rose-500' : icuPercent < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, icuPercent)}%` }}
              />
            </div>
          </div>

          {/* General Ward */}
          <div className={`border p-2.5 rounded-lg ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <HeartPulse className="w-3 h-3 text-blue-600" />
                <span>General</span>
              </span>
              <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {hospital.capacity.general_available}<span className="text-slate-400 font-normal">/{hospital.capacity.general_total}</span>
              </span>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(100, genPercent)}%` }}
              />
            </div>
          </div>

          {/* Ventilators */}
          <div className={`border p-2.5 rounded-lg ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Wind className="w-3 h-3 text-cyan-600" />
                <span>Ventilators</span>
              </span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                {hospital.capacity.ventilators_available}
              </span>
            </div>
            <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              of {hospital.capacity.ventilators_total} ready
            </div>
          </div>

          {/* Liquid Oxygen */}
          <div className={`border p-2.5 rounded-lg ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Droplet className="w-3 h-3 text-emerald-600" />
                <span>Liquid O₂</span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {hospital.capacity.oxygen_supply_percent}%
              </span>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${hospital.capacity.oxygen_supply_percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clean Typographic Metadata */}
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-0.5 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <span className="font-semibold text-slate-500">Specialties:</span>
          {hospital.capabilities.map((cap, i) => (
            <React.Fragment key={cap}>
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{cap}</span>
              {i < hospital.capabilities.length - 1 && (
                <span className="text-slate-400 select-none">·</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Blood Bank & Direct Routing Action */}
        <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Blood Units:</span>
            <span className={`font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              O+ <strong className={isDark ? 'text-white' : 'text-slate-900'}>{hospital.capacity.blood_bank['O+']}u</strong> · 
              A+ <strong className={isDark ? 'text-white' : 'text-slate-900'}>{hospital.capacity.blood_bank['A+']}u</strong> · 
              B+ <strong className={isDark ? 'text-white' : 'text-slate-900'}>{hospital.capacity.blood_bank['B+']}u</strong> · 
              O- <strong className={isDark ? 'text-white' : 'text-slate-900'}>{hospital.capacity.blood_bank['O-']}u</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              <span>Navigation</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTargetForSos();
              }}
              className="text-xs font-semibold px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Target & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
