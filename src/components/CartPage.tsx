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
    setActiveTab,
    settings,
    getProductPrice
  } = useApp();

  const curr = settings?.currency || 'USD';

  // Shipping form state
  const [shippingCities, setShippingCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [phone, setPhone] = useState('');
  const [nearestLandmark, setNearestLandmark] = useState('');
  const [buildingFloor, setBuildingFloor] = useState('');
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  React.useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await apiFetch('/api/shipping-cities');
        if (res && Array.isArray(res)) {
          const sorted = [...res].sort((a, b) => {
            const nameA = language === 'ar' ? a.nameAr : a.nameEn;
            const nameB = language === 'ar' ? b.nameAr : b.nameEn;
            return nameA.localeCompare(nameB);
          });
          setShippingCities(sorted);
          if (sorted.length > 0) {
            setSelectedCityId(sorted[0].id);
            setCity(sorted[0].nameEn);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shipping cities', err);
      }
    };
    fetchCities();
  }, [language]);

  React.useEffect(() => {
    if (settings?.paymentOptions && settings.paymentOptions.length > 0) {
      if (!settings.paymentOptions.includes(paymentMethod)) {
        setPaymentMethod(settings.paymentOptions[0]);
      }
    }
  }, [settings, paymentMethod]);

  // Stripe simulated token
  const [stripeToken, setStripeToken] = useState('');

  // UI Flow States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const { final } = getProductPrice(item.product);
      return sum + final * item.quantity;
    }, 0);
  };

  const getShippingAndCODDetails = () => {
    const subtotal = calculateSubtotal();
    const selectedCityObj = shippingCities.find(c => c.id === selectedCityId);
    let defaultFee = 0;
    let discount = 0;
    let netFee = 0;
    let minOrder = 0;
    let isBelowMinOrder = false;

    if (selectedCityObj) {
      defaultFee = selectedCityObj.defaultShippingFee;
      minOrder = selectedCityObj.minOrderAmount;
      if (subtotal < minOrder) {
        isBelowMinOrder = true;
      }
      if (subtotal >= selectedCityObj.minOrderForDiscount) {
        discount = selectedCityObj.discountAmount;
      }
      netFee = Math.max(0, defaultFee - discount);
    }

    const codCharge = (paymentMethod === 'cod' && settings?.codExtraChargeEnabled) 
      ? (settings.codExtraChargeAmount || 0) 
      : 0;

    const total = subtotal + netFee + codCharge;

    return {
      subtotal,
      defaultFee,
      discount,
      netFee,
      minOrder,
      isBelowMinOrder,
      codCharge,
      total
    };
  };

  const { subtotal: detailsSubtotal, defaultFee, discount, netFee, minOrder, isBelowMinOrder, codCharge, total } = getShippingAndCODDetails();

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) return;

    if (!selectedCityId || !street || !phone) {
      setErrorMsg(language === 'ar' ? 'الرجاء ملء جميع حقول الشحن المطلوبة.' : 'Please fill in all shipping details.');
      return;
    }

    if (isBelowMinOrder) {
      const cityObj = shippingCities.find(c => c.id === selectedCityId);
      const cityName = cityObj ? (language === 'ar' ? cityObj.nameAr : cityObj.nameEn) : city;
      setErrorMsg(language === 'ar' 
        ? `الحد الأدنى لقيمة الطلب لتفعيل التوصيل إلى ${cityName} هو ${minOrder} ${curr}` 
        : `Minimum order amount for shipping to ${cityName} is ${minOrder} ${curr}.`
      );
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

      const cityObj = shippingCities.find(c => c.id === selectedCityId);

      const payload = {
        items: itemsPayload,
        paymentMethod,
        shippingAddress: { 
          city: cityObj ? cityObj.nameEn : city, 
          street, 
          phone,
          nearestLandmark,
          buildingFloor,
          preferredDeliveryTime
        },
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
            <span className="text-emerald-600 font-extrabold text-sm">{completedOrder.totalAmount.toFixed(2)} {settings?.currency || 'USD'}</span>
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
                      {(() => {
                        const { original, final, hasDiscount } = getProductPrice(item.product);
                        const curr = settings?.currency || 'USD';
                        if (hasDiscount) {
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-rose-600 font-bold">{final.toFixed(2)} {curr}</span>
                              <span className="text-[10px] line-through text-gray-400 font-normal">{original.toFixed(2)} {curr}</span>
                            </div>
                          );
                        }
                        return <p className="text-xs text-emerald-600 font-bold">{original.toFixed(2)} {curr}</p>;
                      })()}
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
                      {(() => {
                        const { final } = getProductPrice(item.product);
                        const curr = settings?.currency || 'USD';
                        return `${(final * item.quantity).toFixed(2)} ${curr}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2.5 text-xs font-semibold text-gray-600">
            <div className="flex justify-between items-center text-sm text-gray-900 font-bold">
              <span>{t('subtotal')}</span>
              <span className="font-bold">{subtotal.toFixed(2)} {settings?.currency || 'USD'}</span>
            </div>

            {selectedCityId ? (
              <>
                <div className="flex justify-between items-center">
                  <span>{language === 'ar' ? 'رسوم الشحن الافتراضية' : 'Default Shipping Fee'}</span>
                  <span className="font-mono text-gray-900">+{defaultFee.toFixed(2)} {settings?.currency || 'USD'}</span>
                </div>

                {discount > 0 ? (
                  <div className="flex justify-between items-center text-rose-600 font-bold">
                    <span>{language === 'ar' ? 'خصم الشحن' : 'Shipping Fee Discount'}</span>
                    <span className="font-mono">-{discount.toFixed(2)} {settings?.currency || 'USD'}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 font-normal">
                    {language === 'ar'
                      ? `* أضف منتجات بقيمة ${(minOrder - subtotal) > 0 ? (minOrder - subtotal).toFixed(2) : '0'} ${settings?.currency || 'USD'} أخرى للحصول على خصم الشحن.`
                      : `* Add ${(minOrder - subtotal) > 0 ? (minOrder - subtotal).toFixed(2) : '0'} ${settings?.currency || 'USD'} more of products to apply shipping discount.`}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[10px] text-gray-400 italic">
                {language === 'ar' ? '* حدد مدينة الشحن لحساب التكاليف والخصومات' : '* Select shipping city to determine fees & discounts'}
              </p>
            )}

            {paymentMethod === 'cod' && settings?.codExtraChargeEnabled && (
              <div className="flex justify-between items-center">
                <span>{language === 'ar' ? 'رسوم الدفع عند الاستلام' : 'Cash on Delivery Extra Charge'}</span>
                <span className="font-mono text-gray-900">+{codCharge.toFixed(2)} {settings?.currency || 'USD'}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between items-center text-base font-black text-gray-900">
              <span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total Amount'}</span>
              <span className="text-emerald-600 text-xl font-black font-mono">
                {total.toFixed(2)} {settings?.currency || 'USD'}
              </span>
            </div>
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
              <label className="block text-gray-700 font-bold">{language === 'ar' ? 'المدينة / المحافظة' : 'City / Governorate'}</label>
              {shippingCities.length > 0 ? (
                <select
                  id="shipping-city-select"
                  required
                  value={selectedCityId}
                  onChange={e => {
                    setSelectedCityId(e.target.value);
                    const selectedObj = shippingCities.find(c => c.id === e.target.value);
                    if (selectedObj) setCity(selectedObj.nameEn);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {shippingCities.map(c => (
                    <option key={c.id} value={c.id}>
                      {language === 'ar' ? c.nameAr : c.nameEn} ({c.defaultShippingFee} {curr})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="shipping-city-input"
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Cairo, Giza, etc."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">{language === 'ar' ? 'العنوان بالتفصيل (اسم الشارع والمبنى)' : 'Full Address (Street & Building)'}</label>
              <input
                id="shipping-street-input"
                type="text"
                required
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: 15 شارع التحرير، الطابق الرابع' : 'e.g. 15 El Tahrir Square, Apt 4'}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-gray-500">{language === 'ar' ? 'أقرب علامة مميزة (اختياري)' : 'Nearest Landmark (Optional)'}</label>
                <input
                  id="shipping-landmark-input"
                  type="text"
                  value={nearestLandmark}
                  onChange={e => setNearestLandmark(e.target.value)}
                  placeholder={language === 'ar' ? 'بجوار مسجد / سوبرماركت' : 'e.g. Near Metro Station'}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500">{language === 'ar' ? 'رقم الطابق والشقة (اختياري)' : 'Floor & Apartment (Optional)'}</label>
                <input
                  id="shipping-building-input"
                  type="text"
                  value={buildingFloor}
                  onChange={e => setBuildingFloor(e.target.value)}
                  placeholder={language === 'ar' ? 'الدور 5 شقة 10' : 'e.g. Floor 5, Apt 10'}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-500">{language === 'ar' ? 'وقت التوصيل المفضل (اختياري)' : 'Preferred Delivery Time (Optional)'}</label>
              <input
                id="shipping-time-input"
                type="text"
                value={preferredDeliveryTime}
                onChange={e => setPreferredDeliveryTime(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: مساءً بين ٥ إلى ٩ مساءً' : 'e.g. Afternoon 5pm to 9pm'}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">{t('phoneLabel')}</label>
              <input
                id="shipping-phone-input"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 101 234 5678"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50/20"
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="block text-gray-700 font-bold">{t('paymentMethod')}</label>
              
              <div className="grid grid-cols-2 gap-2">
                {(!settings?.paymentOptions || settings.paymentOptions.includes('cod')) && (
                  <button
                    id="pay-cod-btn"
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">{language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery (COD)'}</span>
                  </button>
                )}
                
                {(!settings?.paymentOptions || settings.paymentOptions.includes('card')) && (
                  <button
                    id="pay-card-btn"
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">{language === 'ar' ? 'بطاقة بنكية' : 'Bank Card (Online)'}</span>
                  </button>
                )}
              </div>

              {paymentMethod === 'card' && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 mt-2 animate-fade-in">
                  <div className="text-[10px] text-gray-400 font-medium">
                    {language === 'ar' 
                      ? `سيتم معالجة الدفع بأمان عبر بوابة الدفع المفعلة (${settings?.paymentGateway || 'Stripe'})`
                      : `Secured via active payment gateway (${settings?.paymentGateway || 'Stripe'})`
                    }
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-500 font-bold">Simulated Card Token / Card Number</label>
                    <input 
                      id="card-token-input"
                      type="text" 
                      value={stripeToken}
                      onChange={e => setStripeToken(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
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
