import React from 'react';
import { Hospital } from '../types.ts';

interface HospitalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'building' | 'badge' | 'marker';
  className?: string;
  isOpen?: boolean;
}

export const HospitalLogo: React.FC<HospitalLogoProps> = ({
  size = 'md',
  variant = 'building',
  className = '',
  isOpen = true,
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  // 1. HOSPITAL BUILDING GRAPHIC (Clear medical center architecture with Red Cross)
  if (variant === 'building') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full drop-shadow-sm select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hospRoofGrad" x1="24" y1="2" x2="24" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="hospWingGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f1f5f9" />
              <stop offset="1" stopColor="#cbd5e1" />
            </linearGradient>
            <filter id="hospCrossGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#dc2626" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Left Wing (Stepped Architecture) */}
          <rect x="4" y="16" width="10" height="24" rx="2" fill="url(#hospWingGrad)" stroke="#94a3b8" strokeWidth="1" />
          {/* Left Wing Windows */}
          <rect x="6.5" y="20" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="10" y="20" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="6.5" y="26" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="10" y="26" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="6.5" y="32" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="10" y="32" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />

          {/* Right Wing (Stepped Architecture) */}
          <rect x="34" y="16" width="10" height="24" rx="2" fill="url(#hospWingGrad)" stroke="#94a3b8" strokeWidth="1" />
          {/* Right Wing Windows */}
          <rect x="36" y="20" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="39.5" y="20" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="36" y="26" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="39.5" y="26" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="36" y="32" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />
          <rect x="39.5" y="32" width="2.5" height="3" rx="0.5" fill="#0284c7" opacity="0.85" />

          {/* Center Main Hospital Tower (Taller) */}
          <rect x="12" y="6" width="24" height="34" rx="3" fill="url(#hospRoofGrad)" stroke="#64748b" strokeWidth="1.5" />

          {/* Helipad / Roof Structure */}
          <rect x="18" y="3" width="12" height="3.5" rx="1.5" fill="#334155" />
          <line x1="24" y1="1" x2="24" y2="3" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="24" cy="1" r="1" fill="#ef4444" className="animate-pulse" />

          {/* Prominent Red Emergency Cross on Main Tower */}
          <g filter="url(#hospCrossGlow)">
            {/* White disc backdrop for cross */}
            <circle cx="24" cy="14" r="5.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
            {/* Vertical beam */}
            <rect x="22.5" y="10" width="3" height="8" rx="0.8" fill="#dc2626" />
            {/* Horizontal beam */}
            <rect x="20" y="12.5" width="8" height="3" rx="0.8" fill="#dc2626" />
          </g>

          {/* Main Tower Clinical Windows Grid */}
          <rect x="15" y="22" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />
          <rect x="22" y="22" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />
          <rect x="29" y="22" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />

          <rect x="15" y="28" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />
          <rect x="22" y="28" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />
          <rect x="29" y="28" width="4" height="3.5" rx="0.6" fill="#0284c7" opacity="0.9" />

          {/* Ground Floor Emergency Department (ER) Entrance Canopy */}
          <path d="M16 35 H32 V40 H16 Z" fill="#0f172a" />
          {/* Red ER Canopy Stripe */}
          <rect x="16" y="34.5" width="16" height="2" fill="#ef4444" />
          {/* Illuminated ER Door Glass */}
          <rect x="20" y="36.5" width="3.5" height="3.5" fill="#fef08a" />
          <rect x="24.5" y="36.5" width="3.5" height="3.5" fill="#fef08a" />

          {/* Status Indicator Beacon */}
          <circle
            cx="41"
            cy="11"
            r="3"
            fill={isOpen ? '#10b981' : '#f59e0b'}
            stroke="#ffffff"
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  }

  // 2. BADGE / COMPACT ICON
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <div className={`w-full h-full rounded-xl flex items-center justify-center p-1.5 shadow-sm border ${
        isOpen
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
      }`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Hospital Building */}
          <path d="M4 22V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" strokeLinecap="round" strokeLinejoin="round" />
          {/* Medical Cross */}
          <path d="M12 8v6M9 11h6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ground & Door */}
          <path d="M2 22h20M10 22v-4h4v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

