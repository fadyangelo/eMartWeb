import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
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
            <RefreshCw size={24} className="text-emerald-600 animate-spin-slow" />
            <span>{isAr ? 'سياسة الاسترجاع والاسترداد' : 'Refund & Return Policy'}</span>
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
            ? 'نحن نسعى دائماً لضمان رضا عملائنا الكامل عن منتجاتنا وخدماتنا. يرجى قراءة شروط الاسترجاع والاسترداد التالية بعناية لضمان تجربة تسوق سلسة وعادلة.'
            : 'We always strive to ensure our customers are completely satisfied with their purchases. Please review our refund and return policy below to ensure a smooth and fair shopping experience.'
          }
        </p>

        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>{isAr ? '1. فترة الاسترجاع والاستبدال' : '1. Return and Exchange Window'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'تتيح سياستنا للعملاء إمكانية تقديم طلب استرجاع أو استبدال للمنتجات في غضون 14 يوماً من تاريخ استلام الطلب. بعد مرور 14 يوماً على استلام الشحنة، نعتذر عن عدم إمكانية تقديم أي استرداد أو استبدال.'
              : 'Our policy allows customers to request a return or exchange within 14 days of receiving their order. Once 14 days have passed since delivery, we unfortunately cannot offer a refund or exchange.'
            }
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <AlertCircle size={18} className="text-emerald-500" />
            <span>{isAr ? '2. شروط الاسترجاع' : '2. Conditions for Returns'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr ? 'لكي يكون المنتج مؤهلاً للاسترجاع، يجب أن يستوفي الشروط التالية:' : 'To be eligible for a return, the product must meet the following criteria:'}
          </p>
          <ul className="list-disc list-inside text-xs font-semibold pl-4 space-y-1.5 text-gray-500">
            {isAr ? (
              <>
                <li>أن يكون المنتج في حالته الأصلية دون أي تلف أو عيب ناتج عن سوء الاستخدام.</li>
                <li>أن يتم إرجاعه في غلافه الأصلي غير المفتوح مع كافة الملحقات والبطاقات التعريفية.</li>
                <li>إرفاق فاتورة الشراء الأصلية أو إثبات الشراء الإلكتروني.</li>
              </>
            ) : (
              <>
                <li>The item must be in its original, undamaged condition, free from misuse.</li>
                <li>The item must be in its original, unopened packaging with all tags and accessories.</li>
                <li>You must provide the original receipt or proof of purchase.</li>
              </>
            )}
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <RefreshCw size={18} className="text-emerald-500" />
            <span>{isAr ? '3. آلية الاسترداد المالي' : '3. Refund Methods'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'بمجرد استلامنا للمنتج المرتجع وفحصه، سنقوم بإرسال إشعار بريد إلكتروني يفيد بقبول أو رفض طلب الاسترداد المالي. في حال الموافقة، سيتم معالجة المبلغ وإعادته تلقائياً إلى وسيلة الدفع الأصلية الخاصة بك في غضون 7 إلى 10 أيام عمل.'
              : 'Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed and automatically applied to your original method of payment within 7 to 10 business days.'
            }
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-2">
            <AlertCircle size={18} className="text-emerald-500" />
            <span>{isAr ? '4. رسوم الشحن والتوصيل' : '4. Shipping & Delivery Fees'}</span>
          </h3>
          <p className="text-xs font-medium">
            {isAr 
              ? 'يتحمل العميل رسوم شحن إرجاع المنتجات، إلا في الحالات التي يكون فيها المنتج تالفاً أو تم إرساله بالخطأ من قبلنا. رسوم الشحن الأصلية غير قابلة للاسترداد.'
              : 'The customer will be responsible for paying their own shipping costs for returning items, unless the item was delivered damaged or defective. Original shipping costs are non-refundable.'
            }
          </p>
        </div>

        {/* Final contact message */}
        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {isAr ? 'هل لديك أي استفسارات أخرى؟' : 'Have any questions?'}
          </p>
          <p className="text-xs text-gray-500 font-semibold">
            {isAr 
              ? 'لا تتردد في الاتصال بفريق الدعم الفني لدينا عبر البريد الإلكتروني support@emart.com أو عبر الدردشة الحية.'
              : 'Do not hesitate to reach out to our dedicated support team via support@emart.com or through live chat.'
            }
          </p>
        </div>

      </div>
    </div>
  );
};
