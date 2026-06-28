import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { 
  Search, SlidersHorizontal, Calendar, ArrowLeftRight, Check, X, 
  RotateCcw, DollarSign, User, ShieldCheck, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { language, apiFetch } = useApp();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Filtering states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentOption, setPaymentOption] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [mode, setMode] = useState('');
  const [status, setStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Errors/Success Toast messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAr = language === 'ar';

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Build Query params
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
      });

      if (startDate) queryParams.set('startDate', formatDateToBackend(startDate));
      if (endDate) queryParams.set('endDate', formatDateToBackend(endDate));
      if (paymentOption) queryParams.set('paymentOption', paymentOption);
      if (paymentGateway) queryParams.set('paymentGateway', paymentGateway);
      if (transactionNumber) queryParams.set('transactionNumber', transactionNumber);
      if (mode) queryParams.set('mode', mode);
      if (status) queryParams.set('status', status);
      if (orderStatus) queryParams.set('orderStatus', orderStatus);
      if (clientName) queryParams.set('clientName', clientName);
      if (clientMobile) queryParams.set('clientMobile', clientMobile);
      if (priceFrom) queryParams.set('priceFrom', priceFrom);
      if (priceTo) queryParams.set('priceTo', priceTo);

      const res = await apiFetch(`/api/admin/payments?${queryParams.toString()}`);
      if (res) {
        setTransactions(res.transactions);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.currentPage);
        setTotalItems(res.pagination.totalItems);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch payments records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setPaymentOption('');
    setPaymentGateway('');
    setTransactionNumber('');
    setMode('');
    setStatus('');
    setOrderStatus('');
    setClientName('');
    setClientMobile('');
    setPriceFrom('');
    setPriceTo('');
    setPage(1);
    // Reload database
    setTimeout(() => {
      fetchPayments();
    }, 50);
  };

  // Convert HTML Input Date (yyyy-mm-dd) to Backend Date Format (dd/mm/yyyy)
  const formatDateToBackend = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleRefund = async (txId: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك في استرداد هذا المبلغ بالكامل؟' : 'Are you sure you want to fully refund this payment?')) {
      return;
    }

    try {
      setActionLoadingId(txId);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await apiFetch(`/api/admin/payments/${txId}/refund`, {
        method: 'POST',
      });

      if (res) {
        setSuccessMsg(isAr ? 'تمت عملية الاسترداد بنجاح وتحديث حالة الطلب!' : 'Refund processed successfully and order status updated!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchPayments();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Refund processing failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (txStatus: string) => {
    const s = txStatus.toLowerCase();
    if (s === 'success' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {isAr ? 'ناجحة' : 'Success'}
        </span>
      );
    } else if (s === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {isAr ? 'فشلت' : 'Failed'}
        </span>
      );
    } else if (s === 'refund' || s === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {isAr ? 'مستردة' : 'Refunded'}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          {isAr ? 'معلقة' : 'Pending'}
        </span>
      );
    }
  };

  return (
    <div className="space-y-6" id="admin-payments-panel">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl font-bold font-sans flex items-center gap-2">
            <DollarSign className="text-indigo-400" size={22} />
            {isAr ? 'إدارة المعاملات المالية والمدفوعات' : 'Transactions & Payments Management'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {isAr ? 'تتبع فواتير الطلبات والمدفوعات وبوابات الدفع وإجراء عمليات الاسترداد' : 'Track payment history, credit card details, gateways, and perform refunds.'}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl px-4 py-2 text-right border border-slate-700">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {isAr ? 'إجمالي المعاملات المصفاة' : 'Total Filtered Tx'}
          </p>
          <p className="text-lg font-mono font-bold text-indigo-300">
            {totalItems}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2 text-sm">
          <X className="shrink-0 text-rose-500 mt-0.5" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-start gap-2 text-sm">
          <Check className="shrink-0 text-emerald-500 mt-0.5" size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Advanced Search & Filtering Accordion */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-gray-100 pb-2">
            <SlidersHorizontal size={14} className="text-indigo-600" />
            <span>{isAr ? 'تصفية وبحث متقدم في المدفوعات' : 'Advanced Payment Filters'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Dates From/To */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'تاريخ المعاملة (من)' : 'Transaction Date (From)'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'تاريخ المعاملة (إلى)' : 'Transaction Date (To)'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Method / Option */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'طريقة الدفع' : 'Payment Method'}
              </label>
              <select
                value={paymentOption}
                onChange={(e) => setPaymentOption(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{isAr ? 'الكل' : 'All methods'}</option>
                <option value="cod">{isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}</option>
                <option value="card">{isAr ? 'البطاقة البنكية' : 'Bank Card'}</option>
              </select>
            </div>

            {/* Payment Gateway */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'بوابة الدفع الإلكترونية' : 'Payment Gateway'}
              </label>
              <select
                value={paymentGateway}
                onChange={(e) => setPaymentGateway(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{isAr ? 'الكل' : 'All gateways'}</option>
                <option value="stripe">Stripe</option>
                <option value="kasheir">Kasheir</option>
              </select>
            </div>

            {/* Transaction Number / Order ID */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'رقم المعاملة / الطلب' : 'Tx / Order Number'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: ord-...' : 'e.g. ord-...'}
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Mode Live/Test */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'الوضع' : 'Gateway Mode'}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{isAr ? 'الكل' : 'All modes'}</option>
                <option value="test">{isAr ? 'تجريبي (Test)' : 'Test mode'}</option>
                <option value="live">{isAr ? 'حي (Live)' : 'Live mode'}</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'حالة الدفع' : 'Payment Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{isAr ? 'الكل' : 'All statuses'}</option>
                <option value="Pending">{isAr ? 'معلق (Pending)' : 'Pending'}</option>
                <option value="Success">{isAr ? 'ناجح (Success)' : 'Success'}</option>
                <option value="Failed">{isAr ? 'فاشل (Failed)' : 'Failed'}</option>
                <option value="Refund">{isAr ? 'مسترد (Refund)' : 'Refund'}</option>
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'حالة الطلب المرتبط' : 'Linked Order Status'}
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{isAr ? 'الكل' : 'All order statuses'}</option>
                <option value="pending">{isAr ? 'قيد الانتظار' : 'Placed / Pending'}</option>
                <option value="paid">{isAr ? 'مدفوع' : 'Paid'}</option>
                <option value="processing">{isAr ? 'مقبول / قيد المعالجة' : 'Accepted / Processing'}</option>
                <option value="shipped">{isAr ? 'خرج للتوصيل' : 'Out for Delivery'}</option>
                <option value="delivered">{isAr ? 'تم التوصيل' : 'Delivered'}</option>
                <option value="cancelled">{isAr ? 'ملغي' : 'Canceled'}</option>
                <option value="refunded">{isAr ? 'مسترجع' : 'Refunded'}</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'اسم العميل' : 'Client Name'}
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Client Mobile */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'موبايل العميل' : 'Client Mobile'}
              </label>
              <input
                type="text"
                value={clientMobile}
                onChange={(e) => setClientMobile(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Price From/To */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'المبلغ من' : 'Amount From'}
              </label>
              <input
                type="number"
                placeholder="Min"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                {isAr ? 'المبلغ إلى' : 'Amount To'}
              </label>
              <input
                type="number"
                placeholder="Max"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 rounded-lg transition"
            >
              {isAr ? 'إعادة ضبط' : 'Reset Filters'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              {isAr ? 'تطبيق الفلاتر والبحث' : 'Apply & Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col justify-center items-center gap-2">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
          <p className="text-gray-400 text-xs font-medium">{isAr ? 'جاري تحميل المعاملات...' : 'Loading transaction records...'}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-xs">
          {isAr ? 'لا توجد أي سجلات دفع تطابق معايير البحث.' : 'No payment records match your search criteria.'}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full lg:min-w-0 min-w-[800px] text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] xl:text-[10px] font-bold border-b border-gray-100">
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'المعرف والعميل' : 'ID & Client'}</th>
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'القيمة' : 'Amount'}</th>
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'بوابة الدفع والتفاصيل' : 'Gateway & Details'}</th>
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'الحالة والنوع' : 'Status & Type'}</th>
                    <th className="px-3 xl:px-4 py-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="px-3 xl:px-4 py-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] xl:text-xs text-gray-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/40 transition">
                      {/* ID & Client */}
                      <td className="px-3 xl:px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-gray-800 block text-[9px] xl:text-[10px]">{tx.id}</span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <User size={11} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[100px] xl:max-w-[130px]">{tx.clientName}</span>
                          </div>
                          {tx.clientMobile && (
                            <span className="text-[9px] text-gray-400 block font-mono">{tx.clientMobile}</span>
                          )}
                        </div>
                      </td>
 
                      {/* Order ID */}
                      <td className="px-3 xl:px-4 py-3">
                        <span className="font-mono bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] xl:text-[10px] font-bold border border-indigo-100/30">
                          {tx.orderId}
                        </span>
                      </td>
 
                      {/* Amount */}
                      <td className="px-3 xl:px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 block text-xs xl:text-sm">
                          {tx.amount.toFixed(2)}
                        </span>
                      </td>
 
                      {/* Gateway & Details */}
                      <td className="px-3 xl:px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-700 uppercase text-[10px]">{tx.paymentMethod}</span>
                            {tx.paymentGateway && (
                              <span className="text-gray-400 text-[9px]">({tx.paymentGateway})</span>
                            )}
                          </div>
                          
                          {tx.transactionNumber && (
                            <div className="text-[9px] text-gray-400 font-mono block truncate max-w-[100px] xl:max-w-[140px]">
                              ID: {tx.transactionNumber}
                            </div>
                          )}
 
                          {tx.last4 && (
                            <div className="text-[9px] text-gray-400 flex items-center gap-1 font-mono">
                              <span>💳 **** {tx.last4}</span>
                              {tx.gatewayMode && (
                                <span className={`text-[8px] font-bold uppercase px-0.5 rounded ${
                                  tx.gatewayMode === 'live' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {tx.gatewayMode}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
 
                      {/* Status & Type */}
                      <td className="px-3 xl:px-4 py-3">
                        <div className="space-y-1">
                          <div>{getStatusBadge(tx.status)}</div>
                          <span className={`text-[8px] xl:text-[9px] font-bold block uppercase ${
                            tx.type === 'refund' ? 'text-amber-600' : 'text-indigo-600'
                          }`}>
                            {tx.type || 'payment'}
                          </span>
                        </div>
                      </td>
 
                      {/* Date */}
                      <td className="px-3 xl:px-4 py-3 text-gray-400 font-mono text-[9px] xl:text-[10px]">
                        {new Date(tx.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
 
                      {/* Actions */}
                      <td className="px-3 xl:px-4 py-3 text-center">
                        {tx.paymentMethod === 'card' && tx.status !== 'Refund' && tx.type !== 'refund' ? (
                          <button
                            onClick={() => handleRefund(tx.id)}
                            disabled={actionLoadingId !== null}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[9px] xl:text-[10px] font-bold transition cursor-pointer border border-rose-100"
                          >
                            {actionLoadingId === tx.id ? (
                              <Loader2 className="animate-spin" size={10} />
                            ) : (
                              <RotateCcw size={10} />
                            )}
                            <span>{isAr ? 'إجراء استرداد' : 'Refund'}</span>
                          </button>
                        ) : tx.status === 'Refund' || tx.type === 'refund' ? (
                          <span className="text-[9px] xl:text-[10px] text-gray-400 font-medium italic">
                            {isAr ? 'تم الاسترداد' : 'Refunded'}
                          </span>
                        ) : (
                          <span className="text-[9px] xl:text-[10px] text-gray-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500">
                {isAr 
                  ? `الصفحة ${page} من ${totalPages}` 
                  : `Page ${page} of ${totalPages}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
