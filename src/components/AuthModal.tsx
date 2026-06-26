import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Key, User as UserIcon, Mail } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    login, 
    t, 
    apiFetch, 
    authModalCallback,
    setAuthModalCallback 
  } = useApp();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleClose = () => {
    setShowAuthModal(false);
    setError('');
    setAuthModalCallback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
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
    setIsSignUp(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="auth-modal"
        className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
            {isSignUp ? t('signUp') : t('login')}
          </h3>
          <button 
            id="close-auth-btn"
            onClick={handleClose} 
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">{t('nameLabel')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">{t('emailLabel')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@emart.com"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">{t('passwordLabel')}</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSignUp ? t('signingUp') : t('signingIn')}
              </span>
            ) : (
              isSignUp ? t('signUp') : t('login')
            )}
          </button>

          <div className="text-center pt-2">
            <button
              id="auth-toggle-btn"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-emerald-600 hover:underline font-medium"
            >
              {isSignUp ? t('haveAccount') : t('noAccount')}
            </button>
          </div>
        </form>

        {/* Quick Fill Credentials Area */}
        {!isSignUp && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-xs">
            <p className="font-semibold text-gray-700 mb-2">💡 Quick Access Accounts:</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <button
                id="quick-fill-admin"
                type="button"
                onClick={() => quickFill('admin@emart.com', 'admin123')}
                className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-left transition font-medium border border-rose-100"
              >
                Admin (Full Access)
              </button>
              <button
                id="quick-fill-manager"
                type="button"
                onClick={() => quickFill('manager@emart.com', 'manager123')}
                className="px-2 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-left transition font-medium border border-amber-100"
              >
                Manager (Staff)
              </button>
              <button
                id="quick-fill-customer"
                type="button"
                onClick={() => quickFill('fady.angelo@itspark-eg.com', 'fady123')}
                className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-left transition font-medium border border-emerald-100"
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
