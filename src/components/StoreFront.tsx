import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../types';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Eye, ShoppingCart, Check, Heart, Star, FileText, Youtube, ZoomIn, X, Video } from 'lucide-react';

export const StoreFront: React.FC = () => {
  const { language, t, addToCart, apiFetch, settings, getProductPrice, token, user } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Wishlist State
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWishlist(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  };

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions fetching logic (debounced)
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const query = new URLSearchParams({
          search: search,
          limit: '5',
        });
        const data = await apiFetch(`/api/products?${query.toString()}`);
        setSuggestions(data.products || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset active suggestion index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});

  // Product Details active image
  const [activeImage, setActiveImage] = useState('');
  // Lightbox Zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  // Active Tab: 'desc' | 'specs' | 'reviews'
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  // New Review state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.imageUrl);
      setActiveTab('desc');
      setNewRating(5);
      setNewComment('');
      setReviewSuccessMsg('');
    }
  }, [selectedProduct]);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول لكتابة مراجعة!' : 'Please login to write a review!');
      return;
    }
    if (!selectedProduct) return;
    setReviewSubmitting(true);
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/reviews`, {
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
      // Update local product state with new review
      setSelectedProduct(data.product);
      setNewComment('');
      setReviewSuccessMsg(language === 'ar' ? 'تمت إضافة مراجعتك بنجاح!' : 'Your review was submitted successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await apiFetch('/api/categories');
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products with active filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        categoryId: selectedCategory,
        minPrice,
        maxPrice,
        sort,
        page: page.toString(),
        limit: '6',
      });
      const data = await apiFetch(`/api/products?${query.toString()}`);
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setPage(data.pagination.currentPage);
      setTotalItems(data.pagination.totalItems);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, sort, page]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    // Directly fetch with reset values
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProductIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedProductIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        {/* Search */}
        <div ref={searchContainerRef} className="relative w-full md:max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <input
            id="search-input"
            type="text"
            value={search}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setShowSuggestions(true);
                setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
              } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                  e.preventDefault();
                  const selected = suggestions[activeIndex];
                  setSelectedProduct(selected);
                  setShowSuggestions(false);
                }
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
              setShowSuggestions(true);
            }}
            placeholder={t('searchPlaceholder')}
            className={`w-full py-2.5 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition`}
          />

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && search.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto scrollbar-none">
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                  {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                </div>
              ) : suggestions.length > 0 ? (
                <div className="p-1.5 space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {language === 'ar' ? 'المنتجات المقترحة' : 'Suggested Products'}
                  </div>
                  {suggestions.map((p, idx) => {
                    const { final, hasDiscount, original } = getProductPrice(p);
                    const curr = settings?.currency || 'USD';
                    const isActive = idx === activeIndex;
                    return (
                      <div
                        key={p.id}
                        id={`autocomplete-item-${p.id}`}
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex items-center justify-between p-2 rounded-xl transition duration-150 cursor-pointer ${
                          isActive ? 'bg-emerald-50 text-emerald-900 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.imageUrl}
                            alt={language === 'ar' ? p.nameAr : p.nameEn}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 shrink-0"
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {language === 'ar' ? p.nameAr : p.nameEn}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {language === 'ar' ? p.descriptionAr : p.descriptionEn}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2 pr-2">
                          <span className="text-xs font-extrabold text-emerald-600 font-mono">
                            {final.toFixed(2)} {curr}
                          </span>
                          {hasDiscount && (
                            <p className="text-[9px] text-gray-400 line-through font-mono">
                              {original.toFixed(2)} {curr}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-xs text-gray-400 text-center">
                  {language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Sorting */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <ArrowUpDown size={16} className="text-gray-400" />
            <select
              id="sort-select"
              value={sort}
              onChange={e => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-sm text-gray-700 outline-hidden pr-8 cursor-pointer focus:ring-0"
            >
              <option value="popular">{t('sortByPopular')}</option>
              <option value="price-asc">{t('sortByPriceAsc')}</option>
              <option value="price-desc">{t('sortByPriceDesc')}</option>
              <option value="name">{t('sortByName')}</option>
            </select>
          </div>

          {/* Toggle Filter Button */}
          <button
            id="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition w-full sm:w-auto ${
              showFilters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            {t('filter')}
          </button>
        </div>
      </div>

      {/* Advanced Filters Drawer/Panel */}
      {showFilters && (
        <form onSubmit={handleApplyFilters} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">{t('allCategories')}</label>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {language === 'ar' ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">{t('priceRange')}</label>
            <div className="flex items-center gap-2">
              <input
                id="min-price-input"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                id="max-price-input"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              id="submit-filters-btn"
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
            >
              {t('filter')}
            </button>
            <button
              id="reset-filters-btn"
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold transition"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Main Categories Fast Badges */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-none">
        <button
          id="badge-cat-all"
          onClick={() => {
            setSelectedCategory('');
            setPage(1);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
            selectedCategory === ''
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('allCategories')}
        </button>
        {categories.map(c => (
          <button
            id={`badge-cat-${c.id}`}
            key={c.id}
            onClick={() => {
              setSelectedCategory(c.id);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
              selectedCategory === c.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {language === 'ar' ? c.nameAr : c.nameEn}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm font-medium">{t('loading')}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-500 space-y-2">
          <p className="text-lg font-semibold">No products found</p>
          <p className="text-sm">Try widening your filters or keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {products.map(p => (
            <div
              id={`prod-card-${p.id}`}
              key={p.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-100 transition-all duration-300 flex flex-col h-[350px] sm:h-[400px]"
            >
              {/* Product Image */}
              <div 
                className="relative h-32 sm:h-48 bg-gray-50 overflow-hidden shrink-0 cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <img
                  referrerPolicy="no-referrer"
                  src={p.imageUrl}
                  alt={language === 'ar' ? p.nameAr : p.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Wishlist Button floating */}
                <button
                  id={`wishlist-toggle-${p.id}`}
                  onClick={(e) => toggleWishlist(p.id, e)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-sm hover:scale-110 active:scale-95 transition"
                >
                  <Heart
                    size={16}
                    className={`transition-colors ${
                      wishlist.includes(p.id)
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-gray-400 hover:text-rose-500'
                    }`}
                  />
                </button>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  {(() => {
                    const isStockLimited = p.stock !== undefined && p.stock !== null && (p.stock as any) !== '';
                    if (isStockLimited) {
                      const stockNum = Number(p.stock);
                      if (stockNum === 0) {
                        return (
                          <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                            {t('outOfStock')}
                          </span>
                        );
                      } else if (stockNum < 10) {
                        return (
                          <span className="bg-amber-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-md animate-pulse">
                            {language === 'ar' ? `متبقي ${stockNum} فقط!` : `Only ${stockNum} left!`}
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}
                  
                  {p.topSelling && (
                    <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                      Best Seller
                    </span>
                  )}
                </div>

                {/* Quick View Button overlay */}
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                  <span className="px-4 py-2 bg-white/95 backdrop-blur-xs text-xs font-bold text-gray-800 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition">
                    <Eye size={14} className="text-emerald-500" />
                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-5 flex flex-col justify-between flex-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                      {categories.find(c => c.id === p.categoryId)
                        ? (language === 'ar' ? categories.find(c => c.id === p.categoryId)?.nameAr : categories.find(c => c.id === p.categoryId)?.nameEn)
                        : ''}
                    </span>
                    
                    {/* Star Rating on product card */}
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{p.rating || 5}</span>
                      <span className="text-[10px] text-gray-400">({p.reviewsCount || 0})</span>
                    </div>
                  </div>
                  
                  <h4 
                    onClick={() => setSelectedProduct(p)}
                    className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition cursor-pointer"
                  >
                    {language === 'ar' ? p.nameAr : p.nameEn}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {language === 'ar' ? p.descriptionAr : p.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 flex-wrap gap-2">
                  {(() => {
                    const { original, final, hasDiscount, discountText } = getProductPrice(p);
                    const curr = settings?.currency || 'USD';
                    if (hasDiscount) {
                      return (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs line-through text-gray-400 font-medium">
                              {original.toFixed(2)} {curr}
                            </span>
                            <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded-sm font-bold">
                              {discountText}
                            </span>
                          </div>
                          <span className="text-base font-bold text-rose-600">
                            {final.toFixed(2)} {curr}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <span className="text-base font-bold text-gray-900">
                        {original.toFixed(2)} {curr}
                      </span>
                    );
                  })()}
                  
                  <button
                    id={`add-cart-btn-${p.id}`}
                    onClick={() => handleAddToCart(p)}
                    disabled={p.stock !== undefined && p.stock !== null && (p.stock as any) !== '' && Number(p.stock) === 0}
                    className={`flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      p.stock !== undefined && p.stock !== null && (p.stock as any) !== '' && Number(p.stock) === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addedProductIds[p.id]
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {addedProductIds[p.id] ? (
                      <>
                        <Check size={14} />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        {t('addToCart')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            id="prev-page-btn"
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
            id="next-page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Product Details Modal (Complete specifications, video, datasheets, zoomable gallery & interactive reviews) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div 
            id="quick-view-modal"
            className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row my-8"
          >
            {/* Close Button */}
            <button
              id="close-quick-view-btn"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-gray-500 hover:text-red-500 shadow-md border hover:scale-105 transition"
            >
              <X size={18} />
            </button>

            {/* Left Column: Multi-Image Zoom Gallery */}
            <div className="md:w-1/2 p-6 bg-gray-50/50 flex flex-col justify-between border-r border-gray-100">
              <div className="space-y-4">
                {/* Main Image View */}
                <div 
                  className="relative h-72 md:h-96 rounded-2xl bg-white overflow-hidden border border-gray-100 group cursor-zoom-in"
                  onClick={() => setIsZoomed(true)}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={activeImage || selectedProduct.imageUrl}
                    alt={language === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                    <span className="p-3 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-gray-700">
                      <ZoomIn size={20} />
                    </span>
                  </div>
                </div>

                {/* Gallery Thumbnails */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {/* Include main image in thumbnails */}
                    {[selectedProduct.imageUrl, ...selectedProduct.images].map((imgUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-white shrink-0 transition ${
                          activeImage === imgUrl ? 'border-emerald-500 scale-95 shadow-xs' : 'border-gray-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img referrerPolicy="no-referrer" src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Data sheets (if available) */}
              {selectedProduct.datasheetUrl && (
                <div className="mt-4 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="text-emerald-600 shrink-0" size={18} />
                    <span className="text-xs font-bold text-gray-700">
                      {language === 'ar' ? 'كتيب المواصفات الفنية' : 'Technical Datasheet PDF'}
                    </span>
                  </div>
                  <a
                    href={selectedProduct.datasheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                  >
                    {language === 'ar' ? 'تنزيل PDF' : 'Download'}
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Tabbed Information Details */}
            <div className="p-8 md:w-1/2 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    {categories.find(c => c.id === selectedProduct.categoryId)
                      ? (language === 'ar' ? categories.find(c => c.id === selectedProduct.categoryId)?.nameAr : categories.find(c => c.id === selectedProduct.categoryId)?.nameEn)
                      : ''}
                  </span>
                  <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">
                    {language === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}
                  </h3>
                </div>

                {/* Rating & reviews counter info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-black text-amber-700">{selectedProduct.rating || 5}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">
                    {selectedProduct.reviewsCount || 0} {language === 'ar' ? 'مراجعات العملاء' : 'Customer Reviews'}
                  </span>
                </div>

                {/* Price block */}
                {(() => {
                  const { original, final, hasDiscount, discountText } = getProductPrice(selectedProduct);
                  const curr = settings?.currency || 'USD';
                  if (hasDiscount) {
                    return (
                      <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100/40">
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-gray-400 font-medium">
                            {original.toFixed(2)} {curr}
                          </span>
                          <span className="bg-rose-100 text-rose-600 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {discountText}
                          </span>
                        </div>
                        <span className="text-3xl font-black text-rose-600 font-mono">
                          {final.toFixed(2)} {curr}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/30">
                      <span className="text-3xl font-black text-emerald-600 font-mono">
                        {original.toFixed(2)} {curr}
                      </span>
                    </div>
                  );
                })()}

                {/* Tab Navigation buttons */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 ${
                      activeTab === 'desc' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </button>
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 ${
                      activeTab === 'specs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {language === 'ar' ? 'المواصفات' : 'Specifications'}
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 ${
                      activeTab === 'reviews' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {language === 'ar' ? 'المراجعات' : 'Reviews'} ({selectedProduct.reviews?.length || 0})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="py-2">
                  {activeTab === 'desc' && (
                    <div className="space-y-4 animate-fade-in text-sm text-gray-600 leading-relaxed">
                      <p>{language === 'ar' ? selectedProduct.descriptionAr : selectedProduct.descriptionEn}</p>
                      
                      {/* Embedded Video / Uploaded Video File */}
                      {selectedProduct.videoUrl && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            {getYouTubeEmbedUrl(selectedProduct.videoUrl) ? (
                              <Youtube className="text-red-500" size={16} />
                            ) : (
                              <Video className="text-emerald-500" size={16} />
                            )}
                            {language === 'ar' ? 'الفيديو التعريفي للمنتج' : 'Product Video Demonstration'}
                          </span>
                          {getYouTubeEmbedUrl(selectedProduct.videoUrl) ? (
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border bg-black shadow-inner">
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={getYouTubeEmbedUrl(selectedProduct.videoUrl) || ''}
                                title="Product Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          ) : (
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border bg-black shadow-inner">
                              <video
                                className="w-full h-full object-contain bg-black"
                                controls
                                src={selectedProduct.videoUrl}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="animate-fade-in">
                      {selectedProduct.specificationsEn || selectedProduct.specificationsAr ? (
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {language === 'ar' 
                            ? (selectedProduct.specificationsAr || selectedProduct.specificationsEn)
                            : (selectedProduct.specificationsEn || selectedProduct.specificationsAr)
                          }
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic py-4 text-center">
                          {language === 'ar' ? 'لم يتم توفير مواصفات فنية إضافية لهذا المنتج.' : 'No additional specifications provided for this product.'}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Existing Reviews List */}
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                          selectedProduct.reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-gray-50/50 border rounded-xl space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800">{rev.userName}</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={10}
                                      className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-600 italic">"{rev.comment}"</p>
                              <span className="text-[9px] text-gray-400 block">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic py-4 text-center">
                            {language === 'ar' ? 'لا توجد مراجعات بعد. كن أول من يكتب مراجعة!' : 'No reviews yet. Be the first to write a review!'}
                          </p>
                        )}
                      </div>

                      {/* Add Review Form */}
                      {user ? (
                        <form onSubmit={handleReviewSubmit} className="pt-3 border-t space-y-3">
                          <p className="text-xs font-bold text-gray-800">
                            {language === 'ar' ? 'اكتب مراجعتك وتقييمك' : 'Write your Review & Rating'}
                          </p>
                          
                          {reviewSuccessMsg && (
                            <div className="p-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                              {reviewSuccessMsg}
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 mr-1">
                              {language === 'ar' ? 'التقييم:' : 'Rating:'}
                            </span>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewRating(i + 1)}
                                className="p-0.5 focus:outline-none"
                              >
                                <Star
                                  size={16}
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
                              placeholder={language === 'ar' ? 'اكتب تعليقك هنا...' : 'Describe your experience with this product...'}
                              className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            {reviewSubmitting ? (
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              language === 'ar' ? 'إرسال المراجعة' : 'Submit Review'
                            )}
                          </button>
                        </form>
                      ) : (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50 p-2 rounded-lg text-center font-semibold">
                          {language === 'ar' ? '* يرجى تسجيل الدخول لتتمكن من كتابة تقييم ومراجعة للمنتج.' : '* Please login to write a rating and product review.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Footer block */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                {(() => {
                  const isStockLimited = selectedProduct.stock !== undefined && selectedProduct.stock !== null && (selectedProduct.stock as any) !== '';
                  const stockNum = isStockLimited ? Number(selectedProduct.stock) : 999;
                  if (stockNum >= 10) return null;
                  return (
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>Stock Status:</span>
                      <span>
                        {stockNum === 0 ? (
                          <span className="text-rose-600 font-bold">{t('outOfStock')}</span>
                        ) : (
                          <span className="text-amber-600 font-bold">{language === 'ar' ? `متبقي ${stockNum} فقط!` : `Only ${stockNum} left!`}</span>
                        )}
                      </span>
                    </div>
                  );
                })()}

                <button
                  id={`quick-view-add-cart-btn-${selectedProduct.id}`}
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stock !== undefined && selectedProduct.stock !== null && (selectedProduct.stock as any) !== '' && Number(selectedProduct.stock) === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Lightbox Zoom */}
      {selectedProduct && isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
          >
            <X size={24} />
          </button>
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl bg-white p-6">
            <img 
              referrerPolicy="no-referrer"
              src={activeImage || selectedProduct.imageUrl} 
              alt="Zoomed Product" 
              className="max-w-full max-h-[75vh] object-contain scale-110 hover:scale-125 transition-transform duration-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};
