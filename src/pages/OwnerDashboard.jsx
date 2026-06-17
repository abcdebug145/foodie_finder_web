import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../components/Toast.jsx';

export default function OwnerDashboard() {
  const { token, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch owned restaurants
      const resRes = await fetch('http://localhost:8000/api/v1/owner/restaurants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRes.ok) {
        const data = await resRes.json();
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurant(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu nhà hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurant) {
      fetchBookings(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const fetchBookings = async (restId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/owner/restaurants/${restId}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (restId, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/owner/restaurants/${restId}/status?is_open=${!currentStatus}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Đã ${!currentStatus ? 'mở' : 'đóng'} cửa hàng`);
        fetchData();
      } else {
        toast.error('Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveBooking = async (bookingId, action) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'confirmed' ? 'Xác nhận' : 'Từ chối'} đơn này?`)) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/owner/bookings/${bookingId}/status?status=${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Đã cập nhật trạng thái đơn đặt bàn');
        fetchBookings(selectedRestaurant);
      } else {
        toast.error('Lỗi khi cập nhật đơn');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div className="owner-dashboard">
      <div className="owner-sidebar">
        <div className="owner-sidebar-header">
          <h2>Bảng Điều Khiển</h2>
          <p>Dành cho Chủ Nhà Hàng</p>
        </div>
        <ul className="owner-nav">
          <li className={activeTab === 'restaurants' ? 'active' : ''} onClick={() => setActiveTab('restaurants')}>
            Cửa hàng của tôi
          </li>
          <li className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>
            Đơn đặt bàn {pendingBookingsCount > 0 && <span className="badge">{pendingBookingsCount}</span>}
          </li>
          {/* <li className={activeTab === 'vouchers' ? 'active' : ''} onClick={() => setActiveTab('vouchers')}>
            Vouchers
          </li> */}
        </ul>
      </div>

      <div className="owner-content">
        {activeTab === 'restaurants' && (
          <div className="owner-section animate-fade-in">
            <h2>Quản lý Cửa Hàng</h2>
            {restaurants.length === 0 ? (
              <p>Bạn chưa sở hữu nhà hàng nào. Hãy ấn nút "Nhận sở hữu" ở trang chi tiết nhà hàng.</p>
            ) : (
              <div className="restaurant-list">
                {restaurants.map(rest => (
                  <div key={rest.id} className="restaurant-card">
                    <img src={rest.img_url || 'https://via.placeholder.com/150'} alt={rest.name} />
                    <div className="rest-info">
                      <h3>{rest.name}</h3>
                      <p>{rest.address}</p>
                      <p>Trạng thái: <strong style={{ color: rest.is_open ? 'var(--success)' : 'var(--danger)' }}>
                        {rest.is_open ? 'Đang mở cửa' : 'Đóng cửa'}
                      </strong></p>
                    </div>
                    <div className="rest-actions">
                      <button className="btn btn--outline" onClick={() => handleToggleStatus(rest.id, rest.is_open)}>
                        {rest.is_open ? 'Đóng cửa' : 'Mở cửa'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="owner-section animate-fade-in">
            <h2>Quản lý Đặt Bàn</h2>
            {restaurants.length > 0 && (
              <div className="filter-bar" style={{ marginBottom: '20px' }}>
                <select value={selectedRestaurant || ''} onChange={(e) => setSelectedRestaurant(e.target.value)} className="form-input">
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {bookings.length === 0 ? (
              <p>Chưa có đơn đặt bàn nào.</p>
            ) : (
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Thời gian</th>
                    <th>Số người</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>User #{b.user_id}</td>
                      <td>{b.booking_date} {b.booking_time}</td>
                      <td>{b.party_size} người</td>
                      <td>
                        <span className={`status-badge status-${b.status}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {b.status === 'pending' && (
                          <div className="action-buttons">
                            <button className="btn-icon accept" onClick={() => handleResolveBooking(b.id, 'confirmed')} title="Xác nhận">
                              ✓
                            </button>
                            <button className="btn-icon reject" onClick={() => handleResolveBooking(b.id, 'rejected')} title="Từ chối">
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .owner-dashboard {
          display: flex;
          min-height: calc(100vh - 70px);
          background-color: var(--bg-light);
        }
        .owner-sidebar {
          width: 250px;
          background-color: #fff;
          border-right: 1px solid var(--border-color);
          padding: 20px 0;
          box-shadow: 2px 0 5px rgba(0,0,0,0.05);
        }
        .owner-sidebar-header {
          padding: 0 20px 20px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        .owner-sidebar-header h2 {
          font-size: 1.2rem;
          color: var(--primary);
          margin: 0;
        }
        .owner-sidebar-header p {
          font-size: 0.9rem;
          color: var(--text-light);
          margin: 5px 0 0;
        }
        .owner-nav {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .owner-nav li {
          padding: 12px 20px;
          cursor: pointer;
          font-weight: 500;
          color: var(--text-dark);
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .owner-nav li:hover {
          background-color: var(--bg-light);
          color: var(--primary);
        }
        .owner-nav li.active {
          background-color: rgba(232,153,81,0.1);
          color: var(--primary);
          border-right: 3px solid var(--primary);
        }
        .badge {
          background-color: var(--danger);
          color: #fff;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: bold;
        }
        .owner-content {
          flex: 1;
          padding: 30px;
        }
        .restaurant-card {
          display: flex;
          background: #fff;
          border-radius: var(--radius-md);
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
          align-items: center;
          gap: 20px;
        }
        .restaurant-card img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        .rest-info {
          flex: 1;
        }
        .rest-info h3 { margin: 0 0 5px; font-size: 1.2rem; }
        .rest-info p { margin: 0 0 5px; color: var(--text-light); font-size: 0.9rem; }
        
        .bookings-table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .bookings-table th, .bookings-table td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .bookings-table th {
          background-color: var(--bg-light);
          font-weight: 600;
          color: var(--text-dark);
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .status-pending { background: #ffeeba; color: #856404; }
        .status-confirmed { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .status-cancelled { background: #e2e3e5; color: #383d41; }

        .action-buttons {
          display: flex;
          gap: 10px;
        }
        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: transform 0.2s;
        }
        .btn-icon:hover { transform: scale(1.1); }
        .btn-icon.accept { background-color: var(--success); color: white; }
        .btn-icon.reject { background-color: var(--danger); color: white; }
      `}</style>
    </div>
  );
}
