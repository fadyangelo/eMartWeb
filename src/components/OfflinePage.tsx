import React from 'react';
import { useApp } from '../context/AppContext';
import { Store, Globe, Mail, Clock } from 'lucide-react';
// @ts-ignore
import illustrationUrl from '../assets/images/StoreClosed.jpg';

export const OfflinePage: React.FC = () => {
  const { language, setLanguage, settings } = useApp();
  const isAr = language === 'ar';

  const primaryColor = settings?.primaryColor || '#4f46e5';
  const secondaryColor = settings?.secondaryColor || '#10b981';

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 text-center select-none bg-[#fafafa]">
      
      {/* Floating Language Switcher */}
      {settings?.allowMultiLanguage !== false && (
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="absolute top-6 right-6 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-950 bg-white border border-gray-150 rounded-2xl shadow-xs transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer hover:shadow-md z-10"
        >
          <Globe size={14} className="text-gray-400" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      )}

      <div className="max-w-xl w-full bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Store Brand Section */}
        <div className="w-full pt-8 px-8 pb-4 flex flex-col items-center border-b border-gray-50 bg-gradient-to-b from-gray-50/50 to-white">
          {settings?.logoUrl ? (
            <div className="h-16 w-16 flex items-center justify-center overflow-hidden transition-all duration-300">
              <img 
                src={settings.logoUrl} 
                alt="Store Logo" 
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div 
              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs"
            >
              <Store size={26} className="stroke-[1.75]" />
            </div>
          )}
          <span className="mt-3.5 font-black text-sm tracking-tight text-gray-800">
            {isAr ? (settings?.storeNameAr || 'إي مارت') : (settings?.storeNameEn || 'eMart Store')}
          </span>
        </div>

        {/* Beautiful Main Illustration */}
        <div className="w-full px-6 sm:px-12 pt-6 pb-2 max-w-sm flex justify-center">
          <div className="relative w-full group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs p-6 flex items-center justify-center h-48 transition-transform duration-300 hover:scale-[1.02]">
            <img 
              src={illustrationUrl} 
              alt="Store Temporarily Closed" 
              className="w-full h-auto object-cover max-h-[220px]"
              referrerPolicy="no-referrer"
            />
            {/* Pulsing Status Overlay Badges */}
            <div className="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-xs text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              <span>{isAr ? 'مغلق مؤقتاً' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Text details / Message card */}
        <div className="px-8 sm:px-12 pb-8 pt-4 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              {isAr ? 'نعتذر منكم، متجرنا مغلق مؤقتاً' : 'We apologize, our store is temporarily offline'}
            </h2>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md mx-auto font-medium">
            {isAr 
              ? 'نحن نقوم ببعض أعمال التحسين والترقية لنمنحكم تجربة تسوق فريدة ومميزة. سنكون جاهزين لاستقبالكم وتلبية طلباتكم من جديد قريباً جداً!'
              : 'We are performing routine upgrades and optimizations to offer you an outstanding shopping experience. We will be back to serve your orders very soon!'}
          </p>

          {/* Divider line */}
          <div className="w-full h-px bg-gray-100/80 my-2"></div>

          {/* Footer Contact Grid */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-left">
            {settings?.salesEmail && (
              <div className="flex items-center gap-2.5 bg-gray-50/80 border border-gray-100 px-4 py-2.5 rounded-2xl shadow-2xs hover:bg-white hover:border-gray-200 transition-all duration-300">
                <div 
                  style={{ color: primaryColor, backgroundColor: `${primaryColor}12` }} 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Mail size={14} />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">
                    {isAr ? 'راسلنا للاستفسار' : 'Questions? Email us'}
                  </div>
                  <a 
                    href={`mailto:${settings.salesEmail}`} 
                    className="text-xs font-bold text-gray-800 hover:underline block"
                  >
                    {settings.salesEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
