import React, { useState } from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import { X, Key, User as UserIcon, Mail, ShieldCheck, ArrowLeft, RefreshCw, HelpCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    login, 
    t, 
    apiFetch, 
    authModalCallback,
    setAuthModalCallback,
    language,
    setActiveTab
  } = useApp();
  
  const isAr = language === 'ar';
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleClose = () => {
    setShowAuthModal(false);
    setError('');
    setSuccess('');
    setAuthMode('login');
    setAuthModalCallback(null);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.emailSent) {
        setSuccess(
          isAr
            ? `تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني (${email})!`
            : `Verification code has been sent to your email address (${email}) successfully!`
        );
        setAuthMode('verify');
      } else {
        setError(
          isAr
            ? `فشل إرسال البريد الإلكتروني. يرجى مراجعة إعدادات SMTP في لوحة التحكم. الخطأ: ${res.error || ''}`
            : `Failed to send verification email. Please verify SMTP configurations in Admin Settings. Error: ${res.error || 'SMTP delivery failed'}`
        );
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'لم نتمكن من العثور على هذا البريد الإلكتروني.' : 'Failed to process request. Email might not exist.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(isAr ? 'كلمات المرور غير متطابقة!' : 'Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code: verificationCode, newPassword }),
      });
      
      setSuccess(isAr ? 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully! Please login.');
      setAuthMode('login');
      setPassword('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || (isAr ? 'رمز التحقق غير صالح أو منتهي الصلاحية.' : 'Invalid or expired verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        login(res.token, res.user);
      } else {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        login(res.token, res.user);
      }
      
      // Close modal and fire success callback if exists
      setShowAuthModal(false);
      if (authModalCallback) {
        authModalCallback();
        setAuthModalCallback(null);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setAuthMode('login');
  };

  const openPolicy = (tab: ActiveTab) => {
    setShowAuthModal(false);
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
      <div 
        id="auth-modal"
        className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {(authMode === 'forgot' || authMode === 'verify') && (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition"
              >
                <ArrowLeft size={16} className={isAr ? "rotate-180" : ""} />
              </button>
            )}
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              {authMode === 'login' && (isAr ? 'تسجيل الدخول' : t('login'))}
              {authMode === 'signup' && (isAr ? 'إنشاء حساب جديد' : t('signUp'))}
              {authMode === 'forgot' && (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
              {authMode === 'verify' && (isAr ? 'إدخال رمز التحقق' : 'Enter Verification')}
            </h3>
          </div>
          <button 
            id="close-auth-btn"
            onClick={handleClose} 
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Alerts */}
        <div className="px-6 pt-4 space-y-2">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-2">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 animate-bounce" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Standard Auth Forms */}
        {(authMode === 'login' || authMode === 'signup') && (
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">{isAr ? 'الاسم بالكامل' : t('nameLabel')}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={isAr ? "الاسم الكامل" : "John Doe"}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">{isAr ? 'البريد الإلكتروني' : t('emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="customer@emart.com"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">{isAr ? 'كلمة المرور' : t('passwordLabel')}</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setAuthMode('forgot');
                    }}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    {isAr ? 'هل نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin h-4 w-4 text-white" />
                  {authMode === 'signup' ? (isAr ? 'جاري التسجيل...' : t('signingUp')) : (isAr ? 'جاري الدخول...' : t('signingIn'))}
                </span>
              ) : (
                authMode === 'signup' ? (isAr ? 'إنشاء الحساب' : t('signUp')) : (isAr ? 'تسجيل الدخول' : t('login'))
              )}
            </button>

            {/* Terms and Policies disclaimer for sign up */}
            {authMode === 'signup' && (
              <p className="text-[10px] leading-relaxed text-gray-400 text-center px-2 pt-1 font-medium">
                {isAr ? (
                  <>
                    بإنشائك حساباً، فإنك تؤكد موافقتك على{' '}
                    <button type="button" onClick={() => openPolicy('terms-of-service')} className="text-emerald-600 font-bold hover:underline">شروط الخدمة</button>،{' '}
                    <button type="button" onClick={() => openPolicy('privacy-policy')} className="text-emerald-600 font-bold hover:underline">سياسة الخصوصية</button>، و{' '}
                    <button type="button" onClick={() => openPolicy('refund-policy')} className="text-emerald-600 font-bold hover:underline">سياسة الاسترجاع</button> الخاصة بنا.
                  </>
                ) : (
                  <>
                    By signing up an account, you confirm that you agree to our{' '}
                    <button type="button" onClick={() => openPolicy('terms-of-service')} className="text-emerald-600 font-bold hover:underline">Terms of Service</button>,{' '}
                    <button type="button" onClick={() => openPolicy('privacy-policy')} className="text-emerald-600 font-bold hover:underline">Privacy Policy</button>, and{' '}
                    <button type="button" onClick={() => openPolicy('refund-policy')} className="text-emerald-600 font-bold hover:underline">Refund Policy</button>.
                  </>
                )}
              </p>
            )}

            <div className="text-center pt-2">
              <button
                id="auth-toggle-btn"
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-emerald-600 hover:underline font-bold"
              >
                {authMode === 'signup' ? (isAr ? 'لديك حساب بالفعل؟ تسجيل الدخول' : t('haveAccount')) : (isAr ? 'ليس لديك حساب؟ إنشاء حساب' : t('noAccount'))}
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Flow */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="p-6 pt-4 space-y-4 animate-fade-in">
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              {isAr 
                ? 'أدخل بريدك الإلكتروني المسجل وسنقوم بإرسال رمز تحقق محاكي فوري لتتمكن من إعادة تعيين كلمة المرور الخاصة بك.'
                : 'Enter your registered email below to receive a simulated verification code instantly to reset your password.'
              }
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="customer@emart.com"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin h-4 w-4" />
                  {isAr ? 'جاري الإرسال...' : 'Sending...'}
                </span>
              ) : (
                isAr ? 'إرسال رمز التحقق' : 'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {/* Verify Code and Reset Password Form */}
        {authMode === 'verify' && (
          <form onSubmit={handleResetSubmit} className="p-6 pt-4 space-y-4 animate-fade-in">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">{isAr ? 'رمز التحقق المكون من 6 أرقام' : '6-Digit Verification Code'}</label>
              <input
                id="reset-code-input"
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center font-mono tracking-widest px-4 py-2 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="reset-new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin h-4 w-4" />
                  {isAr ? 'جاري التحديث...' : 'Updating...'}
                </span>
              ) : (
                isAr ? 'تحديث كلمة المرور' : 'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* Quick Fill Credentials Area */}
        {authMode === 'login' && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-xs">
            <p className="font-semibold text-gray-700 mb-2">💡 Quick Access Accounts:</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <button
                id="quick-fill-admin"
                type="button"
                onClick={() => quickFill('admin@emart.com', 'admin123')}
                className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-left transition font-medium border border-rose-100 cursor-pointer"
              >
                Admin (Full Access)
              </button>
              <button
                id="quick-fill-manager"
                type="button"
                onClick={() => quickFill('manager@emart.com', 'manager123')}
                className="px-2 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-left transition font-medium border border-amber-100 cursor-pointer"
              >
                Manager (Staff)
              </button>
              <button
                id="quick-fill-customer"
                type="button"
                onClick={() => quickFill('fady.angelo@itspark-eg.com', 'fady123')}
                className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-left transition font-medium border border-emerald-100 cursor-pointer"
              >
                Fady (Customer)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
