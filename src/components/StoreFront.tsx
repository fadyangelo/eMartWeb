import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../types';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Eye, ShoppingCart, Check } from 'lucide-react';

export const StoreFront: React.FC = () => {
  const { language, t, addToCart, apiFetch } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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
        <div className="relative w-full md:max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            className={`w-full py-2.5 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition`}
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div
              id={`prod-card-${p.id}`}
              key={p.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-100 transition-all duration-300 flex flex-col h-[400px]"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gray-50 overflow-hidden shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={p.imageUrl}
                  alt={language === 'ar' ? p.nameAr : p.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {t('onlyLeft').replace('{num}', p.stock.toString())}
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {t('outOfStock')}
                    </span>
                  )}
                  {p.topSelling && (
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto">
                      Best Seller
                    </span>
                  )}
                </div>

                {/* Quick View Button overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                  <button
                    id={`quick-view-btn-${p.id}`}
                    onClick={() => setSelectedProduct(p)}
                    className="p-3 bg-white rounded-full text-gray-800 shadow-md hover:bg-emerald-500 hover:text-white transition transform translate-y-4 group-hover:translate-y-0"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    {categories.find(c => c.id === p.categoryId)
                      ? (language === 'ar' ? categories.find(c => c.id === p.categoryId)?.nameAr : categories.find(c => c.id === p.categoryId)?.nameEn)
                      : ''}
                  </span>
                  <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition">
                    {language === 'ar' ? p.nameAr : p.nameEn}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {language === 'ar' ? p.descriptionAr : p.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-lg font-bold text-gray-900">${p.price.toFixed(2)}</span>
                  
                  <button
                    id={`add-cart-btn-${p.id}`}
                    onClick={() => handleAddToCart(p)}
                    disabled={p.stock === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      p.stock === 0
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

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="quick-view-modal"
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button
              id="close-quick-view-btn"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 text-gray-500 hover:text-gray-800 shadow-md border"
            >
              <ChevronLeft size={18} className="rotate-180" />
            </button>

            {/* Left Image Column */}
            <div className="md:w-1/2 h-64 md:h-auto bg-gray-50">
              <img
                referrerPolicy="no-referrer"
                src={selectedProduct.imageUrl}
                alt={language === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Info Column */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  {categories.find(c => c.id === selectedProduct.categoryId)
                    ? (language === 'ar' ? categories.find(c => c.id === selectedProduct.categoryId)?.nameAr : categories.find(c => c.id === selectedProduct.categoryId)?.nameEn)
                    : ''}
                </span>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {language === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}
                </h3>
                <p className="text-2xl font-black text-emerald-600">${selectedProduct.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ar' ? selectedProduct.descriptionAr : selectedProduct.descriptionEn}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>Stock Status:</span>
                  <span>
                    {selectedProduct.stock > 0 ? (
                      <span className="text-emerald-600">{selectedProduct.stock} units available</span>
                    ) : (
                      <span className="text-red-500">{t('outOfStock')}</span>
                    )}
                  </span>
                </div>

                <button
                  id={`quick-view-add-cart-btn-${selectedProduct.id}`}
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stock === 0}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
