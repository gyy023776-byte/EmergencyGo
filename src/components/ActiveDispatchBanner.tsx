import React, { useState, useEffect } from 'react';
import { 
  Siren, Play, Pause, FastForward, Heart, Activity, 
  Phone, Building2, CheckCircle2, ShieldAlert, X, AlertOctagon, RotateCcw
} from 'lucide-react';
import { Dispatch, Ambulance } from '../types.ts';

interface ActiveDispatchBannerProps {
  dispatch: Dispatch;
  ambulances: Ambulance[];
  onDispatchUpdated: () => void;
  onCloseBanner: () => void;
  theme?: 'light' | 'dark';
}

export const ActiveDispatchBanner: React.FC<ActiveDispatchBannerProps> = ({
  dispatch,
  ambulances,
  onDispatchUpdated,
  onCloseBanner,
  theme = 'light',
}) => {
  const [isSimulating, setIsSimulating] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [heartRate, setHeartRate] = useState(dispatch.vitals?.heart_rate_bpm || 112);
  const [spo2, setSpo2] = useState(dispatch.vitals?.spo2_percent || 93);
  const [systolic, setSystolic] = useState(dispatch.vitals?.systolic_bp || 140);
  const [diastolic, setDiastolic] = useState(dispatch.vitals?.diastolic_bp || 90);

  const isDark = theme === 'dark';
  const amb = ambulances.find((a) => a.id === dispatch.assigned_ambulance_id) || dispatch.assigned_ambulance;

  // Auto-advance simulation loop
  useEffect(() => {
    let interval: any = null;
    if (isSimulating && dispatch.status !== 'completed' && dispatch.status !== 'cancelled') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/dispatches/${dispatch.id}/step`, {
            method: 'POST',
          });
          const data = await res.json();
          if (data.success) {
            onDispatchUpdated();
            if (data.status === 'completed') {
              setIsSimulating(false);
            }
          }
        } catch (e) {
          console.error('Simulation step error:', e);
        }
      }, 2500); // Step every 2.5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, dispatch.id, dispatch.status, onDispatchUpdated]);

  const handleManualStep = async () => {
    try {
      const res = await fetch(`/api/dispatches/${dispatch.id}/step`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onDispatchUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelDispatch = async () => {
    if (!confirm('Are you sure you want to cancel this emergency ambulance mission?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/dispatches/${dispatch.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onDispatchUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const totalSteps = dispatch.route_coordinates?.length || 30;
  const progressPercent = Math.min(100, Math.round(((dispatch.route_step || 0) / totalSteps) * 100));

  const getStatusText = () => {
    switch (dispatch.status) {
      case 'en_route_pickup':
        return 'Ambulance En Route to Patient Pickup';
      case 'patient_onboard':
        return 'Patient Onboard · Paramedic Stabilizing';
      case 'en_route_hospital':
        return 'Emergency Transit to Trauma Hospital';
      case 'arrived_hospital':
        return 'Arrived at Emergency Bay';
      case 'completed':
        return 'Transport Completed · Handover Finished';
      case 'cancelled':
        return 'Mission Cancelled';
      default:
        return 'Active Mission';
    }
  };

  return (
    <div className={`rounded-2xl p-5 space-y-4 transition-all border shadow-xl ${
      isDark 
        ? 'bg-gradient-to-br from-[#1c0c16] via-[#0f172a] to-[#070b14] border-rose-600/80 text-white emergency-glow' 
        : 'bg-gradient-to-br from-rose-50/90 via-white to-red-50/50 border-red-300 text-slate-800 shadow-rose-500/10 ring-2 ring-red-500/20'
    }`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                CAD DISPATCH #{dispatch.id.toUpperCase()}
              </span>
              <span className="text-slate-300 dark:text-slate-600 select-none">·</span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {dispatch.emergency_category}
              </span>
            </div>
            <div className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* ETA & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1.5 rounded-lg border text-right ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Estimated ETA</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ~{dispatch.eta_minutes} mins
            </span>
          </div>

          {dispatch.status !== 'completed' && dispatch.status !== 'cancelled' && (
            <>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isSimulating
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Pause GPS' : 'Auto GPS'}</span>
              </button>

              <button
                onClick={handleManualStep}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <FastForward className="w-3.5 h-3.5 text-slate-500" />
                <span>Next Step</span>
              </button>

              <button
                onClick={handleCancelDispatch}
                disabled={isCancelling}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Cancel Dispatch Mission"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          <button
            onClick={onCloseBanner}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Route Progress Bar */}
      <div className="space-y-1">
        <div className={`flex justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Ambulance Transit Progress ({progressPercent}%)</span>
          <span className="font-mono">Step {dispatch.route_step || 0} of {totalSteps}</span>
        </div>
        <div className={`w-full rounded-full h-1.5 overflow-hidden border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid: Unit + Hospital + Live Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
        {/* Unit Info */}
        <div className={`p-3 rounded-lg border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">Assigned Unit</span>
          <div className="font-bold text-xs flex items-center gap-2">
            <span className={isDark ? 'text-white' : 'text-slate-900'}>{amb?.call_sign || 'ALS Unit 101'}</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">({amb?.vehicle_type || 'ALS'})</span>
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Paramedic: {amb?.driver_name}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{amb?.driver_phone}</div>
        </div>

        {/* Hospital Info */}
        <div className={`p-3 rounded-lg border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">Destination Facility</span>
          <div className="font-bold text-xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className={`truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {dispatch.target_hospital?.name || 'Trauma Emergency Center'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            ICU Bed & Trauma Bay Pre-Allocated
          </div>
        </div>

        {/* Live Patient Vitals Stream */}
        <div className={`p-3 rounded-lg border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Patient Telemetry</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">LIVE SYNC</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className={`p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] text-slate-400 block font-sans">HR</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-xs">{heartRate}</span>
            </div>
            <div className={`p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] text-slate-400 block font-sans">SpO₂</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">{spo2}%</span>
            </div>
            <div className={`p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] text-slate-400 block font-sans">BP</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{systolic}/{diastolic}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
