import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Siren, Database, MapPin, Search, Filter, Shield, 
  Activity, Users, User, Building2, Radio, Sparkles,
  PhoneCall, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle,
  Sun, Moon, Compass, Plus, Phone, Crosshair, Navigation,
  Lock, Unlock, Terminal, Heart, Bot, KeyRound, ShieldCheck,
  MessageSquareHeart
} from 'lucide-react';
import { 
  Hospital, Ambulance, Dispatch, UserAccount, SystemConfig 
} from './types.ts';
import { EmergencyMap } from './components/EmergencyMap.tsx';
import { HospitalCard } from './components/HospitalCard.tsx';
import { SetupModal } from './components/SetupModal.tsx';
import { SOSModal } from './components/SOSModal.tsx';
import { LocationLoginModal } from './components/LocationLoginModal.tsx';
import { ResqChatModal } from './components/ResqChatModal.tsx';
import { ActiveDispatchBanner } from './components/ActiveDispatchBanner.tsx';
import { HospitalAdminView } from './components/HospitalAdminView.tsx';
import { DriverCADView } from './components/DriverCADView.tsx';
import { OwnerAuthModal } from './components/OwnerAuthModal.tsx';
import { AmbulanceLogo } from './components/AmbulanceLogo.tsx';
import { FeedbackModal } from './components/FeedbackModal.tsx';

