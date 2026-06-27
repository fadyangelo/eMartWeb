import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShippingCity } from '../types';
import { Plus, Edit2, Trash2, Save, X, Loader2, Landmark, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminShipping: React.FC = () => {
  const { language, apiFetch, settings } = useApp();
  const isAr = language === 'ar';
  const curr = settings?.currency || 'USD';

  const [cities, setCities] = useState<ShippingCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [defaultShippingFee, setDefaultShippingFee] = useState('70');
  const [minOrderAmount, setMinOrderAmount] = useState('100');
  const [discountAmount, setDiscountAmount] = useState('30');
  const [minOrderForDiscount, setMinOrderForDiscount] = useState('200');

  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/shipping-cities');
      if (res) {
        setCities(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load shipping cities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const openForm = (city: ShippingCity | null = null) => {
    setErrorMsg('');
    if (city) {
      setEditingId(city.id);
      setNameEn(city.nameEn);
      setNameAr(city.nameAr);
      setDefaultShippingFee(String(city.defaultShippingFee));
      setMinOrderAmount(String(city.minOrderAmount));
      setDiscountAmount(String(city.discountAmount));
      setMinOrderForDiscount(String(city.minOrderForDiscount));
    } else {
      setEditingId(null);
      setNameEn('');
      setNameAr('');
      setDefaultShippingFee('70');
      setMinOrderAmount('100');
      setDiscountAmount('30');
      setMinOrderForDiscount('200');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      setErrorMsg(isAr ? 'برجاء كتابة اسم المدينة باللغتين' : 'City name in both languages is required.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        defaultShippingFee: Number(defaultShippingFee || 0),
        minOrderAmount: Number(minOrderAmount || 0),
        discountAmount: Number(discountAmount || 0),
        minOrderForDiscount: Number(minOrderForDiscount || 0),
      };

      const url = editingId ? `/api/shipping-cities/${editingId}` : '/api/shipping-cities';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res) {
        setSuccessMsg(
          editingId 
            ? (isAr ? 'تم تعديل المدينة بنجاح!' : 'City updated successfully!') 
            : (isAr ? 'تم إضافة المدينة بنجاح!' : 'City created successfully!')
        );
        setShowModal(false);
        fetchCities();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save city information.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await apiFetch(`/api/shipping-cities/${id}`, { method: 'DELETE' });
      if (res) {
        setSuccessMsg(isAr ? 'تم حذف المدينة بنجاح!' : 'City deleted successfully!');
        setDeleteConfirmId(null);
        fetchCities();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete city.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-gray-500 font-medium text-xs">
          {isAr ? 'جاري تحميل مدن الشحن...' : 'Loading shipping cities...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="text-indigo-600" size={20} />
            {isAr ? 'إدارة رسوم ومناطق الشحن' : 'Shipping Fees & City Matrix'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isAr 
              ? 'تحديد رسوم الشحن الافتراضية، الحد الأدنى للطلبات، وتخفيضات الشحن لكل مدينة في مصر.' 
              : 'Define default delivery fees, minimum orders, and shipping discounts for individual cities in Egypt.'}
          </p>
        </div>

        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus size={14} />
          {isAr ? 'إضافة مدينة جديدة' : 'Add New City'}
        </button>
      </div>

      {/* TOAST NOTIFICATIONS */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CITIES LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((city) => {
          const isConfirmingDelete = deleteConfirmId === city.id;
          return (
            <div 
              key={city.id} 
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{isAr ? city.nameAr : city.nameEn}</h4>
                    <p className="text-[10px] text-gray-400 font-medium font-mono">{isAr ? city.nameEn : city.nameAr}</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-md font-mono">
                    {city.defaultShippingFee} {curr}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-500 font-medium">
                  <div className="flex justify-between">
                    <span>{isAr ? 'الحد الأدنى للطلب:' : 'Min Order:'}</span>
                    <span className="font-bold font-mono text-gray-700">{city.minOrderAmount} {curr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'قيمة خصم الشحن:' : 'Shipping Discount:'}</span>
                    <span className="font-bold font-mono text-rose-600">-{city.discountAmount} {curr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'لتطبيق الخصم (الطلب فوق):' : 'Apply Discount Above:'}</span>
                    <span className="font-bold font-mono text-emerald-600">{city.minOrderForDiscount} {curr}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-50 flex justify-end gap-2 shrink-0">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-rose-50 p-1.5 rounded-lg border border-rose-100 w-full justify-between animate-pulse">
                    <span className="text-[10px] font-bold text-rose-700 px-1">
                      {isAr ? 'متأكد؟ سيتم الحذف فوراً' : 'Confirm deletion?'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(city.id)}
                        disabled={actionLoading}
                        className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-rose-700 cursor-pointer disabled:bg-rose-400"
                      >
                        {isAr ? 'نعم' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded hover:bg-gray-300 cursor-pointer"
                      >
                        {isAr ? 'لا' : 'No'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openForm(city)}
                      className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(city.id)}
                      className="p-2 text-gray-500 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM MODAL (ADD / EDIT CITY) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm">
                {editingId 
                  ? (isAr ? 'تعديل بيانات منطقة الشحن' : 'Edit Shipping City Settings') 
                  : (isAr ? 'إضافة منطقة شحن جديدة' : 'Add New Shipping City')}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-indigo-200 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isAr ? 'اسم المدينة (En)' : 'City Name (En)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Cairo"
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isAr ? 'اسم المدينة (عربي)' : 'City Name (Ar)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: القاهرة"
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Default Fee */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isAr ? `رسوم الشحن الافتراضية (${curr})` : `Default Shipping Fee (${curr})`}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={defaultShippingFee}
                  onChange={(e) => setDefaultShippingFee(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Min Order for Shipping */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isAr ? `الحد الأدنى لقيمة الطلب لتفعيل التوصيل (${curr})` : `Min Order Amount for Delivery (${curr})`}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Discount Amount & Discount Min */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isAr ? `قيمة الخصم في الشحن (${curr})` : `Shipping Discount (${curr})`}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {isAr ? `حد الخصم الأدنى للطلب (${curr})` : `Apply Discount Above (${curr})`}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minOrderForDiscount}
                    onChange={(e) => setMinOrderForDiscount(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:bg-indigo-400"
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>{isAr ? 'حفظ البيانات' : 'Save City'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
