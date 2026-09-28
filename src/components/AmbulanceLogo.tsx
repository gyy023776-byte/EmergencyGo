import React from 'react';

interface AmbulanceLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emblem' | 'vehicle' | 'badge' | 'marker';
  className?: string;
  animateLights?: boolean;
}

export const AmbulanceLogo: React.FC<AmbulanceLogoProps> = ({
  size = 'md',
  variant = 'emblem',
  className = '',
  animateLights = true,
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  // 1. VEHICLE GRAPHIC WITH FLASHING STROBES
  if (variant === 'vehicle') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 120 70"
          className={sizeMap[size] || 'w-24 h-14'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="120" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.7" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="stripeGrad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#dc2626" />
              <stop offset="0.5" stopColor="#ef4444" />
              <stop offset="1" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
            <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Roof Lightbar (Flashing Strobe) */}
          <rect x="76" y="8" width="22" height="5" rx="2" fill="#0f172a" />
          {/* Red Strobe */}
          <rect
            x="77"
            y="6"
            width="9"
            height="4"
            rx="1.5"
            fill="#ef4444"
            className={animateLights ? 'animate-pulse' : ''}
            filter="url(#glowLight)"
          />
          {/* Blue Strobe */}
          <rect
            x="88"
            y="6"
            width="9"
            height="4"
            rx="1.5"
            fill="#3b82f6"
            className={animateLights ? 'animate-ping' : ''}
            filter="url(#glowLight)"
          />

          {/* Ambulance Body Box */}
          <path
            d="M8 18 H76 V14 Q76 13 77 13 H98 Q103 13 107 19 L114 32 Q116 35 116 39 V52 Q116 54 114 54 H8 Q6 54 6 52 V20 Q6 18 8 18 Z"
            fill="url(#bodyGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Front Windshield */}
          <path
            d="M97 18 L108 32 H88 V18 H97 Z"
            fill="url(#windowGrad)"
            opacity="0.9"
            stroke="#0284c7"
            strokeWidth="0.8"
          />

          {/* Side Cabin Windows */}
          <rect x="73" y="19" width="12" height="12" rx="1.5" fill="url(#windowGrad)" opacity="0.85" />
          <rect x="48" y="20" width="18" height="11" rx="1.5" fill="url(#windowGrad)" opacity="0.85" />

          {/* Emergency High-Vis Reflective Stripe */}
          <rect x="6" y="36" width="110" height="9" fill="url(#stripeGrad)" />
          {/* Neon Chevron Accents */}
          <polygon points="12,36 18,36 14,45 8,45" fill="#facc15" opacity="0.9" />
          <polygon points="22,36 28,36 24,45 18,45" fill="#facc15" opacity="0.9" />
          <polygon points="32,36 38,36 34,45 28,45" fill="#facc15" opacity="0.9" />

          {/* Star of Life / Medical Cross on Patient Box */}
          <g transform="translate(26, 21)">
            {/* White disc */}
            <circle cx="9" cy="9" r="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            {/* Star of life (6-pointed blue star) */}
            <path
              d="M9 3 V15 M4 6 L14 12 M4 12 L14 6"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Golden Rod of Asclepius */}
            <path
              d="M9 4 V14 M7 7 Q11 8 7 10 Q11 11 8 13"
              stroke="#eab308"
              strokeWidth="0.9"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* "AMBULANCE" / "108" text along body */}
          <text
            x="48"
            y="43"
            fill="#ffffff"
            fontSize="6.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            letterSpacing="0.8"
          >
            AMBULANCE
          </text>

          {/* Wheels */}
          {/* Rear Wheel */}
          <circle cx="28" cy="54" r="10" fill="#0f172a" />
          <circle cx="28" cy="54" r="5.5" fill="#94a3b8" />
          <circle cx="28" cy="54" r="2.5" fill="#334155" />

          {/* Front Wheel */}
          <circle cx="95" cy="54" r="10" fill="#0f172a" />
          <circle cx="95" cy="54" r="5.5" fill="#94a3b8" />
          <circle cx="95" cy="54" r="2.5" fill="#334155" />

          {/* Headlights & Tail Lights */}
          <rect x="114" y="38" width="2" height="5" rx="1" fill="#fef08a" />
          <rect x="6" y="38" width="2" height="5" rx="1" fill="#ef4444" />
        </svg>
      </div>
    );
  }

  // 2. EMBLEM / CREST (Round Gold & Blue Star of Life Badge)
  if (variant === 'emblem') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="crestGlow" cx="50%" cy="50%" r="50%">
              <stop stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f172a" />
              <stop offset="1" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="goldBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#eab308" />
              <stop offset="1" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="starBlue" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Outer Glow */}
          <circle cx="50" cy="50" r="48" fill="url(#crestGlow)" />

          {/* Crest Shield Base */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="url(#shieldGrad)"
            stroke="url(#goldBorder)"
            strokeWidth="3.5"
          />

          {/* Inner Accent Ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />

          {/* 6-Pointed Star of Life (EMS International Symbol) */}
          {/* Vertical Bar */}
          <rect x="45" y="20" width="10" height="60" rx="3" fill="url(#starBlue)" />
          {/* Diagonal Bar 1 */}
          <rect
            x="45"
            y="20"
            width="10"
            height="60"
            rx="3"
            fill="url(#starBlue)"
            transform="rotate(60 50 50)"
          />
          {/* Diagonal Bar 2 */}
          <rect
            x="45"
            y="20"
            width="10"
            height="60"
            rx="3"
            fill="url(#starBlue)"
            transform="rotate(120 50 50)"
          />

          {/* White Border Accent around Star of Life */}
          <g stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
            <line x1="50" y1="22" x2="50" y2="78" />
            <line x1="26" y1="36" x2="74" y2="64" />
            <line x1="26" y1="64" x2="74" y2="36" />
          </g>

          {/* Rod of Asclepius (Staff and Snake in Center) */}
          {/* Golden Staff */}
          <line
            x1="50"
            y1="25"
            x2="50"
            y2="75"
            stroke="url(#goldBorder)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Serpent winding around staff */}
          <path
            d="M50 28 C43 32 43 40 50 42 C57 44 57 52 50 54 C43 56 43 64 50 66 C55 67 56 71 52 73"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 28 C43 32 43 40 50 42 C57 44 57 52 50 54 C43 56 43 64 50 66 C55 67 56 71 52 73"
            stroke="#f59e0b"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Serpent Head */}
          <circle cx="50" cy="27" r="2" fill="#facc15" />

          {/* Top Flashing Strobe Dots */}
          <circle
            cx="26"
            cy="18"
            r="3.5"
            fill="#ef4444"
            className={animateLights ? 'animate-pulse' : ''}
          />
          <circle
            cx="74"
            cy="18"
            r="3.5"
            fill="#3b82f6"
            className={animateLights ? 'animate-ping' : ''}
          />
        </svg>
      </div>
    );
  }

  // 3. BADGE / COMPACT ICON
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-amber-500 via-red-600 to-rose-700 p-0.5 shadow-md flex items-center justify-center">
        <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle emergency background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-transparent to-blue-600/20" />
          
          {/* Vector Star of Life */}
          <svg viewBox="0 0 40 40" className="w-4/5 h-4/5 z-10" fill="none">
            <rect x="17" y="5" width="6" height="30" rx="1.5" fill="#0284c7" />
            <rect x="17" y="5" width="6" height="30" rx="1.5" fill="#0284c7" transform="rotate(60 20 20)" />
            <rect x="17" y="5" width="6" height="30" rx="1.5" fill="#0284c7" transform="rotate(120 20 20)" />
            {/* Center cross line */}
            <path d="M20 7 V33 M10 14 L30 26 M10 26 L30 14" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            {/* Asclepius golden serpent */}
            <path d="M20 8 V32 M17 14 Q23 16 17 20 Q23 22 18 26" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>

          {/* Tiny LED Strobes */}
          {animateLights && (
            <>
              <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping shadow-sm shadow-sky-400" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Generates an attractive Data-URI SVG string for use inside Google Maps and Leaflet markers
export function getAmbulanceMapMarkerSvg(callSign: string, isBusy: boolean = false): string {
  const badgeColor = isBusy ? '#dc2626' : '#d97706';
  const pulseColor = isBusy ? '#ef4444' : '#3b82f6';
  
  const svg = `
    <svg width="48" height="52" viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="48" height="52" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.45" />
        </filter>
        <linearGradient id="body" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="${badgeColor}" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      
      <!-- Outer Beacon Halo -->
      <circle cx="24" cy="20" r="19" fill="${pulseColor}" opacity="0.25" />
      
      <!-- Marker Crest Shield -->
      <g filter="url(#shadow)">
        <rect x="6" y="2" width="36" height="34" rx="10" fill="#0f172a" stroke="#ffffff" stroke-width="2.5" />
        
        <!-- Ambulance Vector Mini Profile inside Crest -->
        <rect x="10" y="8" width="28" height="22" rx="4" fill="#ffffff" />
        <rect x="10" y="18" width="28" height="5" fill="#dc2626" />
        <rect x="30" y="10" width="7" height="7" rx="1" fill="#38bdf8" />
        
        <!-- Blue Star of Life Cross on Vehicle -->
        <path d="M21 10 V17 M17.5 13.5 H24.5" stroke="#0284c7" stroke-width="2" stroke-linecap="round" />
        <circle cx="21" cy="13.5" r="0.8" fill="#eab308" />
        
        <!-- Strobe Bar on Top -->
        <rect x="17" y="5" width="6" height="3" rx="1" fill="#ef4444" />
        <rect x="25" y="5" width="6" height="3" rx="1" fill="#3b82f6" />
        
        <!-- Wheels -->
        <circle cx="17" cy="29" r="3" fill="#0f172a" stroke="#ffffff" stroke-width="1" />
        <circle cx="31" cy="29" r="3" fill="#0f172a" stroke="#ffffff" stroke-width="1" />
      </g>
      
      <!-- Call Sign Banner -->
      <rect x="2" y="38" width="44" height="13" rx="3.5" fill="#020617" stroke="#475569" stroke-width="1" />
      <text x="24" y="47.5" fill="#fef08a" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="900" text-anchor="middle" letter-spacing="0.5">
        ${callSign}
      </text>
    </svg>
  `;

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
}
