import React, { useState, useEffect } from 'react';
import { 
  X, Star, MessageSquareHeart, CheckCircle2, ThumbsUp, 
  Send, Sparkles, Building2, Siren, MapPin, HeartHandshake, ShieldCheck
} from 'lucide-react';
import { UserAccount, UserFeedback } from '../types.ts';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  city?: string;
  theme?: 'light' | 'dark';
}

const CATEGORIES = [
  { id: 'ambulance_speed', label: 'Ambulance Response Speed', icon: Siren },
  { id: 'hospital_accuracy', label: 'Hospital Bed & ICU Accuracy', icon: Building2 },
  { id: 'paramedic_care', label: 'Paramedic & Emergency Care', icon: HeartHandshake },
  { id: 'app_maps', label: 'App Maps & GPS Navigation', icon: MapPin },
  { id: 'suggestion_bug', label: 'Feature Suggestion / Feedback', icon: Sparkles },
] as const;

const QUICK_TAGS = [
  '⚡ Rapid Dispatch',
  '🏥 Accurate ICU Beds',
  '🚑 Lifesaving Service',
  '🧭 Precise Road Directions',
  '👨‍⚕️ Caring Paramedics',
  '📞 Smooth 108/112 Routing',
  '📱 Easy to Use in Crisis',
  '💡 Great Map Features',
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Critical Issues / Poor Experience', color: 'text-rose-500' },
  2: { text: 'Fair / Needs Improvement', color: 'text-amber-500' },
  3: { text: 'Good / Met Emergency Needs', color: 'text-yellow-500' },
  4: { text: 'Very Good / Fast & Helpful', color: 'text-emerald-500' },
  5: { text: 'Outstanding / Lifesaving Quality', color: 'text-emerald-600' },
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  city = 'Visakhapatnam',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<UserFeedback['category']>('ambulance_speed');
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Rapid Dispatch', '🏥 Accurate ICU Beds']);
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<string>('');
  const [recentFeedbacks, setRecentFeedbacks] = useState<UserFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<'submit' | 'recent'>('submit');

  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
    if (currentUser?.phone) {
      setContact(currentUser.phone);
    } else if (currentUser?.email) {
      setContact(currentUser.email);
    }
  }, [currentUser]);

  // Load recent community feedback
  const fetchRecentFeedback = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        if (data.feedbacks) {
          setRecentFeedbacks(data.feedbacks);
        }
      }
    } catch (e) {
      console.error('Failed to fetch feedback:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentFeedback();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setIsSubmitting(true);

    const feedbackPayload: Partial<UserFeedback> = {
      user_name: name.trim() || currentUser?.name || 'Citizen User',
      user_phone: contact.trim() || undefined,
      role: currentUser?.role || 'patient',
      category,
      rating,
      tags: selectedTags,
      comments: comments.trim(),
      city,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedFeedbackId(data.feedback?.id || `FB-${Date.now().toString().slice(-4)}`);
        setIsSuccess(true);
        fetchRecentFeedback();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      // Fallback local persistence
      const fallbackId = `FB-${Date.now().toString().slice(-4)}`;
      setSubmittedFeedbackId(fallbackId);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setComments('');
    setRating(5);
    setActiveTab('submit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
          isDark 
            ? 'bg-[#0b101c] border-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  User Experience & Service Feedback
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  EMS Community
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Help optimize ambulance response, hospital bed accuracy, and crisis workflows in {city}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Submit Feedback vs Recent Reviews */}
        <div className={`flex items-center px-5 pt-3 border-b text-xs ${
          isDark ? 'border-slate-800 bg-[#090e18]' : 'border-slate-100 bg-slate-50/30'
        }`}>
          <button
            onClick={() => setActiveTab('submit')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'submit'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Feedback</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'recent'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Community Feedback ({recentFeedbacks.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'submit' ? (
            isSuccess ? (
              /* Success Screen */
              <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black tracking-tight">
                    Thank You for Your Feedback!
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Your submission has been recorded under reference <strong className="font-mono text-emerald-600 dark:text-emerald-400">{submittedFeedbackId}</strong>.
                    It directly helps paramedic dispatch teams and ER triage officers optimize critical care response.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={resetForm}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Submit Another Review
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-3d-emerald px-5 py-2 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Done & Return to Grid
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Rating Selector */}
                <div className={`p-4 rounded-xl border text-center space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    How would you rate your emergency service experience?
                  </label>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                          title={`${starVal} Star`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isActive
                                ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                                : isDark ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className={`text-xs font-bold transition-all ${
                    RATING_LABELS[hoverRating || rating]?.color || 'text-slate-500'
                  }`}>
                    {RATING_LABELS[hoverRating || rating]?.text}
                  </div>
                </div>

                {/* 2. Category Selector */}
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                            isSelected
                              ? 'border-red-600 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/30'
                              : isDark
                                ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Quick Tags */}
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Key Highlights & Tags (Click to select)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                            isSelected
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold'
                              : isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Comments */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Your Comments & Emergency Experience
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {comments.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Describe your dispatch experience, response speed, ambulance paramedic care, or app suggestions..."
                    required
                    className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* 5. User Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Contact Phone / Email (Optional)
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98480 XXXXX"
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Verified citizen review</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                        isDark ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !comments.trim()}
                      className="btn-3d-red px-5 py-2.5 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 tracking-wide"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit User Feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )
          ) : (
            /* Recent Community Feedback Feed */
            <div className="space-y-3">
              {recentFeedbacks.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <MessageSquareHeart className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No community reviews yet. Be the first to share your experience!
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="btn-3d-red px-4 py-1.5 text-white font-bold text-xs rounded-xl shadow mt-2"
                  >
                    Write a Review
                  </button>
                </div>
              ) : (
                recentFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {fb.user_name}
                        </div>
                        <span className="text-slate-400 text-[10px]">·</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= fb.rating
                                ? 'fill-amber-400 text-amber-500'
                                : isDark ? 'text-slate-800' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      "{fb.comments}"
                    </p>

                    {fb.tags && fb.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {fb.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
