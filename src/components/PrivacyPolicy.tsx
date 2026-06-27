import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, ArrowLeft, Eye, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
            <Lock size={24} className="text-emerald-600 animate-pulse" />
            <span>{isAr ? 'سياسة الخصوصية وسرية المعلومات' : 'Privacy Policy'}</span>
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
            ? 'نحن نولي أهمية قصوى لخصوصية وأمن بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية ومشاركة معلوماتك عند زيارة أو شراء أي من منتجاتنا.'
            : 'We place the highest importance on the privacy and security of your personal data. This privacy policy explains how we collect, use, protect, and share your information when you visit or purchase products from us.'
          }
        </p>

        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <Eye size={18} className="text-emerald-500" />
            <span>{isAr ? '1. المعلومات التي نجمعها' : '1. Information We Collect'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'عند قيامك بإنشاء حساب أو إجراء طلب شراء، نقوم بجمع المعلومات الشخصية الأساسية التي تقدمها، مثل: الاسم، عنوان البريد الإلكتروني، رقم الهاتف، عنوان الشحن والتوصيل، ومعلومات وسيلة الدفع.'
              : 'When you create an account or make a purchase, we collect the basic personal information you provide, such as: name, email address, phone number, shipping and delivery address, and payment method details.'
            }
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <Lock size={18} className="text-emerald-500" />
            <span>{isAr ? '2. كيف نستخدم معلوماتك' : '2. How We Use Your Information'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr ? 'نستخدم البيانات التي نجمعها للأغراض التالية:' : 'We use the collected information for the following purposes:'}
          </p>
          <ul className="list-disc list-inside text-xs font-semibold pl-4 space-y-1.5 text-gray-500">
            {isAr ? (
              <>
                <li>معالجة طلبات الشراء وتأكيدها وتوصيلها إلى موقعك بدقة.</li>
                <li>توفير وتخصيص دعم العملاء وحل المشكلات الفنية.</li>
                <li>إرسال إشعارات هامة حول حالة طلباتك، والتحديثات الأمنية، وأحدث العروض الترويجية (التي يمكنك إلغاء الاشتراك بها في أي وقت).</li>
              </>
            ) : (
              <>
                <li>Process, confirm, and accurately deliver your shopping orders.</li>
                <li>Provide and customize customer support and technical troubleshooting.</li>
                <li>Send important notifications regarding order status, security updates, and promotional deals (which you can opt out of at any time).</li>
              </>
            )}
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>{isAr ? '3. حماية وتأمين البيانات' : '3. Security of Your Data'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'نحن نطبق مجموعة متنوعة من تدابير الحماية الأمنية المتقدمة لضمان أمان معلوماتك الشخصية من الدخول غير المصرح به، التعديل، الإفشاء أو التدمير. يتم تشفير جميع المعاملات الحساسة ومعلومات الدفع بتقنيات التشفير القياسية الآمنة للغاية.'
              : 'We implement a variety of advanced security measures to safeguard your personal information against unauthorized access, alteration, disclosure, or destruction. All sensitive transaction and payment details are encrypted using industry-standard secure socket layer technology.'
            }
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <Eye size={18} className="text-emerald-500" />
            <span>{isAr ? '4. مشاركة البيانات مع جهات خارجية' : '4. Sharing with Third Parties'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'نحن لا نبيع أو نقوم بتأجير أو تبادل بياناتك الشخصية مع أطراف خارجية مطلقاً. قد تتم مشاركة معلومات محددة فقط مع شركائنا الموثوقين لخدمات التوصيل والشحن ووسائل الدفع لتسهيل استكمال الطلب الخاص بك.'
              : 'We do not sell, rent, or trade your personal data to third parties. Specific information may only be shared with trusted logistics and payment partners solely to facilitate and complete your orders.'
            }
          </p>
        </div>

        {/* Final contact message */}
        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {isAr ? 'هل لديك أي استفسارات تخص خصوصية بياناتك؟' : 'Questions about your data privacy?'}
          </p>
          <p className="text-xs text-gray-500 font-semibold">
            {isAr 
              ? 'يرجى التواصل معنا عبر البريد الإلكتروني privacy@emart.com وسيقوم مسؤول حماية البيانات بالرد عليك.'
              : 'Please contact us at privacy@emart.com and our data protection officer will get back to you.'
            }
          </p>
        </div>

      </div>
    </div>
  );
};
