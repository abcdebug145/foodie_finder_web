import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { toast } from '../components/Toast.jsx';
import { formatCategory } from '../utils/category.js';
import UserAvatar from '../components/UserAvatar.jsx';

const CATEGORIES = [
  { value: 'nha-hang', label: 'Nhà hàng' },
  { value: 'quan-nhau', label: 'Quán nhậu' },
  { value: 'quan-an', label: 'Quán ăn' },
  { value: 'cafe', label: 'Cafe' }
];

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { updateRestaurant, deleteRestaurant } = useRestaurants();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'reports' | 'users' | 'restaurants' | 'restaurants_all' | 'ai_announcements'
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [mergeTargets, setMergeTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('all'); // 'all' | 'pending' | 'resolved' | 'dismissed'
  
  // Stats & RAG states
  const [stats, setStats] = useState({
    total_users: 0,
    total_restaurants: 0,
    unverified_restaurants: 0,
    total_reviews: 0,
    total_reports: 0,
    pending_reports: 0,
    category_counts: {},
    reviews_by_rating: {}
  });
  // Vouchers states
  const [vouchers, setVouchers] = useState([]);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 0,
    points_required: 0,
    total_quantity: -1,
    restaurant_id: '',
    is_active: true,
  });
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  
  // Edit Restaurant modal states
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: CATEGORIES[0].value,
    address: '',
    phone: '',
    hours: '',
    img_url: '',
    specialties: '',
    tags: '',
    menu: '',
    city: 'Hà Nội'
  });

  const token = localStorage.getItem('ff_token');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/v1/vouchers/?all=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...voucherForm };
      if (!payload.restaurant_id || payload.restaurant_id.trim() === '') {
        payload.restaurant_id = null;
      }

      let res;
      if (editingVoucher) {
        res = await fetch(`/api/v1/vouchers/${editingVoucher.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/v1/vouchers/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        toast(`Đã ${editingVoucher ? 'cập nhật' : 'tạo'} voucher thành công!`, 'success');
        setShowVoucherModal(false);
        setEditingVoucher(null);
        fetchVouchers();
      } else {
        const err = await res.json();
        toast(err.detail || 'Thao tác thất bại.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      try {
        const res = await fetch(`/api/v1/vouchers/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          toast('Đã xóa voucher thành công!', 'success');
          fetchVouchers();
        } else {
          toast('Xóa thất bại.', 'error');
        }
      } catch (e) {
        toast('Lỗi kết nối máy chủ.', 'error');
      }
    }
  };

  const openVoucherModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setVoucherForm({
        code: voucher.code,
        title: voucher.title,
        description: voucher.description || '',
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        points_required: voucher.points_required,
        total_quantity: voucher.total_quantity,
        restaurant_id: voucher.restaurant_id || '',
        is_active: voucher.is_active,
      });
    } else {
      setEditingVoucher(null);
      setVoucherForm({
        code: '',
        title: '',
        description: '',
        discount_type: 'percent',
        discount_value: 0,
        points_required: 0,
        total_quantity: -1,
        restaurant_id: '',
        is_active: true,
      });
    }
    setShowVoucherModal(true);
  };

  const fetchAllRestaurants = async (q = '') => {
    try {
      const url = q ? `/api/v1/restaurants/?q=${encodeURIComponent(q)}&limit=100` : '/api/v1/restaurants/?limit=100';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAllRestaurants(data);
      } else {
        toast('Không thể tải danh sách nhà hàng.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleRestaurantSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllRestaurants(restaurantSearchQuery);
  };

  const openEditModal = (rest) => {
    setEditingRestaurant(rest);
    setEditForm({
      name: rest.name || '',
      category: rest.category || CATEGORIES[0].value,
      address: rest.address || '',
      phone: rest.phone || '',
      hours: rest.hours || '08:00 - 22:00',
      img_url: rest.img_url || '',
      specialties: rest.serves_dishes ? rest.serves_dishes.replace(/;/g, ', ') : '',
      tags: rest.cuisine_tags ? rest.cuisine_tags.replace(/;/g, ', ') : '',
      menu: rest.menu || '',
      city: rest.city || 'Hà Nội'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const res = await updateRestaurant(editingRestaurant.id, editForm);
    if (res.ok) {
      toast('Đã cập nhật thông tin nhà hàng thành công!', 'success');
      setEditingRestaurant(null);
      fetchAllRestaurants(restaurantSearchQuery);
    } else {
      toast(res.error || 'Cập nhật thất bại.', 'error');
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà hàng này khỏi hệ thống? Toàn bộ review đi kèm cũng sẽ bị xóa.')) {
      const res = await deleteRestaurant(id);
      if (res.ok) {
        toast('Đã xóa nhà hàng thành công!', 'success');
        fetchAllRestaurants(restaurantSearchQuery);
      } else {
        toast(res.error || 'Xóa thất bại.', 'error');
      }
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        toast('Không thể tải danh sách báo cáo.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const fetchUsers = async (query = '') => {
    try {
      const url = query ? `/api/v1/users/?q=${encodeURIComponent(query)}` : '/api/v1/users/';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast('Không thể tải danh sách người dùng.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const fetchPendingRestaurants = async () => {
    try {
      const res = await fetch('/api/v1/restaurants/?verified=false&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRestaurants(data);
      } else {
        toast('Không thể tải danh sách nhà hàng chờ duyệt.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleVerifyRestaurant = async (restaurantId) => {
    try {
      const res = await fetch(`/api/v1/restaurants/${restaurantId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast('Đã xác minh nhà hàng thành công!', 'success');
        fetchPendingRestaurants();
      } else {
        const err = await res.json();
        toast(err.detail || 'Xác minh nhà hàng thất bại.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleMergeRestaurant = async (sourceId) => {
    const targetId = mergeTargets[sourceId];
    if (!targetId || !targetId.trim()) {
      toast('Vui lòng nhập ID nhà hàng đích để gộp!', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/v1/restaurants/merge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source_id: sourceId,
          target_id: targetId.trim()
        })
      });
      if (res.ok) {
        toast('Đã gộp nhà hàng thành công!', 'success');
        setMergeTargets(prev => {
          const next = { ...prev };
          delete next[sourceId];
          return next;
        });
        fetchPendingRestaurants();
      } else {
        const err = await res.json();
        toast(err.detail || 'Gộp nhà hàng thất bại.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'stats') {
        await fetchStats();
      } else if (activeTab === 'reports') {
        await fetchReports();
      } else if (activeTab === 'users') {
        await fetchUsers(searchQuery);
      } else if (activeTab === 'restaurants') {
        await fetchPendingRestaurants();
      } else if (activeTab === 'restaurants_all') {
        await fetchAllRestaurants(restaurantSearchQuery);
      } else if (activeTab === 'vouchers') {
        await fetchVouchers();
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab]);



  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await fetch(`/api/v1/reports/${reportId}?action=${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast('Đã cập nhật trạng thái báo cáo.', 'success');
        fetchReports();
      } else {
        const err = await res.json();
        toast(err.detail || 'Xử lý báo cáo thất bại.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      const res = await fetch(`/api/v1/users/${userId}/status?is_active=${nextStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast(nextStatus ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!', 'success');
        fetchUsers(searchQuery);
      } else {
        const err = await res.json();
        toast(err.detail || 'Không thể cập nhật trạng thái tài khoản.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleUserAdminToggle = async (userId, currentAdminStatus) => {
    try {
      const nextAdminStatus = !currentAdminStatus;
      const res = await fetch(`/api/v1/users/${userId}/admin-toggle?is_admin=${nextAdminStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast(nextAdminStatus ? 'Đã cấp quyền Quản trị viên!' : 'Đã thu hồi quyền Quản trị viên!', 'success');
        fetchUsers(searchQuery);
      } else {
        const err = await res.json();
        toast(err.detail || 'Không thể cập nhật quyền quản trị.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="container section" style={{ minHeight: '80vh', paddingTop: '40px' }}>
      {/* Page Title */}
      <div className="section__head" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="section__title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', color: 'var(--primary)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Hệ thống quản trị
          </h1>
          <p className="section__subtitle">Điều hành dữ liệu ẩm thực, kiểm duyệt nội dung và tối ưu hóa hệ thống AI.</p>
        </div>

        {/* Tab Controls */}
        <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button 
            className={`chip ${activeTab === 'stats' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('stats')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Thống kê
          </button>
          <button 
            className={`chip ${activeTab === 'reports' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Báo cáo ({reports.filter(r => r.status === 'pending').length} chờ)
          </button>
          <button 
            className={`chip ${activeTab === 'users' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Người dùng
          </button>
          <button 
            className={`chip ${activeTab === 'restaurants' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Chờ duyệt ({pendingRestaurants.length} quán)
          </button>
          <button 
            className={`chip ${activeTab === 'restaurants_all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('restaurants_all')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3ZM21 15v7"/></svg>
            Quán ăn (CRUD)
          </button>
          <button 
            className={`chip ${activeTab === 'vouchers' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Vouchers
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '100px 0', color: 'var(--text-dark)' }}>
          <svg className="animate-spin" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.15)" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="panel glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
          
          {/* ================= STATS TAB ================= */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="panel__title" style={{ marginBottom: '24px', fontSize: '18px' }}>Tổng quan hệ thống</h3>
              
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Thành viên</span>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-dark)' }}>{stats.total_users}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tài khoản đã đăng ký</span>
                </div>

                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tổng quán ăn</span>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary-dark)' }}>{stats.total_restaurants}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Trong đó có <strong style={{ color: 'var(--danger)' }}>{stats.unverified_restaurants}</strong> quán chờ duyệt
                  </span>
                </div>

                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lượt đánh giá</span>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: '#3e6d23' }}>{stats.total_reviews}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Số review từ cộng đồng</span>
                </div>

                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Báo cáo nội dung</span>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--danger)' }}>{stats.total_reports}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Có <strong style={{ color: 'var(--danger)' }}>{stats.pending_reports}</strong> báo cáo chờ xử lý
                  </span>
                </div>
              </div>

              {/* Data Distributions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Category counts */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', background: 'var(--bg-light)' }}>
                  <h4 style={{ margin: '0 0 16px', fontWeight: '900', textTransform: 'uppercase', fontSize: '14px' }}>Cơ cấu ẩm thực</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(stats.category_counts).map(([cat, count]) => {
                      const percent = Math.round((count / (stats.total_restaurants || 1)) * 100);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
                            <span>{formatCategory(cat)}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} quán ({percent}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(42,29,25,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)', borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rating counts */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', background: 'var(--bg-light)' }}>
                  <h4 style={{ margin: '0 0 16px', fontWeight: '900', textTransform: 'uppercase', fontSize: '14px' }}>Phân bố sao đánh giá</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = stats.reviews_by_rating[String(stars)] || 0;
                      const percent = Math.round((count / (stats.total_reviews || 1)) * 100);
                      return (
                        <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', width: '30px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {stars}★
                          </span>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(42,29,25,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percent}%`, background: '#eab308', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '12px', width: '90px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {count} ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= REPORTS TAB ================= */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 className="panel__title" style={{ margin: 0, fontSize: '18px' }}>Moderation Logs</h3>
                <div className="filters" style={{ margin: 0 }}>
                  <select 
                    className="select" 
                    value={reportFilter} 
                    onChange={e => setReportFilter(e.target.value)}
                  >
                    <option value="all">Tất cả báo cáo</option>
                    <option value="pending">Chờ giải quyết (Pending)</option>
                    <option value="resolved">Đã duyệt (Resolved)</option>
                    <option value="dismissed">Đã bỏ qua (Dismissed)</option>
                  </select>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', margin: '0 auto 14px', display: 'block', color: 'var(--text-muted)' }}>
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                  <strong>Hộp thư báo cáo trống!</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '14px' }}>Không có báo cáo nào khớp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-dark)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Loại</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Nội dung bị tố cáo</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Người báo</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Lý do & Mô tả</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Thời gian</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Trạng thái</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                              background: r.target_type === 'review' ? 'rgba(232,153,81,0.15)' : 'rgba(165,207,131,0.2)',
                              color: r.target_type === 'review' ? 'var(--primary-dark)' : '#3e6d23'
                            }}>
                              {r.target_type === 'review' ? 'Review' : 'Quán ăn'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', maxWidth: '240px', minWidth: '150px' }}>
                            {r.target_type === 'review' ? (
                              r.review ? (
                                <div style={{ fontSize: '13.5px' }}>
                                  <strong style={{ display: 'block', color: 'var(--text-dark)' }}>Bài viết của {r.review.userName}:</strong>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.review.content}
                                  </span>
                                  <a 
                                    href={`/restaurants/${r.review.restaurantId}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn--ghost"
                                    style={{ marginTop: '8px', display: 'inline-block', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border)', textDecoration: 'none' }}
                                  >
                                    Xem Review
                                  </a>
                                </div>
                              ) : (
                                <em style={{ color: 'var(--danger)', fontSize: '13px' }}>[Review đã bị xóa]</em>
                              )
                            ) : (
                              r.restaurant ? (
                                <div style={{ fontSize: '13.5px' }}>
                                  <strong>{r.restaurant.name}</strong>
                                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{r.restaurant.address}</span>
                                </div>
                              ) : (
                                <em style={{ color: 'var(--danger)', fontSize: '13px' }}>[Quán ăn đã bị xóa]</em>
                              )
                            )}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px' }}>
                            {r.reporter ? (
                              <div>
                                <strong>{r.reporter.full_name || 'Khách'}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{r.reporter.email}</span>
                              </div>
                            ) : 'Ẩn danh'}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px', maxWidth: '280px' }}>
                            <strong style={{ color: 'var(--text-dark)', display: 'block' }}>{r.reason}</strong>
                            {r.description && <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>{r.description}</span>}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            {formatDate(r.created_at)}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                              color: r.status === 'pending' ? 'var(--primary)' : r.status === 'resolved' ? '#059669' : '#6b7280'
                            }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: r.status === 'pending' ? 'var(--primary)' : r.status === 'resolved' ? '#059669' : '#6b7280', marginRight: '6px', verticalAlign: 'middle' }} />
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                            {r.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleReportAction(r.id, 'dismiss')}
                                  className="btn btn--ghost"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  Bỏ qua
                                </button>
                                <button
                                  onClick={() => handleReportAction(r.id, 'resolve')}
                                  className="btn btn--ghost"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleReportAction(r.id, 'resolve_delete')}
                                  className="btn btn--primary"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                                >
                                  Xóa ND vi phạm
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Xử lý bởi UID: {r.resolver_id || 'System'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= USERS TAB ================= */}
          {activeTab === 'users' && (
            <div>
              {/* User Search Bar */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--border)',
                    outline: 'none',
                    fontSize: '14.5px'
                  }}
                />
                <button type="submit" className="btn btn--primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)' }}>
                  Tìm kiếm
                </button>
              </form>

              {users.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <strong>Không tìm thấy người dùng nào.</strong>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-dark)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Tên người dùng</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Email</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Vai trò (Admin)</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Trạng thái tài khoản</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Ngày tham gia</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserAvatar
                              src={u.avatar}
                              name={u.full_name || u.email}
                              size={32}
                              style={{ border: '1px solid var(--border)' }}
                            />
                            <strong>{u.full_name || 'Chưa cập nhật'}</strong>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', color: 'var(--text-dark)' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                              background: u.is_admin ? 'rgba(232,153,81,0.2)' : 'rgba(42,29,25,0.06)',
                              color: u.is_admin ? 'var(--primary-dark)' : 'var(--text-muted)'
                            }}>
                              {u.is_admin ? 'Quản trị viên' : 'Thành viên'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle' }}>
                            <span style={{
                              fontWeight: '700',
                              color: u.is_active ? '#059669' : 'var(--danger)',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: u.is_active ? '#059669' : 'var(--danger)', marginRight: '6px' }} />
                              {u.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {formatDate(u.created_at)}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                            {u.id === currentUser?.id ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Bản thân
                              </span>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleUserAdminToggle(u.id, u.is_admin)}
                                  className="btn btn--ghost"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  {u.is_admin ? 'Hủy Admin' : 'Cấp Admin'}
                                </button>
                                <button
                                  onClick={() => handleUserStatusToggle(u.id, u.is_active)}
                                  className={`btn ${u.is_active ? 'btn--ghost' : 'btn--primary'}`}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    borderColor: u.is_active ? 'var(--danger)' : 'var(--success)',
                                    color: u.is_active ? 'var(--danger)' : 'white',
                                    background: u.is_active ? 'transparent' : 'var(--success)'
                                  }}
                                >
                                  {u.is_active ? 'Khóa' : 'Mở khóa'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= PENDING RESTAURANTS TAB ================= */}
          {activeTab === 'restaurants' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="panel__title" style={{ margin: 0, fontSize: '18px' }}>Nhà hàng do cộng đồng đề xuất</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Tổng cộng: {pendingRestaurants.length} nhà hàng đang chờ xác minh
                </span>
              </div>

              {pendingRestaurants.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <strong>Hàng chờ trống!</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '14px' }}>Tất cả nhà hàng đều đã được xác minh hoặc gộp.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-dark)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Tên nhà hàng & ID</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Địa chỉ</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Thể loại / Tags</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRestaurants.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{r.name}</strong>
                            <code style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(232,153,81,0.08)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                              ID: {r.id}
                            </code>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px', maxWidth: '240px' }}>
                            {r.address || 'Chưa cập nhật địa chỉ'}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px' }}>
                            <span style={{ display: 'block', fontWeight: '700', color: 'var(--text-dark)' }}>
                              {formatCategory(r.category)}
                            </span>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {r.cuisine_tags ? r.cuisine_tags.replace(/;/g, ' • ') : 'Không có tags'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleVerifyRestaurant(r.id)}
                                className="btn btn--primary"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}
                              >
                                Xác minh
                              </button>

                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Nhập ID đích..."
                                  value={mergeTargets[r.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setMergeTargets(prev => ({ ...prev, [r.id]: val }));
                                  }}
                                  style={{
                                    padding: '6px 8px',
                                    fontSize: '11px',
                                    width: '110px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  onClick={() => handleMergeRestaurant(r.id)}
                                  className="btn btn--ghost"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  Gộp
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= ALL RESTAURANTS CRUD TAB ================= */}
          {activeTab === 'restaurants_all' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 className="panel__title" style={{ margin: 0, fontSize: '18px' }}>Danh sách toàn bộ Quán ăn</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hiển thị tối đa 100 quán ăn gần đây</span>
              </div>

              {/* Restaurant Search Bar */}
              <form onSubmit={handleRestaurantSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm quán ăn theo tên hoặc địa chỉ..."
                  value={restaurantSearchQuery}
                  onChange={e => setRestaurantSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--border)',
                    outline: 'none',
                    fontSize: '14.5px'
                  }}
                />
                <button type="submit" className="btn btn--primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)' }}>
                  Tìm kiếm
                </button>
              </form>

              {allRestaurants.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <strong>Không tìm thấy quán ăn nào.</strong>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-dark)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Tên quán & ID</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Địa chỉ</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Chuyên mục / Điểm số</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Xác minh</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRestaurants.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            <strong style={{ color: 'var(--text-dark)', display: 'block' }}>{r.name}</strong>
                            <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {r.id}</code>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px', maxWidth: '280px' }}>
                            {r.address}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px' }}>
                            <strong style={{ display: 'block' }}>{formatCategory(r.category)}</strong>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: '700' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                              {r.avg_rating || 'Chưa đánh giá'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            {r.is_verified ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '12px', color: 'var(--accent-green)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Đã xác minh
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '12px', color: 'var(--danger)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Chưa xác minh
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openEditModal(r)}
                                className="btn btn--ghost"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteRestaurant(r.id)}
                                className="btn btn--primary"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'var(--danger)', borderColor: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= VOUCHERS TAB ================= */}
          {activeTab === 'vouchers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="panel__title" style={{ margin: 0, fontSize: '18px' }}>Quản lý Vouchers</h3>
                <button
                  onClick={() => openVoucherModal()}
                  className="btn btn--primary"
                  style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '13px' }}
                >
                  + Tạo Voucher
                </button>
              </div>

              {vouchers.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <strong>Không có voucher nào.</strong>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-dark)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Mã & Tên</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Chiết khấu</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Điểm cần</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800' }}>Trạng thái</th>
                        <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            <strong style={{ color: 'var(--text-dark)', display: 'block' }}>{v.code}</strong>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{v.title}</span>
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px' }}>
                            {v.discount_type === 'percent' ? `${v.discount_value}%` : `${v.discount_value.toLocaleString()}đ`}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '13.5px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                            {v.points_required} điểm
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                            {v.is_active ? (
                              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px' }}>Hoạt động</span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '12px' }}>Vô hiệu hóa</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openVoucherModal(v)}
                                className="btn btn--ghost"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteVoucher(v.id)}
                                className="btn btn--primary"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ================= EDIT RESTAURANT MODAL ================= */}
      {editingRestaurant && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          {/* Decoupled blurred backdrop for premium performance */}
          <div 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(42, 29, 25, 0.45)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setEditingRestaurant(null)} 
          />
          
          <div 
            className="panel glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '580px', 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              padding: '30px', 
              position: 'relative', 
              borderRadius: '4px', 
              boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)' 
            }}
          >
            <button
              onClick={() => setEditingRestaurant(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'rgba(42, 29, 25, 0.05)',
                width: '32px',
                height: '32px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-muted)'
              }}
              aria-label="Đóng"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', margin: '0 0 20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Cập nhật thông tin quán ăn
            </h3>

            <form onSubmit={handleEditSubmit} className="form">
              <label className="form__field">
                <span>Tên quán ăn *</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="form__field">
                  <span>Danh mục *</span>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="select"
                    style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '12px 16px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form__field">
                  <span>Thành phố *</span>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="select"
                    style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '12px 16px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                    required
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Huế">Huế</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                  </select>
                </label>
              </div>

              <label className="form__field">
                <span>Địa chỉ *</span>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="form__field">
                  <span>Giờ hoạt động</span>
                  <input
                    type="text"
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                  />
                </label>

                <label className="form__field">
                  <span>Số điện thoại</span>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </label>
              </div>

              <label className="form__field">
                <span>Món đặc trưng (phân cách bằng dấu phẩy)</span>
                <input
                  type="text"
                  value={editForm.specialties}
                  onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                />
              </label>

              <label className="form__field">
                <span>Hashtag bổ sung (phân cách bằng dấu phẩy)</span>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </label>

              <label className="form__field">
                <span>Ảnh bìa quán (URL hình ảnh)</span>
                <input
                  type="url"
                  value={editForm.img_url}
                  onChange={(e) => setEditForm({ ...editForm, img_url: e.target.value })}
                />
              </label>

              <label className="form__field">
                <span>Giới thiệu chi tiết (Thực đơn / Mô tả)</span>
                <textarea
                  value={editForm.menu}
                  onChange={(e) => setEditForm({ ...editForm, menu: e.target.value })}
                  rows={3}
                />
              </label>

              <div className="form__actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditingRestaurant(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VOUCHER MODAL ================= */}
      {showVoucherModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(42, 29, 25, 0.45)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setShowVoucherModal(false)} 
          />
          
          <div 
            className="panel glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              padding: '30px', 
              position: 'relative', 
              borderRadius: '4px', 
              boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)' 
            }}
          >
            <button
              onClick={() => setShowVoucherModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'rgba(42, 29, 25, 0.05)',
                width: '32px',
                height: '32px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', margin: '0 0 20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              {editingVoucher ? 'Cập nhật Voucher' : 'Tạo mới Voucher'}
            </h3>

            <form onSubmit={handleVoucherSubmit} className="form">
              <label className="form__field">
                <span>Mã Voucher (Code) *</span>
                <input
                  type="text"
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  disabled={!!editingVoucher}
                  required
                />
              </label>

              <label className="form__field">
                <span>Tên Voucher (Tiêu đề) *</span>
                <input
                  type="text"
                  value={voucherForm.title}
                  onChange={(e) => setVoucherForm({ ...voucherForm, title: e.target.value })}
                  required
                />
              </label>

              <label className="form__field">
                <span>Mô tả chi tiết</span>
                <textarea
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  rows={2}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="form__field">
                  <span>Loại giảm giá *</span>
                  <select
                    value={voucherForm.discount_type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}
                    className="select"
                    style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '12px 16px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Tiền mặt (VNĐ)</option>
                  </select>
                </label>

                <label className="form__field">
                  <span>Giá trị giảm *</span>
                  <input
                    type="number"
                    value={voucherForm.discount_value}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_value: parseFloat(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="form__field">
                  <span>Điểm yêu cầu đổi *</span>
                  <input
                    type="number"
                    value={voucherForm.points_required}
                    onChange={(e) => setVoucherForm({ ...voucherForm, points_required: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </label>

                <label className="form__field">
                  <span>Số lượng (-1 = vô hạn) *</span>
                  <input
                    type="number"
                    value={voucherForm.total_quantity}
                    onChange={(e) => setVoucherForm({ ...voucherForm, total_quantity: parseInt(e.target.value) || -1 })}
                    required
                  />
                </label>
              </div>

              <label className="form__field">
                <span>ID Nhà hàng (Để trống nếu áp dụng toàn hệ thống)</span>
                <input
                  type="text"
                  value={voucherForm.restaurant_id}
                  onChange={(e) => setVoucherForm({ ...voucherForm, restaurant_id: e.target.value })}
                />
              </label>

              <label className="form__field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={voucherForm.is_active}
                  onChange={(e) => setVoucherForm({ ...voucherForm, is_active: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <span style={{ margin: 0, fontWeight: 'bold' }}>Hoạt động</span>
              </label>

              <div className="form__actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowVoucherModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Lưu Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
