import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { StoreFront } from './components/StoreFront';
import { CartPage } from './components/CartPage';
import { MyOrders } from './components/MyOrders';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { 
  ShoppingBag, ShoppingCart, User as UserIcon, LogOut, 
  Settings, Globe, BarChart2, Package, Tag, ClipboardList, Shield, Users,
  DollarSign, Sliders, History, Database, Truck
} from 'lucide-react';
import { AdminSettings } from './components/AdminSettings';
import { AdminPayments } from './components/AdminPayments';
import { AdminShipping } from './components/AdminShipping';

const AppContent: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    user, 
    logout, 
    cart, 
    activeTab, 
    setActiveTab, 
    adminSubTab, 
    setAdminSubTab, 
    setShowAuthModal, 
    t,
    settings,
    isPromoActive
  } = useApp();

  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    if (!settings?.promoTimerEnabled || !settings?.promoTimerTo) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(settings.promoTimerTo) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [settings?.promoTimerTo, settings?.promoTimerEnabled]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Promo Countdown Banner */}
      {isPromoActive() && settings && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white text-xs font-bold py-2.5 px-4 text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 shadow-sm z-50">
          <span className="flex items-center gap-1.5 animate-pulse">
            <Tag size={14} className="rotate-90 text-yellow-300 fill-yellow-300" />
            {language === 'ar' ? settings.promoTimerTextAr : settings.promoTimerTextEn}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-sm tracking-tight bg-black/20 px-2.5 py-0.5 rounded-full border border-white/15">
            <span className="text-yellow-200">{timeLeft.days}d</span>:
            <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>:
            <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>:
            <span className="text-red-200">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
          </div>
        </div>
      )}
      
      {/* 1. MAIN GLOBAL HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <button 
            id="logo-brand-btn"
            onClick={() => setActiveTab('store')} 
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-emerald-700 transition">
              eM
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-gray-900 group-hover:text-emerald-600 transition">eMart</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t('slogan')}</p>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-tab-shop"
              onClick={() => setActiveTab('store')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'store' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {t('home')}
            </button>

            <button
              id="nav-tab-orders"
              onClick={() => setActiveTab('my-orders')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'my-orders' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {t('myOrders')}
            </button>

            {/* Admin entry - only visible if staff (admin/manager) */}
            {user && (user.role === 'admin' || user.role === 'manager') && (
              <button
                id="nav-tab-admin"
                onClick={() => { setActiveTab('admin'); setAdminSubTab('dashboard'); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-500 hover:bg-indigo-50/30 hover:text-indigo-600'
                }`}
              >
                <Settings size={14} className="animate-pulse" />
                {t('adminPanel')}
              </button>
            )}
          </nav>

          {/* Action Buttons: Language, Cart, Profile */}
          <div className="flex items-center gap-3">
            
            {/* Dual Language Switcher Toggle */}
            <button
              id="language-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
            >
              <Globe size={14} className="text-gray-400" />
              <span>{t('language')}</span>
            </button>

            {/* Shopping Cart button with bubble */}
            <button
              id="header-cart-btn"
              onClick={() => setActiveTab('cart')}
              className={`p-2 rounded-xl transition relative border ${
                activeTab === 'cart'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Profile Info / Authorization toggles */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-150">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-extrabold text-gray-800 leading-none">{user.name}</p>
                  <span className="text-[10px] font-bold text-gray-400 capitalize">{user.role}</span>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition"
                  title={t('logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                {t('login')}
              </button>
            )}

          </div>
        </div>
      </header>

      {/* 2. ADMINISTRATIVE SIDEBAR / TAB RAIL (Only active on Admin tab) */}
      {activeTab === 'admin' && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto gap-4 py-3 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-2 shrink-0">Admin Controls:</span>
            
            {/* Dashboard Subtab */}
            <button
              id="admin-subtab-dashboard"
              onClick={() => setAdminSubTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                adminSubTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 size={13} />
              {t('adminDashboard')}
            </button>

            {/* Products catalog subtab */}
            <button
              id="admin-subtab-products"
              onClick={() => setAdminSubTab('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                adminSubTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package size={13} />
              {t('adminProducts')}
            </button>

            {/* Categories subtab */}
            <button
              id="admin-subtab-categories"
              onClick={() => setAdminSubTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                adminSubTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag size={13} />
              {t('adminCategories')}
            </button>

            {/* Orders list subtab */}
            <button
              id="admin-subtab-orders"
              onClick={() => setAdminSubTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                adminSubTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList size={13} />
              {t('adminOrders')}
            </button>

            {/* Admin users staff roles subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-staff"
                onClick={() => setAdminSubTab('admin-users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'admin-users' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield size={13} />
                {t('usersManagement')}
              </button>
            )}

            {/* Activity Logs subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-activity-logs"
                onClick={() => setAdminSubTab('activity-logs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'activity-logs' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <History size={13} />
                {t('activityLogs')}
              </button>
            )}

            {/* Backup & Restore subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-backup-restore"
                onClick={() => setAdminSubTab('backup-restore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'backup-restore' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database size={13} />
                {t('backupRestore')}
              </button>
            )}

            {/* Manage Payments subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-payments"
                onClick={() => setAdminSubTab('payments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={13} />
                {language === 'ar' ? 'إدارة المدفوعات' : 'Payments'}
              </button>
            )}

            {/* Settings subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-settings"
                onClick={() => setAdminSubTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders size={13} />
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </button>
            )}

            {/* Shipping Fees subtab (Admins only) */}
            {user?.role === 'admin' && (
              <button
                id="admin-subtab-shipping"
                onClick={() => setAdminSubTab('shipping')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  adminSubTab === 'shipping' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck size={13} />
                {language === 'ar' ? 'رسوم الشحن' : 'Shipping Fees'}
              </button>
            )}

            {/* Customers database subtab */}
            <button
              id="admin-subtab-customers"
              onClick={() => setAdminSubTab('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                adminSubTab === 'customers' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={13} />
              {t('siteUsers')}
            </button>
          </div>
        </div>
      )}

      {/* 3. MOBILE ACTION NAVIGATION TAB (Shown only on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 py-2.5 px-6 flex justify-around shadow-lg">
        <button
          id="mobile-nav-shop"
          onClick={() => setActiveTab('store')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'store' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <ShoppingBag size={18} />
          {t('home')}
        </button>

        <button
          id="mobile-nav-orders"
          onClick={() => setActiveTab('my-orders')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'my-orders' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <ShoppingCart size={18} />
          {t('myOrders')}
        </button>

        {user && (user.role === 'admin' || user.role === 'manager') && (
          <button
            id="mobile-nav-admin"
            onClick={() => { setActiveTab('admin'); setAdminSubTab('dashboard'); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'admin' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <Settings size={18} />
            Admin
          </button>
        )}
      </div>

      {/* 4. MAIN CONTENT ROUTER DISPLAY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {activeTab === 'store' && <StoreFront />}
        {activeTab === 'cart' && <CartPage />}
        {activeTab === 'my-orders' && <MyOrders />}
        {activeTab === 'admin' && (
          <>
            {adminSubTab === 'dashboard' && <Dashboard />}
            {adminSubTab === 'settings' && <AdminSettings />}
            {adminSubTab === 'payments' && <AdminPayments />}
            {adminSubTab === 'shipping' && <AdminShipping />}
            {adminSubTab !== 'dashboard' && adminSubTab !== 'settings' && adminSubTab !== 'payments' && adminSubTab !== 'shipping' && <AdminPanel />}
          </>
        )}
      </main>

      {/* 5. GLOBAL FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-medium shrink-0">
        <p>Copyright &copy; {new Date().getFullYear()}. All Rights Reserved to ITSPARK</p>
      </footer>

      {/* Global Auth modal prompt */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
