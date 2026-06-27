import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader2, Star } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const {
    language,
    addToCart,
    apiFetch,
    setActiveTab,
    getProductPrice
  } = useApp();

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const isAr = language === 'ar';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all products up to a large limit so we can filter them by ID
        const res = await apiFetch('/api/products?limit=1000');
        if (res && res.products) {
          const matched = res.products.filter((p: any) => wishlistIds.includes(p.id));
          setProducts(matched);
        }
      } catch (err: any) {
        console.error('Failed to load wishlist products:', err);
        setError(isAr ? 'فشل تحميل المنتجات المفضلة.' : 'Failed to load wishlist products.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds]);

  const handleRemoveFromWishlist = (productId: string, name: string) => {
    const updated = wishlistIds.filter(id => id !== productId);
    setWishlistIds(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    showToast(isAr ? `تمت إزالة "${name}" من المفضلة` : `Removed "${name}" from Wishlist`);
    // Also dispatch storage event for any other components listening
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    const name = isAr ? product.nameAr : product.nameEn;
    showToast(isAr ? `تمت إضافة "${name}" إلى السلة` : `Added "${name}" to Cart`);
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
            <span>{isAr ? 'قائمة المفضلة الخاصة بك' : 'Your Wishlist'}</span>
          </h2>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
            {isAr ? `لديك ${products.length} منتج في المفضلة` : `You have ${products.length} item${products.length !== 1 ? 's' : ''} in your wishlist`}
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

      {/* Main content viewport */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isAr ? 'جاري تحميل المفضلة...' : 'Loading your wishlist...'}
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
          <p className="text-xs font-bold text-rose-700">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white border border-gray-100 rounded-3xl p-8 max-w-xl mx-auto shadow-xs">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full">
            <Heart size={32} className="stroke-2 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800">
              {isAr ? 'قائمة المفضلة فارغة حالياً' : 'Your Wishlist is Empty'}
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs mt-1">
              {isAr 
                ? 'تصفح منتجاتنا الممتازة وقم بإضافة المنتجات التي تنال إعجابك لقائمة المفضلة بالضغط على أيقونة القلب.' 
                : 'Browse our premium products catalog and add items you love to your wishlist by clicking the heart icon.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('store')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
          >
            {isAr ? 'اكتشف المنتجات الآن' : 'Discover Products Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const { original, final, hasDiscount, discountText } = getProductPrice(p);
            const name = isAr ? p.nameAr : p.nameEn;
            const desc = isAr ? p.descriptionAr : p.descriptionEn;

            return (
              <div
                key={p.id}
                id={`wishlist-item-${p.id}`}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-gray-200/80 transition-all duration-300 flex flex-col group text-left"
              >
                {/* Image & Badge container */}
                <div className="relative aspect-video w-full bg-gray-50 overflow-hidden shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={p.imageUrl}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                      {discountText}
                    </span>
                  )}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 text-[10px] font-black rounded-lg">
                        {isAr ? 'نفذت الكمية' : 'OUT OF STOCK'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                        {isAr ? p.categoryNameAr || 'عام' : p.categoryNameEn || 'General'}
                      </span>
                      {p.rating && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star size={11} className="fill-amber-500 text-amber-500" />
                          <span className="text-[10px] font-bold font-mono">{p.rating}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-600 transition truncate" title={name}>
                      {name}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  {/* Pricing and Actions row */}
                  <div className="space-y-3 pt-2 border-t border-gray-50 mt-auto">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-gray-900 font-mono">
                        ${final.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 font-semibold line-through font-mono">
                          ${original.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Add to Cart */}
                      <button
                        id={`wishlist-add-cart-${p.id}`}
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-[11px] font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart size={12} />
                        <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                      </button>

                      {/* Remove from Wishlist */}
                      <button
                        id={`wishlist-remove-${p.id}`}
                        onClick={() => handleRemoveFromWishlist(p.id, name)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 text-[11px] font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-100"
                        title={isAr ? 'حذف من المفضلة' : 'Remove from Wishlist'}
                      >
                        <Trash2 size={12} />
                        <span>{isAr ? 'حذف' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
