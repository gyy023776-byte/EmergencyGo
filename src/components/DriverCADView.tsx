import React, { useState } from 'react';
import { 
  Siren, Navigation, Gauge, BatteryCharging, Droplet, 
  Heart, Activity, CheckCircle, Radio, Phone, User, AlertCircle, Check
} from 'lucide-react';
import { Ambulance, Dispatch, Hospital } from '../types.ts';
import { AmbulanceLogo } from './AmbulanceLogo.tsx';

interface DriverCADViewProps {
  ambulance: Ambulance;
  activeDispatch: Dispatch | null;
  hospital: Hospital | null;
  onDispatchUpdated: () => void;
  onAmbulanceUpdated: () => void;
  theme?: 'light' | 'dark';
}

export const DriverCADView: React.FC<DriverCADViewProps> = ({
  ambulance,
  activeDispatch,
  hospital,
  onDispatchUpdated,
  onAmbulanceUpdated,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [heartRate, setHeartRate] = useState(activeDispatch?.vitals?.heart_rate_bpm || 108);
  const [spo2, setSpo2] = useState(activeDispatch?.vitals?.spo2_percent || 94);
  const [systolic, setSystolic] = useState(activeDispatch?.vitals?.systolic_bp || 135);
  const [diastolic, setDiastolic] = useState(activeDispatch?.vitals?.diastolic_bp || 88);
  const [vitalsSent, setVitalsSent] = useState(false);

  const handleUpdateStatus = async (status: any) => {
    if (!activeDispatch) return;
    try {
      await fetch(`/api/dispatches/${activeDispatch.id}/step`, {
        method: 'POST',
      });
      onDispatchUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransmitVitals = async () => {
    if (!activeDispatch) return;
    try {
      await fetch(`/api/dispatches/${activeDispatch.id}/vitals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heart_rate_bpm: heartRate,
          spo2_percent: spo2,
          systolic_bp: systolic,
          diastolic_bp: diastolic,
        }),
      });
      setVitalsSent(true);
      setTimeout(() => setVitalsSent(false), 2000);
      onDispatchUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Unit Status Tactical Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all shadow-sm ${
        isDark ? 'bg-[#0b101c] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <AmbulanceLogo size="lg" variant="emblem" animateLights={true} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {ambulance.call_sign}
              </h2>
              <span className="text-slate-400 text-xs">·</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {ambulance.vehicle_type}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                EMS Unit Active
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lead Paramedic: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{ambulance.driver_name}</strong> · Plate: <span className="font-mono">{ambulance.vehicle_number}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <AmbulanceLogo size="md" variant="vehicle" animateLights={true} />
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-center ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">SPEED</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{ambulance.speed_kmh} km/h</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-center ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">O₂ LEVEL</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{ambulance.oxygen_level_pct}%</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-center ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">BATTERY</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{ambulance.battery_level_pct}%</span>
          </div>
        </div>
      </div>

      {/* Active Mission CAD Card */}
      {activeDispatch ? (
        <div className={`p-5 space-y-4 rounded-xl border transition-colors ${
          isDark 
            ? 'bg-slate-900 border-red-500/80 shadow-lg' 
            : 'bg-white border-red-300 shadow-md ring-1 ring-red-500/10'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <div>
              <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                ACTIVE CAD DISPATCH #{activeDispatch.id}
              </div>
              <h3 className={`text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDispatch.emergency_category} · Priority: {activeDispatch.priority}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">ESTIMATED ETA</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ~{activeDispatch.eta_minutes} mins
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient / Location</span>
              <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDispatch.caller_name}
              </div>
              <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {activeDispatch.patient_address}
              </div>
              <div className="font-mono flex items-center gap-1.5 pt-0.5 text-slate-600 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                <a href={`tel:${activeDispatch.caller_phone}`} className="hover:underline font-bold">
                  {activeDispatch.caller_phone}
                </a>
              </div>
              <div className={`mt-2 p-2.5 rounded-lg border text-[11px] ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <strong className="text-slate-400">Dispatcher Notes:</strong> {activeDispatch.notes}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1.5 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Receiving Emergency Department</span>
              <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDispatch.target_hospital?.name || hospital?.name || 'Trauma Emergency Facility'}
              </div>
              <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {activeDispatch.target_hospital?.address || hospital?.address}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                ✓ ICU Bed Reserved · Emergency Bay Alerted
              </div>
            </div>
          </div>

          {/* Real-time Status Stepper */}
          <div className="space-y-2">
            <span className={`text-xs font-bold uppercase tracking-wider block ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Mission Phase Progress
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { status: 'en_route_pickup', label: '1. En Route to Patient' },
                { status: 'patient_onboard', label: '2. Patient Onboard' },
                { status: 'en_route_hospital', label: '3. Transporting to ER' },
                { status: 'arrived_hospital', label: '4. Arrived at Hospital' },
              ].map((step) => {
                const isActive = activeDispatch.status === step.status;
                return (
                  <button
                    key={step.status}
                    onClick={() => handleUpdateStatus(step.status)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      isActive
                        ? 'border-red-500 bg-red-600 text-white font-bold shadow-sm'
                        : isDark
                          ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paramedic Live Vitals Input */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-2 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <Activity className="w-4 h-4 text-red-600" />
                <span>Paramedic Vitals Telemetry (Broadcasts to Receiving Hospital)</span>
              </span>
              <button
                onClick={handleTransmitVitals}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{vitalsSent ? 'Transmitted ✓' : 'Broadcast to ER'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-semibold mb-1 uppercase">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(parseInt(e.target.value, 10))}
                  className={`w-full rounded-lg p-2 font-mono font-bold text-red-600 border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-semibold mb-1 uppercase">SpO₂ (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(parseInt(e.target.value, 10))}
                  className={`w-full rounded-lg p-2 font-mono font-bold text-cyan-600 border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-semibold mb-1 uppercase">Systolic BP</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(parseInt(e.target.value, 10))}
                  className={`w-full rounded-lg p-2 font-mono font-bold text-amber-600 border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-semibold mb-1 uppercase">Diastolic BP</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(parseInt(e.target.value, 10))}
                  className={`w-full rounded-lg p-2 font-mono font-bold text-amber-600 border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-8 text-center space-y-2 rounded-xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Unit {ambulance.call_sign} on Standby
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Ambulance is fueled, equipped with ALS medical gear, and awaiting emergency CAD dispatch calls.
          </p>
        </div>
      )}
    </div>
  );
};
