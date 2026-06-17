import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const RestaurantsContext = createContext(null);

export function RestaurantsProvider({ children }) {
  const [restaurantMap, setRestaurantMap] = useState({});

  const getRestaurant = useCallback(async (id) => {
    if (restaurantMap[id]) return restaurantMap[id];
    try {
      const res = await fetch(`/api/v1/restaurants/${id}`);
      if (res.ok) {
        const r = await res.json();
        const mapped = {
          id: r.id,
          name: r.name,
          category: r.category || 'Khác',
          priceRange: r.capacity || '$$',
          address: r.address || 'Chưa cập nhật',
          phone: r.phone || 'Chưa cập nhật',
          hours: r.hours || '08:00 - 22:00',
          rating: r.avg_rating || 0.0,
          image: r.img_url || r.restaurant_url || '/image.png',
          tags: r.cuisine_tags ? r.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
          description: r.menu || 'Chưa có thực đơn chi tiết.',
          specialties: r.serves_dishes ? r.serves_dishes.split(';').map(s => s.trim()).filter(Boolean) : (r.cuisine_style ? r.cuisine_style.split(';').map(s => s.trim()).filter(Boolean) : ['Món ăn gia đình']),
          gallery: [],
          menu: r.menu,
          serves_dishes: r.serves_dishes,
          cuisine_style: r.cuisine_style,
          suitable_for: r.suitable_for,
          suitable_times: r.suitable_times,
          last_order: r.last_order,
          prep_time: r.prep_time,
          holiday_closing: r.holiday_closing,
          capacity: r.capacity,
          sub_scores: r.sub_scores,
          latitude: r.latitude,
          longitude: r.longitude,
          is_verified: r.is_verified
        };
        setRestaurantMap(prev => ({ ...prev, [id]: mapped }));
        return mapped;
      }
    } catch (err) {
      console.error("Error fetching restaurant details:", err);
    }
    return null;
  }, [restaurantMap]);

  const addRestaurant = useCallback(async (data) => {
    if (!data.name?.trim()) return { ok: false, error: 'Vui lòng nhập tên quán ăn.' };
    if (!data.address?.trim()) return { ok: false, error: 'Vui lòng nhập địa chỉ.' };
    if (!data.category || data.category === 'Tất cả') return { ok: false, error: 'Vui lòng chọn danh mục hợp lệ.' };

    const newId = 'r_' + Date.now();
    
    const cuisine_tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean).join(';')
      : data.category;

    const serves_dishes = data.specialties
      ? data.specialties.split(',').map((s) => s.trim()).filter(Boolean).join(';')
      : 'Món ăn gia đình';

    if (!data.city || !data.city.trim()) return { ok: false, error: 'Vui lòng chọn tỉnh / thành phố.' };

    const payload = {
      id: newId,
      name: data.name.trim(),
      category: data.category,
      capacity: data.priceRange || '$$',
      address: data.address.trim(),
      phone: data.phone?.trim() || 'Chưa cập nhật',
      hours: data.hours?.trim() || '08:00 - 22:00',
      avg_rating: 5.0,
      img_url: data.image?.trim() || '/image.png',
      cuisine_tags,
      menu: data.description?.trim() || 'Chưa có mô tả chi tiết từ cộng đồng.',
      serves_dishes,
      city: data.city.trim(),
      is_verified: false
    };

    try {
      const response = await fetch('/api/v1/restaurants/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const newRest = await response.json();
        const mapped = {
          id: newRest.id,
          name: newRest.name,
          category: newRest.category || 'Khác',
          priceRange: newRest.capacity || '$$',
          address: newRest.address || 'Chưa cập nhật',
          phone: newRest.phone || 'Chưa cập nhật',
          hours: newRest.hours || '08:00 - 22:00',
          rating: newRest.avg_rating || 0.0,
          image: newRest.img_url || newRest.restaurant_url || '/image.png',
          tags: newRest.cuisine_tags ? newRest.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
          description: newRest.menu || 'Chưa có thực đơn chi tiết.',
          specialties: newRest.serves_dishes ? newRest.serves_dishes.split(';').map(s => s.trim()).filter(Boolean) : (newRest.cuisine_style ? newRest.cuisine_style.split(';').map(s => s.trim()).filter(Boolean) : ['Món ăn gia đình']),
          gallery: [],
          menu: newRest.menu,
          serves_dishes: newRest.serves_dishes,
          cuisine_style: newRest.cuisine_style,
          suitable_for: newRest.suitable_for,
          suitable_times: newRest.suitable_times,
          last_order: newRest.last_order,
          prep_time: newRest.prep_time,
          holiday_closing: newRest.holiday_closing,
          capacity: newRest.capacity,
          sub_scores: newRest.sub_scores,
          is_verified: newRest.is_verified
        };
        setRestaurantMap(prev => ({ ...prev, [newRest.id]: mapped }));
        return { ok: true, restaurantId: newRest.id };
      } else {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Không thể đăng quán ăn.' };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  }, []);

  const updateRestaurant = useCallback(async (id, data) => {
    const token = localStorage.getItem('ff_token');
    if (!token) return { ok: false, error: 'Bạn cần đăng nhập bằng tài khoản Admin để chỉnh sửa.' };
    
    const cuisine_tags = data.tags
      ? (Array.isArray(data.tags) ? data.tags.join(';') : data.tags.split(',').map((t) => t.trim()).filter(Boolean).join(';'))
      : data.cuisine_tags;

    const serves_dishes = data.specialties
      ? (Array.isArray(data.specialties) ? data.specialties.join(';') : data.specialties.split(',').map((s) => s.trim()).filter(Boolean).join(';'))
      : data.serves_dishes;

    const payload = {
      name: data.name?.trim(),
      category: data.category,
      address: data.address?.trim(),
      phone: data.phone?.trim(),
      hours: data.hours?.trim(),
      img_url: data.img_url || data.image,
      cuisine_tags,
      menu: data.menu || data.description,
      serves_dishes,
      city: data.city || 'Hà Nội'
    };

    try {
      const response = await fetch(`/api/v1/restaurants/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const updatedRest = await response.json();
        const mapped = {
          id: updatedRest.id,
          name: updatedRest.name,
          category: updatedRest.category || 'Khác',
          priceRange: updatedRest.capacity || '$$',
          address: updatedRest.address || 'Chưa cập nhật',
          phone: updatedRest.phone || 'Chưa cập nhật',
          hours: updatedRest.hours || '08:00 - 22:00',
          rating: updatedRest.avg_rating || 0.0,
          image: updatedRest.img_url || updatedRest.restaurant_url || '/image.png',
          tags: updatedRest.cuisine_tags ? updatedRest.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
          description: updatedRest.menu || 'Chưa có thực đơn chi tiết.',
          specialties: updatedRest.serves_dishes ? updatedRest.serves_dishes.split(';').map(s => s.trim()).filter(Boolean) : ['Món ăn gia đình'],
          gallery: [],
          menu: updatedRest.menu,
          serves_dishes: updatedRest.serves_dishes,
          cuisine_style: updatedRest.cuisine_style,
          suitable_for: updatedRest.suitable_for,
          sub_scores: updatedRest.sub_scores,
          is_verified: updatedRest.is_verified
        };
        setRestaurantMap(prev => ({ ...prev, [id]: mapped }));
        return { ok: true };
      } else {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Không thể cập nhật quán ăn.' };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  }, []);

  const deleteRestaurant = useCallback(async (id) => {
    const token = localStorage.getItem('ff_token');
    if (!token) return { ok: false, error: 'Bạn cần đăng nhập bằng tài khoản Admin để xóa.' };

    try {
      const response = await fetch(`/api/v1/restaurants/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setRestaurantMap(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return { ok: true };
      } else {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Không thể xóa quán ăn.' };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  }, []);

  const value = useMemo(
    () => ({
      restaurants: Object.values(restaurantMap),
      getRestaurant,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant
    }),
    [restaurantMap, getRestaurant, addRestaurant, updateRestaurant, deleteRestaurant]
  );

  return (
    <RestaurantsContext.Provider value={value}>
      {children}
    </RestaurantsContext.Provider>
  );
}

export function useRestaurants() {
  const ctx = useContext(RestaurantsContext);
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantsProvider');
  return ctx;
}
