import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    language, 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    t, 
    user, 
    setShowAuthModal, 
    setAuthModalCallback,
    apiFetch,
    setActiveTab
  } = useApp();

  // Shipping form state
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'kasheir'>('stripe');

  // Stripe simulated token
  const [stripeToken, setStripeToken] = useState('');

  // UI Flow States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) return;

    if (!city || !street || !phone) {
      setErrorMsg('Please fill in all shipping details.');
      return;
    }

    // AUTH CHECK: Must log in or register before checking out
    if (!user) {
      setAuthModalCallback(() => {
        // Retry submitting once authenticated
        handleSubmitCheckout();
      });
      setShowAuthModal(true);
      return;
    }

    await handleSubmitCheckout();
  };

  const handleSubmitCheckout = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const payload = {
        items: itemsPayload,
        paymentMethod,
        shippingAddress: { city, street, phone },
        stripePaymentToken: stripeToken || 'tok_visa', // simulated token
      };

      const completed = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCompletedOrder(completed);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="bg-white border rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 animate-fade-in shadow-xs">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{t('orderSuccess')}</h2>
          <p className="text-sm text-gray-500">{t('orderSuccessMsg')}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600 text-left space-y-2">
          <p className="flex justify-between">
            <span>{t('orderId')}:</span>
            <span className="font-mono text-gray-900 font-bold">#{completedOrder.id}</span>
          </p>
          <p className="flex justify-between">
            <span>{t('orderDate')}:</span>
            <span className="text-gray-900">{new Date(completedOrder.createdAt).toLocaleString(language === 'ar' ? 'ar' : 'en')}</span>
          </p>
          <p className="flex justify-between">
            <span>{t('orderTotal')}:</span>
            <span className="text-emerald-600 font-extrabold text-sm">${completedOrder.totalAmount.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>{t('paymentMethod')}:</span>
            <span className="uppercase text-gray-900">{completedOrder.paymentMethod}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            id="order-success-shop-btn"
            onClick={() => { setCompletedOrder(null); setActiveTab('store'); }}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
          >
            {t('backToShop')}
          </button>
          <button
            id="order-success-view-orders-btn"
            onClick={() => { setCompletedOrder(null); setActiveTab('my-orders'); }}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            {t('myOrders')}
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-white border rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">{t('emptyCart')}</h3>
        <button
          id="cart-back-shop-btn"
          onClick={() => setActiveTab('store')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          {t('backToShop')}
        </button>
      </div>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('cart')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart items list (Left side - 7 Columns) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="divide-y divide-gray-100">
            {cart.map(item => (
              <div 
                id={`cart-item-${item.product.id}`}
                key={item.product.id} 
                className="py-4 flex gap-4 first:pt-0 last:pb-0"
              >
                {/* Image */}
                <img referrerPolicy="no-referrer" src={item.product.imageUrl} alt={item.product.nameEn} className="w-16 h-16 rounded-xl object-cover border shrink-0 bg-gray-50" />

                {/* Info & Quantity controls */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                      </h4>
                      <p className="text-xs text-emerald-600 font-bold">${item.product.price.toFixed(2)}</p>
                    </div>
                    
                    <button
                      id={`cart-remove-${item.product.id}`}
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition shrink-0 self-start"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {/* Qty count control */}
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50/55">
                      <button
                        id={`cart-qty-dec-${item.product.id}`}
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-800">{item.quantity}</span>
                      <button
                        id={`cart-qty-inc-${item.product.id}`}
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between items-center text-sm font-bold text-gray-900">
            <span>{t('subtotal')}</span>
            <span className="text-emerald-600 text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Form & Billing Checkout (Right side - 5 Columns) */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-5">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-500" />
            {t('shippingInfo')}
          </h3>

          {errorMsg && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              {errorMsg}
            </div>
          )}

          {/* User Sign-In Banner if they are browsing guest but checkout requires it */}
          {!user && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs flex justify-between items-center">
              <span>Checkout requires a free account login.</span>
              <button
                id="cart-auth-btn"
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="underline font-bold hover:text-indigo-900"
              >
                Login Now
              </button>
            </div>
          )}

          <div className="space-y-4 text-xs font-semibold text-gray-600">
            <div className="space-y-1">
              <label className="block">{t('cityLabel')}</label>
              <input
                id="shipping-city-input"
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Cairo, Giza, etc."
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-gray-50/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block">{t('streetLabel')}</label>
              <input
                id="shipping-street-input"
                type="text"
                required
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="15 El Tahrir Square, Apt 4"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-gray-50/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block">{t('phoneLabel')}</label>
              <input
                id="shipping-phone-input"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 101 234 5678"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-gray-50/20"
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="block text-gray-700 font-bold">{t('paymentMethod')}</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="pay-stripe-btn"
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'stripe'
                      ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-bold'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">Stripe Card</span>
                </button>
                <button
                  id="pay-kasheir-btn"
                  type="button"
                  onClick={() => setPaymentMethod('kasheir')}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'kasheir'
                      ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-bold'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">Kasheir</span>
                </button>
              </div>
            </div>
          </div>

          <button
            id="checkout-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('placingOrder')}
              </>
            ) : (
              <>
                {t('placeOrder')}
                {language === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
