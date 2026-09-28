import React, { useState } from 'react';
import { 
  AlertTriangle, Siren, Phone, User, MapPin, 
  CheckCircle2, HeartPulse, Building2, Flame, X, Navigation
} from 'lucide-react';
import { Hospital, Ambulance, EmergencyCategory, EmergencyPriority } from '../types.ts';
import { AmbulanceLogo } from './AmbulanceLogo.tsx';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  city: string;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  selectedHospitalId?: string | null;
  onDispatchCreated: (dispatch: any) => void;
  theme?: 'light' | 'dark';
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng,
  city,
  hospitals,
  ambulances,
  selectedHospitalId,
  onDispatchCreated,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [callerName, setCallerName] = useState('Emergency Caller');
  const [callerPhone, setCallerPhone] = useState('+91 91234 56789');
  const [emergencyCategory, setEmergencyCategory] = useState<EmergencyCategory>('Cardiac Arrest');
  const [priority, setPriority] = useState<EmergencyPriority>('P1_CODE_RED');
  const [patientAddress, setPatientAddress] = useState(`${city} Metropolitan Center, Sector 4`);
  const [notes, setNotes] = useState('Patient unconscious, severe respiratory distress. Oxygen required immediately.');
  const [targetHospitalId, setTargetHospitalId] = useState(selectedHospitalId || hospitals[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories: { name: EmergencyCategory; priority: EmergencyPriority; icon: any; desc: string }[] = [
    { name: 'Cardiac Arrest', priority: 'P1_CODE_RED', icon: HeartPulse, desc: 'Chest pain, unresponsive, defibrillator ready' },
    { name: 'Severe Trauma / Accident', priority: 'P1_CODE_RED', icon: Flame, desc: 'Highway crash, fractures, major blood loss' },
    { name: 'Respiratory Failure', priority: 'P1_CODE_RED', icon: Siren, desc: 'Choking, acute asthma, liquid oxygen needed' },
    { name: 'Acute Stroke', priority: 'P1_CODE_RED', icon: AlertTriangle, desc: 'Facial droop, arm weakness, speech difficulty' },
    { name: 'Maternity / OB Emergency', priority: 'P2_URGENT', icon: User, desc: 'Labor onset, obstetric emergency care' },
    { name: 'Severe Bleeding', priority: 'P1_CODE_RED', icon: AlertTriangle, desc: 'Arterial bleeding, tourniquet / plasma required' },
  ];

  const handleTriggerDispatch = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_name: callerName,
          caller_phone: callerPhone,
          emergency_category: emergencyCategory,
          priority,
          patient_lat: userLat,
          patient_lng: userLng,
          patient_address: patientAddress,
          notes,
          target_hospital_id: targetHospitalId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onDispatchCreated(data.dispatch);
        onClose();
      } else {
        alert(data.error || 'Failed to dispatch ambulance');
      }
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedHospital = hospitals.find((h) => h.id === targetHospitalId) || hospitals[0];
  const availableAmbulances = ambulances.filter((a) => a.status === 'available');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className={`rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-red-50/80 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Emergency Medical Dispatch
                </h2>
                <span className="font-mono text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-950/80 dark:text-red-400 px-2 py-0.5 rounded-full uppercase">
                  Code Red
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Automatic GPS matching · Hospital trauma pre-alerting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* 1. Triage Selection */}
          <div className="space-y-2">
            <label className={`block text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              1. Select Emergency Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = emergencyCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setEmergencyCategory(cat.name);
                      setPriority(cat.priority);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? isDark
                          ? 'border-red-500 bg-red-950/40 text-white ring-1 ring-red-500'
                          : 'border-red-500 bg-red-50/70 text-slate-900 ring-2 ring-red-500/30'
                        : isDark
                          ? 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{cat.priority}</span>
                    </div>
                    <span className="font-bold text-xs leading-snug">{cat.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Destination Hospital Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                2. Target Hospital & Trauma Center
              </label>
              {selectedHospital && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {selectedHospital.distance_km} km away · {selectedHospital.capacity.icu_available} ICU beds free
                </span>
              )}
            </div>
            <select
              value={targetHospitalId}
              onChange={(e) => setTargetHospitalId(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.distance_km} km, ~{h.drive_time_mins} min ETA) — {h.capacity.icu_available} ICU Free
                </option>
              ))}
            </select>
          </div>

          {/* 3. Dispatch Vehicle Status */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <AmbulanceLogo size="md" variant="emblem" animateLights={true} className="shrink-0" />
              <div>
                <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {availableAmbulances.length > 0 ? 'Nearest Available ALS Ambulance Unit' : 'Backup EMS Unit Routing'}
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {availableAmbulances.length > 0
                    ? `${availableAmbulances[0].call_sign} (${availableAmbulances[0].vehicle_type}) · Paramedic: ${availableAmbulances[0].driver_name}`
                    : 'Dispatching nearest available backup unit'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <AmbulanceLogo size="sm" variant="vehicle" animateLights={false} />
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                GPS Verified
              </span>
            </div>
          </div>

          {/* 4. Caller & Incident Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Caller / Patient Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Incident Address / Landmark
            </label>
            <input
              type="text"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Paramedic Symptoms & Triage Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`w-full rounded-xl p-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleTriggerDispatch}
            disabled={isSubmitting}
            className="btn-3d-red px-6 py-2.5 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 tracking-wide"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            <span>{isSubmitting ? 'Contacting EMS...' : 'Confirm Ambulance Dispatch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
