import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { StoreFront } from './components/StoreFront';
import { CartPage } from './components/CartPage';
import { MyOrders } from './components/MyOrders';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { WishlistPage } from './components/WishlistPage';
import { 
  ShoppingBag, ShoppingCart, User as UserIcon, LogOut, 
  Settings, Globe, BarChart2, Package, Tag, ClipboardList, Shield, Users,
  DollarSign, Sliders, History, Database, Truck, Menu, X, ChevronLeft, ChevronRight, Heart
} from 'lucide-react';
import { AdminSettings } from './components/AdminSettings';
import { AdminPayments } from './components/AdminPayments';
import { AdminShipping } from './components/AdminShipping';
import { RefundPolicy } from './components/RefundPolicy';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { UserProfileModal } from './components/UserProfileModal';

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
  const [adminMenuOpen, setAdminMenuOpen] = React.useState(false);
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const isAr = language === 'ar';

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

  const renderAdminSubTabs = (collapsed: boolean) => {
    const btnClass = (subTab: string) => {
      const isSelected = adminSubTab === subTab;
      if (isSelected) {
        return `w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'} py-3 text-xs font-black rounded-xl bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 transition duration-150`;
      }
      return `w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'} py-3 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition duration-150`;
    };

    return (
      <div className="space-y-1.5 font-sans">
        {/* Dashboard */}
        <button
          id="admin-subtab-dashboard"
          onClick={() => { setAdminSubTab('dashboard'); setAdminMenuOpen(false); }}
          className={btnClass('dashboard')}
          title={collapsed ? (isAr ? 'لوحة القيادة' : 'Dashboard') : undefined}
        >
          <BarChart2 size={15} />
          {!collapsed && <span>{t('adminDashboard')}</span>}
        </button>

        {/* Products */}
        <button
          id="admin-subtab-products"
          onClick={() => { setAdminSubTab('products'); setAdminMenuOpen(false); }}
          className={btnClass('products')}
          title={collapsed ? (isAr ? 'المنتجات' : 'Products') : undefined}
        >
          <Package size={15} />
          {!collapsed && <span>{t('adminProducts')}</span>}
        </button>

        {/* Categories */}
        <button
          id="admin-subtab-categories"
          onClick={() => { setAdminSubTab('categories'); setAdminMenuOpen(false); }}
          className={btnClass('categories')}
          title={collapsed ? (isAr ? 'الفئات' : 'Categories') : undefined}
        >
          <Tag size={15} />
          {!collapsed && <span>{t('adminCategories')}</span>}
        </button>

        {/* Orders */}
        <button
          id="admin-subtab-orders"
          onClick={() => { setAdminSubTab('orders'); setAdminMenuOpen(false); }}
          className={btnClass('orders')}
          title={collapsed ? (isAr ? 'الطلبات' : 'Orders') : undefined}
        >
          <ClipboardList size={15} />
          {!collapsed && <span>{t('adminOrders')}</span>}
        </button>

        {/* Users Management */}
        {user?.role === 'admin' && (
          <button
            id="admin-subtab-staff"
            onClick={() => { setAdminSubTab('admin-users'); setAdminMenuOpen(false); }}
            className={btnClass('admin-users')}
            title={collapsed ? (isAr ? 'إدارة المستخدمين' : 'Users Management') : undefined}
          >
            <Shield size={15} />
            {!collapsed && <span>{t('usersManagement')}</span>}
          </button>
        )}

        {/* Customers List */}
        <button
          id="admin-subtab-customers"
          onClick={() => { setAdminSubTab('customers'); setAdminMenuOpen(false); }}
          className={btnClass('customers')}
          title={collapsed ? (isAr ? 'العملاء' : 'Customers') : undefined}
        >
          <Users size={15} />
          {!collapsed && <span>{t('siteUsers')}</span>}
        </button>

        {/* Payments */}
        {user?.role === 'admin' && (
          <button
            id="admin-subtab-payments"
            onClick={() => { setAdminSubTab('payments'); setAdminMenuOpen(false); }}
            className={btnClass('payments')}
            title={collapsed ? (isAr ? 'المدفوعات' : 'Payments') : undefined}
          >
            <DollarSign size={15} />
            {!collapsed && <span>{isAr ? 'إدارة المدفوعات' : 'Payments'}</span>}
          </button>
        )}

        {/* Shipping & Cities - Accessible to admin and manager roles */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            id="admin-subtab-shipping"
            onClick={() => { setAdminSubTab('shipping'); setAdminMenuOpen(false); }}
            className={btnClass('shipping')}
            title={collapsed ? (isAr ? 'الشحن والمدن' : 'Shipping & Cities') : undefined}
          >
            <Truck size={15} />
            {!collapsed && <span>{isAr ? 'الشحن والمدن' : 'Shipping & Cities'}</span>}
          </button>
        )}

        {/* Activity Logs */}
        {user?.role === 'admin' && (
          <button
            id="admin-subtab-activity-logs"
            onClick={() => { setAdminSubTab('activity-logs'); setAdminMenuOpen(false); }}
            className={btnClass('activity-logs')}
            title={collapsed ? (isAr ? 'سجلات النشاط' : 'Activity Logs') : undefined}
          >
            <History size={15} />
            {!collapsed && <span>{t('activityLogs')}</span>}
          </button>
        )}

        {/* Backup & Restore */}
        {user?.role === 'admin' && (
          <button
            id="admin-subtab-backup-restore"
            onClick={() => { setAdminSubTab('backup-restore'); setAdminMenuOpen(false); }}
            className={btnClass('backup-restore')}
            title={collapsed ? (isAr ? 'النسخ الاحتياطي' : 'Backup & Restore') : undefined}
          >
            <Database size={15} />
            {!collapsed && <span>{t('backupRestore')}</span>}
          </button>
        )}

        {/* Settings */}
        {user?.role === 'admin' && (
          <button
            id="admin-subtab-settings"
            onClick={() => { setAdminSubTab('settings'); setAdminMenuOpen(false); }}
            className={btnClass('settings')}
            title={collapsed ? (isAr ? 'الإعدادات' : 'Settings') : undefined}
          >
            <Sliders size={15} />
            {!collapsed && <span>{isAr ? 'الإعدادات' : 'Settings'}</span>}
          </button>
        )}
      </div>
    );
  };

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
            className="flex items-center gap-2.5 text-left group animate-fade-in"
          >
            <div className="relative w-10 h-10 shrink-0">
              <img 
                src="/images/logo.png" 
                alt="eMart Logo" 
                className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-md border border-gray-100 transition duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = document.getElementById('emart-logo-fallback');
                  if (fb) fb.classList.remove('hidden');
                }}
              />
              <div 
                id="emart-logo-fallback" 
                className="hidden absolute inset-0 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-emerald-700 transition"
              >
                eM
              </div>
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

            <button
              id="nav-tab-wishlist"
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'wishlist' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Heart size={14} className={activeTab === 'wishlist' ? "fill-rose-500 text-rose-500 animate-pulse" : "text-gray-400"} />
              <span>{language === 'ar' ? 'المفضلة' : 'Wishlist'}</span>
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
                <button
                  id="header-profile-btn"
                  onClick={() => setShowProfileModal(true)}
                  className="text-right flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  title={isAr ? 'الملف الشخصي وتغيير كلمة المرور' : 'Profile & Change Password'}
                >
                  <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-extrabold text-gray-800 leading-none">{user.name}</p>
                    <span className="text-[10px] font-bold text-indigo-600 hover:underline capitalize">{user.role}</span>
                  </div>
                </button>
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

      {/* 2. ADMINISTRATIVE NAVIGATION MOVED TO RESPONSIVE SIDEBAR */}

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
          id="mobile-nav-wishlist"
          onClick={() => setActiveTab('wishlist')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'wishlist' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <Heart size={18} className={activeTab === 'wishlist' ? "fill-rose-500 text-rose-500" : ""} />
          {language === 'ar' ? 'المفضلة' : 'Wishlist'}
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
        {activeTab === 'wishlist' && <WishlistPage />}
        {activeTab === 'refund-policy' && <RefundPolicy />}
        {activeTab === 'privacy-policy' && <PrivacyPolicy />}
        {activeTab === 'terms-of-service' && <TermsOfService />}
        {activeTab === 'admin' && (
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Mobile Admin Header with Hamburger Trigger */}
            <div className="md:hidden flex items-center justify-between bg-white border border-gray-150 p-4 rounded-2xl mb-2 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(true)}
                  className="p-2 hover:bg-gray-150 text-gray-700 rounded-xl transition cursor-pointer"
                >
                  <Menu size={20} />
                </button>
                <span className="font-bold text-sm tracking-tight text-gray-800">
                  {isAr ? 'لوحة التحكم - ' : 'Admin - '}
                  <span className="text-indigo-600 font-extrabold capitalize">
                    {adminSubTab === 'admin-users' ? (isAr ? 'إدارة المستخدمين' : 'Users Management') : adminSubTab === 'shipping' ? (isAr ? 'الشحن والمدن' : 'Shipping & Cities') : adminSubTab}
                  </span>
                </span>
              </div>
              <img src="/images/logo.png" className="w-8 h-8 object-cover rounded-lg" alt="eMart logo" />
            </div>

            {/* Mobile Sliding Navigation Drawer with Backdrop */}
            {adminMenuOpen && (
              <div 
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
                onClick={() => setAdminMenuOpen(false)}
              >
                <div 
                  className="fixed inset-y-0 left-0 w-64 max-w-xs bg-white text-gray-700 p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-left duration-200 border-r border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <img src="/images/logo.png" className="w-6 h-6 object-cover rounded-md" alt="Logo" />
                      <span className="font-extrabold text-gray-800 text-sm tracking-wider uppercase">
                        {isAr ? 'خيارات الإدارة' : 'Admin Menu'}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAdminMenuOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
                    {renderAdminSubTabs(false)}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Persistent Sidebar */}
            <aside className={`hidden md:flex flex-col ${adminSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 bg-white text-gray-700 rounded-3xl p-5 border border-gray-200/80 shadow-xs min-h-[500px] h-fit sticky top-20 transition-all duration-300`}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                {!adminSidebarCollapsed && (
                  <div className="flex items-center gap-2">
                    <img src="/images/logo.png" className="w-6 h-6 object-cover rounded-md" alt="Logo" />
                    <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</span>
                  </div>
                )}
                {adminSidebarCollapsed && (
                  <div className="mx-auto">
                    <img src="/images/logo.png" className="w-6 h-6 object-cover rounded-md" alt="Logo" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  title={adminSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
                >
                  {adminSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-none">
                {renderAdminSubTabs(adminSidebarCollapsed)}
              </div>
            </aside>

            {/* Admin Content Viewport */}
            <div className="flex-1 min-w-0">
              {adminSubTab === 'dashboard' && <Dashboard />}
              {adminSubTab === 'settings' && <AdminSettings />}
              {adminSubTab === 'payments' && <AdminPayments />}
              {adminSubTab === 'shipping' && <AdminShipping />}
              {adminSubTab !== 'dashboard' && adminSubTab !== 'settings' && adminSubTab !== 'payments' && adminSubTab !== 'shipping' && <AdminPanel />}
            </div>

          </div>
        )}
      </main>

      {/* 5. GLOBAL FOOTER */}
      <footer className="bg-white border-t border-gray-100 pt-8 pb-24 md:pb-8 text-center text-xs text-gray-400 font-medium shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>Copyright &copy; {new Date().getFullYear()}. All Rights Reserved to ITSPARK</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button
              onClick={() => setActiveTab('refund-policy')}
              className="hover:text-emerald-600 transition font-semibold cursor-pointer"
            >
              {isAr ? 'سياسة الاسترجاع' : 'Refund Policy'}
            </button>
            <span className="text-gray-200 hidden sm:inline">|</span>
            <button
              onClick={() => setActiveTab('privacy-policy')}
              className="hover:text-emerald-600 transition font-semibold cursor-pointer"
            >
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <span className="text-gray-200 hidden sm:inline">|</span>
            <button
              onClick={() => setActiveTab('terms-of-service')}
              className="hover:text-emerald-600 transition font-semibold cursor-pointer"
            >
              {isAr ? 'شروط وأحكام الخدمة' : 'Terms of Service'}
            </button>
          </div>
        </div>
      </footer>

      {/* Global Auth modal prompt */}
      <AuthModal />

      {/* Global User Profile modal */}
      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
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
