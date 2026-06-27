import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardStats } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, Award, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t, apiFetch, settings } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/admin/stats');
        setStats(res);
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-500 text-sm font-medium">{t('loading')}</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('kpiRevenue')}</span>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stats.totalRevenue.toLocaleString()} {settings?.currency || 'USD'}</h3>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('kpiOrders')}</span>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stats.totalOrders}</h3>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Package size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('kpiProducts')}</span>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stats.totalProductsCount}</h3>
          </div>
        </div>

        {/* Total Shoppers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('kpiCustomers')}</span>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stats.totalUsersCount}</h3>
          </div>
        </div>
      </div>

      {/* Graphs & Detailed Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenues Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={18} />
              {t('salesOverTime')}
            </h4>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  formatter={(value: any) => [`${value} ${settings?.currency || 'USD'}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Orders Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-indigo-500" size={18} />
            Orders Distribution
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                  formatter={(value: any) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Selling Products List */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Award className="text-amber-500" size={18} />
          {t('topProductsTitle')}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Items Sold</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((p, idx) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-4 px-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{p.nameEn}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-bold text-gray-600">{p.sales}</td>
                  <td className="py-4 px-4 text-right text-sm font-black text-emerald-600">{p.revenue.toLocaleString()} {settings?.currency || 'USD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
