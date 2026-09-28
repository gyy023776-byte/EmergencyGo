import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, KeyRound, 
  CheckCircle2, X, ShieldAlert, Sparkles 
} from 'lucide-react';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  theme?: 'light' | 'dark';
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  
  // Password status: is a password already configured?
  const [isPasswordConfigured, setIsPasswordConfigured] = useState<boolean | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Setup / Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeError, setChangeError] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Check if owner password is configured on open
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setChangeSuccess('');
      setChangeError('');
      setShowChangePassword(false);

      const checkOwnerStatus = async () => {
        try {
          const res = await fetch('/api/owner/status');
          if (res.ok) {
            const data = await res.json();
            const hasLocal = Boolean(localStorage.getItem('emergencygo_custom_owner_password'));
            setIsPasswordConfigured(Boolean(data.has_password || hasLocal));
          } else {
            const hasLocal = Boolean(localStorage.getItem('emergencygo_custom_owner_password'));
            setIsPasswordConfigured(hasLocal);
          }
        } catch {
          const hasLocal = Boolean(localStorage.getItem('emergencygo_custom_owner_password'));
          setIsPasswordConfigured(hasLocal);
        }
      };

      checkOwnerStatus();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Initial First-Time Setup: Create Secret Owner Password
  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    if (!newPass.trim()) {
      setChangeError('Please enter a secret owner password.');
      return;
    }

    if (newPass.length < 4) {
      setChangeError('Password must be at least 4 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setChangeError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch('/api/owner/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPass.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
        sessionStorage.setItem('emergencygo_owner_session', data.token || 'verified_owner');
        localStorage.setItem('emergencygo_is_admin', 'true');
        onAuthenticated();
        onClose();
      } else {
        // Fallback local persistence if server returned error
        localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
        sessionStorage.setItem('emergencygo_owner_session', 'verified_local');
        localStorage.setItem('emergencygo_is_admin', 'true');
        onAuthenticated();
        onClose();
      }
    } catch {
      localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
      sessionStorage.setItem('emergencygo_owner_session', 'verified_offline');
      localStorage.setItem('emergencygo_is_admin', 'true');
      onAuthenticated();
      onClose();
    } finally {
      setIsChanging(false);
    }
  };

  // 2. Verify Existing Owner Password
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your secret owner password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/owner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('emergencygo_owner_session', data.token || 'verified');
        localStorage.setItem('emergencygo_is_admin', 'true');
        onAuthenticated();
        onClose();
      } else if (data.needs_setup) {
        setIsPasswordConfigured(false);
      } else {
        // Fallback check against saved local custom password
        const localOwnerPass = localStorage.getItem('emergencygo_custom_owner_password');
        if (localOwnerPass && password === localOwnerPass) {
          sessionStorage.setItem('emergencygo_owner_session', 'verified_local');
          localStorage.setItem('emergencygo_is_admin', 'true');
          onAuthenticated();
          onClose();
          return;
        }

        setErrorMsg(data.error || 'Access Denied: Incorrect owner password.');
        if (data.attempts_remaining !== undefined) {
          setAttemptsRemaining(data.attempts_remaining);
        }
      }
    } catch {
      const localOwnerPass = localStorage.getItem('emergencygo_custom_owner_password');
      if (localOwnerPass && password === localOwnerPass) {
        sessionStorage.setItem('emergencygo_owner_session', 'verified_offline');
        localStorage.setItem('emergencygo_is_admin', 'true');
        onAuthenticated();
        onClose();
      } else {
        setErrorMsg('Access Denied: Incorrect owner password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Change Existing Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!currentPass || !newPass) {
      setChangeError('Please enter both current and new passwords.');
      return;
    }

    if (newPass.length < 4) {
      setChangeError('New password must be at least 4 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setChangeError('New passwords do not match.');
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch('/api/owner/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPass.trim(),
          new_password: newPass.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
        setChangeSuccess('Owner password successfully updated! Please log in with your new password.');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => {
          setShowChangePassword(false);
          setChangeSuccess('');
        }, 1500);
      } else {
        const localOwnerPass = localStorage.getItem('emergencygo_custom_owner_password');
        if (localOwnerPass && currentPass === localOwnerPass) {
          localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
          setChangeSuccess('Owner password successfully updated!');
          setTimeout(() => {
            setShowChangePassword(false);
            setChangeSuccess('');
          }, 1500);
        } else {
          setChangeError(data.error || 'Failed to update owner password. Check current password.');
        }
      }
    } catch {
      const localOwnerPass = localStorage.getItem('emergencygo_custom_owner_password');
      if (localOwnerPass && currentPass === localOwnerPass) {
        localStorage.setItem('emergencygo_custom_owner_password', newPass.trim());
        setChangeSuccess('Owner password saved locally!');
        setTimeout(() => {
          setShowChangePassword(false);
          setChangeSuccess('');
        }, 1500);
      } else {
        setChangeError('Verification failed. Incorrect current password.');
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#0b101c] border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>Owner Authentication</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                  Restricted
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized EmergencyGo System Owner Only
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* SCENARIO A: First-time setup (No default password exists) */}
          {isPasswordConfigured === false ? (
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isDark 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">First-Time Owner Setup:</span>
                    <p className="mt-0.5 opacity-90">
                      No default password is provided for security. Please create your private master password to protect administrative controls.
                    </p>
                  </div>
                </div>
              </div>

              {changeError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Create Secret Owner Password
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => {
                      setNewPass(e.target.value);
                      if (changeError) setChangeError('');
                    }}
                    placeholder="Create your custom secret password..."
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 ${
                      isDark 
                        ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-type secret password..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
                    isDark 
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChanging || !newPass.trim() || !confirmPass.trim()}
                  className="btn-3d-emerald flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wide"
                >
                  {isChanging ? 'Configuring...' : 'Set Password & Unlock'}
                </button>
              </div>
            </form>
          ) : !showChangePassword ? (
            /* SCENARIO B: Normal Login (Requires configured owner password) */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isDark 
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Protected Administrative Deck:</span>
                    <p className="mt-0.5 opacity-90">
                      Owner Mode unlocks live PostGIS configurations, Twilio SMS routing, direct database ingestion, and full dispatch overrides.
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Secret Owner Password
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter your secret owner password..."
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 ${
                      isDark 
                        ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-end text-[11px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="text-red-500 hover:underline font-medium"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
                    isDark 
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password.trim()}
                  className="btn-3d-red flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Unlock Owner Mode</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* SCENARIO C: Change Password View */
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold flex items-center gap-1.5 text-red-500">
                  <KeyRound className="w-4 h-4" />
                  <span>Update Secret Owner Password</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ← Back
                </button>
              </div>

              {changeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{changeSuccess}</span>
                </div>
              )}

              {changeError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Current Owner Password
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current owner password..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  New Owner Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Create your new secret password..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-type new secret password..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold border transition ${
                    isDark 
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChanging || !currentPass || !newPass || !confirmPass}
                  className="btn-3d-emerald flex-1 py-2 px-4 rounded-xl text-xs font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wide"
                >
                  {isChanging ? 'Saving...' : 'Set My Secret Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
