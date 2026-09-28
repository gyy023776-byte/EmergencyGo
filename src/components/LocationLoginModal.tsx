import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, ShieldCheck, CheckCircle2, 
  AlertCircle, Siren, User, Phone, 
  X, RefreshCw, ArrowRight, Crosshair, Database,
  Lock, Eye, EyeOff, KeyRound, Check, LogIn, UserPlus,
  Smartphone, Sparkles, Building2
} from 'lucide-react';
import { UserAccount } from '../types.ts';

interface LocationLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  currentLat: number;
  currentLng: number;
  isGpsActive: boolean;
  onLocationGranted: (lat: number, lng: number, cityName?: string) => Promise<void> | void;
  currentUser: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin'; password?: string };
  onUpdateUser: (user: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin'; password?: string }) => void;
  availableUsers?: UserAccount[];
  theme?: 'light' | 'dark';
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
  onLoginSuccess?: (user: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin' }) => void;
}

export const LocationLoginModal: React.FC<LocationLoginModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  currentLat,
  currentLng,
  isGpsActive,
  onLocationGranted,
  currentUser,
  onUpdateUser,
  availableUsers = [],
  theme = 'light',
  isAdminMode = false,
  onToggleAdminMode,
  onLoginSuccess,
}) => {
  const isDark = theme === 'dark';

  // Mode: Register / Create Account or Sign In
  const hasExistingProfile = Boolean(currentUser.name && currentUser.phone && localStorage.getItem('emergencygo_has_registered') === 'true');
  const [authMode, setAuthMode] = useState<'register' | 'login'>(hasExistingProfile ? 'register' : 'register');

  // Registration Fields
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [password, setPassword] = useState(() => localStorage.getItem('emergencygo_user_password') || '');
  const [confirmPassword, setConfirmPassword] = useState(() => localStorage.getItem('emergencygo_user_password') || '');
  const [role, setRole] = useState<'patient' | 'driver' | 'hospital_admin'>(currentUser.role || 'patient');

  // Login Fields
  const [loginPhone, setLoginPhone] = useState(currentUser.phone || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser.name) setName(currentUser.name);
    if (currentUser.phone) {
      setPhone(currentUser.phone);
      setLoginPhone(currentUser.phone);
    }
    if (currentUser.role) setRole(currentUser.role);
    const savedPw = localStorage.getItem('emergencygo_user_password');
    if (savedPw) {
      setPassword(savedPw);
      setConfirmPassword(savedPw);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Validation Checkers
  const isNameValid = name.trim().length >= 2;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhone.length >= 10;
  const isPasswordValid = password.length >= 4;
  const isPasswordMatch = password === confirmPassword;
  const isLocationReady = isGpsActive || Boolean(currentCity);

  const canSubmitRegister = isNameValid && isPhoneValid && isPasswordValid && isPasswordMatch && isLocationReady;

  // Browser Geolocation
  const handleRequestLocation = () => {
    setIsLocating(true);
    setLocError(null);
    setLocSuccess(null);

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser. Please tap one of the city presets below.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          let detectedCity = currentCity;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              detectedCity = geoData.address?.city || geoData.address?.town || geoData.address?.county || geoData.address?.state || currentCity;
            }
          } catch {}

          await onLocationGranted(latitude, longitude, detectedCity);
          setLocSuccess(`GPS Location Locked! Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Accuracy ~${Math.round(accuracy)}m).`);
          localStorage.setItem('emergencygo_location_enabled', 'true');
          setIsLocating(false);
        } catch (err: any) {
          setLocError(err?.message || 'Failed to update location on dispatch server.');
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocError('Location permission was denied. Tap any city below to set your emergency center immediately.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocError('Location information is unavailable from your device. Please pick a city below.');
            break;
          case error.TIMEOUT:
            setLocError('Location request timed out. Please try again or pick a city below.');
            break;
          default:
            setLocError('Could not retrieve location. Please select a city preset.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleSelectPreset = async (cityName: string, lat: number, lng: number) => {
    setLocError(null);
    setLocSuccess(`Location selected: ${cityName} (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
    localStorage.setItem('emergencygo_location_enabled', 'true');
    await onLocationGranted(lat, lng, cityName);
  };

  // Complete Registration & Save
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isNameValid) {
      setFormError('Please enter your full name (at least 2 letters).');
      return;
    }
    if (!isPhoneValid) {
      setFormError('Please enter a valid mobile number (at least 10 digits).');
      return;
    }
    if (!isPasswordValid) {
      setFormError('Please create an app password with at least 4 characters.');
      return;
    }
    if (!isPasswordMatch) {
      setFormError('Passwords do not match. Please re-check your password.');
      return;
    }
    if (!isLocationReady) {
      setFormError('Please enable mobile location or select your city preset.');
      return;
    }

    try {
      setIsSubmittedSuccess(true);
      localStorage.setItem('emergencygo_user_password', password);
      localStorage.setItem('emergencygo_has_registered', 'true');
      localStorage.setItem('emergencygo_has_prompted_location', 'true');
      
      onUpdateUser({
        name: name.trim(),
        phone: phone.trim(),
        role,
        password,
      });

      setTimeout(() => {
        setIsSubmittedSuccess(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete registration.');
      setIsSubmittedSuccess(false);
    }
  };

  // Sign in with Existing Account
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      const loggedUser = data.user;
      localStorage.setItem('emergencygo_user_password', loginPassword);
      localStorage.setItem('emergencygo_has_registered', 'true');
      localStorage.setItem('emergencygo_has_prompted_location', 'true');

      if (loggedUser.location?.lat && loggedUser.location?.lng) {
        onLocationGranted(loggedUser.location.lat, loggedUser.location.lng);
      }

      onUpdateUser({
        name: loggedUser.name,
        phone: loggedUser.phone,
        role: loggedUser.role,
        password: loginPassword,
      });

      if (onLoginSuccess) {
        onLoginSuccess(loggedUser);
      }

      setTimeout(() => {
        setIsLoggingIn(false);
        onClose();
      }, 600);
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError(err.message || 'Failed to log in.');
    }
  };

  const handleQuickUserSelect = (u: UserAccount) => {
    setName(u.name);
    setPhone(u.phone);
    setRole(u.role);
    setLoginPhone(u.phone);
    onUpdateUser({ name: u.name, phone: u.phone, role: u.role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0a0f1d] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-4 ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-red-50/70 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {authMode === 'register' ? 'Emergency Profile & GPS Registration' : 'Emergency Account Login'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                  Required
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {authMode === 'register'
                  ? 'Fill your name, mobile number, app password, and enable mobile location for instant 108/112 dispatch.'
                  : 'Log in with your registered mobile number and password to access your emergency records.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-xs'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Mode Switcher */}
        <div className={`px-4 sm:px-6 pt-3 flex items-center justify-between border-b ${
          isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setFormError(null);
                setLoginError(null);
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                authMode === 'register'
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create / Update Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setFormError(null);
                setLoginError(null);
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                authMode === 'login'
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Password</span>
            </button>
          </div>

          {/* Real-Time Progress Checklist (In Register Mode) */}
          {authMode === 'register' && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono pb-2">
              <span className={`flex items-center gap-0.5 ${isNameValid ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                {isNameValid ? '✓' : '○'} Name
              </span>
              <span>·</span>
              <span className={`flex items-center gap-0.5 ${isPhoneValid ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                {isPhoneValid ? '✓' : '○'} Mobile
              </span>
              <span>·</span>
              <span className={`flex items-center gap-0.5 ${isPasswordValid && isPasswordMatch ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                {isPasswordValid && isPasswordMatch ? '✓' : '○'} Password
              </span>
              <span>·</span>
              <span className={`flex items-center gap-0.5 ${isLocationReady ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                {isLocationReady ? '✓' : '○'} GPS
              </span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {authMode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* STEP 1: Name and Mobile Number */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-red-600" />
                    <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      1. Name & Emergency Mobile Number
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                    Mandatory
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Sharma or Rahul"
                        className={`w-full border rounded-lg px-3 py-2 text-xs transition ${
                          isDark 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                        }`}
                      />
                      {isNameValid && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Mobile Number (10 Digits) *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition ${
                          isDark 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                        }`}
                      />
                      {isPhoneValid && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  💡 <strong>Emergency Dispatch Guarantee:</strong> 108/112 operators and ambulance drivers use your phone number to coordinate live vehicle arrival.
                </p>

                {/* Role Switcher Option */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Selected Role:</span>
                  <div className="flex items-center gap-1">
                    {(['patient', 'driver', 'hospital_admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          role === r
                            ? 'bg-red-600 text-white'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {r === 'patient' ? 'Citizen' : r === 'driver' ? 'Paramedic' : 'ER Admin'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 2: Create App Password */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      2. Create App Password
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isPasswordValid && isPasswordMatch
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                      : 'bg-amber-500/10 text-amber-500 font-medium'
                  }`}>
                    {isPasswordValid && isPasswordMatch ? 'Password Secured' : 'Min 4 Characters'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Create App Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create password (min 4 chars)"
                        className={`w-full border rounded-lg px-3 py-2 pr-9 text-xs transition ${
                          isDark 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-500' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Confirm App Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`w-full border rounded-lg px-3 py-2 pr-9 text-xs transition ${
                          confirmPassword && !isPasswordMatch
                            ? 'border-rose-500 focus:border-rose-500'
                            : isDark 
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-500' 
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {confirmPassword && !isPasswordMatch && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Passwords do not match. Please verify both fields.</span>
                  </p>
                )}

                <p className="text-[10px] text-slate-400">
                  🔒 <strong>Privacy & Security:</strong> Your password protects your emergency dispatch telemetry, ER reservations, and responder communications.
                </p>
              </div>

              {/* STEP 3: Enable Mobile Location */}
              <div className={`p-4 sm:p-5 rounded-xl border space-y-3.5 ${
                isDark ? 'bg-gradient-to-b from-red-950/20 to-slate-900/60 border-red-900/40' : 'bg-red-50/50 border-red-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-red-600 animate-pulse" />
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      3. Enable Mobile Location (Required for Ambulances & ERs)
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isGpsActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isGpsActive ? 'GPS ACTIVE 🟢' : 'LOCATION REQUIRED'}
                  </span>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  EmergencyGo uses your device GPS coordinates to calculate real road drive times to the nearest emergency hospitals and dispatch the closest ambulance unit.
                </p>

                {/* Big Location Enable Button */}
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isGpsActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-600/20'
                  }`}
                >
                  {isLocating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Locking High-Accuracy GPS Coordinates...</span>
                    </>
                  ) : isGpsActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Mobile GPS Location Locked & Active ({currentLat.toFixed(3)}, {currentLng.toFixed(3)})</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4 animate-ping" />
                      <span>Enable Mobile Device Location & Lock GPS</span>
                    </>
                  )}
                </button>

                {/* Feedback message */}
                {locSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{locSuccess}</span>
                  </div>
                )}

                {locError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{locError}</span>
                  </div>
                )}

                {/* City Preset Fallback Selector */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Or Select City Preset:</span>
                    <span>Instant Real-Time Load</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
                      { city: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
                      { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
                      { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
                      { city: 'Mumbai', lat: 18.9986, lng: 72.8427 },
                    ].map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => handleSelectPreset(c.city, c.lat, c.lng)}
                        className={`p-2 rounded-lg border text-left transition ${
                          currentCity.toLowerCase().includes(c.city.toLowerCase().slice(0, 5))
                            ? 'bg-red-600 text-white border-red-600 font-bold'
                            : isDark 
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        <div className="font-semibold text-[11px] truncate">{c.city}</div>
                        <div className="text-[9px] opacity-80 font-mono">
                          {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Validation Feedback Banner */}
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs font-semibold animate-in shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canSubmitRegister}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    canSubmitRegister
                      ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-600/30 cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  {isSubmittedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                      <span>Registration Confirmed! Launching EmergencyGo...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save Profile, Create Password & Launch App</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {!canSubmitRegister && (
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Please ensure Name, Mobile (10 digits), Password (min 4 chars), and Mobile Location are completed.
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* SIGN IN WITH EXISTING PASSWORD FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <LogIn className="w-4 h-4 text-red-600" />
                  <span>Sign In with Registered Mobile & Password</span>
                </div>

                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition ${
                      isDark 
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    App Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your created password"
                      className={`w-full border rounded-lg px-3 py-2 pr-9 text-xs transition ${
                        isDark 
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginPhone || !loginPassword}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Mobile & Password...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In & Restore Emergency Profile</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick switch presets */}
              {availableUsers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">Available registered demo profiles:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableUsers.slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickUserSelect(u)}
                        className={`px-2 py-1 rounded text-[10px] border transition ${
                          u.name === name
                            ? 'bg-red-600 text-white border-red-600 font-bold'
                            : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.name} ({u.phone})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Owner / Developer Live Database Console Toggle */}
          <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                isAdminMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Owner Database Live Console</span>
                  {isAdminMode && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-500 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isAdminMode ? 'Live indicators & telemetry deck visible' : 'Hidden from normal users. Click to view.'}
                </div>
              </div>
            </div>
            {onToggleAdminMode && (
              <button
                type="button"
                onClick={onToggleAdminMode}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  isAdminMode
                    ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isAdminMode ? 'Hide Database' : 'View Database Live'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>End-to-End Encrypted Emergency Dispatch Grid</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isDark 
                  ? 'text-slate-400 hover:text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancel / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
