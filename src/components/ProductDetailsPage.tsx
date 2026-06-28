import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../types';
import { 
  ArrowLeft, Star, Heart, Share2, Check, FileText, ShoppingCart, 
  Play, MessageSquare, ChevronRight, BadgePercent, ShieldAlert, ArrowRight, Eye
} from 'lucide-react';

interface ProductDetailsPageProps {
  productId: string;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ productId }) => {
  const { 
    language, 
    apiFetch, 
    user, 
    token, 
    addToCart, 
    cart, 
    t, 
    settings, 
    getProductPrice 
  } = useApp();

  const isAr = language === 'ar';
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Zoom Style for Main Image
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  // Fetch product and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        // Fetch specific product
        const prod = await apiFetch(`/api/products/${productId}`);
        if (!prod) {
          throw new Error(isAr ? 'المنتج غير موجود' : 'Product not found');
        }
        setProduct(prod);
        setActiveImage(prod.imageUrl);
        
        // Fetch categories
        const cats = await apiFetch('/api/categories');
        setCategories(cats || []);

        // Fetch related products (same category)
        const productsResponse = await apiFetch('/api/products');
        const allProductsList = productsResponse?.products || [];
        if (allProductsList && prod) {
          const related = allProductsList.filter(
            (p: Product) => p.categoryId === prod.categoryId && p.id !== prod.id
          ).slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err: any) {
        console.error('Error loading product page:', err);
        setErrorMsg(err.message || (isAr ? 'فشل تحميل تفاصيل المنتج.' : 'Failed to load product details.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  // Share link handler
  const handleShareProduct = () => {
    const shareUrl = `${window.location.origin}/product/${productId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy share link:', err);
    });
  };

  // Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(isAr ? 'يرجى تسجيل الدخول لكتابة مراجعة!' : 'Please login to write a review!');
      return;
    }
    if (!product) return;
    
    setReviewSubmitting(true);
    setReviewSuccessMsg('');
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit review');
      }
      const data = await response.json();
      setProduct(data.product);
      setNewComment('');
      setReviewSuccessMsg(isAr ? 'تمت إضافة مراجعتك بنجاح!' : 'Your review was submitted successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
  };

  // Back to shop handler
  const handleBackToShop = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Zoom mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomContainerRef.current) return;
    const { left, top, width, height } = zoomContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-gray-500">
          {isAr ? 'جاري تحميل تفاصيل المنتج...' : 'Loading product details...'}
        </p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 text-center">
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-black text-gray-900 mb-2">
          {isAr ? 'عذراً، حدث خطأ ما!' : 'Oops, something went wrong!'}
        </h3>
        <p className="text-sm text-gray-500 max-w-md mb-6">{errorMsg}</p>
        <button
          onClick={handleBackToShop}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          {isAr ? 'العودة للمتجر الرئيسي' : 'Back to Store'}
        </button>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const { original, final, hasDiscount } = getProductPrice(product);
  const discountPercent = hasDiscount ? Math.round(((original - final) / original) * 100) : 0;
  const curr = settings?.currency || 'USD';

  return (
    <div className="flex-1 bg-[#fafafa] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <button
            onClick={handleBackToShop}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-emerald-600 transition cursor-pointer"
          >
            {isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{isAr ? 'العودة للمتجر' : 'Back to Shop'}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Share link button */}
            <button
              id="share-product-btn"
              onClick={handleShareProduct}
              className="p-2.5 rounded-xl bg-white text-gray-600 hover:text-emerald-600 hover:border-emerald-200 border border-gray-150 shadow-xs hover:scale-105 transition flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              title={isAr ? 'مشاركة رابط المنتج' : 'Share product link'}
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-600 animate-pulse" />
                  <span className="text-emerald-600">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>{isAr ? 'مشاركة' : 'Share'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Product Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs">
          
          {/* Left Side: Images Gallery and Tech Docs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Main Interactive Zoom Box */}
            <div className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
              
              {/* Product Discount Badge (Rounded no decimals) */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-extrabold shadow-md uppercase tracking-wider">
                  {isAr ? `خصم ${discountPercent}٪` : `-${discountPercent}%`}
                </div>
              )}

              {/* Zoom Instruction Tag */}
              <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] px-3 py-1.5 rounded-full font-bold pointer-events-none opacity-100 group-hover:opacity-0 transition duration-350">
                {isAr ? 'مرر الماوس للتكبير والتنقل' : 'Hover to zoom & inspect'}
              </div>

              {/* Container for Hover Zoom */}
              <div
                ref={zoomContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full h-80 sm:h-[420px] bg-white flex items-center justify-center overflow-hidden cursor-zoom-in relative"
              >
                <img
                  referrerPolicy="no-referrer"
                  src={activeImage || product.imageUrl}
                  alt={isAr ? product.nameAr : product.nameEn}
                  className={`w-full h-full object-contain p-4 transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                />
                {isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${activeImage || product.imageUrl})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Thumbnails list */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto py-2 scrollbar-thin">
                {[product.imageUrl, ...product.images].map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-20 rounded-xl border-2 overflow-hidden bg-white shrink-0 transition-all ${
                      activeImage === imgUrl 
                        ? 'border-emerald-500 scale-95 shadow-sm' 
                        : 'border-gray-250 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img referrerPolicy="no-referrer" src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Technical Datasheet PDF Download link */}
            {product.datasheetUrl && (
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <FileText className="text-emerald-600 shrink-0" size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-gray-800">
                      {isAr ? 'كتيب المواصفات الفنية المعتمد' : 'Official Technical Datasheet'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">PDF Document</span>
                  </div>
                </div>
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                >
                  {isAr ? 'تنزيل PDF' : 'Download PDF'}
                </a>
              </div>
            )}
          </div>

          {/* Right Side: Primary product buy-card details and tabs */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              {/* Category, Brand, Title */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                  {category ? (isAr ? category.nameAr : category.nameEn) : ''}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                  {isAr ? product.nameAr : product.nameEn}
                </h1>
              </div>

              {/* Rating Review Summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-lg">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-700">{product.rating || 5}</span>
                </div>
                <span className="text-xs text-gray-400 font-semibold">
                  {product.reviewsCount || 0} {isAr ? 'مراجعات العملاء الكرام' : 'Customer Reviews'}
                </span>
              </div>

              {/* Rich Pricing Block */}
              {(() => {
                if (hasDiscount) {
                  return (
                    <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/30">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                          {final.toFixed(2)} {curr}
                        </span>
                        
                        {/* Strike Price is rendered below the current final price */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-sm line-through text-gray-400 font-medium font-mono">
                            {original.toFixed(2)} {curr}
                          </span>
                          <span className="bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                            {isAr ? `خصم ${discountPercent}٪` : `-${discountPercent}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                      {original.toFixed(2)} {curr}
                    </span>
                  </div>
                );
              })()}

              {/* Product interactive specifications tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-gray-150">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={`pb-3 text-xs font-black transition relative ${
                      activeTab === 'desc' 
                        ? 'text-emerald-600 border-b-2 border-emerald-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    } ${isAr ? 'ml-6' : 'mr-6'}`}
                  >
                    {isAr ? 'الوصف' : 'Description'}
                  </button>
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-3 text-xs font-black transition relative ${
                      activeTab === 'specs' 
                        ? 'text-emerald-600 border-b-2 border-emerald-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    } ${isAr ? 'ml-6' : 'mr-6'}`}
                  >
                    {isAr ? 'المواصفات الفنية' : 'Specifications'}
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 text-xs font-black transition relative ${
                      activeTab === 'reviews' 
                        ? 'text-emerald-600 border-b-2 border-emerald-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isAr ? 'التقييمات' : 'Reviews'} ({product.reviews?.length || 0})
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="min-h-40">
                  {activeTab === 'desc' && (
                    <div className="space-y-4 animate-fade-in text-xs leading-relaxed text-gray-600">
                      <p className="whitespace-pre-line">
                        {isAr ? product.descriptionAr : product.descriptionEn}
                      </p>
                      
                      {/* Video Embed layout */}
                      {product.videoUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 bg-black aspect-video relative">
                          {getYouTubeEmbedUrl(product.videoUrl) ? (
                            <iframe
                              className="w-full h-full"
                              src={getYouTubeEmbedUrl(product.videoUrl) || ''}
                              title="Product Video"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <video 
                              src={product.videoUrl} 
                              controls 
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="space-y-4 animate-fade-in">
                      {product.specificationsEn || product.specificationsAr ? (
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs text-gray-600 leading-relaxed whitespace-pre-line font-mono">
                          {isAr 
                            ? (product.specificationsAr || product.specificationsEn)
                            : (product.specificationsEn || product.specificationsAr)
                          }
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic py-4 text-center">
                          {isAr ? 'لم يتم توفير مواصفات فنية إضافية.' : 'No additional specifications provided.'}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Reviews container */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {product.reviews && product.reviews.length > 0 ? (
                          product.reviews.map((rev) => (
                            <div key={rev.id} className="p-3.5 bg-gray-50/40 border border-gray-100 rounded-xl space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-gray-800">{rev.userName}</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={11}
                                      className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-600 italic">"{rev.comment}"</p>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic py-4 text-center">
                            {isAr ? 'لا توجد مراجعات بعد. كن أول من يضيف رأيه!' : 'No reviews yet. Be the first to add!'}
                          </p>
                        )}
                      </div>

                      {/* Add Review Box */}
                      {user ? (
                        <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-gray-100 space-y-3">
                          <p className="text-xs font-black text-gray-800">
                            {isAr ? 'أضف تقييمك ورأيك في المنتج' : 'Write a Review'}
                          </p>
                          
                          {reviewSuccessMsg && (
                            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 rounded-xl font-bold">
                              {reviewSuccessMsg}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">
                              {isAr ? 'التقييم:' : 'Your Rating:'}
                            </span>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewRating(i + 1)}
                                className="p-0.5 focus:outline-none transition hover:scale-115 cursor-pointer"
                              >
                                <Star
                                  size={18}
                                  className={i < newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                />
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <textarea
                              required
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={2}
                              placeholder={isAr ? 'اكتب تعليقك هنا بوضوح...' : 'Describe your experience with this product...'}
                              className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {reviewSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              isAr ? 'إرسال التقييم' : 'Submit Review'
                            )}
                          </button>
                        </form>
                      ) : (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50/70 p-3 rounded-xl text-center font-bold">
                          {isAr ? '* يرجى تسجيل الدخول لتتمكن من إضافة تقييم ومراجعة للمنتج.' : '* Please login to write a rating and review.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Buy Block controls */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              {(() => {
                const isStockLimited = product.stock !== undefined && product.stock !== null && (product.stock as any) !== '';
                const stockNum = isStockLimited ? Number(product.stock) : 999;
                if (stockNum >= 10) return null;
                return (
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-gray-500">{isAr ? 'حالة المخزون:' : 'Stock Status:'}</span>
                    <span>
                      {stockNum === 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{t('outOfStock')}</span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{isAr ? `متبقي ${stockNum} فقط!` : `Only ${stockNum} left!`}</span>
                      )}
                    </span>
                  </div>
                );
              })()}

              <button
                id={`product-page-add-cart-btn-${product.id}`}
                onClick={handleAddToCart}
                disabled={product.stock !== undefined && product.stock !== null && (product.stock as any) !== '' && Number(product.stock) === 0}
                className={`w-full py-4 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                  product.stock !== undefined && product.stock !== null && (product.stock as any) !== '' && Number(product.stock) === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                }`}
              >
                <ShoppingCart size={18} />
                <span>
                  {product.stock !== undefined && product.stock !== null && (product.stock as any) !== '' && Number(product.stock) === 0
                    ? t('outOfStock')
                    : (isAr ? 'إضافة إلى عربة التسوق' : 'Add to Cart')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-gray-150">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              {isAr ? 'منتجات ذات صلة قد تعجبك' : 'Related Products You May Like'}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => {
                const { original: rOriginal, final: rFinal, hasDiscount: rHasDiscount } = getProductPrice(p);
                const rDiscountPercent = rHasDiscount ? Math.round(((rOriginal - rFinal) / rOriginal) * 100) : 0;

                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      window.history.pushState(null, '', `/product/${p.id}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="group bg-white rounded-2xl border border-gray-150 shadow-xs hover:shadow-md transition duration-300 cursor-pointer flex flex-col h-full"
                  >
                    {/* Related Image */}
                    <div className="relative aspect-square overflow-hidden bg-white rounded-t-2xl border-b border-gray-50 flex items-center justify-center">
                      {rHasDiscount && (
                        <span className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {isAr ? `خصم ${rDiscountPercent}٪` : `-${rDiscountPercent}%`}
                        </span>
                      )}
                      <img 
                        referrerPolicy="no-referrer"
                        src={p.imageUrl} 
                        alt={isAr ? p.nameAr : p.nameEn} 
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Related Info */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                      <h4 className="font-bold text-gray-900 text-xs line-clamp-1 group-hover:text-emerald-600 transition">
                        {isAr ? p.nameAr : p.nameEn}
                      </h4>
                      
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-600 font-mono">
                          {rFinal.toFixed(2)} {curr}
                        </span>
                        {rHasDiscount && (
                          <span className="text-[10px] line-through text-gray-400 font-medium font-mono">
                            {rOriginal.toFixed(2)} {curr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
