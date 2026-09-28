import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Siren, Phone, MapPin, ShieldAlert, 
  X, RefreshCw, Volume2, VolumeX, Sparkles, AlertTriangle,
  ArrowRight, HeartPulse, Flame, Shield, HelpCircle, Activity,
  CheckCircle2, Compass
} from 'lucide-react';
import { Hospital } from '../types.ts';

interface Message {
  id: string;
  sender: 'user' | 'resq';
  text: string;
  timestamp: string;
  suggestedActions?: {
    type: 'call_sos' | 'route_hospital' | 'call_phone';
    label: string;
    phone?: string;
    hospital_id?: string;
    color?: string;
  }[];
}

interface ResqChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  city: string;
  hospitals: Hospital[];
  onTriggerSos: () => void;
  onSelectHospital: (hospitalId: string) => void;
  theme?: 'light' | 'dark';
}

export const ResqChatModal: React.FC<ResqChatModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng,
  city,
  hospitals,
  onTriggerSos,
  onSelectHospital,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'resq',
      text: `I am **RESQ**, your emergency navigation and crisis assistance chatbot.

1. **CALL 108 / 112 IMMEDIATELY** if this is a life-threatening crisis, or tap **Trigger SOS** below.
2. Tell me what is happening (e.g., collapsed person, bleeding, choking, fire, or danger).
3. I will give you immediate, step-by-step First Aid instructions and route you to the nearest open trauma center in **${city}**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { type: 'call_sos', label: '🚨 Trigger SOS Dispatch', color: 'red' },
        { type: 'call_phone', label: '📞 Call 108 Ambulance', phone: '108', color: 'blue' },
      ],
    },
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // TTS Readout helper for hands-free CPR/Emergency guidance
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown bold asterisks for clean voice
      const clean = text.replace(/\*\*/g, '').replace(/###/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/resq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          userLat,
          userLng,
          city,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || '1. **CALL 108 / 112 IMMEDIATELY**.\n2. Ensure your personal safety.\n3. Tap the SOS button on screen.';

      const resqMsg: Message = {
        id: `resq-${Date.now()}`,
        sender: 'resq',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggested_actions,
      };

      setMessages((prev) => [...prev, resqMsg]);
      speakText(replyText);
    } catch (err) {
      const fallbackMsg: Message = {
        id: `resq-err-${Date.now()}`,
        sender: 'resq',
        text: `1. **CALL 108 OR 112 IMMEDIATELY**.\n2. Check if the scene is safe.\n3. Tap the red **Trigger SOS** button on your screen for emergency ambulance routing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { type: 'call_sos', label: '🚨 Trigger SOS Dispatch', color: 'red' },
          { type: 'call_phone', label: '📞 Call 108 Ambulance', phone: '108', color: 'blue' },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { type: string; phone?: string; hospital_id?: string }) => {
    if (action.type === 'call_sos') {
      onTriggerSos();
    } else if (action.type === 'route_hospital' && action.hospital_id) {
      onSelectHospital(action.hospital_id);
    } else if (action.type === 'call_phone' && action.phone) {
      window.location.href = `tel:${action.phone}`;
    }
  };

  // Quick emergency crisis scenario prompts
  const quickPrompts = [
    { label: 'Unconscious / CPR', query: 'Someone collapsed in front of me and is not breathing! Help!' },
    { label: 'Severe Bleeding', query: 'Severe arterial bleeding and deep wound. How do I stop it?' },
    { label: 'Choking Airway', query: 'Adult is choking, cannot cough or speak. Give Heimlich steps.' },
    { label: 'Heart Attack', query: 'Crushing chest pain and left arm numbness. What should I do right now?' },
    { label: 'Building Fire', query: 'Smoke and fire in building. How do I safely evacuate?' },
    { label: 'Personal Threat', query: 'I feel threatened by someone following me. I need safety instructions.' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-2xl h-[92vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0a0f1d] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-red-50/80 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/25 relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                  <span>RESQ</span>
                  <span className="text-red-600 dark:text-red-400">Crisis AI</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live Dispatch Grid
                </span>
              </div>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Emergency Navigation & First Aid · {city} ({userLat.toFixed(2)}, {userLng.toFixed(2)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Hands-Free Voice Readout Toggle */}
            <button
              onClick={() => {
                const next = !speechEnabled;
                setSpeechEnabled(next);
                if (!next && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-2 rounded-lg border text-xs transition flex items-center gap-1 ${
                speechEnabled
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 shadow-xs'
              }`}
              title={speechEnabled ? 'Mute voice readout' : 'Enable hands-free audio readout for CPR/Protocols'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline text-[11px] font-semibold">
                {speechEnabled ? 'Voice ON' : 'Hands-Free'}
              </span>
            </button>

            {/* Quick SOS Trigger Shortcut */}
            <button
              onClick={onTriggerSos}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-red-600/30"
              title="Trigger Direct SOS Dispatch"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg border text-xs transition ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-xs'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Scenario Pills */}
        <div className={`px-3 py-2 border-b overflow-x-auto flex items-center gap-1.5 scrollbar-none ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-red-500" />
            <span>Crisis Quick:</span>
          </span>
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSendMessage(p.query)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition border shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-red-500/50'
                  : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200 hover:border-red-300 shadow-xs'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs sm:text-sm">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
              >
                {/* Sender badge */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                  {isUser ? (
                    <span>You</span>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-red-500" />
                      <span className="font-bold text-red-500">RESQ Crisis Guide</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl max-w-[92%] sm:max-w-[85%] leading-relaxed ${
                    isUser
                      ? 'bg-red-600 text-white rounded-tr-none shadow-md shadow-red-600/20 font-medium'
                      : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-lg'
                        : 'bg-slate-100/90 border border-slate-200 text-slate-900 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line space-y-1">
                    {m.text.split('\n').map((line, idx) => {
                      if (!line.trim()) return <div key={idx} className="h-1.5" />;
                      
                      // Format bold markdown (**action**)
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={idx} className={line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') ? 'font-medium' : ''}>
                          {parts.map((p, pIdx) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                              return (
                                <strong key={pIdx} className={isUser ? 'font-extrabold underline' : 'font-extrabold text-red-500 dark:text-red-400'}>
                                  {p.slice(2, -2)}
                                </strong>
                              );
                            }
                            return p;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Suggested Interactive Actions */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(act)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                            act.color === 'red'
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : act.color === 'emerald'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : act.color === 'blue'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                  : isDark
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-slate-900 border border-red-200 dark:border-slate-800 rounded-2xl w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                RESQ is assessing nearest trauma hospitals & step-by-step protocols...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-3 sm:p-4 border-t ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe emergency (e.g., collapsed, heavy bleeding, accident, fire)..."
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-inner'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-600/25 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Safety First: Always dial 108 / 112 alongside First Aid</span>
            <span className="hidden sm:inline">Encrypted Real-Time EMS Channel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