export default function App() {
  // Theme State: Default to 'light' as requested by the user, with one-click toggle to dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('emergencygo_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('emergencygo_theme', next);
  };

  const isDark = theme === 'dark';

  // System State
  const [config, setConfig] = useState<SystemConfig>({
    database_type: 'local_postgis',
    database_url: '',
    is_connected: true,
    postgis_enabled: true,
    city: 'Visakhapatnam',
    center_lat: 17.6868,
    center_lng: 83.2185,
    twilio_configured: false,
    total_hospitals: 5,
    total_ambulances: 2,
    active_dispatches: 0,
  });

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activeRole, setActiveRole] = useState<'patient' | 'driver' | 'hospital_admin'>('patient');

  // User Profile & Location Permission State
  const [userProfile, setUserProfile] = useState<{
    name: string;
    phone: string;
    role: 'patient' | 'driver' | 'hospital_admin';
    password?: string;
  }>(() => {
    const saved = localStorage.getItem('emergencygo_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: '',
      phone: '',
      role: 'patient',
    };
  });

  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => {
    return localStorage.getItem('emergencygo_location_enabled') === 'true';
  });

  // Prompt for registration, password, & location on first launch or when entering the app
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(() => {
    const hasRegistered = localStorage.getItem('emergencygo_has_registered') === 'true';
    const hasLocation = localStorage.getItem('emergencygo_location_enabled') === 'true';
    const hasPassword = Boolean(localStorage.getItem('emergencygo_user_password'));
    return !hasRegistered || !hasLocation || !hasPassword;
  });

  const [locationToast, setLocationToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Discovery State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [selectedCapability, setSelectedCapability] = useState<string>('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'icu' | 'rating'>('distance');

  // Selection & Modals
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isResqOpen, setIsResqOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);

  // Admin / Owner Mode: Strictly restricted to authorized system owner ("no one should enter except me")
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem('emergencygo_owner_session'));
    }
    return false;
  });
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [dbLatencyMs, setDbLatencyMs] = useState(12);

  const handleExitOwnerMode = useCallback(() => {
    setIsAdminMode(false);
    sessionStorage.removeItem('emergencygo_owner_session');
    localStorage.setItem('emergencygo_is_admin', 'false');
    setLocationToast({
      message: '🔒 Owner Mode Locked. System database is now shielded.',
      type: 'info',
    });
    setTimeout(() => setLocationToast(null), 3000);
  }, []);

  // If URL explicitly requests owner/admin mode, require password prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || urlParams.get('owner') === 'true' || urlParams.get('db') === 'live') {
        if (!sessionStorage.getItem('emergencygo_owner_session')) {
          setShowAdminAuthModal(true);
        }
      }
    }
  }, []);

  // Keyboard shortcut listener: Ctrl+Shift+D or Alt+D to toggle Owner Mode (requests password when locked)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.altKey && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        if (isAdminMode) {
          handleExitOwnerMode();
        } else {
          setShowAdminAuthModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode, handleExitOwnerMode]);

  // Quick Hotline Modal state
  const [showHotlines, setShowHotlines] = useState(false);

  // Fetch System Config & Users
  const fetchConfig = useCallback(async () => {
    try {
      const t0 = performance.now();
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setDbLatencyMs(Math.max(4, Math.round(performance.now() - t0)));
        setConfig(data);
      }
    } catch (e) {
      console.error('Failed to load system config:', e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Hospitals via PostGIS Query
  const fetchHospitals = useCallback(async () => {
    setIsLoadingHospitals(true);
    try {
      const params = new URLSearchParams({
        lat: config.center_lat.toString(),
        lng: config.center_lng.toString(),
        radius: radiusKm.toString(),
        emergency_only: emergencyOnly ? 'true' : 'false',
      });
      if (selectedCapability) {
        params.append('capability', selectedCapability);
      }

      const res = await fetch(`/api/hospitals?${params.toString()}`);
      const data = await res.json();
      setHospitals(data.hospitals || []);
      if (!selectedHospitalId && data.hospitals?.length > 0) {
        setSelectedHospitalId(data.hospitals[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch hospitals:', e);
    } finally {
      setIsLoadingHospitals(false);
    }
  }, [config.center_lat, config.center_lng, radiusKm, emergencyOnly, selectedCapability, selectedHospitalId]);

  // Fetch Ambulances & Dispatches
  const fetchAmbulances = useCallback(async () => {
    try {
      const res = await fetch(`/api/ambulances?lat=${config.center_lat}&lng=${config.center_lng}`);
      const data = await res.json();
      setAmbulances(data.ambulances || []);
    } catch (e) {
      console.error(e);
    }
  }, [config.center_lat, config.center_lng]);

  const fetchDispatches = useCallback(async () => {
    try {
      const res = await fetch('/api/dispatches');
      const data = await res.json();
      setDispatches(data.dispatches || []);
      if (data.dispatches?.length > 0 && !activeDispatchId) {
        const active = data.dispatches.find((d: any) => d.status !== 'completed' && d.status !== 'cancelled');
        if (active) setActiveDispatchId(active.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeDispatchId]);

  // Handle Location Granted from GPS or Preset
  const handleLocationGranted = async (lat: number, lng: number, cityName?: string) => {
    const effectiveCity = cityName || config.city;
    try {
      await fetch('/api/config/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: effectiveCity,
          lat,
          lng,
        }),
      });

      setConfig((prev) => ({
        ...prev,
        city: effectiveCity,
        center_lat: lat,
        center_lng: lng,
      }));
      setIsGpsActive(true);
      localStorage.setItem('emergencygo_location_enabled', 'true');
      localStorage.setItem('emergencygo_has_prompted_location', 'true');

      // Fetch hospitals immediately with the new coordinates
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radiusKm.toString(),
        emergency_only: emergencyOnly ? 'true' : 'false',
      });
      if (selectedCapability) {
        params.append('capability', selectedCapability);
      }

      const res = await fetch(`/api/hospitals?${params.toString()}`);
      const data = await res.json();
      if (data.hospitals) {
        setHospitals(data.hospitals);
        if (data.hospitals.length > 0) {
          setSelectedHospitalId(data.hospitals[0].id);
        }
      }

      // Fetch ambulances near the new coordinates
      const ambRes = await fetch(`/api/ambulances?lat=${lat}&lng=${lng}`);
      const ambData = await ambRes.json();
      if (ambData.ambulances) {
        setAmbulances(ambData.ambulances);
      }

      setLocationToast({
        message: `📍 Location Enabled: Centered near ${effectiveCity} (${lat.toFixed(4)}, ${lng.toFixed(4)}). Loaded ${data.hospitals?.length || 0} nearby emergency medical centers.`,
        type: 'success',
      });
      setTimeout(() => setLocationToast(null), 5000);
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const handleUpdateUser = async (newProfile: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin'; password?: string }) => {
    setUserProfile(newProfile);
    setActiveRole(newProfile.role);
    localStorage.setItem('emergencygo_user_profile', JSON.stringify({
      name: newProfile.name,
      phone: newProfile.phone,
      role: newProfile.role,
    }));
    if (newProfile.password) {
      localStorage.setItem('emergencygo_user_password', newProfile.password);
    }
    localStorage.setItem('emergencygo_has_registered', 'true');

    try {
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProfile.name,
          phone: newProfile.phone,
          password: newProfile.password,
          role: newProfile.role,
          lat: config.center_lat,
          lng: config.center_lng,
        }),
      });
      fetchUsers();
      setLocationToast({
        message: `✅ Emergency profile & password saved! Welcome, ${newProfile.name}.`,
        type: 'success',
      });
      setTimeout(() => setLocationToast(null), 4000);
    } catch (e) {
      console.warn('Note on persisting user to DB:', e);
    }
  };

  // If location was previously granted, refresh silently in the background
  useEffect(() => {
    if (localStorage.getItem('emergencygo_location_enabled') === 'true' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleLocationGranted(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchConfig();
    fetchUsers();
    fetchAmbulances();
    fetchDispatches();
  }, [fetchConfig, fetchUsers, fetchAmbulances, fetchDispatches]);

  // Refresh hospitals when center or radius changes
  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Polling for live ambulance telemetry & dispatch sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAmbulances();
      fetchDispatches();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchAmbulances, fetchDispatches]);

  // Filtered & Sorted Hospital List
  const filteredHospitals = useMemo(() => {
    let result = hospitals.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });

    if (sortBy === 'icu') {
      result = [...result].sort((a, b) => b.capacity.icu_available - a.capacity.icu_available);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: distance
      result = [...result].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    }

    return result;
  }, [hospitals, searchQuery, sortBy]);

  const activeDispatch = dispatches.find((d) => d.id === activeDispatchId) || null;
  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || null;
  const currentAmbulance = ambulances[0] || {
    id: 'amb_default',
    vehicle_number: 'AP 31 EM 108',
    call_sign: 'ALS Rescue 1',
    driver_name: 'Rajesh Kumar',
    driver_phone: '+91 98480 12345',
    vehicle_type: 'ALS',
    latitude: config.center_lat + 0.005,
    longitude: config.center_lng - 0.003,
    status: 'available',
    speed_kmh: 0,
    oxygen_level_pct: 95,
    battery_level_pct: 92,
    updated_at: new Date().toISOString(),
  };

  const capabilitiesList = [
    'Trauma Level 1',
    'Cardiac Cath Lab',
    '24/7 ER',
    'Pediatric ICU',
    'Stroke Center',
    'Burn Unit',
    'Helipad',
    'Blood Bank',
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-red-500 selection:text-white transition-colors ${
      isDark ? 'bg-[#06090e] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. TOP NAVIGATION & SYSTEM STATUS BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-[#090e17]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo with Official Ambulance Star of Life Crest */}
          <div className="flex items-center gap-3">
            <AmbulanceLogo size="md" variant="emblem" animateLights={true} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  EmergencyGo
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {config.city}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active EMS Dispatch Grid Online</span>
              </div>
            </div>
          </div>

          {/* Role Segmented Controller */}
          <div className={`flex items-center p-1 rounded-xl gap-1 border ${
            isDark ? 'bg-[#0a0f19] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveRole('patient')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'patient'
                  ? 'btn-3d-red text-white font-bold shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen SOS</span>
            </button>
            <button
              onClick={() => setActiveRole('driver')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'driver'
                  ? 'btn-3d-amber text-white font-bold shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Paramedic CAD</span>
            </button>
            <button
              onClick={() => setActiveRole('hospital_admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'hospital_admin'
                  ? 'btn-3d-purple text-white font-bold shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ER Operations</span>
            </button>
          </div>

          {/* Action Tools: Location/User, Theme Switcher, Hotlines, Setup & Direct SOS */}
          <div className="flex items-center gap-2">
            {/* User Profile & Location Status Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                userProfile.name && isGpsActive
                  ? isDark 
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
                  : isDark
                    ? 'bg-red-950/40 border-red-800/80 text-red-300 hover:bg-red-900/50 ring-1 ring-red-500/50'
                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 shadow-xs ring-1 ring-red-400/50'
              }`}
              title="Click to view/edit user profile, password, or GPS location"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isGpsActive ? 'text-emerald-500 animate-pulse' : 'text-red-500 animate-ping'}`} />
              <span className="font-semibold hidden sm:inline">
                {userProfile.name ? userProfile.name.split(' ')[0] : 'Register & Set Password'}
              </span>
              <span className="opacity-40 hidden sm:inline">·</span>
              <span className="font-semibold truncate max-w-[85px] sm:max-w-none">
                {isGpsActive ? `${config.city}` : 'Enable GPS'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isGpsActive ? 'bg-emerald-500 animate-ping' : 'bg-red-500 animate-bounce'}`} />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isDark 
                  ? 'bg-[#0b101c] hover:bg-slate-800 border-slate-800 text-amber-300' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
              }`}
              title={isDark ? 'Switch to Clean Light Theme' : 'Switch to Tactical Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Quick Hotlines Toggle */}
            <button
              onClick={() => setShowHotlines(!showHotlines)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showHotlines
                  ? 'bg-red-50 text-red-600 border-red-200 font-semibold'
                  : isDark
                    ? 'bg-[#0b101c] hover:bg-slate-800 border-slate-800 text-slate-300'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">108 / 112</span>
            </button>

            {/* Submit User Feedback Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isDark 
                  ? 'bg-[#0b101c] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
              }`}
              title="Submit User Feedback & Service Review"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* RESQ Crisis AI Chatbot Button (3D Pill) */}
            <button
              onClick={() => setIsResqOpen(true)}
              className="btn-3d-resq flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white tracking-wide"
              title="Open RESQ Emergency Navigation & Crisis Assistant"
            >
              <Bot className="w-3.5 h-3.5 animate-pulse" />
              <span>RESQ AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </button>

            {/* Owner Access Control (Password Protected) */}
            {!isAdminMode ? (
              <button
                onClick={() => setShowAdminAuthModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isDark 
                    ? 'bg-[#0b101c] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                }`}
                title="Enter Owner Mode (Password Protected)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Owner Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSetupOpen(true)}
                  className="btn-3d-emerald flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  title="Database Live & Ingestion Inspector (Owner Mode)"
                >
                  <Database className="w-3.5 h-3.5 animate-pulse" />
                  <span>Database Live</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                </button>
                <button
                  onClick={handleExitOwnerMode}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                    isDark 
                      ? 'border-red-900/60 text-red-300 hover:bg-red-950/50' 
                      : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                  title="Lock / Exit Owner Mode"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Lock</span>
                </button>
              </div>
            )}

            {/* Primary SOS Action (3D Physical Button) */}
            <button
              onClick={() => setIsSosOpen(true)}
              className="btn-3d-red flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-black rounded-xl tracking-wide"
            >
              <Siren className="w-3.5 h-3.5 animate-bounce" />
              <span>ONE-TAP SOS</span>
            </button>
          </div>
        </div>

        {/* Quick Emergency Hotlines Drawer if open */}
        {showHotlines && (
          <div className={`border-t py-2 px-4 text-xs flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-1 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-red-50 border-red-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-red-600">🚨 National Emergency Hotlines:</span>
              <span>Ambulance: <a href="tel:108" className="font-mono text-red-600 underline font-bold">108</a></span>
              <span>·</span>
              <span>All Emergency: <a href="tel:112" className="font-mono text-red-600 underline font-bold">112</a></span>
              <span>·</span>
              <span>Police: <a href="tel:100" className="font-mono underline font-bold">100</a></span>
              <span>·</span>
              <span>Disaster Mgmt: <a href="tel:1077" className="font-mono underline font-bold">1077</a></span>
            </div>
            <button
              onClick={() => setShowHotlines(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Hide
            </button>
          </div>
        )}
      </header>

      {/* Owner Live Database Diagnostics Deck (ONLY visible to Owner / "i") */}
      {isAdminMode && (
        <div className={`border-b py-2 px-4 sm:px-6 text-xs flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-1 ${
          isDark ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold">
              <Database className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Database Live: Connected (Owner View)</span>
            </div>
            <span className="hidden md:inline opacity-30">|</span>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 font-semibold">
                {config.database_type === 'postgres' ? 'PostgreSQL/PostGIS' : 'PostGIS Spatial Engine'}
              </span>
              <span>Latency: ~{dbLatencyMs}ms</span>
              <span>•</span>
              <span>{hospitals.length} Hospitals</span>
              <span>•</span>
              <span>{ambulances.length} Ambulances</span>
              <span>•</span>
              <span>{users.length} Users</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminAuthModal(true)}
              className="px-2.5 py-1 rounded border border-emerald-400/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-medium transition flex items-center gap-1.5"
              title="Change your secret owner password"
            >
              <KeyRound className="w-3 h-3 text-emerald-400" />
              <span>Change Password</span>
            </button>
            <button
              onClick={() => setIsSetupOpen(true)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 transition shadow-xs"
            >
              <Terminal className="w-3 h-3" />
              <span>Open DB & Setup Inspector</span>
            </button>
            <button
              onClick={handleExitOwnerMode}
              className="px-2.5 py-1 rounded border border-red-500/50 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-300 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Owner Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Active Dispatch Live Telemetry Banner (If Any) */}
        {activeDispatch && (
          <ActiveDispatchBanner
            dispatch={activeDispatch}
            ambulances={ambulances}
            onDispatchUpdated={() => {
              fetchDispatches();
              fetchAmbulances();
            }}
            onCloseBanner={() => setActiveDispatchId(null)}
            theme={theme}
          />
        )}

        {/* 2. CITIZEN / EMERGENCY CALLER VIEW */}
        {activeRole === 'patient' && (
          <div className="space-y-5">
            {/* Attractive EMS Overview & Emergency Hero Deck */}
            <div className={`rounded-2xl p-5 sm:p-6 border transition-all relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-br from-[#0c1322] via-[#090e1a] to-[#06090e] border-slate-800 shadow-xl' 
                : 'bg-gradient-to-br from-white via-slate-50 to-red-50/20 border-slate-200/90 shadow-sm'
            }`}>
              {/* Subtle emergency background glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Rapid EMS Grid Online
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Metropolitan: <strong>{config.city}</strong></span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <span className="text-slate-400 font-medium">{hospitals.length} Verified ER Facilities</span>
                  </div>

                  <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Real-Time Emergency Ambulance & Hospital Dispatch Grid
                  </h1>

                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    PostGIS sub-second road transit calculations, live ER/ICU capacity telemetry, and direct GPS-linked paramedic dispatch for immediate critical care.
                  </p>

                  {/* High-visibility Live Stats Strip */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <AmbulanceLogo size="sm" variant="badge" animateLights={true} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ambulances.length} Ambulances on Patrol
                      </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Avg Response ETA: <strong>~4.2 mins</strong></span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                      <span>Direct Hotline: <strong>108 / 112</strong></span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <button
                      onClick={() => setIsFeedbackOpen(true)}
                      className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      <MessageSquareHeart className="w-3.5 h-3.5" />
                      <span>Submit Feedback</span>
                    </button>
                  </div>
                </div>

                {/* Hero Ambulance Vehicle Graphic & Direct SOS CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="hidden lg:flex flex-col items-center p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <AmbulanceLogo size="lg" variant="vehicle" animateLights={true} />
                    <span className="text-[10px] font-mono text-slate-400 font-bold mt-1 tracking-wider">
                      RAPID RESPONSE EMS
                    </span>
                  </div>

                  <button
                    onClick={() => setIsSosOpen(true)}
                    className="btn-3d-red w-full sm:w-auto px-7 py-4 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-3 tracking-wide"
                  >
                    <div className="relative">
                      <Siren className="w-5 h-5 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                    </div>
                    <span>ONE-TAP EMERGENCY SOS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split View: Live Map & Hospitals Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map Column (5 Cols) */}
              <div className="lg:col-span-5 sticky top-20 space-y-3">
                <div className="h-[460px]">
                  <EmergencyMap
                    userLat={config.center_lat}
                    userLng={config.center_lng}
                    hospitals={hospitals}
                    ambulances={ambulances}
                    activeDispatch={activeDispatch}
                    onSelectHospital={(h) => setSelectedHospitalId(h.id)}
                    selectedHospitalId={selectedHospitalId}
                    mapsApiKey={config.maps_api_key || 'AIzaSyBG2FFrZIx6U0X7iWVtAGEVH_ITCoOtC2g'}
                    theme={theme}
                  />
                </div>

                {/* Attractive Ambulance Fleet Live Telemetry Deck */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#090e18] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80 mb-2.5">
                    <div className="flex items-center gap-2">
                      <AmbulanceLogo size="sm" variant="badge" animateLights={true} />
                      <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Active EMS Fleet Radar
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{ambulances.length} Units Dispatched</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ambulances.map((amb) => {
                      const isBusy = amb.status !== 'available';
                      return (
                        <div
                          key={amb.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            isDark ? 'bg-slate-900/60 border-slate-800/90' : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <AmbulanceLogo size="sm" variant="emblem" animateLights={isBusy} className="shrink-0" />
                            <div>
                              <div className="font-bold flex items-center gap-1.5 text-xs">
                                <span className={isDark ? 'text-white' : 'text-slate-900'}>{amb.call_sign}</span>
                                <span className="text-[10px] font-mono text-amber-500 font-semibold">({amb.vehicle_type})</span>
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Paramedic: {amb.driver_name} · Reg: {amb.vehicle_number}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBusy 
                                ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            }`}>
                              {isBusy ? 'EN ROUTE' : 'READY'}
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 font-bold">
                              {amb.speed_kmh} km/h
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hospital Finder & Capacity Feed (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Radius Filter Bar */}
                <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  isDark ? 'bg-[#0b101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  {/* Quick City Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <span className={`text-[10px] uppercase font-bold shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      City:
                    </span>
                    {[
                      { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
                      { name: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
                      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
                      { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
                      { name: 'Mumbai', lat: 18.9986, lng: 72.8427 },
                      { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
                    ].map((cityItem) => (
                      <button
                        key={cityItem.name}
                        onClick={() => handleLocationGranted(cityItem.lat, cityItem.lng, cityItem.name)}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition border ${
                          config.city.toLowerCase().includes(cityItem.name.toLowerCase().split(' ')[0])
                            ? 'bg-red-600 text-white border-red-600 font-semibold shadow-xs'
                            : isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        {cityItem.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsLocationModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Use GPS</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hospitals by name, specialty, or area..."
                        className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 border ${
                          isDark 
                            ? 'bg-[#070b12] border-slate-800 text-white placeholder:text-slate-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    {/* Radius Slider */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      isDark ? 'bg-[#070b12] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Radius:</span>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        step="1"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                        className="w-20 accent-red-600 cursor-pointer"
                      />
                      <span className={`text-xs font-mono font-bold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {radiusKm} km
                      </span>
                    </div>

                    {/* Sort Selector */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                      isDark ? 'bg-[#070b12] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        <option value="distance" className={isDark ? 'bg-slate-900' : 'bg-white'}>Nearest</option>
                        <option value="icu" className={isDark ? 'bg-slate-900' : 'bg-white'}>Most ICU Beds</option>
                        <option value="rating" className={isDark ? 'bg-slate-900' : 'bg-white'}>Highest Rated</option>
                      </select>
                    </div>

                    {/* ER Open Only Toggle */}
                    <button
                      onClick={() => setEmergencyOnly(!emergencyOnly)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                        emergencyOnly
                          ? 'bg-emerald-600 text-white font-semibold border-emerald-600'
                          : isDark
                            ? 'bg-[#070b12] border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ER Open Only</span>
                    </button>
                  </div>

                  {/* Capabilities Filter Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                    <button
                      onClick={() => setSelectedCapability('')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        !selectedCapability
                          ? 'bg-red-600 text-white font-semibold'
                          : isDark
                            ? 'bg-[#070b12] text-slate-400 hover:text-slate-200 border border-slate-800'
                            : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      All Services
                    </button>
                    {capabilitiesList.map((cap) => (
                      <button
                        key={cap}
                        onClick={() => setSelectedCapability(selectedCapability === cap ? '' : cap)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap font-medium transition-colors ${
                          selectedCapability === cap
                            ? 'bg-red-600 text-white font-semibold'
                            : isDark
                              ? 'bg-[#070b12] text-slate-400 hover:text-slate-200 border border-slate-800'
                              : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hospitals List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      Showing <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{filteredHospitals.length}</strong> facilities within <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{radiusKm} km</strong>
                    </span>
                    <button
                      onClick={fetchHospitals}
                      disabled={isLoadingHospitals}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-red-600 ${isLoadingHospitals ? 'animate-spin' : ''}`} />
                      <span>Refresh Bed Data</span>
                    </button>
                  </div>

                  {filteredHospitals.length > 0 ? (
                    filteredHospitals.map((hosp) => (
                      <HospitalCard
                        key={hosp.id}
                        hospital={hosp}
                        isSelected={hosp.id === selectedHospitalId}
                        onSelect={() => setSelectedHospitalId(hosp.id)}
                        onTargetForSos={() => {
                          setSelectedHospitalId(hosp.id);
                          setIsSosOpen(true);
                        }}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <div className={`border rounded-2xl p-8 text-center space-y-3.5 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        No Emergency Facilities Match Your Filter
                      </h4>
                      <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        No hospitals found with current filters within {radiusKm} km of {config.city}. Reset filters or expand search radius to see nearby facilities.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setRadiusKm(50);
                            setSearchQuery('');
                            setSelectedCapability('');
                            setEmergencyOnly(false);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                        >
                          Reset Filters & Expand Radius (50 km)
                        </button>
                        {isAdminMode && (
                          <button
                            onClick={() => setIsSetupOpen(true)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                          >
                            Owner: Seed OSM Data
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PARAMEDIC / AMBULANCE DRIVER VIEW */}
        {activeRole === 'driver' && (
          <DriverCADView
            ambulance={currentAmbulance}
            activeDispatch={activeDispatch}
            hospital={currentHospital}
            onDispatchUpdated={fetchDispatches}
            onAmbulanceUpdated={fetchAmbulances}
            theme={theme}
          />
        )}

        {/* 4. HOSPITAL ER ADMIN VIEW */}
        {activeRole === 'hospital_admin' && currentHospital && (
          <HospitalAdminView
            hospital={currentHospital}
            activeDispatches={dispatches}
            onCapacityUpdated={fetchHospitals}
            theme={theme}
          />
        )}
      </main>

      {/* 5. USER-FRIENDLY ACCESSIBLE FOOTER */}
      <footer className={`border-t py-6 px-4 sm:px-6 transition-colors text-xs ${
        isDark ? 'bg-[#080d16] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0">
              <Siren className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">EmergencyGo Network</div>
              <div className="text-[11px] text-slate-500">Immediate Ambulance Dispatch & Verified ER Availability</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="text-red-600 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Ambulance: <a href="tel:108" className="underline font-bold">108</a></span>
            </span>
            <span>·</span>
            <span className="text-red-600 flex items-center gap-1">
              <span>National: <a href="tel:112" className="underline font-bold">112</a></span>
            </span>
            <span>·</span>
            <span>Police: <a href="tel:100" className="underline font-bold">100</a></span>
          </div>

          <div className="flex items-center gap-3">
            {/* Owner / Developer Access Link */}
            <button
              onClick={() => {
                if (isAdminMode) {
                  setIsAdminMode(false);
                  localStorage.setItem('emergencygo_is_admin', 'false');
                  setLocationToast({
                    message: '🔒 Owner Mode Exited. Database Live is now hidden.',
                    type: 'info',
                  });
                  setTimeout(() => setLocationToast(null), 3500);
                } else {
                  setShowAdminAuthModal(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isAdminMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-xs'
              }`}
              title="Restricted System & Database Console (Owner Access)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAdminMode ? '🟢 Database Live: ACTIVE (Click to Hide)' : '🔒 Owner: View Database Live'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Location Permission & User Profile Modal */}
      <LocationLoginModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          localStorage.setItem('emergencygo_has_prompted_location', 'true');
        }}
        currentCity={config.city}
        currentLat={config.center_lat}
        currentLng={config.center_lng}
        isGpsActive={isGpsActive}
        onLocationGranted={handleLocationGranted}
        currentUser={userProfile}
        onUpdateUser={handleUpdateUser}
        availableUsers={users}
        theme={theme}
        isAdminMode={isAdminMode}
        onToggleAdminMode={() => {
          if (isAdminMode) {
            handleExitOwnerMode();
          } else {
            setShowAdminAuthModal(true);
          }
        }}
        onLoginSuccess={(loggedUser) => {
          setUserProfile(loggedUser);
          setActiveRole(loggedUser.role);
          localStorage.setItem('emergencygo_user_profile', JSON.stringify(loggedUser));
          setLocationToast({
            message: `👋 Welcome back, ${loggedUser.name}! Emergency profile restored.`,
            type: 'success',
          });
          setTimeout(() => setLocationToast(null), 4000);
        }}
      />

      {/* Owner Security Password Verification Modal */}
      <OwnerAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        onAuthenticated={() => {
          setIsAdminMode(true);
          setLocationToast({
            message: '🟢 Owner Mode Unlocked! Welcome, System Owner. All database live telemetry and administrative overrides are enabled.',
            type: 'success',
          });
          setTimeout(() => setLocationToast(null), 4000);
        }}
        theme={theme}
      />

      {/* Interactive Ingestion & Database Setup Modal */}
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        config={config}
        onConfigUpdated={() => {
          fetchConfig();
          fetchHospitals();
          fetchAmbulances();
          fetchUsers();
        }}
        users={users}
        theme={theme}
      />

      {/* Emergency SOS Dispatch Modal */}
      <SOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        userLat={config.center_lat}
        userLng={config.center_lng}
        city={config.city}
        hospitals={hospitals}
        ambulances={ambulances}
        selectedHospitalId={selectedHospitalId}
        onDispatchCreated={(disp) => {
          setActiveDispatchId(disp.id);
          fetchDispatches();
          fetchAmbulances();
        }}
        theme={theme}
      />

      {/* RESQ Emergency Navigation & Crisis AI Chatbot */}
      <ResqChatModal
        isOpen={isResqOpen}
        onClose={() => setIsResqOpen(false)}
        userLat={config.center_lat}
        userLng={config.center_lng}
        city={config.city}
        hospitals={hospitals}
        onTriggerSos={() => {
          setIsResqOpen(false);
          setIsSosOpen(true);
        }}
        onSelectHospital={(hospId) => {
          setSelectedHospitalId(hospId);
          setActiveRole('patient');
          setIsResqOpen(false);
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* User Service Experience & Rating Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentUser={userProfile.name ? { 
          id: 'usr-curr', 
          name: userProfile.name, 
          phone: userProfile.phone, 
          email: '', 
          role: activeRole 
        } : null}
        city={config.city}
        theme={theme}
      />

      {/* Floating Action Trigger Group */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5">
        {/* Floating Feedback Trigger */}
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full border text-xs font-bold transition-all shadow-lg hover:scale-105 ${
            isDark 
              ? 'bg-[#0f172a]/95 hover:bg-slate-800 border-slate-700 text-slate-200' 
              : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-slate-300/40'
          }`}
          title="Submit User Feedback"
        >
          <MessageSquareHeart className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="hidden sm:inline">Feedback</span>
        </button>

        {/* Floating RESQ Crisis Assistant Trigger Button (3D Tactical Pill) */}
        <button
          onClick={() => setIsResqOpen(true)}
          className="btn-3d-resq flex items-center gap-2.5 px-4.5 py-3 text-white rounded-full font-bold text-xs sm:text-sm tracking-wide group"
          title="Open RESQ Emergency Navigation & Crisis Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span>RESQ Crisis AI</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono font-bold">108/112</span>
        </button>
      </div>

      {/* Floating Status Toast Notification */}
      {locationToast && (
        <div className="fixed bottom-20 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium leading-relaxed">
            {locationToast.message}
          </div>
          <button
            onClick={() => setLocationToast(null)}
            className="text-slate-400 hover:text-slate-600 text-xs ml-auto shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
