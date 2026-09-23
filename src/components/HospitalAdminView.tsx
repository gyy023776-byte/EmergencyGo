import React, { useState } from 'react';
import { 
  Building2, Activity, Heart, Wind, Droplet, 
  ShieldAlert, CheckCircle, RefreshCw, Radio, Bell
} from 'lucide-react';
import { Hospital, Dispatch } from '../types.ts';

interface HospitalAdminViewProps {
  hospital: Hospital;
  activeDispatches: Dispatch[];
  onCapacityUpdated: () => void;
  theme?: 'light' | 'dark';
}

export const HospitalAdminView: React.FC<HospitalAdminViewProps> = ({
  hospital,
  activeDispatches,
  onCapacityUpdated,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [emergencyStatus, setEmergencyStatus] = useState(hospital.emergency_status);
  const [icuAvail, setIcuAvail] = useState(hospital.capacity.icu_available);
  const [genAvail, setGenAvail] = useState(hospital.capacity.general_available);
  const [ventAvail, setVentAvail] = useState(hospital.capacity.ventilators_available);
  const [oxygenPct, setOxygenPct] = useState(hospital.capacity.oxygen_supply_percent);
  const [bloodOpos, setBloodOpos] = useState(hospital.capacity.blood_bank['O+']);
  const [bloodApos, setBloodApos] = useState(hospital.capacity.blood_bank['A+']);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveCapacity = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/capacity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_status: emergencyStatus,
          capacity: {
            icu_available: icuAvail,
            general_available: genAvail,
            ventilators_available: ventAvail,
            oxygen_supply_percent: oxygenPct,
            blood_bank: {
              ...hospital.capacity.blood_bank,
              'O+': bloodOpos,
              'A+': bloodApos,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('Hospital bed capacity updated and synchronized to Cloud SQL database.');
        onCapacityUpdated();
      }
    } catch (e: any) {
      setSaveMessage(`Failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const incomingDispatches = activeDispatches.filter(
    (d) => d.target_hospital_id === hospital.id && d.status !== 'completed' && d.status !== 'cancelled'
  );

  return (
    <div className="space-y-4">
      {/* Hospital Identity Header */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {hospital.name}
              </h2>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
                ER Operations Command
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {hospital.address} · Emergency Line: {hospital.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Incoming Trauma</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center justify-end gap-1.5">
              <Radio className="w-4 h-4 text-red-600" />
              <span>{incomingDispatches.length} Units En Route</span>
            </span>
          </div>
        </div>
      </div>

      {/* Incoming Ambulances Telemetry Radar */}
      {incomingDispatches.length > 0 && (
        <div className={`p-4 rounded-xl border space-y-3 ${
          isDark ? 'bg-slate-900 border-red-500/60' : 'bg-red-50/60 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Inbound Trauma Pre-Alert</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Live Paramedic Stream</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingDispatches.map((disp) => (
              <div key={disp.id} className={`p-3.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mission #{disp.id} · {disp.emergency_category}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ~{disp.eta_minutes} mins ETA
                  </span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Caller: {disp.caller_name} ({disp.caller_phone})
                </div>
                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <strong className="text-slate-400">Paramedic:</strong> {disp.notes}
                </div>

                {/* Vitals Feed */}
                <div className={`flex items-center justify-between text-[11px] p-2 rounded-lg font-mono border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-red-600 font-bold">HR: {disp.vitals?.heart_rate_bpm || 110} BPM</span>
                  <span className="text-cyan-600 font-bold">SpO₂: {disp.vitals?.spo2_percent || 92}%</span>
                  <span className="text-amber-600 font-bold">BP: {disp.vitals?.systolic_bp || 140}/{disp.vitals?.diastolic_bp || 90}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Capacity Controller */}
      <div className={`p-5 rounded-xl border space-y-5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Emergency Department Resource Control
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Update available ICU beds, ventilators, and oxygen stock. Syncs in real time with ambulance routing.
            </p>
          </div>
          <button
            onClick={handleSaveCapacity}
            disabled={isSaving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Broadcasting...' : 'Save & Sync Capacity'}</span>
          </button>
        </div>

        {saveMessage && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-medium">
            {saveMessage}
          </div>
        )}

        {/* Emergency Status Switcher */}
        <div className="space-y-2">
          <label className={`block text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Emergency Admission Status
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'OPEN', label: 'OPEN (Accepting Emergencies)', activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
              { id: 'ON_DIVERSION', label: 'DIVERSION (High Load / Standby)', activeColor: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
              { id: 'CRITICAL_CAPACITY', label: 'CRITICAL (Code Red / Full)', activeColor: 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setEmergencyStatus(st.id as any)}
                className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                  emergencyStatus === st.id
                    ? `${st.activeColor} font-bold ring-1 ring-current shadow-xs`
                    : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs flex items-center gap-1.5 font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Activity className="w-4 h-4 text-red-600" />
              <span>Available ICU Beds</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={hospital.capacity.icu_total}
                value={icuAvail}
                onChange={(e) => setIcuAvail(parseInt(e.target.value, 10) || 0)}
                className={`w-16 rounded-lg px-2 py-1 text-sm font-bold font-mono text-center border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="text-xs text-slate-400 font-mono">/ {hospital.capacity.icu_total} total</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs flex items-center gap-1.5 font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Heart className="w-4 h-4 text-blue-600" />
              <span>General Beds</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={hospital.capacity.general_total}
                value={genAvail}
                onChange={(e) => setGenAvail(parseInt(e.target.value, 10) || 0)}
                className={`w-16 rounded-lg px-2 py-1 text-sm font-bold font-mono text-center border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="text-xs text-slate-400 font-mono">/ {hospital.capacity.general_total} total</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs flex items-center gap-1.5 font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Wind className="w-4 h-4 text-cyan-600" />
              <span>Free Ventilators</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={hospital.capacity.ventilators_total}
                value={ventAvail}
                onChange={(e) => setVentAvail(parseInt(e.target.value, 10) || 0)}
                className={`w-16 rounded-lg px-2 py-1 text-sm font-bold font-mono text-center border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="text-xs text-slate-400 font-mono">/ {hospital.capacity.ventilators_total}</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs flex items-center gap-1.5 font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Droplet className="w-4 h-4 text-emerald-600" />
              <span>Oxygen Level (%)</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={oxygenPct}
                onChange={(e) => setOxygenPct(parseInt(e.target.value, 10) || 0)}
                className={`w-16 rounded-lg px-2 py-1 text-sm font-bold font-mono text-center border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                }`}
              />
              <span className="text-xs text-slate-400 font-mono">% reserve</span>
            </div>
          </div>
        </div>

        {/* Blood Bank Reserves */}
        <div className="space-y-2">
          <label className={`block text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Emergency Blood Units (Units on Hand)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-red-600">O+ Positive</span>
              <input
                type="number"
                value={bloodOpos}
                onChange={(e) => setBloodOpos(parseInt(e.target.value, 10) || 0)}
                className={`w-14 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-red-600">A+ Positive</span>
              <input
                type="number"
                value={bloodApos}
                onChange={(e) => setBloodApos(parseInt(e.target.value, 10) || 0)}
                className={`w-14 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
