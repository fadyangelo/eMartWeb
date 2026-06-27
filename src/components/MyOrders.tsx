import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { ChevronLeft, ChevronRight, Package, Clock, ShieldCheck, Truck, ShoppingBag, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const { language, t, apiFetch, user, setShowAuthModal, settings } = useApp();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Active detail view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/orders?page=${page}&limit=5`);
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, user]);

  if (!user) {
    return (
      <div className="bg-white border rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={28} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{t('loginRequired')}</h3>
        <p className="text-sm text-gray-500">{t('loginPrompt')}</p>
        <button
          id="orders-login-btn"
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          {t('login')}
        </button>
      </div>
    );
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-amber-500" size={16} />;
      case 'paid':
        return <ShieldCheck className="text-blue-500" size={16} />;
      case 'processing':
        return <Clock className="text-indigo-500" size={16} />;
      case 'shipped':
        return <Truck className="text-purple-500" size={16} />;
      case 'delivered':
        return <Package className="text-emerald-500" size={16} />;
      case 'refunded':
        return <RotateCcw className="text-rose-500" size={16} />;
      case 'cancelled':
        return <AlertTriangle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'refunded': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled': return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('myOrders')}</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm font-medium">{t('loading')}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-500 space-y-4">
          <Package className="mx-auto text-gray-300" size={48} />
          <p className="text-lg font-semibold">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              id={`order-row-${order.id}`}
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:border-gray-200 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              {/* Order Brief Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-gray-900">#{order.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(order.status)}`}>
                    {t(order.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {order.items.length} {t('items')} &bull; <span className="font-bold text-gray-800">{order.totalAmount.toFixed(2)} {settings?.currency || 'USD'}</span>
                </div>
              </div>

              {/* Order Actions */}
              <button
                id={`view-order-details-btn-${order.id}`}
                onClick={() => setSelectedOrder(order)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition"
              >
                {t('trackOrder')}
                <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
              </button>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                id="orders-prev-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-sm font-semibold text-gray-700">
                {t('page')} {page} {t('of')} {totalPages}
              </span>

              <button
                id="orders-next-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Tracking Timeline & Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="order-tracker-modal"
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span>{t('trackOrder')}</span>
                  <span className="font-mono text-emerald-600">#{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-gray-400">
                  {new Date(selectedOrder.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
              <button
                id="close-order-tracker-btn"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <ChevronLeft size={22} className="rotate-180" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Timeline Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2">{t('timeline')}</h4>
                
                <div className="relative pl-6 border-l-2 border-gray-150 space-y-6 ml-3 py-1">
                  {selectedOrder.statusHistory.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-4 h-4 bg-white rounded-full border-2 border-emerald-500">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getStatusColor(item.status)}`}>
                            {t(item.status)}
                          </span>
                          <span className="text-[10px] text-gray-400">by {item.updatedBy}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {new Date(item.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })} &bull; {new Date(item.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Summary & Delivery Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 border-b pb-2">{t('items')}</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-800">
                            {language === 'ar' ? item.productNameAr : item.productNameEn}
                          </p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity} x {item.price.toFixed(2)} {settings?.currency || 'USD'}</p>
                        </div>
                        <span className="font-bold text-gray-700">{(item.quantity * item.price).toFixed(2)} {settings?.currency || 'USD'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-1.5 text-xs font-semibold text-gray-600">
                    {(() => {
                      const itemsSubtotal = selectedOrder.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
                      const curr = settings?.currency || 'USD';
                      return (
                        <>
                          <div className="flex justify-between items-center text-gray-500">
                            <span>{language === 'ar' ? 'مجموع المنتجات' : 'Items Subtotal'}</span>
                            <span className="font-mono">{itemsSubtotal.toFixed(2)} {curr}</span>
                          </div>
                          {selectedOrder.shippingFee !== undefined && selectedOrder.shippingFee > 0 && (
                            <div className="flex justify-between items-center text-gray-500">
                              <span>{language === 'ar' ? 'رسوم الشحن الافتراضية' : 'Default Shipping Fee'}</span>
                              <span className="font-mono">+{selectedOrder.shippingFee.toFixed(2)} {curr}</span>
                            </div>
                          )}
                          {selectedOrder.shippingDiscount !== undefined && selectedOrder.shippingDiscount > 0 && (
                            <div className="flex justify-between items-center text-rose-600 font-bold">
                              <span>{language === 'ar' ? 'خصم الشحن' : 'Shipping Discount'}</span>
                              <span className="font-mono">-{selectedOrder.shippingDiscount.toFixed(2)} {curr}</span>
                            </div>
                          )}
                          {selectedOrder.codCharge !== undefined && selectedOrder.codCharge > 0 && (
                            <div className="flex justify-between items-center text-gray-500">
                              <span>{language === 'ar' ? 'رسوم الدفع عند الاستلام' : 'COD Extra Charge'}</span>
                              <span className="font-mono">+{selectedOrder.codCharge.toFixed(2)} {curr}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <div className="flex justify-between items-center border-t pt-2 text-sm font-bold text-gray-900">
                      <span>{t('orderTotal')}</span>
                      <span className="text-emerald-600 font-extrabold font-mono">
                        {selectedOrder.totalAmount.toFixed(2)} {settings?.currency || 'USD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 border-b pb-2">{t('shippingInfo')}</h4>
                  <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
                    <p><span className="font-semibold text-gray-700">{t('shippingTo')}:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-semibold text-gray-700">{t('cityLabel')}:</span> {selectedOrder.shippingAddress.city}</p>
                    <p><span className="font-semibold text-gray-700">{t('streetLabel')}:</span> {selectedOrder.shippingAddress.street}</p>
                    {selectedOrder.shippingAddress.nearestLandmark && (
                      <p><span className="font-semibold text-gray-700">{language === 'ar' ? 'أقرب علامة مميزة' : 'Nearest Landmark'}:</span> {selectedOrder.shippingAddress.nearestLandmark}</p>
                    )}
                    {selectedOrder.shippingAddress.buildingFloor && (
                      <p><span className="font-semibold text-gray-700">{language === 'ar' ? 'الطابق والشقة' : 'Floor & Apartment'}:</span> {selectedOrder.shippingAddress.buildingFloor}</p>
                    )}
                    {selectedOrder.shippingAddress.preferredDeliveryTime && (
                      <p><span className="font-semibold text-gray-700">{language === 'ar' ? 'وقت التوصيل المفضل' : 'Preferred Delivery Time'}:</span> {selectedOrder.shippingAddress.preferredDeliveryTime}</p>
                    )}
                    <p><span className="font-semibold text-gray-700">{t('phoneLabel')}:</span> {selectedOrder.shippingAddress.phone}</p>
                    
                    <div className="pt-3 border-t">
                      <p><span className="font-semibold text-gray-700">{t('paymentMethod')}:</span> {selectedOrder.paymentMethod === 'stripe' ? t('stripeCard') : t('kasheirPay')}</p>
                      {selectedOrder.paymentDetails?.last4 && (
                        <p className="font-mono text-[10px] text-gray-400 uppercase mt-0.5">
                          {selectedOrder.paymentDetails.brand} **** {selectedOrder.paymentDetails.last4}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
