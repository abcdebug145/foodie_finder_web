import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../components/Toast.jsx';
import { formatCategory } from '../utils/category.js';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'users' | 'restaurants'
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [mergeTargets, setMergeTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('all'); // 'all' | 'pending' | 'resolved' | 'dismissed'

  const token = localStorage.getItem('ff_token');

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
      if (activeTab === 'reports') {
        await fetchReports();
      } else if (activeTab === 'users') {
        await fetchUsers(searchQuery);
      } else {
        await fetchPendingRestaurants();
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
          <p className="section__subtitle">Điều hành nội dung báo cáo vi phạm và quản lý người dùng hệ thống.</p>
        </div>

        {/* Tab Controls */}
        <div className="chips">
          <button 
            className={`chip ${activeTab === 'reports' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Báo cáo ({reports.filter(r => r.status === 'pending').length} chờ)
          </button>
          <button 
            className={`chip ${activeTab === 'users' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Tài khoản
          </button>
          <button 
            className={`chip ${activeTab === 'restaurants' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
            </svg>
            Nhà hàng chờ duyệt ({pendingRestaurants.length} chờ)
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
          
          {/* ================= REPORTS TAB ================= */}
          {activeTab === 'reports' && (
            <div>
              {/* Reports Filter Options */}
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
                              ● {r.status}
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
                            <img
                              src={u.avatar || `https://i.pravatar.cc/150?u=${u.id}`}
                              alt=""
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
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
                              color: u.is_active ? '#059669' : 'var(--danger)'
                            }}>
                              ● {u.is_active ? 'Đang hoạt động' : 'Đã khóa'}
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
                                {/* Admin toggle */}
                                <button
                                  onClick={() => handleUserAdminToggle(u.id, u.is_admin)}
                                  className="btn btn--ghost"
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  {u.is_admin ? 'Hủy Admin' : 'Cấp Admin'}
                                </button>
                                {/* Block toggle */}
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
        </div>
      )}
    </div>
  );
}
