import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Siren, Database, MapPin, Search, Filter, Shield, 
  Activity, Users, User, Building2, Radio, Sparkles,
  PhoneCall, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle,
  Sun, Moon, Compass, Plus, Phone, Crosshair, Navigation
} from 'lucide-react';
import { 
  Hospital, Ambulance, Dispatch, UserAccount, SystemConfig 
} from './types.ts';
import { EmergencyMap } from './components/EmergencyMap.tsx';
import { HospitalCard } from './components/HospitalCard.tsx';
import { SetupModal } from './components/SetupModal.tsx';
import { SOSModal } from './components/SOSModal.tsx';
import { LocationLoginModal } from './components/LocationLoginModal.tsx';
import { ActiveDispatchBanner } from './components/ActiveDispatchBanner.tsx';
import { HospitalAdminView } from './components/HospitalAdminView.tsx';
import { DriverCADView } from './components/DriverCADView.tsx';

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
  }>(() => {
    const saved = localStorage.getItem('emergencygo_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'Ananya Sharma',
      phone: '+91 91234 56789',
      role: 'patient',
    };
  });

  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => {
    return localStorage.getItem('emergencygo_location_enabled') === 'true';
  });

  // Prompt for location on first launch or when entering the app
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(() => {
    return localStorage.getItem('emergencygo_has_prompted_location') !== 'true';
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
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);

  // Quick Hotline Modal state
  const [showHotlines, setShowHotlines] = useState(false);

  // Fetch System Config & Users
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
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

  const handleUpdateUser = (newProfile: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin' }) => {
    setUserProfile(newProfile);
    setActiveRole(newProfile.role);
    localStorage.setItem('emergencygo_user_profile', JSON.stringify(newProfile));
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
          {/* Logo & City Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  EmergencyGo
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {config.city}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'patient'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen SOS</span>
            </button>
            <button
              onClick={() => setActiveRole('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'driver'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Paramedic CAD</span>
            </button>
            <button
              onClick={() => setActiveRole('hospital_admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRole === 'hospital_admin'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
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
                isGpsActive
                  ? isDark 
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
                  : isDark
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-xs'
              }`}
              title="Click to enable or update GPS location or switch user"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isGpsActive ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
              <span className="font-semibold hidden sm:inline">{userProfile.name.split(' ')[0]}</span>
              <span className="opacity-40 hidden sm:inline">·</span>
              <span className="font-semibold truncate max-w-[85px] sm:max-w-none">
                {isGpsActive ? `${config.city}` : 'Enable GPS'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isGpsActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
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

            {/* Ingestion & DB Live Setup */}
            <button
              onClick={() => setIsSetupOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                isDark 
                  ? 'bg-[#0b101c] hover:bg-slate-800 border-slate-800 text-slate-300' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline">Database Live</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>

            {/* Primary SOS Action */}
            <button
              onClick={() => setIsSosOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Siren className="w-3.5 h-3.5" />
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
            {/* Overview Banner */}
            <div className={`border rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-[#0b101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">PostGIS Spatial Engine Online</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Grid: {config.city}</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span className="font-mono text-slate-400">{config.center_lat.toFixed(3)}, {config.center_lng.toFixed(3)}</span>
                </div>
                <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Emergency Medical Transit & Real-Time Hospital Directory
                </h1>
                <p className={`text-xs max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Spatial routing calculating real road travel times, live ICU and ventilator availability, and active paramedic unit telemetry.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsSosOpen(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <Siren className="w-4 h-4" />
                  <span>Request Emergency Ambulance</span>
                </button>
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

                <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Live EMS Telemetry</span>
                  </div>
                  <div className={`flex items-center gap-3 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>{ambulances.length} Active Ambulances</span>
                    <span>•</span>
                    <span>{hospitals.length} Hospitals in DB</span>
                  </div>
                </div>
              </div>

              {/* Hospital Finder & Capacity Feed (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Radius Filter Bar */}
                <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  isDark ? 'bg-[#0b101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
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
                    <div className={`border rounded-2xl p-8 text-center space-y-3 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        No Hospitals Match Current Spatial Query
                      </h4>
                      <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Try expanding the radius slider or use the Setup Layer to fetch hospitals live from OpenStreetMap for {config.city}.
                      </p>
                      <button
                        onClick={() => setIsSetupOpen(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Open Ingestion Setup & Seed OSM
                      </button>
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
    </div>
  );
}
