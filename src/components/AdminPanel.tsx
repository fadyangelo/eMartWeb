import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category, Order, User, OrderStatus } from '../types';
import { 
  Plus, Edit2, Trash2, Shield, UserCheck, Calendar, DollarSign, 
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, CheckSquare, 
  X, RefreshCw, Eye, ArrowRight, User as UserIcon, Lock
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { language, adminSubTab, setAdminSubTab, t, apiFetch, user } = useApp();

  // Core Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [filterOption, setFilterOption] = useState(''); // e.g., categoryId for products, status for orders, role for users
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals & Form States
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'product' | 'category' | 'user' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail Drawer States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // ----------------------------------------------------
  // INDIVIDUAL FORM STATES
  // ----------------------------------------------------
  // Product Form
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescAr, setProdDescAr] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodTopSelling, setProdTopSelling] = useState(false);

  // Category Form
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // User Form (Staff Add/Edit)
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'manager'>('manager');
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);

  // Toast / Error
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load Categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiFetch('/api/categories');
        setCategories(res);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  // Fetch data depending on active administrative tab
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '8',
      });

      if (adminSubTab === 'products') {
        if (filterOption) query.set('categoryId', filterOption);
        const res = await apiFetch(`/api/products?${query.toString()}`);
        setProducts(res.products);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.currentPage);
      } 
      else if (adminSubTab === 'categories') {
        const res = await apiFetch('/api/categories');
        setCategories(res);
        setTotalPages(1);
      } 
      else if (adminSubTab === 'orders') {
        if (filterOption) query.set('status', filterOption);
        const res = await apiFetch(`/api/orders?${query.toString()}`);
        setOrders(res.orders);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.currentPage);
      } 
      else if (adminSubTab === 'admin-users') {
        query.set('role', 'manager'); // Default filters
        const res = await apiFetch(`/api/admin/users?${query.toString()}`);
        setUsers(res.users);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.currentPage);
      } 
      else if (adminSubTab === 'customers') {
        const queryCust = new URLSearchParams({
          search,
          role: 'customer',
          page: page.toString(),
          limit: '8',
        });
        const res = await apiFetch(`/api/admin/users?${queryCust.toString()}`);
        setUsers(res.users);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.currentPage);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminSubTab, search, filterOption, page]);

  // Reset filter & search on tab shift
  useEffect(() => {
    setSearch('');
    setFilterOption('');
    setPage(1);
  }, [adminSubTab]);

  const showToast = (msg: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // ----------------------------------------------------
  // SUBMISSIONS & ACTIONS
  // ----------------------------------------------------

  const openForm = (type: 'product' | 'category' | 'user', editId: string | null = null) => {
    setFormType(type);
    setEditingId(editId);
    setErrorMsg('');
    setShowFormModal(true);

    if (type === 'product') {
      if (editId) {
        const p = products.find(prod => prod.id === editId);
        if (p) {
          setProdNameEn(p.nameEn);
          setProdNameAr(p.nameAr);
          setProdDescEn(p.descriptionEn);
          setProdDescAr(p.descriptionAr);
          setProdPrice(p.price.toString());
          setProdCategory(p.categoryId);
          setProdStock(p.stock.toString());
          setProdImage(p.imageUrl);
          setProdTopSelling(!!p.topSelling);
        }
      } else {
        setProdNameEn('');
        setProdNameAr('');
        setProdDescEn('');
        setProdDescAr('');
        setProdPrice('');
        setProdCategory(categories[0]?.id || '');
        setProdStock('');
        setProdImage('');
        setProdTopSelling(false);
      }
    } 
    else if (type === 'category') {
      if (editId) {
        const c = categories.find(cat => cat.id === editId);
        if (c) {
          setCatNameEn(c.nameEn);
          setCatNameAr(c.nameAr);
          setCatSlug(c.slug);
        }
      } else {
        setCatNameEn('');
        setCatNameAr('');
        setCatSlug('');
      }
    } 
    else if (type === 'user') {
      if (editId) {
        const u = users.find(usr => usr.id === editId);
        if (u) {
          setStaffName(u.name);
          setStaffEmail(u.email);
          setStaffPassword('');
          setStaffRole(u.role as 'admin' | 'manager');
          setStaffPermissions(u.permissions || []);
        }
      } else {
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffRole('manager');
        setStaffPermissions([]);
      }
    }
  };

  const closeForm = () => {
    setShowFormModal(false);
    setFormType(null);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      if (formType === 'product') {
        const body = {
          nameEn: prodNameEn,
          nameAr: prodNameAr,
          descriptionEn: prodDescEn,
          descriptionAr: prodDescAr,
          price: prodPrice,
          categoryId: prodCategory,
          stock: prodStock,
          imageUrl: prodImage,
          topSelling: prodTopSelling,
        };

        if (editingId) {
          await apiFetch(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
          showToast('Product updated successfully!');
        } else {
          await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) });
          showToast('Product created successfully!');
        }
      } 
      else if (formType === 'category') {
        const body = { nameEn: catNameEn, nameAr: catNameAr, slug: catSlug || catNameEn };
        if (editingId) {
          await apiFetch(`/api/categories/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
          showToast('Category updated successfully!');
        } else {
          await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(body) });
          showToast('Category created successfully!');
        }
      } 
      else if (formType === 'user') {
        const body = {
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          permissions: staffPermissions,
        };

        if (editingId) {
          await apiFetch(`/api/admin/users/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
          showToast('Staff member updated successfully!');
        } else {
          await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
          showToast('Staff member created successfully!');
        }
      }

      closeForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string, type: 'products' | 'categories') => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    try {
      await apiFetch(`/api/${type}/${id}`, { method: 'DELETE' });
      showToast('Item deleted successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', false);
    }
  };

  // Change Status of Order
  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelectedOrder(updated);
      showToast('Order status updated successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change status', false);
    }
  };

  // Issue Order Refund
  const handleIssueRefund = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to issue a full refund for this order? This will restock the inventory automatically.')) return;
    try {
      const updated = await apiFetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
      });
      setSelectedOrder(updated);
      showToast('Refund processed successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Refund failed', false);
    }
  };

  // View Customer's Orders History Drawer
  const viewCustomerOrders = async (cust: User) => {
    try {
      const res = await apiFetch(`/api/admin/users/${cust.id}/orders`);
      setSelectedCustomer(res.user);
      setCustomerOrders(res.orders);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customer details', false);
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

  // Toggle checklist permission helpers
  const togglePermission = (perm: string) => {
    setStaffPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Messages */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-lg border border-emerald-500 animate-slide-down">
          {successMsg}
        </div>
      )}
      {errorMsg && !showFormModal && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-md">
          {errorMsg}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        {/* Paging & Search Row */}
        <div className="relative w-full md:max-w-xs">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <input
            id="admin-search-input"
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={`Search ${adminSubTab}...`}
            className={`w-full py-2 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden transition`}
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Sub-tab dependent filter drop downs */}
          {adminSubTab === 'products' && (
            <select
              id="admin-prod-cat-filter"
              value={filterOption}
              onChange={e => { setFilterOption(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          )}

          {adminSubTab === 'orders' && (
            <select
              id="admin-order-status-filter"
              value={filterOption}
              onChange={e => { setFilterOption(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          {/* Add New Trigger buttons */}
          {adminSubTab === 'products' && (
            <button
              id="add-product-btn"
              onClick={() => openForm('product')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus size={14} />
              Add Product
            </button>
          )}
          {adminSubTab === 'categories' && (
            <button
              id="add-category-btn"
              onClick={() => openForm('category')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus size={14} />
              Add Category
            </button>
          )}
          {adminSubTab === 'admin-users' && (
            <button
              id="add-staff-btn"
              onClick={() => openForm('user')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus size={14} />
              Add Staff User
            </button>
          )}
        </div>
      </div>

      {/* Main Admin Data Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm font-medium">{t('loading')}</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
          
          {/* PRODUCTS LIST */}
          {adminSubTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">Image</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Price</th>
                    <th className="py-3.5 px-5">Inventory</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5">
                        <img referrerPolicy="no-referrer" src={p.imageUrl} alt={p.nameEn} className="w-10 h-10 rounded-lg object-cover border" />
                      </td>
                      <td className="py-4 px-5 font-semibold text-gray-800">
                        <div>
                          <p>{p.nameEn}</p>
                          <p className="text-[10px] text-gray-400 font-mono font-medium">#{p.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-500">
                        {categories.find(c => c.id === p.categoryId)?.nameEn || 'Unassigned'}
                      </td>
                      <td className="py-4 px-5 font-bold">${p.price.toFixed(2)}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right shrink-0">
                        <div className="flex justify-end gap-2">
                          <button
                            id={`edit-prod-${p.id}`}
                            onClick={() => openForm('product', p.id)}
                            className="p-1.5 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            id={`delete-prod-${p.id}`}
                            onClick={() => handleDelete(p.id, 'products')}
                            className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CATEGORIES LIST */}
          {adminSubTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Category Name (EN)</th>
                    <th className="py-3.5 px-5">Category Name (AR)</th>
                    <th className="py-3.5 px-5">Slug</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-gray-400">{c.id}</td>
                      <td className="py-4 px-5 font-semibold text-gray-800">{c.nameEn}</td>
                      <td className="py-4 px-5 font-semibold text-gray-800">{c.nameAr}</td>
                      <td className="py-4 px-5 font-mono text-xs text-gray-500">/{c.slug}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            id={`edit-cat-${c.id}`}
                            onClick={() => openForm('category', c.id)}
                            className="p-1.5 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            id={`delete-cat-${c.id}`}
                            onClick={() => handleDelete(c.id, 'categories')}
                            className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ORDERS LIST */}
          {adminSubTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">Order ID</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Total</th>
                    <th className="py-3.5 px-5">Method</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5 font-mono font-bold text-gray-900">#{o.id}</td>
                      <td className="py-4 px-5 font-medium text-gray-800">
                        <div>
                          <p>{o.customerName}</p>
                          <p className="text-[10px] text-gray-400">{o.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-400 font-semibold">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 font-extrabold text-gray-900">${o.totalAmount.toFixed(2)}</td>
                      <td className="py-4 px-5 text-xs font-bold text-gray-500 uppercase">{o.paymentMethod}</td>
                      <td className="py-4 px-5">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          id={`manage-order-${o.id}`}
                          onClick={() => setSelectedOrder(o)}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-1.5 px-3 rounded-lg ml-auto transition"
                        >
                          <SlidersHorizontal size={12} />
                          Manage Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ADMIN STAFF LIST */}
          {adminSubTab === 'admin-users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5">Permissions Assigned</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5 font-semibold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-full shrink-0">
                            <Shield size={16} />
                          </div>
                          <div>
                            <p>{u.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.role === 'admin' ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Full Privileges</span>
                          ) : (
                            u.permissions?.map((p, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                {p.replace('manage_', '')}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {u.id !== 'u-1' && (
                          <button
                            id={`edit-staff-btn-${u.id}`}
                            onClick={() => openForm('user', u.id)}
                            className="p-1.5 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition inline-block"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SITE USERS / CUSTOMER PROFILE AUDIT LIST */}
          {adminSubTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">Customer Detail</th>
                    <th className="py-3.5 px-5">Registered On</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5 font-semibold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 text-gray-600 rounded-full shrink-0">
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <p>{u.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-400 font-semibold">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          id={`view-cust-orders-${u.id}`}
                          onClick={() => viewCustomerOrders(u)}
                          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg ml-auto transition"
                        >
                          <Eye size={12} />
                          Audit Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/20">
              <button
                id="admin-prev-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              
              <span className="text-xs font-semibold text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                id="admin-next-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          FORM DIALOG MODAL (ADD / EDIT)
         ---------------------------------------------------- */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="admin-form-modal"
            className="w-full max-w-lg overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                <Lock size={16} className="text-emerald-500" />
                {editingId ? 'Edit' : 'Add'} {formType} Form
              </h3>
              <button 
                id="close-form-btn"
                onClick={closeForm} 
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-md">
                  {errorMsg}
                </div>
              )}

              {/* 1. PRODUCT FIELDS */}
              {formType === 'product' && (
                <div className="space-y-4 text-xs font-medium text-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block">Product Name (EN)</label>
                      <input id="prod-name-en-input" required type="text" value={prodNameEn} onChange={e => setProdNameEn(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="block">Product Name (AR)</label>
                      <input id="prod-name-ar-input" required type="text" value={prodNameAr} onChange={e => setProdNameAr(e.target.value)} className="w-full border rounded-lg p-2 text-xs text-right" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block">Description (EN)</label>
                    <textarea id="prod-desc-en-input" rows={2} value={prodDescEn} onChange={e => setProdDescEn(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block">Description (AR)</label>
                    <textarea id="prod-desc-ar-input" rows={2} value={prodDescAr} onChange={e => setProdDescAr(e.target.value)} className="w-full border rounded-lg p-2 text-xs text-right" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block">Price ($)</label>
                      <input id="prod-price-input" required type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="block">Category</label>
                      <select id="prod-cat-input" value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block">Stock Level</label>
                      <input id="prod-stock-input" required type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block">Image URL</label>
                    <input id="prod-img-input" type="text" value={prodImage} onChange={e => setProdImage(e.target.value)} placeholder="https://unsplash..." className="w-full border rounded-lg p-2 text-xs" />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold py-1">
                    <input id="prod-best-seller-input" type="checkbox" checked={prodTopSelling} onChange={e => setProdTopSelling(e.target.checked)} className="rounded-sm text-emerald-600 focus:ring-emerald-500" />
                    <span>Promote as Best Seller (Top Selling)</span>
                  </label>
                </div>
              )}

              {/* 2. CATEGORY FIELDS */}
              {formType === 'category' && (
                <div className="space-y-4 text-xs font-medium text-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block">Category Name (EN)</label>
                      <input id="cat-name-en-input" required type="text" value={catNameEn} onChange={e => setCatNameEn(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="block">Category Name (AR)</label>
                      <input id="cat-name-ar-input" required type="text" value={catNameAr} onChange={e => setCatNameAr(e.target.value)} className="w-full border rounded-lg p-2 text-xs text-right" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block">Slug Identifier</label>
                    <input id="cat-slug-input" required type="text" value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="e.g. fashion-wear" className="w-full border rounded-lg p-2 text-xs" />
                  </div>
                </div>
              )}

              {/* 3. STAFF / USER FIELDS */}
              {formType === 'user' && (
                <div className="space-y-4 text-xs font-medium text-gray-700">
                  <div className="space-y-1">
                    <label className="block">Staff Full Name</label>
                    <input id="staff-name-input" required type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block">Email Address</label>
                    <input id="staff-email-input" required type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block">{editingId ? 'New Password (Optional)' : 'Password'}</label>
                    <input id="staff-password-input" required={!editingId} type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <label className="block">Role Type</label>
                    <select id="staff-role-select" value={staffRole} onChange={e => setStaffRole(e.target.value as 'admin' | 'manager')} className="w-full border rounded-lg p-2 text-xs bg-white">
                      <option value="manager">Manager (Restricted Access)</option>
                      <option value="admin">Admin (Full Privilege Override)</option>
                    </select>
                  </div>

                  {/* Permissions checkboxes (Only shown/editable if manager) */}
                  {staffRole === 'manager' && (
                    <div className="space-y-2 pt-2 border-t">
                      <label className="block font-bold text-gray-800">Assign Manager Permissions:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'manage_products', label: 'Manage Products' },
                          { id: 'manage_categories', label: 'Manage Categories' },
                          { id: 'manage_orders', label: 'Manage Orders' },
                          { id: 'manage_refunds', label: 'Authorize Refunds' },
                        ].map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer py-1 font-medium">
                            <input
                              id={`perm-checkbox-${perm.id}`}
                              type="checkbox"
                              checked={staffPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded-sm text-emerald-600"
                            />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  id="admin-form-submit-btn"
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center"
                >
                  {actionLoading ? 'Processing...' : 'Save Changes'}
                </button>
                <button
                  id="admin-form-cancel-btn"
                  type="button"
                  onClick={closeForm}
                  className="py-2.5 px-4 border text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          ORDER STATUS & REFUND DETAIL MODAL (ADMIN CONTROL)
         ---------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="admin-order-modal"
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <span>Manage Order</span>
                  <span className="font-mono text-emerald-600">#{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-gray-400">Placed by {selectedOrder.customerName} &bull; {selectedOrder.customerEmail}</p>
              </div>
              <button
                id="close-admin-order-btn"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Change Status Controls */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Change Active Status:</label>
                  <select
                    id="admin-order-status-select"
                    value={selectedOrder.status}
                    onChange={e => handleOrderStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    disabled={selectedOrder.status === 'refunded' || selectedOrder.status === 'cancelled'}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 bg-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded" disabled>Refunded (Use button below)</option>
                  </select>
                </div>

                {/* Refund action */}
                <div className="space-y-2 sm:text-right">
                  <label className="text-xs font-bold text-gray-600 block">Financial Reciprocity:</label>
                  <button
                    id="refund-order-btn"
                    onClick={() => handleIssueRefund(selectedOrder.id)}
                    disabled={selectedOrder.status === 'refunded' || selectedOrder.status === 'cancelled'}
                    className="w-full sm:w-auto py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    Issue Stripe/Kasheir Refund
                  </button>
                </div>
              </div>

              {/* Status Changes Logs with explicit Timestamps */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Timestamps and Status History Log:</h4>
                <div className="bg-white border rounded-xl divide-y">
                  {selectedOrder.statusHistory.map((h, idx) => (
                    <div key={idx} className="p-3 text-xs flex justify-between items-center bg-gray-50/10">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(h.status)}`}>
                          {h.status}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-2">by {h.updatedBy}</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 font-semibold">
                        {new Date(h.updatedAt).toLocaleDateString()} {new Date(h.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping and items brief summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50/30 p-4 rounded-xl border border-dashed">
                  <p className="font-bold text-gray-700 mb-2">Delivery Details</p>
                  <p className="mb-1"><span className="text-gray-400">Destination:</span> {selectedOrder.shippingAddress.city}</p>
                  <p className="mb-1"><span className="text-gray-400">Address:</span> {selectedOrder.shippingAddress.street}</p>
                  <p><span className="text-gray-400">Recipient Phone:</span> {selectedOrder.shippingAddress.phone}</p>
                </div>

                <div className="bg-gray-50/30 p-4 rounded-xl border border-dashed">
                  <p className="font-bold text-gray-700 mb-2">Billing & Payment</p>
                  <p className="mb-1"><span className="text-gray-400">Total Price:</span> <span className="font-black text-emerald-600">${selectedOrder.totalAmount.toFixed(2)}</span></p>
                  <p className="mb-1"><span className="text-gray-400">Processor:</span> <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                  {selectedOrder.paymentDetails?.refundId && (
                    <p className="text-rose-600 font-bold mt-1">Refund Reference ID: {selectedOrder.paymentDetails.refundId}</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          CUSTOMER AUDIT LOGS VIEW DRAWER
         ---------------------------------------------------- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="customer-audit-modal"
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-full shrink-0">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900">Customer Profile & Order History</h3>
                  <p className="text-xs text-gray-400">{selectedCustomer.name} &bull; {selectedCustomer.email}</p>
                </div>
              </div>
              <button
                id="close-cust-audit-btn"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-gray-600">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-center">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5">Total Orders Placed</p>
                  <p className="text-xl font-black text-gray-800">{customerOrders.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5">Aggregate Spend ($)</p>
                  <p className="text-xl font-black text-emerald-600">
                    ${customerOrders.reduce((sum, o) => o.status !== 'refunded' && o.status !== 'cancelled' ? sum + o.totalAmount : sum, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-800 border-b pb-2 pt-2">Full Purchase Logs:</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {customerOrders.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">This customer has not completed any purchases.</p>
                ) : (
                  customerOrders.map(o => (
                    <div key={o.id} className="p-3 border rounded-xl flex justify-between items-center hover:bg-gray-50 transition">
                      <div className="space-y-1">
                        <p className="font-mono text-gray-900 font-bold">Order ID: #{o.id}</p>
                        <p className="text-[10px] text-gray-400">Placed: {new Date(o.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Items: {o.items.map(item => `${item.productNameEn} (x${item.quantity})`).join(', ')}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-black text-gray-800">${o.totalAmount.toFixed(2)}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
