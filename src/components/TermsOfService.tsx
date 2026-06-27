import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, ArrowLeft, Scale, AlertOctagon } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  const { language, setActiveTab } = useApp();
  const isAr = language === 'ar';

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-left font-sans animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Scale size={24} className="text-emerald-600 animate-pulse" />
            <span>{isAr ? 'شروط وأحكام الخدمة' : 'Terms of Service'}</span>
          </h2>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
            {isAr ? 'آخر تحديث: 27 يونيو 2026' : 'Last Updated: June 27, 2026'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('store')}
          className="w-fit flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition shadow-xs cursor-pointer"
        >
          {isAr ? <ArrowLeft size={14} className="rotate-180" /> : <ArrowLeft size={14} />}
          <span>{isAr ? 'العودة للمتجر' : 'Back to Shop'}</span>
        </button>
      </div>

      {/* Policy Content */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-8 leading-relaxed text-gray-600">
        
        {/* Intro */}
        <p className="text-sm font-medium">
          {isAr 
            ? 'مرحباً بكم في متجرنا الإلكتروني. باستخدامكم لهذا الموقع أو إنشاء حساب به، فإنكم توافقون التام وغير المشروط على الالتزام بجميع البنود والشروط والسياسات المذكورة أدناه.'
            : 'Welcome to our online store. By using this website or registering an account, you unconditionally and fully agree to comply with and be bound by all the terms, conditions, and policies detailed below.'
          }
        </p>

        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>{isAr ? '1. شروط إنشاء واستخدام الحساب' : '1. Account Registration & Use'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'عند قيامكم بالتسجيل وإنشاء حساب، تلتزمون بتوفير معلومات دقيقة وكاملة ومحدثة. كما تتحملون المسؤولية الكاملة عن حماية سرية كلمة المرور الخاصة بكم وأي أنشطة تتم من خلال حسابكم.'
              : 'When registering and creating an account, you agree to provide accurate, complete, and updated information. You also assume full responsibility for maintaining the confidentiality of your password and all activities occurring under your account.'
            }
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <Scale size={18} className="text-emerald-500" />
            <span>{isAr ? '2. عمليات الشراء والدفع' : '2. Purchases & Payment Terms'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'جميع أسعار السلع والمنتجات المعروضة نهائية ومحدثة. نحن نحتفظ بالحق في تعديل الأسعار، إلغاء الطلبات، أو رفض الخدمة في أي وقت بناءً على توفر المخزون، أو اكتشاف خطأ في السعر، أو لشكوك تتعلق بعمليات احتيالية.'
              : 'All product prices listed are final and updated. We reserve the right to modify pricing, cancel orders, or refuse service at any time due to stock limitations, pricing errors, or suspicions of fraudulent transactions.'
            }
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <AlertOctagon size={18} className="text-emerald-500" />
            <span>{isAr ? '3. حدود المسؤولية القانونية' : '3. Limitation of Liability'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'يتم تقديم الموقع والخدمات والمنتجات على حالتها الحالية دون أي ضمانات صريحة أو ضمنية. لا نتحمل أي مسؤولية عن أضرار مباشرة أو غير مباشرة ناتجة عن استخدام أو عدم القدرة على استخدام خدمات الموقع.'
              : 'The website, services, and products are provided on an "as is" and "as available" basis without any warranties. Under no circumstances shall we be liable for any direct or indirect damages resulting from the use or inability to use our services.'
            }
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>{isAr ? '4. التعديل على البنود والخدمة' : '4. Modifications of Terms'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'نحتفظ بحقنا في مراجعة وتحديث هذه الشروط والأحكام في أي وقت دون إشعار مسبق. استمراركم في استخدام الموقع بعد نشر التعديلات يعتبر موافقة صريحة على الشروط الجديدة.'
              : 'We reserve the right to review and update these terms and conditions at any time without prior notice. Your continued use of the website following any changes signifies your explicit acceptance of the updated terms.'
            }
          </p>
        </div>

        {/* Final contact message */}
        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {isAr ? 'هل لديك أي استفسارات قانونية؟' : 'Have any legal inquiries?'}
          </p>
          <p className="text-xs text-gray-500 font-semibold">
            {isAr 
              ? 'لا تتردد في مراسلتنا بخصوص الشروط علىlegal@emart.com وسيسعد فريقنا القانوني بمساعدتكم.'
              : 'Do not hesitate to email us regarding our terms at legal@emart.com and our legal team will be happy to assist you.'
            }
          </p>
        </div>

      </div>
    </div>
  );
};