// Generates an attractive, ultra-clear Hospital Building vector Data-URI for map markers
export function getHospitalMapMarkerSvg(hosp: Hospital, isSelected: boolean = false): string {
  const isOpen = hosp.emergency_status === 'OPEN';
  const badgeColor = isSelected ? '#dc2626' : isOpen ? '#059669' : '#d97706';
  const glowColor = isSelected ? '#ef4444' : isOpen ? '#10b981' : '#f59e0b';
  const labelBed = `${hosp.capacity.icu_available} ICU`;

  const svg = `
    <svg width="52" height="58" viewBox="0 0 52 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="hospShadow" x="0" y="0" width="52" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3.5" stdDeviation="3.5" flood-opacity="0.48" />
        </filter>
        <linearGradient id="hospWall" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="wingWall" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      <!-- Pulsing Ambient Status Aura -->
      <circle cx="26" cy="20" r="20" fill="${glowColor}" opacity="${isSelected ? '0.35' : '0.22'}" />

      <!-- Main Marker Crest Card -->
      <g filter="url(#hospShadow)">
        <rect x="5" y="2" width="42" height="38" rx="10" fill="${badgeColor}" stroke="#ffffff" stroke-width="2.5" />

        <!-- Realistic Hospital Building Architectural Illustration Inside Crest -->
        <!-- Left Wing -->
        <rect x="10" y="14" width="7" height="22" rx="1.5" fill="url(#wingWall)" />
        <rect x="11.5" y="17" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="14" y="17" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="11.5" y="22" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="14" y="22" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="11.5" y="27" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="14" y="27" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />

        <!-- Right Wing -->
        <rect x="35" y="14" width="7" height="22" rx="1.5" fill="url(#wingWall)" />
        <rect x="36.5" y="17" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="39" y="17" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="36.5" y="22" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="39" y="22" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="36.5" y="27" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />
        <rect x="39" y="27" width="1.8" height="2.5" rx="0.4" fill="#0284c7" />

        <!-- Center Hospital Main Tower -->
        <rect x="15" y="7" width="22" height="29" rx="2.5" fill="url(#hospWall)" stroke="#64748b" stroke-width="0.75" />

        <!-- Helipad / Roof Top Structure -->
        <rect x="21" y="4.5" width="10" height="3" rx="1" fill="#1e293b" />
        <circle cx="26" cy="3" r="1.2" fill="#ef4444" />

        <!-- PROMINENT RED MEDICAL CROSS (International Hospital Symbol) -->
        <circle cx="26" cy="13.5" r="4.5" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.6" />
        <rect x="24.8" y="10.5" width="2.4" height="6" rx="0.6" fill="#dc2626" />
        <rect x="23" y="12.3" width="6" height="2.4" rx="0.6" fill="#dc2626" />

        <!-- Hospital Floor Windows -->
        <rect x="18" y="20" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />
        <rect x="24.4" y="20" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />
        <rect x="30.8" y="20" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />

        <rect x="18" y="25" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />
        <rect x="24.4" y="25" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />
        <rect x="30.8" y="25" width="3.2" height="2.6" rx="0.5" fill="#0284c7" />

        <!-- Ground Floor ER Trauma Canopy -->
        <rect x="18" y="30.5" width="16" height="5.5" rx="1" fill="#0f172a" />
        <rect x="18" y="30.5" width="16" height="1.5" fill="#ef4444" />
        <!-- Emergency Bay Doors -->
        <rect x="22" y="32" width="3" height="4" fill="#fef08a" />
        <rect x="27" y="32" width="3" height="4" fill="#fef08a" />
      </g>

      <!-- ICU Bed Capacity Badge -->
      <rect x="3" y="42" width="46" height="14" rx="4" fill="#020617" stroke="#334155" stroke-width="1"/>
      <text x="26" y="52.5" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="900" text-anchor="middle" letter-spacing="0.3">
        ${labelBed}
      </text>
    </svg>
  `;

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
}
