import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SystemSettings } from '../types';
import { Save, AlertTriangle, Check, Loader2, ShieldCheck, Mail, Link, Key, Eye, EyeOff } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { language, apiFetch } = useApp();
  const [settings, setSettings] = useState<SystemSettings>({
    paymentOptions: ['cod', 'card'],
    paymentGateway: 'stripe',
    gatewayMode: 'test',
    stripeTestSecretKey: 'sk_test_placeholder',
    stripeLiveSecretKey: '',
    kasheirTestKey: 'pk_test_placeholder',
    kasheirLiveKey: '',
    currency: 'USD',
    promoTimerEnabled: false,
    promoTimerFrom: '',
    promoTimerTo: '',
    promoTimerTextEn: '',
    promoTimerTextAr: '',
    mailUser: '',
    mailPass: '',
    baseUrl: '',
    salesEmail: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showStripeTest, setShowStripeTest] = useState(false);
  const [showStripeLive, setShowStripeLive] = useState(false);
  const [showKasheirTest, setShowKasheirTest] = useState(false);
  const [showKasheirLive, setShowKasheirLive] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/settings');
        if (res) {
          setSettings({
            ...settings,
            ...res,
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCheckboxChange = (option: 'cod' | 'card') => {
    const current = [...settings.paymentOptions];
    const index = current.indexOf(option);
    if (index > -1) {
      if (current.length === 1) {
        // Must select at least 1
        setErrorMsg(language === 'ar' ? 'يجب اختيار خيار دفع واحد على الأقل.' : 'Must select at least 1 payment option.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      current.splice(index, 1);
    } else {
      current.push(option);
    }
    setSettings({ ...settings, paymentOptions: current });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.paymentOptions.length === 0) {
      setErrorMsg(language === 'ar' ? 'يجب اختيار خيار دفع واحد على الأقل.' : 'Must select at least 1 payment option.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res) {
        setSettings(res);
        setSuccessMsg(language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-gray-500 font-medium text-xs">
          {language === 'ar' ? 'جاري تحميل الإعدادات...' : 'Loading system settings...'}
        </p>
      </div>
    );
  }

  const isAr = language === 'ar';

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden" id="admin-settings-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={22} />
            {isAr ? 'إعدادات المتجر العامة والمدفوعات' : 'Global Store & Payment Settings'}
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            {isAr ? 'تكوين بوابات الدفع والعملة والعروض الترويجية' : 'Configure payment gateways, currency, and countdown promos'}
          </p>
        </div>
        <div className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
          ADMIN CONF
        </div>
      </div>

      <form onSubmit={handleSave} className="p-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2 text-sm">
            <AlertTriangle className="shrink-0 text-rose-500 mt-0.5" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-start gap-2 text-sm">
            <Check className="shrink-0 text-emerald-500 mt-0.5" size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. PAYMENT OPTIONS */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            {isAr ? 'خيارات الدفع المتاحة للعملاء' : 'Allowed Customer Payment Options'}
          </h3>
          <p className="text-xs text-gray-400">
            {isAr 
              ? 'اختر خيارات الدفع التي ستظهر للعملاء في صفحة إتمام الطلب (يجب اختيار خيار واحد على الأقل)' 
              : 'Choose the payment options that clients will see at checkout (must select at least one).'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
              settings.paymentOptions.includes('cod') 
                ? 'border-indigo-200 bg-indigo-50/20' 
                : 'border-gray-100 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={settings.paymentOptions.includes('cod')}
                onChange={() => handleCheckboxChange('cod')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-700 block">
                  {isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {isAr ? 'يتم الدفع نقداً عند تسليم الطلب للعميل' : 'Customer pays in cash upon physical order delivery.'}
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
              settings.paymentOptions.includes('card') 
                ? 'border-indigo-200 bg-indigo-50/20' 
                : 'border-gray-100 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={settings.paymentOptions.includes('card')}
                onChange={() => handleCheckboxChange('card')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-700 block">
                  {isAr ? 'الدفع الإلكتروني بالبطاقة البنكية' : 'Bank Card Payment'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {isAr ? 'توجيه العميل مباشرةً لبوابة الدفع الإلكترونية المحددة أدناه' : 'Directly processes electronic payment via selected gateway below.'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. GATEWAY CONFIGURATION */}
        {settings.paymentOptions.includes('card') && (
          <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-gray-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
              {isAr ? 'إعدادات بوابة الدفع الإلكتروني' : 'Bank Card Payment Gateway Setup'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  {isAr ? 'بوابة الدفع النشطة (لا تظهر للعميل)' : 'Active Payment Gateway (Hidden from clients)'}
                </label>
                <select
                  value={settings.paymentGateway}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value as 'stripe' | 'kasheir' })}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="stripe">Stripe</option>
                  <option value="kasheir">Kasheir</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  {isAr 
                    ? 'العميل سيرى فقط زر "البطاقة البنكية" وسيتم الدفع عبر هذه البوابة المحددة تلقائياً' 
                    : 'The client will only see a standard Card button, but checkout will execute via this gateway.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  {isAr ? 'وضع التشغيل' : 'Gateway Mode'}
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gatewayMode"
                      value="test"
                      checked={settings.gatewayMode === 'test'}
                      onChange={() => setSettings({ ...settings, gatewayMode: 'test' })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span>{isAr ? 'وضع التجربة (Test)' : 'Test Mode'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gatewayMode"
                      value="live"
                      checked={settings.gatewayMode === 'live'}
                      onChange={() => setSettings({ ...settings, gatewayMode: 'live' })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span>{isAr ? 'الوضع الحي (Live)' : 'Live Mode'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* API Keys inputs */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {isAr ? 'مفاتيح الربط والـ API' : 'API Connection Credentials'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stripe Test Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {isAr ? 'مفتاح Stripe السري للتجربة (Test Secret Key)' : 'Stripe Test Secret Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showStripeTest ? "text" : "password"}
                      value={settings.stripeTestSecretKey || ''}
                      onChange={(e) => setSettings({ ...settings, stripeTestSecretKey: e.target.value })}
                      placeholder="sk_test_..."
                      className={`w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isAr ? 'pl-10' : 'pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeTest(!showStripeTest)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none ${isAr ? 'left-3' : 'right-3'}`}
                    >
                      {showStripeTest ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Stripe Live Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {isAr ? 'مفتاح Stripe السري للوضع الحي (Live Secret Key)' : 'Stripe Live Secret Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showStripeLive ? "text" : "password"}
                      value={settings.stripeLiveSecretKey || ''}
                      onChange={(e) => setSettings({ ...settings, stripeLiveSecretKey: e.target.value })}
                      placeholder="sk_live_..."
                      className={`w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isAr ? 'pl-10' : 'pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeLive(!showStripeLive)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none ${isAr ? 'left-3' : 'right-3'}`}
                    >
                      {showStripeLive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Kasheir Test Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {isAr ? 'مفتاح Kasheir للتجربة (Test API Key)' : 'Kasheir Test API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showKasheirTest ? "text" : "password"}
                      value={settings.kasheirTestKey || ''}
                      onChange={(e) => setSettings({ ...settings, kasheirTestKey: e.target.value })}
                      placeholder="pk_test_..."
                      className={`w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isAr ? 'pl-10' : 'pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKasheirTest(!showKasheirTest)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none ${isAr ? 'left-3' : 'right-3'}`}
                    >
                      {showKasheirTest ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Kasheir Live Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {isAr ? 'مفتاح Kasheir للوضع الحي (Live API Key)' : 'Kasheir Live API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showKasheirLive ? "text" : "password"}
                      value={settings.kasheirLiveKey || ''}
                      onChange={(e) => setSettings({ ...settings, kasheirLiveKey: e.target.value })}
                      placeholder="pk_live_..."
                      className={`w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isAr ? 'pl-10' : 'pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKasheirLive(!showKasheirLive)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none ${isAr ? 'left-3' : 'right-3'}`}
                    >
                      {showKasheirLive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CURRENCY */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            {isAr ? 'عملة المتجر الرئيسية' : 'Default Store Currency'}
          </h3>
          <div className="max-w-xs">
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            >
              <option value="USD">USD ($)</option>
              <option value="EGP">EGP (ج.م)</option>
              <option value="SAR">SAR (ر.س)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="EUR">EUR (€)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              {isAr ? 'سيتم تطبيق هذه العملة عبر كامل صفحات المتجر ومراحل الدفع.' : 'This currency will be applied across the storefront and orders.'}
            </p>
          </div>
        </div>

        {/* 4. PROMO TIMER */}
        <div className="space-y-6 bg-indigo-50/10 p-6 rounded-2xl border border-indigo-50">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
              {isAr ? 'مؤقت العرض الترويجي التنازلي' : 'Promotional Offer Countdown Timer'}
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.promoTimerEnabled}
                onChange={(e) => setSettings({ ...settings, promoTimerEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {settings.promoTimerEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'تاريخ ووقت بدء العرض' : 'Promo Start Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.promoTimerFrom || ''}
                    onChange={(e) => setSettings({ ...settings, promoTimerFrom: e.target.value })}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'تاريخ ووقت نهاية العرض' : 'Promo End Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.promoTimerTo || ''}
                    onChange={(e) => setSettings({ ...settings, promoTimerTo: e.target.value })}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'نص العرض باللغة الإنجليزية' : 'Promo Text (English)'}
                  </label>
                  <input
                    type="text"
                    value={settings.promoTimerTextEn || ''}
                    onChange={(e) => setSettings({ ...settings, promoTimerTextEn: e.target.value })}
                    placeholder="Mega Sale! Offers end in:"
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'نص العرض باللغة العربية' : 'نص العرض (العربية)'}
                  </label>
                  <input
                    type="text"
                    value={settings.promoTimerTextAr || ''}
                    onChange={(e) => setSettings({ ...settings, promoTimerTextAr: e.target.value })}
                    placeholder="تنزيلات كبرى! تنتهي العروض خلال:"
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. CASH ON DELIVERY (COD) CHARGE */}
        <div className="space-y-4 bg-emerald-50/10 p-6 rounded-2xl border border-emerald-50">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              {isAr ? 'رسوم إضافية لخدمة الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD) Extra Charge'}
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!settings.codExtraChargeEnabled}
                onChange={(e) => setSettings({ ...settings, codExtraChargeEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {settings.codExtraChargeEnabled && (
            <div className="max-w-xs space-y-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isAr ? 'قيمة الرسوم الإضافية بالعملة الحالية' : `Extra Charge Amount (${settings.currency})`}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.codExtraChargeAmount || 0}
                onChange={(e) => setSettings({ ...settings, codExtraChargeAmount: Number(e.target.value) })}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-gray-400">
                {isAr ? 'سيتم تطبيق هذه الرسوم في صفحة الدفع عند اختيار وسيلة الدفع عند الاستلام.' : 'This extra charge will be added to the order total when Cash on Delivery is selected.'}
              </p>
            </div>
          )}
        </div>

        {/* 6. SMTP EMAIL CONFIGURATION */}
        <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100" id="smtp-settings-section">
          <h3 className="text-sm font-bold text-gray-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            {isAr ? 'إعدادات البريد الإلكتروني (SMTP)' : 'SMTP Email Configuration'}
          </h3>
          <p className="text-xs text-gray-400">
            {isAr
              ? 'قم بتكوين إعدادات SMTP لإرسال رسائل التحقق من كلمة المرور المنسية والإشعارات.'
              : 'Configure SMTP credentials to send password verification codes and system notifications.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1" id="smtp-username-label">
                <Mail size={14} className="text-indigo-500" />
                {isAr ? 'بريد SMTP الإلكتروني (اسم المستخدم)' : 'SMTP Username / Email Address'}
              </label>
              <input
                id="smtp-username-input"
                type="email"
                value={settings.mailUser || ''}
                onChange={(e) => setSettings({ ...settings, mailUser: e.target.value })}
                placeholder="example@gmail.com"
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {isAr ? 'البريد الإلكتروني المستخدم لإرسال الرسائل (مثال: بريد Gmail)' : 'The email address used to authenticate and send emails.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1" id="smtp-password-label">
                <Key size={14} className="text-indigo-500" />
                {isAr ? 'كلمة مرور التطبيق (SMTP Password)' : 'SMTP Password / App Password'}
              </label>
              <input
                id="smtp-password-input"
                type="password"
                value={settings.mailPass || ''}
                onChange={(e) => setSettings({ ...settings, mailPass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {isAr ? 'كلمة مرور التطبيق المكونة من ١٦ حرفًا لحساب Gmail الخاص بك.' : 'For Gmail, use a 16-character Google App Password.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1" id="sales-email-label">
                <Mail size={14} className="text-indigo-500" />
                {isAr ? 'بريد المبيعات والدعم الإلكتروني' : 'Sales / Support Email'}
              </label>
              <input
                id="sales-email-input"
                type="email"
                value={settings.salesEmail || ''}
                onChange={(e) => setSettings({ ...settings, salesEmail: e.target.value })}
                placeholder="sales@example.com"
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {isAr ? 'البريد الإلكتروني الذي يظهر للعملاء في تذييل الرسائل للتواصل.' : 'The contact email displayed to customers in the email footers.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1" id="base-url-label">
                <Link size={14} className="text-indigo-500" />
                {isAr ? 'رابط المتجر الرئيسي (Base URL)' : 'Store Base URL'}
              </label>
              <input
                id="base-url-input"
                type="url"
                value={settings.baseUrl || ''}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="https://yourstore.com"
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {isAr ? 'عنوان URL للمتجر لتضمينه في روابط الرسائل التلقائية.' : 'The public URL of your store to embed in automated emails.'}
              </p>
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 transition cursor-pointer disabled:bg-indigo-400"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{isAr ? 'حفظ التغييرات' : 'Save Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
