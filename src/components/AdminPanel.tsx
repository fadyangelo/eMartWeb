import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category, Order, User, OrderStatus, ActivityLog, BackupFile, RestoreEvent } from '../types';
import { 
  Plus, Edit2, Trash2, Shield, UserCheck, Calendar, DollarSign, 
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, CheckSquare, 
  X, RefreshCw, Eye, ArrowRight, User as UserIcon, Lock,
  History, Database, Download, Upload, AlertCircle, ToggleLeft, ToggleRight,
  ChevronDown
} from 'lucide-react';

const getDeviceName = (userAgent: string): string => {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();
  
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  
  let browser = 'Unknown Browser';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge') || ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
  
  return `${browser} on ${os}`;
};

export const AdminPanel: React.FC = () => {
  const { language, adminSubTab, setAdminSubTab, t, apiFetch, user, settings, fetchSettings, token } = useApp();

  // Core Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [backupsList, setBackupsList] = useState<BackupFile[]>([]);
  const [restoresList, setRestoresList] = useState<RestoreEvent[]>([]);

  // Backup-Restore Specific States
  const [activeBackupTab, setActiveBackupTab] = useState<'backups' | 'restored'>('backups');
  const [isDraggingBackup, setIsDraggingBackup] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [processingItem, setProcessingItem] = useState<{
    filename: string;
    action: 'restore' | 'download' | 'delete' | 'upload' | null;
  }>({ filename: '', action: null });
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [backupSearch, setBackupSearch] = useState('');
  const [backupCreatorFilter, setBackupCreatorFilter] = useState('All');
  const [backupTypeFilter, setBackupTypeFilter] = useState('All');
  const [backupDateFrom, setBackupDateFrom] = useState('');
  const [backupDateTo, setBackupDateTo] = useState('');
  const [backupSortOption, setBackupSortOption] = useState('newest');
  const [backupsPage, setBackupsPage] = useState(1);
  const [restoresPage, setRestoresPage] = useState(1);
  const [totalPagesBackups, setTotalPagesBackups] = useState(1);
  const [totalPagesRestores, setTotalPagesRestores] = useState(1);
  const [totalBackupsCount, setTotalBackupsCount] = useState(0);
  const [filteredBackupsCount, setFilteredBackupsCount] = useState(0);
  const [totalRestoresCount, setTotalRestoresCount] = useState(0);
  const [filteredRestoresCount, setFilteredRestoresCount] = useState(0);
  const [uniqueBackupUsers, setUniqueBackupUsers] = useState<Array<{ email: string, name: string }>>([]);
  const [uniqueRestoreUsers, setUniqueRestoreUsers] = useState<Array<{ email: string, name: string }>>([]);
  const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
  const [newBackupDescription, setNewBackupDescription] = useState('');

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
  const [prodEnabled, setProdEnabled] = useState(true);
  const [prodDiscountPercent, setProdDiscountPercent] = useState('');
  const [prodDiscountAmount, setProdDiscountAmount] = useState('');
  const [prodAdditionalImages, setProdAdditionalImages] = useState<string[]>([]);
  const [prodDatasheetUrl, setProdDatasheetUrl] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');

  // Category Form
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');

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

  // User Form Extended States
  const [staffDisabled, setStaffDisabled] = useState(false);
  const [staffPriceMultiplier, setStaffPriceMultiplier] = useState('1.0');
  
  // Granular Access Permissions
  const [canSeeAllOrders, setCanSeeAllOrders] = useState(false);
  const [canEditOrders, setCanEditOrders] = useState(false);
  const [canEditOwnOrders, setCanEditOwnOrders] = useState(false);
  const [canEditAllOrders, setCanEditAllOrders] = useState(false);
  const [canEditOwnStatus, setCanEditOwnStatus] = useState(false);
  const [canEditAllStatus, setCanEditAllStatus] = useState(false);
  const [canDeleteOrders, setCanDeleteOrders] = useState(false);
  const [canDeleteOwnOrders, setCanDeleteOwnOrders] = useState(false);
  const [canDeleteAllOrders, setCanDeleteAllOrders] = useState(false);
  const [canSeeReviewsPage, setCanSeeReviewsPage] = useState(false);
  const [canViewFullDashboard, setCanViewFullDashboard] = useState(false);
  const [canViewPaymentTerms, setCanViewPaymentTerms] = useState(false);
  const [canAddPaymentTerms, setCanAddPaymentTerms] = useState(false);
  const [canEditPaymentTerms, setCanEditPaymentTerms] = useState(false);
  const [canDeletePaymentTerms, setCanDeletePaymentTerms] = useState(false);
  const [canViewBackups, setCanViewBackups] = useState(false);
  const [canManageBackups, setCanManageBackups] = useState(false);

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
        const queryUsers = new URLSearchParams({
          search,
          page: page.toString(),
          limit: '8',
        });
        if (filterOption) {
          queryUsers.set('role', filterOption);
        }
        const res = await apiFetch(`/api/admin/users?${queryUsers.toString()}`);
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
      else if (adminSubTab === 'activity-logs') {
        const queryLogs = new URLSearchParams({
          search,
          page: page.toString(),
          limit: '10',
        });
        if (filterOption) {
          queryLogs.set('action', filterOption);
        }
        const res = await apiFetch(`/api/admin/activity-logs?${queryLogs.toString()}`);
        setActivityLogs(res.logs || []);
        setTotalPages(res.pagination.totalPages || 1);
        setPage(res.pagination.currentPage || 1);
      }
      else if (adminSubTab === 'backup-restore') {
        // Fetch Backups
        const queryBackups = new URLSearchParams({
          search: backupSearch,
          page: backupsPage.toString(),
          limit: '5',
          createdBy: backupCreatorFilter,
          backupType: backupTypeFilter,
          dateFrom: backupDateFrom,
          dateTo: backupDateTo,
          sort: backupSortOption,
        });
        const resBackups = await apiFetch(`/api/admin/backups?${queryBackups.toString()}`);
        setBackupsList(resBackups.backups || []);
        setTotalPagesBackups(resBackups.pagination.totalPages || 1);
        setFilteredBackupsCount(resBackups.pagination.totalItems || 0);
        setUniqueBackupUsers(resBackups.uniqueUsers || []);

        // Fetch Restores
        const queryRestores = new URLSearchParams({
          search: backupSearch,
          page: restoresPage.toString(),
          limit: '5',
          createdBy: backupCreatorFilter,
          dateFrom: backupDateFrom,
          dateTo: backupDateTo,
          sort: backupSortOption,
        });
        const resRestores = await apiFetch(`/api/admin/restores?${queryRestores.toString()}`);
        setRestoresList(resRestores.restores || []);
        setTotalPagesRestores(resRestores.pagination.totalPages || 1);
        setFilteredRestoresCount(resRestores.pagination.totalItems || 0);
        setUniqueRestoreUsers(resRestores.uniqueUsers || []);

        // Fetch total counts
        const totalQueryBackups = new URLSearchParams({ limit: '1' });
        const totalResBackups = await apiFetch(`/api/admin/backups?${totalQueryBackups.toString()}`);
        setTotalBackupsCount(totalResBackups.pagination.totalItems || 0);

        const totalQueryRestores = new URLSearchParams({ limit: '1' });
        const totalResRestores = await apiFetch(`/api/admin/restores?${totalQueryRestores.toString()}`);
        setTotalRestoresCount(totalResRestores.pagination.totalItems || 0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    adminSubTab, search, filterOption, page,
    backupSearch, backupCreatorFilter, backupTypeFilter, backupDateFrom, backupDateTo, backupSortOption, backupsPage, restoresPage
  ]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'category') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64data = reader.result as string;
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64data, name: file.name }),
        });
        if (res && res.url) {
          if (target === 'product') {
            setProdImage(res.url);
          } else {
            setCatImage(res.url);
          }
        }
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenericFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'pdf' | 'video' | 'additional-image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are allowed for data sheets!', false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64data = reader.result as string;
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64data, name: file.name }),
        });
        if (res && res.url) {
          if (type === 'pdf') {
            setProdDatasheetUrl(res.url);
            showToast('PDF Datasheet uploaded successfully!');
          } else if (type === 'video') {
            setProdVideoUrl(res.url);
            showToast('Video uploaded successfully!');
          } else if (type === 'additional-image') {
            setProdAdditionalImages(prev => [...prev, res.url]);
            showToast('Additional image added successfully!');
          }
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        showToast('Failed to upload file.', false);
      }
    };
    reader.readAsDataURL(file);
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
          setProdStock(p.stock !== undefined && p.stock !== null ? p.stock.toString() : '');
          setProdImage(p.imageUrl);
          setProdTopSelling(!!p.topSelling);
          setProdEnabled(p.enabled !== false);
          setProdDiscountPercent(p.discountPercent !== undefined && p.discountPercent !== null ? p.discountPercent.toString() : '');
          setProdDiscountAmount(p.discountAmount !== undefined && p.discountAmount !== null ? p.discountAmount.toString() : '');
          setProdAdditionalImages(p.images || []);
          setProdDatasheetUrl(p.datasheetUrl || '');
          setProdVideoUrl(p.videoUrl || '');
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
        setProdEnabled(true);
        setProdDiscountPercent('');
        setProdDiscountAmount('');
        setProdAdditionalImages([]);
        setProdDatasheetUrl('');
        setProdVideoUrl('');
      }
    } 
    else if (type === 'category') {
      if (editId) {
        const c = categories.find(cat => cat.id === editId);
        if (c) {
          setCatNameEn(c.nameEn);
          setCatNameAr(c.nameAr);
          setCatSlug(c.slug);
          setCatImage(c.imageUrl || '');
        }
      } else {
        setCatNameEn('');
        setCatNameAr('');
        setCatSlug('');
        setCatImage('');
      }
    } 
    else if (type === 'user') {
      if (editId) {
        const u = users.find(usr => usr.id === editId);
        if (u) {
          setStaffName(u.name);
          setStaffEmail(u.email);
          setStaffPassword(u.password || '');
          setStaffRole(u.role as any);
          setStaffPermissions(u.permissions || []);
          setStaffDisabled(u.disabled || false);
          setStaffPriceMultiplier(String(u.priceMultiplier !== undefined ? u.priceMultiplier : '1.0'));
          setCanSeeAllOrders(u.canSeeAllOrders || false);
          setCanEditOrders(u.canEditOrders || false);
          setCanEditOwnOrders(u.canEditOwnOrders || false);
          setCanEditAllOrders(u.canEditAllOrders || false);
          setCanEditOwnStatus(u.canEditOwnStatus || false);
          setCanEditAllStatus(u.canEditAllStatus || false);
          setCanDeleteOrders(u.canDeleteOrders || false);
          setCanDeleteOwnOrders(u.canDeleteOwnOrders || false);
          setCanDeleteAllOrders(u.canDeleteAllOrders || false);
          setCanSeeReviewsPage(u.canSeeReviewsPage || false);
          setCanViewFullDashboard(u.canViewFullDashboard || false);
          setCanViewPaymentTerms(u.canViewPaymentTerms || false);
          setCanAddPaymentTerms(u.canAddPaymentTerms || false);
          setCanEditPaymentTerms(u.canEditPaymentTerms || false);
          setCanDeletePaymentTerms(u.canDeletePaymentTerms || false);
          setCanViewBackups(u.canViewBackups || false);
          setCanManageBackups(u.canManageBackups || false);
        }
      } else {
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffRole('manager');
        setStaffPermissions([]);
        setStaffDisabled(false);
        setStaffPriceMultiplier('1.0');
        setCanSeeAllOrders(false);
        setCanEditOrders(false);
        setCanEditOwnOrders(false);
        setCanEditAllOrders(false);
        setCanEditOwnStatus(false);
        setCanEditAllStatus(false);
        setCanDeleteOrders(false);
        setCanDeleteOwnOrders(false);
        setCanDeleteAllOrders(false);
        setCanSeeReviewsPage(false);
        setCanViewFullDashboard(false);
        setCanViewPaymentTerms(false);
        setCanAddPaymentTerms(false);
        setCanEditPaymentTerms(false);
        setCanDeletePaymentTerms(false);
        setCanViewBackups(false);
        setCanManageBackups(false);
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
          enabled: prodEnabled,
          discountPercent: prodDiscountPercent,
          discountAmount: prodDiscountAmount,
          datasheetUrl: prodDatasheetUrl,
          videoUrl: prodVideoUrl,
          images: prodAdditionalImages,
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
        const body = { nameEn: catNameEn, nameAr: catNameAr, slug: catSlug || catNameEn, imageUrl: catImage };
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
          disabled: staffDisabled,
          priceMultiplier: Number(staffPriceMultiplier),
          canSeeAllOrders,
          canEditOrders,
          canEditOwnOrders,
          canEditAllOrders,
          canEditOwnStatus,
          canEditAllStatus,
          canDeleteOrders,
          canDeleteOwnOrders,
          canDeleteAllOrders,
          canSeeReviewsPage,
          canViewFullDashboard,
          canViewPaymentTerms,
          canAddPaymentTerms,
          canEditPaymentTerms,
          canDeletePaymentTerms,
          canViewBackups,
          canManageBackups,
        };

        if (editingId) {
          await apiFetch(`/api/admin/users/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
          showToast('User updated successfully!');
        } else {
          await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
          showToast('User created successfully!');
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

  // Custom Confirmation Modal Helper
  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await onConfirm();
        } catch (err: any) {
          console.error('Confirmation action failed:', err);
        }
      }
    });
  };

  // Delete Action
  const handleDelete = async (id: string, type: 'products' | 'categories') => {
    const itemType = type.slice(0, -1);
    const title = language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion';
    const message = language === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف هذا الـ ${itemType === 'product' ? 'منتج' : 'فئة'}؟` 
      : `Are you sure you want to delete this ${itemType}?`;

    showConfirm(title, message, async () => {
      try {
        await apiFetch(`/api/${type}/${id}`, { method: 'DELETE' });
        showToast(language === 'ar' ? 'تم حذف العنصر بنجاح!' : 'Item deleted successfully!');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete item', false);
      }
    });
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
    const title = language === 'ar' ? 'تأكيد استرداد الأموال' : 'Confirm Refund';
    const message = language === 'ar' 
      ? 'هل أنت متأكد من رغبتك في استرداد كامل المبلغ لهذا الطلب؟ سيتم إرجاع المنتجات إلى المخزون تلقائياً.' 
      : 'Are you sure you want to issue a full refund for this order? This will restock the inventory automatically.';

    showConfirm(title, message, async () => {
      try {
        const updated = await apiFetch(`/api/orders/${orderId}/refund`, {
          method: 'POST',
        });
        setSelectedOrder(updated);
        showToast(language === 'ar' ? 'تمت عملية الاسترداد بنجاح!' : 'Refund processed successfully!');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Refund failed', false);
      }
    });
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

  // Backup and Restore Actions
  const handleCreateBackup = async (description = '') => {
    try {
      setActionLoading(true);
      await apiFetch('/api/admin/backups', {
        method: 'POST',
        body: JSON.stringify({ isAutomatic: false, description }),
      });
      showToast(language === 'ar' ? 'تم إنشاء نسخة احتياطية بنجاح' : 'Backup file created successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Backup failed', false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    const title = language === 'ar' ? 'استعادة قاعدة البيانات' : 'Restore Database';
    const message = language === 'ar' 
      ? `هل أنت متأكد من استعادة النسخة الاحتياطية "${filename}"؟ سيؤدي ذلك لاستبدال قاعدة البيانات الحالية بالكامل.` 
      : `Are you sure you want to restore "${filename}"? This will completely overwrite the active database.`;

    showConfirm(title, message, async () => {
      try {
        setActionLoading(true);
        setProcessingItem({ filename, action: 'restore' });
        await apiFetch('/api/admin/backups/restore', {
          method: 'POST',
          body: JSON.stringify({ filename }),
        });
        showToast(language === 'ar' ? 'تمت استعادة البيانات بنجاح' : 'Database restored successfully!');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Restore failed', false);
      } finally {
        setActionLoading(false);
        setProcessingItem({ filename: '', action: null });
      }
    });
  };

  const handleDeleteBackup = async (filename: string) => {
    const title = language === 'ar' ? 'حذف نسخة احتياطية' : 'Delete Backup';
    const message = language === 'ar' 
      ? `هل أنت متأكد من حذف ملف النسخة الاحتياطية "${filename}"؟` 
      : `Are you sure you want to delete backup file "${filename}"?`;

    showConfirm(title, message, async () => {
      try {
        setActionLoading(true);
        setProcessingItem({ filename, action: 'delete' });
        await apiFetch(`/api/admin/backups/${filename}`, {
          method: 'DELETE',
        });
        showToast(language === 'ar' ? 'تم حذف الملف بنجاح' : 'Backup file deleted successfully!');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Delete failed', false);
      } finally {
        setActionLoading(false);
        setProcessingItem({ filename: '', action: null });
      }
    });
  };

  const handleDeleteRestore = async (id: string) => {
    const title = language === 'ar' ? 'حذف سجل الاستعادة' : 'Delete Restore Record';
    const message = language === 'ar' 
      ? 'هل أنت متأكد من حذف سجل عملية الاستعادة هذه؟' 
      : 'Are you sure you want to delete this restore history record?';

    showConfirm(title, message, async () => {
      try {
        setActionLoading(true);
        await apiFetch(`/api/admin/restores/${id}`, {
          method: 'DELETE',
        });
        showToast(language === 'ar' ? 'تم حذف سجل الاستعادة بنجاح' : 'Restore record deleted successfully!');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Delete failed', false);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      setActionLoading(true);
      setProcessingItem({ filename, action: 'download' });
      const res = await fetch(`/api/admin/backups/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      showToast(err.message || 'Download failed', false);
    } finally {
      setActionLoading(false);
      setProcessingItem({ filename: '', action: null });
    }
  };

  const handleUploadBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const title = language === 'ar' ? 'تأكيد استعادة قاعدة البيانات' : 'Confirm Database Restore';
    const confirmMessage = language === 'ar' 
      ? `هل أنت متأكد من استعادة قاعدة البيانات من ملف النسخة الاحتياطية "${file.name}"؟ سيؤدي ذلك لاستبدال قاعدة البيانات الحالية بالكامل.`
      : `Are you sure you want to restore the database from "${file.name}"? This will completely overwrite the active database.`;

    showConfirm(title, confirmMessage, async () => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setActionLoading(true);
          setProcessingItem({ filename: file.name, action: 'upload' });
          const content = reader.result as string;
          // Validate JSON syntax locally
          const parsed = JSON.parse(content);
          
          // Basic validation of keys
          if (!parsed.users || !parsed.products || !parsed.settings) {
            throw new Error(language === 'ar' ? 'بنية الملف غير صالحة. يجب أن يحتوي على الجداول الرئيسية.' : 'Invalid file structure. Missing key tables (users, products, settings).');
          }
          
          await apiFetch('/api/admin/backups/upload', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name, content, restore: true }),
          });
          showToast(language === 'ar' ? 'تم استيراد واستعادة قاعدة البيانات بنجاح' : 'Backup file uploaded and database restored successfully!');
          fetchData();
        } catch (err: any) {
          showToast(language === 'ar' ? 'ملف JSON غير صالح أو خطأ بالرفع: ' + err.message : `Invalid JSON structure or upload error: ${err.message}`, false);
        } finally {
          setActionLoading(false);
          setProcessingItem({ filename: '', action: null });
        }
      };
      reader.readAsText(file);
    });

    e.target.value = ''; // Reset input
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

          {adminSubTab === 'admin-users' && (
            <select
              id="admin-user-role-filter"
              value={filterOption}
              onChange={e => { setFilterOption(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
            >
              <option value="">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
              <option value="admin">{language === 'ar' ? 'مدير عام (Admin)' : 'Admin'}</option>
              <option value="manager">{language === 'ar' ? 'مدير (Manager)' : 'Manager'}</option>
              <option value="staff">{language === 'ar' ? 'موظف (Staff)' : 'Staff'}</option>
              <option value="customer">{language === 'ar' ? 'عميل (Customer)' : 'Customer'}</option>
            </select>
          )}

          {adminSubTab === 'activity-logs' && (
            <select
              id="admin-log-action-filter"
              value={filterOption}
              onChange={e => { setFilterOption(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
            >
              <option value="">{language === 'ar' ? 'جميع الأنشطة' : 'All Actions'}</option>
              <option value="LOGIN">{language === 'ar' ? 'تسجيل دخول (LOGIN)' : 'LOGIN'}</option>
              <option value="USER_CREATED">{language === 'ar' ? 'إنشاء مستخدم (USER_CREATED)' : 'USER_CREATED'}</option>
              <option value="USER_UPDATED">{language === 'ar' ? 'تعديل مستخدم (USER_UPDATED)' : 'USER_UPDATED'}</option>
              <option value="BACKUP_CREATED">{language === 'ar' ? 'إنشاء نسخة احتياطية' : 'BACKUP_CREATED'}</option>
              <option value="BACKUP_RESTORED">{language === 'ar' ? 'استعادة نسخة احتياطية' : 'BACKUP_RESTORED'}</option>
              <option value="BACKUP_DELETED">{language === 'ar' ? 'حذف نسخة احتياطية' : 'BACKUP_DELETED'}</option>
              <option value="BACKUP_UPLOADED">{language === 'ar' ? 'رفع نسخة احتياطية' : 'BACKUP_UPLOADED'}</option>
            </select>
          )}

          {/* Add New Trigger buttons */}
          {adminSubTab === 'products' && (
            <button
              id="add-product-btn"
              onClick={() => openForm('product')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              Add Product
            </button>
          )}
          {adminSubTab === 'categories' && (
            <button
              id="add-category-btn"
              onClick={() => openForm('category')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              Add Category
            </button>
          )}
          {adminSubTab === 'admin-users' && (
            <button
              id="add-staff-btn"
              onClick={() => openForm('user')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
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
              <table className="w-full min-w-[900px] text-left border-collapse">
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{language === 'ar' ? p.nameAr : p.nameEn}</span>
                            {p.enabled === false ? (
                              <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Disabled</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Active</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono font-medium">#{p.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-500">
                        {categories.find(c => c.id === p.categoryId)?.nameEn || 'Unassigned'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-800">{p.price.toFixed(2)} {settings?.currency || 'USD'}</div>
                        {((p.discountPercent && p.discountPercent > 0) || (p.discountAmount && p.discountAmount > 0)) && (
                          <div className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md inline-block font-semibold mt-1">
                            {p.discountPercent && p.discountPercent > 0 ? `-${p.discountPercent}%` : `-${p.discountAmount} ${settings?.currency || 'USD'}`}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {p.stock === undefined || p.stock === null || (p.stock as any) === '' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                            Unlimited / ∞
                          </span>
                        ) : Number(p.stock) === 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        ) : Number(p.stock) < 10 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 animate-pulse">
                            Low Stock: {p.stock} left
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            {p.stock} units
                          </span>
                        )}
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
              <table className="w-full min-w-[800px] text-left border-collapse">
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
              <table className="w-full min-w-[1000px] text-left border-collapse">
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
                      <td className="py-4 px-5 font-extrabold text-gray-900">{o.totalAmount.toFixed(2)} {settings?.currency || 'USD'}</td>
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

          {/* ADMIN STAFF / USER MANAGEMENT LIST */}
          {adminSubTab === 'admin-users' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">{language === 'ar' ? 'المستخدم' : 'User Member'}</th>
                    <th className="py-3.5 px-5">{language === 'ar' ? 'الصلاحيات / التفاصيل' : 'Permissions & Overrides'}</th>
                    <th className="py-3.5 px-5 text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-sm text-gray-700">
                      <td className="py-4 px-5 font-semibold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full shrink-0 ${u.role === 'admin' ? 'bg-red-50 text-red-700' : u.role === 'manager' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Shield size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{u.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {u.role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                            {u.password && (
                              <p className="text-[10px] text-amber-600 font-bold font-mono">
                                {language === 'ar' ? 'كلمة المرور: ' : 'Password: '}
                                <span className="bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{u.password}</span>
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 font-medium font-mono">{language === 'ar' ? 'انضم في: ' : 'Joined: '}{new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.role === 'admin' ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Full Admin Override</span>
                          ) : (
                            <>
                              {u.permissions?.map((p, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                  {p.replace('manage_', '')}
                                </span>
                              ))}
                              {u.canSeeAllOrders && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">See Orders</span>}
                              {u.canEditOrders && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">Edit Orders</span>}
                              {u.canDeleteOrders && <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">Delete Orders</span>}
                              {u.canManageBackups && <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">Manage Backups</span>}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {u.id !== 'u-1' && (
                            <button
                              id={`toggle-disable-btn-${u.id}`}
                              onClick={async () => {
                                if (!window.confirm(u.disabled ? 'Enable this user?' : 'Disable this user? This will block their active session immediately.')) return;
                                try {
                                  setActionLoading(true);
                                  await apiFetch(`/api/admin/users/${u.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ disabled: !u.disabled }),
                                  });
                                  showToast(u.disabled ? 'Account enabled successfully' : 'Account disabled successfully');
                                  fetchData();
                                } catch (err: any) {
                                  showToast(err.message || 'Operation failed', false);
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full border transition cursor-pointer ${
                                u.disabled 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {u.disabled ? (language === 'ar' ? 'موقف (تفعيل)' : 'Disabled') : (language === 'ar' ? 'نشط (تعطيل)' : 'Enabled')}
                            </button>
                          )}
                          
                          {/* Audit Orders button for all users */}
                          <button
                            id={`audit-user-orders-${u.id}`}
                            onClick={() => viewCustomerOrders(u)}
                            className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition inline-block cursor-pointer"
                            title={language === 'ar' ? 'معاينة الطلبات' : 'Audit Orders'}
                          >
                            <Eye size={14} />
                          </button>

                          {u.id !== 'u-1' && (
                            <button
                              id={`edit-staff-btn-${u.id}`}
                              onClick={() => openForm('user', u.id)}
                              className="p-1.5 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition inline-block cursor-pointer"
                              title={language === 'ar' ? 'تعديل' : 'Edit Details'}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
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
              <table className="w-full min-w-[700px] text-left border-collapse">
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`toggle-disable-cust-${u.id}`}
                            onClick={async () => {
                              if (!window.confirm(u.disabled ? 'Enable this customer?' : 'Disable this customer? This will block their active session immediately.')) return;
                              try {
                                setActionLoading(true);
                                await apiFetch(`/api/admin/users/${u.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ disabled: !u.disabled }),
                                });
                                showToast(u.disabled ? 'Customer account enabled successfully' : 'Customer account disabled successfully');
                                fetchData();
                              } catch (err: any) {
                                showToast(err.message || 'Operation failed', false);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border transition cursor-pointer ${
                              u.disabled 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.disabled ? (language === 'ar' ? 'موقف (تفعيل)' : 'Disabled') : (language === 'ar' ? 'نشط (تعطيل)' : 'Enabled')}
                          </button>
                          <button
                            id={`view-cust-orders-${u.id}`}
                            onClick={() => viewCustomerOrders(u)}
                            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                          >
                            <Eye size={12} />
                            {language === 'ar' ? 'معاينة الطلبات' : 'Audit Orders'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ACTIVITY LOGS LIST */}
          {adminSubTab === 'activity-logs' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-5">{language === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                    <th className="py-3.5 px-5">{language === 'ar' ? 'النشاط' : 'Action'}</th>
                    <th className="py-3.5 px-5">{language === 'ar' ? 'بواسطة' : 'User / Operator'}</th>
                    <th className="py-3.5 px-5">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                    <th className="py-3.5 px-5">{language === 'ar' ? 'العنوان والبيانات' : 'Metadata (IP & User Agent)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 font-semibold">
                        {language === 'ar' ? 'لا توجد سجلات نشاط مطابقة' : 'No activity logs match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map(log => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/10 transition text-xs text-gray-700">
                        <td className="py-3 px-5 font-mono text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                            log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            log.action.includes('CREATED') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            log.action.includes('RESTORE') ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            log.action.includes('DELETED') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <p className="font-bold text-gray-800">{log.userEmail}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">{log.userRole}</p>
                        </td>
                        <td className="py-3 px-5 max-w-xs truncate font-medium" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-3 px-5">
                          <button
                            type="button"
                            onClick={() => setExpandedLogIds(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-md font-bold transition text-[10px] cursor-pointer"
                          >
                            <span>{expandedLogIds[log.id] ? (language === 'ar' ? 'إخفاء البيانات' : 'Hide Device') : (language === 'ar' ? 'عرض البيانات' : 'Show Device')}</span>
                            <ChevronDown size={11} className={`transition-transform duration-200 ${expandedLogIds[log.id] ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {expandedLogIds[log.id] && (
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-gray-500 space-y-1 font-medium">
                              <p><span className="font-bold text-gray-700">IP:</span> {log.ipAddress || 'N/A'}</p>
                              <p><span className="font-bold text-gray-700">{language === 'ar' ? 'الجهاز:' : 'Device:'}</span> {getDeviceName(log.userAgent || '')}</p>
                              <p className="break-all max-w-[220px]"><span className="font-bold text-gray-700">UA:</span> {log.userAgent || 'N/A'}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BACKUP & RESTORE TAB */}
          {adminSubTab === 'backup-restore' && (
            <div className="p-6 space-y-6">
              
              {/* Top info and controllers section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Panel 1: Create Backup Card */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Database size={16} className="text-indigo-600" />
                      <span>{language === 'ar' ? 'إنشاء نسخة احتياطية جديدة' : 'Generate New Backup'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                      {language === 'ar' ? 'قم بإنشاء نسخة احتياطية فورية لقاعدة البيانات وحفظها بأمان على السيرفر لتتمكن من استعادتها في أي وقت.' : 'Take an instant backup of the current state of the database. Backups are saved securely on the server and can be restored with a single click.'}
                    </p>
                  </div>
                  <div>
                    <button
                      id="create-manual-backup-btn"
                      onClick={() => {
                        setNewBackupDescription('');
                        setShowCreateBackupModal(true);
                      }}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Database size={14} />
                      {actionLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Creating...') : (language === 'ar' ? 'إنشاء نسخة احتياطية الآن' : 'Create Backup Now')}
                    </button>
                  </div>
                </div>

                {/* Panel 2: Upload Backup File Card */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingBackup(true);
                  }}
                  onDragLeave={() => {
                    setIsDraggingBackup(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingBackup(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.type === "application/json" || file.name.endsWith(".json"))) {
                      const mockEvent = {
                        target: {
                          files: [file]
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleUploadBackupFile(mockEvent);
                    } else {
                      showToast(language === 'ar' ? 'الرجاء سحب وإفلات ملف JSON صالح فقط' : 'Please drop a valid JSON backup file only', false);
                    }
                  }}
                  className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-200 ${
                    isDraggingBackup 
                      ? 'bg-emerald-100/50 border-dashed border-emerald-400 scale-[1.02] shadow-md' 
                      : 'bg-emerald-50/30 border-emerald-100'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-800 flex items-center gap-2">
                      <Upload size={16} className="text-emerald-600" />
                      <span>{language === 'ar' ? 'رفع نسخة احتياطية (ملف JSON)' : 'Upload Backup File'}</span>
                    </h3>
                    <p className="text-xs text-emerald-600/80 mt-2 font-medium leading-relaxed">
                      {language === 'ar' ? 'هل تمتلك ملف نسخة احتياطية مخزن محلياً؟ قم برفعه لاستيراد البيانات مباشرة إلى الموقع.' : 'Restore database from a previously downloaded JSON backup file. Select or drag a valid JSON backup file here to import it immediately.'}
                    </p>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer justify-center w-full sm:w-auto">
                      <Upload size={14} />
                      <span>{language === 'ar' ? 'اختر ملف JSON للرفع' : 'Choose JSON Backup File'}</span>
                      <input
                        id="upload-backup-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleUploadBackupFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* Grid Split Navigation with Counts */}
              <div className="flex border-b border-gray-100">
                <button
                  id="tab-backups-list"
                  onClick={() => {
                    setActiveBackupTab('backups');
                    setPage(1);
                  }}
                  className={`py-3 px-5 text-xs font-bold flex items-center gap-2 transition border-b-2 -mb-[2px] cursor-pointer ${
                    activeBackupTab === 'backups'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Database size={14} />
                  <span>{language === 'ar' ? 'ملفات النسخ الاحتياطية' : 'Backup Files'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-extrabold font-mono">
                    {filteredBackupsCount} / {totalBackupsCount}
                  </span>
                </button>

                <button
                  id="tab-restores-history"
                  onClick={() => {
                    setActiveBackupTab('restored');
                    setPage(1);
                  }}
                  className={`py-3 px-5 text-xs font-bold flex items-center gap-2 transition border-b-2 -mb-[2px] cursor-pointer ${
                    activeBackupTab === 'restored'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <History size={14} />
                  <span>{language === 'ar' ? 'تاريخ الاستعادة' : 'Restore History'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-extrabold font-mono">
                    {filteredRestoresCount} / {totalRestoresCount}
                  </span>
                </button>
              </div>

              {/* Filters Bar (Universal styling) */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-left">
                {/* Search Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'بحث' : 'Search'}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'اسم الملف، الوصف...' : 'Filename, description...'}
                      value={backupSearch}
                      onChange={(e) => {
                        setBackupSearch(e.target.value);
                        setBackupsPage(1);
                        setRestoresPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Creator Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'بواسطة المستخدم' : 'Created By User'}</label>
                  <select
                    value={backupCreatorFilter}
                    onChange={(e) => {
                      setBackupCreatorFilter(e.target.value);
                      setBackupsPage(1);
                      setRestoresPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="All">{language === 'ar' ? 'جميع المستخدمين' : 'All Users'}</option>
                    {Array.from(new Set([
                      ...uniqueBackupUsers.map(u => JSON.stringify(u)),
                      ...uniqueRestoreUsers.map(u => JSON.stringify(u))
                    ])).map(str => {
                      const u = JSON.parse(str);
                      return (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Backup Type Filter (Only active or sensible for Backups tab) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'نوع النسخة' : 'Backup Type'}</label>
                  <select
                    value={backupTypeFilter}
                    disabled={activeBackupTab === 'restored'}
                    onChange={(e) => {
                      setBackupTypeFilter(e.target.value);
                      setBackupsPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="All">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    <option value="MANUAL">{language === 'ar' ? 'يدوي' : 'MANUAL'}</option>
                    <option value="AUTOMATIC">{language === 'ar' ? 'تلقائي' : 'AUTOMATIC'}</option>
                  </select>
                </div>

                {/* Date From & Date To */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'من تاريخ' : 'Date From'}</label>
                  <input
                    type="date"
                    value={backupDateFrom}
                    onChange={(e) => {
                      setBackupDateFrom(e.target.value);
                      setBackupsPage(1);
                      setRestoresPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'إلى تاريخ' : 'Date To'}</label>
                  <input
                    type="date"
                    value={backupDateTo}
                    onChange={(e) => {
                      setBackupDateTo(e.target.value);
                      setBackupsPage(1);
                      setRestoresPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Sort Option */}
                <div className="sm:col-span-2 md:col-span-5 flex items-center justify-between gap-4 pt-2 border-t border-slate-200/60 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{language === 'ar' ? 'ترتيب:' : 'Sort By:'}</span>
                    <select
                      value={backupSortOption}
                      onChange={(e) => {
                        setBackupSortOption(e.target.value);
                        setBackupsPage(1);
                        setRestoresPage(1);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="newest">{language === 'ar' ? 'الأحدث أولاً' : 'Newest First'}</option>
                      <option value="oldest">{language === 'ar' ? 'الأقدم أولاً' : 'Oldest First'}</option>
                      <option value="size_desc">{language === 'ar' ? 'الحجم: من الأكبر للأصغر' : 'File Size: Large to Small'}</option>
                      <option value="size_asc">{language === 'ar' ? 'الحجم: من الأصغر للأكبر' : 'File Size: Small to Large'}</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setBackupSearch('');
                      setBackupCreatorFilter('All');
                      setBackupTypeFilter('All');
                      setBackupDateFrom('');
                      setBackupDateTo('');
                      setBackupSortOption('newest');
                      setBackupsPage(1);
                      setRestoresPage(1);
                    }}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    <X size={12} />
                    <span>{language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
                  </button>
                </div>
              </div>

              {/* Backups List Grid Tab */}
              {activeBackupTab === 'backups' && (
                <div className="space-y-3 text-left">
                  <div className="border border-gray-100 rounded-2xl overflow-x-auto bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                          <th className="py-3 px-4">{language === 'ar' ? 'اسم ملف النسخة الاحتياطية والوصف' : 'Backup File Name & Description'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'بواسطة' : 'Created By'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'الحجم' : 'File Size'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'النوع' : 'Type'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                          <th className="py-3 px-4 text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                              {language === 'ar' ? 'لا توجد نسخ احتياطية تطابق الفلاتر المحددة' : 'No backup files match the current filters.'}
                            </td>
                          </tr>
                        ) : (
                          backupsList.map(bk => (
                            <tr key={bk.filename} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-xs text-gray-700">
                              <td className="py-3.5 px-4 font-medium">
                                <span className="font-mono font-bold text-gray-900 block truncate max-w-sm" title={bk.filename}>
                                  {bk.filename}
                                </span>
                                {bk.description && (
                                  <span className="text-[11px] text-gray-500 mt-0.5 block font-medium max-w-sm">
                                    {bk.description}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">{bk.createdByName || 'System'}</span>
                                  <span className="text-[10px] text-gray-400 font-mono">{bk.createdByEmail || 'system@emart.com'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold font-mono text-gray-500">
                                {bk.size !== undefined ? (bk.size / 1024).toFixed(2) + ' KB' : 'Unknown'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${bk.isAutomatic ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                  {bk.isAutomatic ? (language === 'ar' ? 'تلقائي' : 'AUTOMATIC') : (language === 'ar' ? 'يدوي' : 'MANUAL')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-gray-400">
                                {new Date(bk.createdAt).toLocaleDateString()} {new Date(bk.createdAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    id={`restore-bk-btn-${bk.filename.replace(/\./g, '-')}`}
                                    onClick={() => handleRestoreBackup(bk.filename)}
                                    disabled={actionLoading}
                                    className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg transition text-[10px] cursor-pointer"
                                    title={language === 'ar' ? 'استعادة قاعدة البيانات' : 'Restore database state'}
                                  >
                                    {processingItem.filename === bk.filename && processingItem.action === 'restore' ? (
                                      <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    ) : (
                                      <RefreshCw size={11} className="animate-pulse" />
                                    )}
                                    <span>
                                      {processingItem.filename === bk.filename && processingItem.action === 'restore'
                                        ? (language === 'ar' ? 'جاري الاستعادة...' : 'Restoring...')
                                        : (language === 'ar' ? 'استعادة' : 'Restore')}
                                    </span>
                                  </button>
                                  
                                  <button
                                    id={`download-bk-btn-${bk.filename.replace(/\./g, '-')}`}
                                    onClick={() => handleDownloadBackup(bk.filename)}
                                    disabled={actionLoading}
                                    className="p-1.5 bg-gray-50 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px]"
                                    title={language === 'ar' ? 'تحميل' : 'Download file'}
                                  >
                                    {processingItem.filename === bk.filename && processingItem.action === 'download' ? (
                                      <RefreshCw size={13} className="animate-spin text-indigo-600" />
                                    ) : (
                                      <Download size={13} />
                                    )}
                                  </button>

                                  <button
                                    id={`delete-bk-btn-${bk.filename.replace(/\./g, '-')}`}
                                    onClick={() => handleDeleteBackup(bk.filename)}
                                    disabled={actionLoading}
                                    className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px]"
                                    title={language === 'ar' ? 'حذف' : 'Delete file'}
                                  >
                                    {processingItem.filename === bk.filename && processingItem.action === 'delete' ? (
                                      <RefreshCw size={13} className="animate-spin text-red-500" />
                                    ) : (
                                      <Trash2 size={13} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Backups Pagination */}
                  {!loading && totalPagesBackups > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <button
                        onClick={() => setBackupsPage(p => Math.max(1, p - 1))}
                        disabled={backupsPage === 1}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        {language === 'ar' ? `صفحة ${backupsPage} من ${totalPagesBackups}` : `Page ${backupsPage} of ${totalPagesBackups}`}
                      </span>
                      <button
                        onClick={() => setBackupsPage(p => Math.min(totalPagesBackups, p + 1))}
                        disabled={backupsPage === totalPagesBackups}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Restores List Grid Tab */}
              {activeBackupTab === 'restored' && (
                <div className="space-y-3 text-left">
                  <div className="border border-gray-100 rounded-2xl overflow-x-auto bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase font-semibold">
                          <th className="py-3 px-4">{language === 'ar' ? 'الحدث وتفاصيل استعادة قاعدة البيانات' : 'Database Restore Event & Details'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'بواسطة' : 'Restored By'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'الحجم الأصلي للنسخة' : 'Original Size'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'تاريخ الاستعادة والوقت' : 'Restored At'}</th>
                          <th className="py-3 px-4 text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restoresList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">
                              {language === 'ar' ? 'لا يوجد تاريخ استعادة يطابق الفلاتر المحددة' : 'No database restore events match the current filters.'}
                            </td>
                          </tr>
                        ) : (
                          restoresList.map(restore => (
                            <tr key={restore.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition text-xs text-gray-700">
                              <td className="py-3.5 px-4 font-medium">
                                <span className="font-mono font-bold text-gray-900 block truncate max-w-sm" title={restore.filename}>
                                  {restore.filename}
                                </span>
                                {restore.description && (
                                  <span className="text-[11px] text-gray-500 mt-0.5 block font-medium max-w-sm">
                                    {restore.description}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">{restore.createdByName || 'System'}</span>
                                  <span className="text-[10px] text-gray-400 font-mono">{restore.createdByEmail || 'system@emart.com'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold font-mono text-gray-500">
                                {restore.size !== undefined ? (restore.size / 1024).toFixed(2) + ' KB' : 'Unknown'}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-gray-400">
                                {new Date(restore.createdAt).toLocaleDateString()} {new Date(restore.createdAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  id={`delete-restore-btn-${restore.id}`}
                                  onClick={() => handleDeleteRestore(restore.id)}
                                  disabled={actionLoading}
                                  className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                  title={language === 'ar' ? 'حذف سجل الاستعادة' : 'Delete restore record'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Restores Pagination */}
                  {!loading && totalPagesRestores > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <button
                        onClick={() => setRestoresPage(p => Math.max(1, p - 1))}
                        disabled={restoresPage === 1}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        {language === 'ar' ? `صفحة ${restoresPage} من ${totalPagesRestores}` : `Page ${restoresPage} of ${totalPagesRestores}`}
                      </span>
                      <button
                        onClick={() => setRestoresPage(p => Math.min(totalPagesRestores, p + 1))}
                        disabled={restoresPage === totalPagesRestores}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-40 transition"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Create Backup Confirmation & Description Dialog Modal */}
              {showCreateBackupModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 text-left shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Database size={16} className="text-indigo-600" />
                        <span>{language === 'ar' ? 'تأكيد إنشاء نسخة احتياطية' : 'Create Database Backup'}</span>
                      </h3>
                      <button
                        onClick={() => setShowCreateBackupModal(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {language === 'ar' 
                          ? 'يمكنك إضافة وصف اختياري لمساعدتك في التعرف على هذه النسخة الاحتياطية لاحقاً.' 
                          : 'You can optionally add a description below to help you identify this backup file later.'}
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {language === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)'}
                        </label>
                        <textarea
                          rows={3}
                          placeholder={language === 'ar' ? 'أدخل تفاصيل النسخة الاحتياطية هنا...' : 'Enter details about what is in this backup...'}
                          value={newBackupDescription}
                          onChange={(e) => setNewBackupDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setShowCreateBackupModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          handleCreateBackup(newBackupDescription);
                          setShowCreateBackupModal(false);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Database size={13} />
                        <span>{language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Create Backup'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Table pagination */}
          {!loading && adminSubTab !== 'backup-restore' && totalPages > 1 && (
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
                      <label className="block">Price ({settings?.currency || 'USD'})</label>
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
                      <input id="prod-stock-input" type="number" placeholder="Unlimited" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-3">
                    <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Promotional Discount Options</h4>
                    <p className="text-[10px] text-gray-400">These will be automatically applied whenever a storewide promotional campaign is active.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-medium text-gray-600">Discount Percentage (%)</label>
                        <input id="prod-discount-percent-input" type="number" placeholder="e.g. 15" value={prodDiscountPercent} onChange={e => setProdDiscountPercent(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-medium text-gray-600">Discount Amount ({settings?.currency || 'USD'})</label>
                        <input id="prod-discount-amount-input" type="number" placeholder="e.g. 50" value={prodDiscountAmount} onChange={e => setProdDiscountAmount(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Product Image</label>
                    <div className="flex items-center gap-3">
                      {prodImage && (
                        <img src={prodImage} alt="Product Preview" className="w-12 h-12 object-cover rounded-xl border border-gray-100" />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'product')}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <input 
                          id="prod-img-input" 
                          type="text" 
                          value={prodImage} 
                          onChange={e => setProdImage(e.target.value)} 
                          placeholder="Or paste an image URL..." 
                          className="w-full border rounded-lg p-2 text-xs mt-1" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 py-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input id="prod-best-seller-input" type="checkbox" checked={prodTopSelling} onChange={e => setProdTopSelling(e.target.checked)} className="rounded-sm text-emerald-600 focus:ring-emerald-500" />
                      <span>Promote as Best Seller (Top Selling)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input id="prod-enabled-input" type="checkbox" checked={prodEnabled} onChange={e => setProdEnabled(e.target.checked)} className="rounded-sm text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-gray-800">Enabled (Visible in store by default)</span>
                    </label>
                  </div>

                  {/* Additional Images Section */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="block text-xs font-bold text-gray-700">Additional Images</label>
                    {prodAdditionalImages.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pb-2">
                        {prodAdditionalImages.map((imgUrl, index) => (
                          <div key={index} className="relative w-16 h-16 group/img border rounded-lg overflow-hidden">
                            <img src={imgUrl} alt={`Additional ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProdAdditionalImages(prev => prev.filter((_, idx) => idx !== index))}
                              className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition duration-150 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleGenericFileUpload(e, 'additional-image')}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <p className="text-[10px] text-gray-400">Upload multiple additional images for the product carousel</p>
                    </div>
                  </div>

                  {/* Datasheets (PDF only) */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="block text-xs font-bold text-gray-700">Product Datasheet (PDF Only)</label>
                    {prodDatasheetUrl && (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-100 text-xs">
                        <span className="font-semibold truncate flex-1">{prodDatasheetUrl}</span>
                        <button
                          type="button"
                          onClick={() => setProdDatasheetUrl('')}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleGenericFileUpload(e, 'pdf')}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <input
                        type="text"
                        value={prodDatasheetUrl}
                        onChange={(e) => setProdDatasheetUrl(e.target.value)}
                        placeholder="Or paste custom PDF url..."
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Video URL or Upload */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="block text-xs font-bold text-gray-700">Product Video Link / Upload</label>
                    {prodVideoUrl && (
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-800 p-2 rounded-xl border border-blue-100 text-xs">
                        <span className="font-semibold truncate flex-1">{prodVideoUrl}</span>
                        <button
                          type="button"
                          onClick={() => setProdVideoUrl('')}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleGenericFileUpload(e, 'video')}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <input
                        type="text"
                        value={prodVideoUrl}
                        onChange={(e) => setProdVideoUrl(e.target.value)}
                        placeholder="Or paste video Link (YouTube, Vimeo, MP4)..."
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
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
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Category Image</label>
                    <div className="flex items-center gap-3">
                      {catImage && (
                        <img src={catImage} alt="Category Preview" className="w-12 h-12 object-cover rounded-xl border border-gray-100" />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'category')}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <input 
                          id="cat-img-input" 
                          type="text" 
                          value={catImage} 
                          onChange={e => setCatImage(e.target.value)} 
                          placeholder="Or paste an image URL..." 
                          className="w-full border rounded-lg p-2 text-xs mt-1" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. STAFF / USER FIELDS */}
              {formType === 'user' && (
                <div className="space-y-4 text-xs font-medium text-gray-700 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-700">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                      <input id="staff-name-input" required type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-700">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input id="staff-email-input" required type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="w-full border rounded-lg p-2 text-xs font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-700">{editingId ? (language === 'ar' ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)') : (language === 'ar' ? 'كلمة المرور' : 'Password')}</label>
                      <input id="staff-password-input" required={!editingId} type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-700">{language === 'ar' ? 'صلاحية الدور الرئيسية' : 'Primary Role Type'}</label>
                      <select id="staff-role-select" value={staffRole} onChange={e => setStaffRole(e.target.value as any)} className="w-full border rounded-lg p-2 text-xs bg-white font-bold">
                        <option value="staff">{language === 'ar' ? 'موظف (Staff)' : 'Staff Member (Custom Rights)'}</option>
                        <option value="admin">{language === 'ar' ? 'مدير عام (Admin)' : 'Admin (Full privileges override)'}</option>
                        <option value="customer">{language === 'ar' ? 'عميل (Customer)' : 'Customer (Standard purchaser)'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex flex-col justify-center space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          id="staff-disabled-checkbox"
                          type="checkbox"
                          checked={staffDisabled}
                          onChange={e => setStaffDisabled(e.target.checked)}
                          className="rounded-sm text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span>{language === 'ar' ? 'الحساب معطل (Disabled)' : 'Account Disabled'}</span>
                      </label>
                      <p className="text-[10px] text-gray-400">
                        {language === 'ar' ? 'سيؤدي تعطيل الحساب إلى إنهاء جلسته ومنعه من تسجيل الدخول فوراً.' : 'Disabling this user blocks their access and terminates their active session instantly.'}
                      </p>
                    </div>
                  </div>

                  {/* Permissions checkboxes (Only shown/editable if role is staff) */}
                  {staffRole === 'staff' && (
                    <div className="space-y-3 pt-3 border-t">
                      <label className="block font-bold text-gray-800">
                        {language === 'ar' ? 'تخصيص حقوق الوصول الدقيقة للموظف:' : 'Configure Granular Access Rights:'}
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl">
                        
                        <div className="space-y-2">
                          <p className="font-extrabold text-indigo-900 text-[10px] uppercase tracking-wider">{language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}</p>
                          
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-see-all-orders"
                              type="checkbox"
                              checked={canSeeAllOrders}
                              onChange={e => setCanSeeAllOrders(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'رؤية جميع الطلبات' : 'View all orders'}</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-edit-orders"
                              type="checkbox"
                              checked={canEditOrders}
                              onChange={e => setCanEditOrders(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'تعديل الطلبات' : 'Edit orders'}</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-delete-orders"
                              type="checkbox"
                              checked={canDeleteOrders}
                              onChange={e => setCanDeleteOrders(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'حذف الطلبات' : 'Delete orders'}</span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <p className="font-extrabold text-indigo-900 text-[10px] uppercase tracking-wider">{language === 'ar' ? 'التحكم بالنسخ الاحتياطي والنظام' : 'System & Backups'}</p>
                          
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-view-backups"
                              type="checkbox"
                              checked={canViewBackups}
                              onChange={e => setCanViewBackups(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'رؤية النسخ الاحتياطية' : 'View server backups'}</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-manage-backups"
                              type="checkbox"
                              checked={canManageBackups}
                              onChange={e => setCanManageBackups(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'إدارة وإنشاء واستعادة النسخ' : 'Manage & restore backups'}</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700">
                            <input
                              id="perm-view-dashboard"
                              type="checkbox"
                              checked={canViewFullDashboard}
                              onChange={e => setCanViewFullDashboard(e.target.checked)}
                              className="rounded-sm text-indigo-600"
                            />
                            <span>{language === 'ar' ? 'عرض لوحة المعلومات والإحصائيات كاملة' : 'Access full metric dashboard'}</span>
                          </label>
                        </div>

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
                <div className="bg-gray-50/30 p-4 rounded-xl border border-dashed space-y-1">
                  <p className="font-bold text-gray-700 mb-2">Delivery Details</p>
                  <p className="mb-1"><span className="text-gray-400">Destination:</span> {selectedOrder.shippingAddress.city}</p>
                  <p className="mb-1"><span className="text-gray-400">Address:</span> {selectedOrder.shippingAddress.street}</p>
                  {selectedOrder.shippingAddress.nearestLandmark && (
                    <p className="mb-1"><span className="text-gray-400">Nearest Landmark:</span> {selectedOrder.shippingAddress.nearestLandmark}</p>
                  )}
                  {selectedOrder.shippingAddress.buildingFloor && (
                    <p className="mb-1"><span className="text-gray-400">Floor/Apt:</span> {selectedOrder.shippingAddress.buildingFloor}</p>
                  )}
                  {selectedOrder.shippingAddress.preferredDeliveryTime && (
                    <p className="mb-1"><span className="text-gray-400">Preferred Time:</span> {selectedOrder.shippingAddress.preferredDeliveryTime}</p>
                  )}
                  <p><span className="text-gray-400">Recipient Phone:</span> {selectedOrder.shippingAddress.phone}</p>
                </div>

                <div className="bg-gray-50/30 p-4 rounded-xl border border-dashed space-y-1">
                  <p className="font-bold text-gray-700 mb-2">Billing & Payment</p>
                  {(() => {
                    const orderItemsSubtotal = selectedOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                    const curr = settings?.currency || 'USD';
                    return (
                      <div className="space-y-1 font-medium text-gray-600 text-[11px] mb-2 border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span>Items Subtotal:</span>
                          <span className="font-mono">{orderItemsSubtotal.toFixed(2)} {curr}</span>
                        </div>
                        {selectedOrder.shippingFee !== undefined && selectedOrder.shippingFee > 0 && (
                          <div className="flex justify-between">
                            <span>Default Shipping:</span>
                            <span className="font-mono">+{selectedOrder.shippingFee.toFixed(2)} {curr}</span>
                          </div>
                        )}
                        {selectedOrder.shippingDiscount !== undefined && selectedOrder.shippingDiscount > 0 && (
                          <div className="flex justify-between text-rose-600 font-bold">
                            <span>Shipping Discount:</span>
                            <span className="font-mono">-{selectedOrder.shippingDiscount.toFixed(2)} {curr}</span>
                          </div>
                        )}
                        {selectedOrder.codCharge !== undefined && selectedOrder.codCharge > 0 && (
                          <div className="flex justify-between">
                            <span>COD Extra Charge:</span>
                            <span className="font-mono">+{selectedOrder.codCharge.toFixed(2)} {curr}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <p className="mb-1"><span className="text-gray-400">Total Charged:</span> <span className="font-black text-emerald-600 font-mono text-sm">{selectedOrder.totalAmount.toFixed(2)} {settings?.currency || 'USD'}</span></p>
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
                  <p className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5">Aggregate Spend ({settings?.currency || 'USD'})</p>
                  <p className="text-xl font-black text-emerald-600">
                    {customerOrders.reduce((sum, o) => o.status !== 'refunded' && o.status !== 'cancelled' ? sum + o.totalAmount : sum, 0).toFixed(2)} {settings?.currency || 'USD'}
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
                        <p className="font-black text-gray-800">{o.totalAmount.toFixed(2)} {settings?.currency || 'USD'}</p>
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

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl mt-0.5">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">{confirmModal.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">{confirmModal.message}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-extrabold rounded-xl transition text-xs cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition text-xs shadow-md shadow-amber-600/10 cursor-pointer animate-pulse"
                >
                  {language === 'ar' ? 'تأكيد' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
