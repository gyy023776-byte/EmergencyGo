import React, { useState, useEffect } from 'react';
import { 
  MapPin, Compass, Navigation, ShieldCheck, CheckCircle2, 
  AlertCircle, Sparkles, Building2, Siren, User, Phone, 
  X, RefreshCw, ArrowRight, Crosshair
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
  currentUser: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin' };
  onUpdateUser: (user: { name: string; phone: string; role: 'patient' | 'driver' | 'hospital_admin' }) => void;
  availableUsers?: UserAccount[];
  theme?: 'light' | 'dark';
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
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  const [name, setName] = useState(currentUser.name || 'Ananya Sharma');
  const [phone, setPhone] = useState(currentUser.phone || '+91 91234 56789');
  const [role, setRole] = useState<'patient' | 'driver' | 'hospital_admin'>(currentUser.role || 'patient');
  
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setPhone(currentUser.phone);
    setRole(currentUser.role);
  }, [currentUser]);

  if (!isOpen) return null;

  // Request browser geolocation
  const handleRequestLocation = () => {
    setIsLocating(true);
    setLocError(null);
    setLocSuccess(null);

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser. Please select a city preset below.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          // Attempt reverse geocoding to find city name
          let detectedCity = currentCity;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              detectedCity = geoData.address?.city || geoData.address?.town || geoData.address?.county || geoData.address?.state || currentCity;
            }
          } catch {
            // Keep current city name if reverse geocoding fails
          }

          await onLocationGranted(latitude, longitude, detectedCity);
          setLocSuccess(`GPS Location Locked! Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Accuracy ~${Math.round(accuracy)}m).`);
          localStorage.setItem('emergencygo_location_enabled', 'true');
          
          setTimeout(() => {
            setIsLocating(false);
            onClose();
          }, 1200);
        } catch (err: any) {
          setLocError(err?.message || 'Failed to update location on dispatch server.');
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocError('Location access was denied. You can select your city preset below or click the lock/location icon in your browser address bar to allow.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocError('Location information is unavailable from your device. Please pick a city below.');
            break;
          case error.TIMEOUT:
            setLocError('Location request timed out. Please try again or select a city below.');
            break;
          default:
            setLocError('An unknown error occurred while retrieving location.');
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
    setLocSuccess(`Switched location to ${cityName} (${lat}, ${lng})`);
    await onLocationGranted(lat, lng, cityName);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSaveProfile = () => {
    onUpdateUser({ name, phone, role });
  };

  const handleQuickUserSelect = (u: UserAccount) => {
    setName(u.name);
    setPhone(u.phone);
    setRole(u.role);
    onUpdateUser({ name: u.name, phone: u.phone, role: u.role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0a0f1d] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-4 ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-red-50/70 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Welcome to EmergencyGo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                  GPS Required
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Enable device location to view nearby hospitals, check live ER capacity, and route ambulances.
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* User Account / Identity Section */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Caller / Responder Profile
                </span>
              </div>
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Role: <span className="font-semibold text-red-600 uppercase">{role}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    onUpdateUser({ name: e.target.value, phone, role });
                  }}
                  placeholder="e.g. Ananya Sharma"
                  className={`w-full border rounded-lg px-3 py-2 text-xs transition ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    onUpdateUser({ name, phone: e.target.value, role });
                  }}
                  placeholder="+91 91234 56789"
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-red-500'
                  }`}
                />
              </div>
            </div>

            {/* Quick Switch Accounts */}
            {availableUsers.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Quick Switch:</span>
                {availableUsers.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickUserSelect(u)}
                    className={`px-2 py-0.5 rounded text-[10px] border transition ${
                      u.name === name
                        ? 'bg-red-600 text-white border-red-600 font-semibold'
                        : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {u.name} ({u.role})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Request Hero Banner */}
          <div className={`p-4 sm:p-5 rounded-xl border text-center space-y-3.5 ${
            isDark ? 'bg-gradient-to-b from-red-950/20 to-slate-900/60 border-red-900/40' : 'bg-red-50/50 border-red-100'
          }`}>
            <div className="w-12 h-12 mx-auto rounded-full bg-red-600/10 border-2 border-red-500/30 flex items-center justify-center text-red-600">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Allow Location for Nearest Emergency Hospitals
              </h4>
              <p className={`text-xs max-w-md mx-auto mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                EmergencyGo uses your device GPS to calculate immediate road drive times, locate open ER beds, and dispatch the closest paramedic unit.
              </p>
            </div>

            {/* Main Action Button */}
            <button
              onClick={handleRequestLocation}
              disabled={isLocating}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 mx-auto transition-all disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Locking Device GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Enable Device Location & Find Hospitals</span>
                </>
              )}
            </button>

            {/* Current Status Pill */}
            <div className="flex items-center justify-center gap-2 text-[11px] pt-1">
              <span className={`h-2 w-2 rounded-full ${isGpsActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Current Active Center: <strong>{currentCity}</strong> ({currentLat.toFixed(3)}, {currentLng.toFixed(3)})
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {locSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{locSuccess}</span>
            </div>
          )}

          {locError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 flex items-start gap-2 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{locError}</span>
            </div>
          )}

          {/* Or Pick a City Preset Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`font-semibold text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Or Select City Preset (Real Hospitals & Ambulances):
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Instant Spatial Load
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('Visakhapatnam', 17.6868, 83.2185)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentCity.toLowerCase().includes('visakha')
                    ? 'border-red-500 bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs">Visakhapatnam</div>
                <div className="text-[10px] opacity-75 mt-0.5">20 Real Hospitals</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Hyderabad', 17.3850, 78.4867)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentCity.toLowerCase().includes('hyderabad')
                    ? 'border-red-500 bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs">Hyderabad</div>
                <div className="text-[10px] opacity-75 mt-0.5">NIMS, Apollo, AIG</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Bengaluru', 12.9716, 77.5946)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentCity.toLowerCase().includes('bengaluru') || currentCity.toLowerCase().includes('bangalore')
                    ? 'border-red-500 bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs">Bengaluru</div>
                <div className="text-[10px] opacity-75 mt-0.5">Manipal, Narayana</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Mumbai', 18.9986, 72.8427)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentCity.toLowerCase().includes('mumbai')
                    ? 'border-red-500 bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs">Mumbai</div>
                <div className="text-[10px] opacity-75 mt-0.5">KEM, Lilavati, Hinduja</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Delhi', 28.6139, 77.2090)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentCity.toLowerCase().includes('delhi')
                    ? 'border-red-500 bg-red-500/10 font-bold text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs">Delhi NCR</div>
                <div className="text-[10px] opacity-75 mt-0.5">AIIMS Trauma, Max</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveProfile();
                  onClose();
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 shadow-xs'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>Keep Default</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">Continue to Map</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted HIPAA/GDPR Location Protocol</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleSaveProfile();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
