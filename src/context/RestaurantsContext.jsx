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
          image: r.restaurant_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
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

    const payload = {
      id: newId,
      name: data.name.trim(),
      category: data.category,
      capacity: data.priceRange || '$$',
      address: data.address.trim(),
      phone: data.phone?.trim() || 'Chưa cập nhật',
      hours: data.hours?.trim() || '08:00 - 22:00',
      avg_rating: 5.0,
      restaurant_url: data.image?.trim() || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      cuisine_tags,
      menu: data.description?.trim() || 'Chưa có mô tả chi tiết từ cộng đồng.',
      serves_dishes,
      city: 'ha-noi',
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
          image: newRest.restaurant_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
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

  const value = useMemo(
    () => ({
      restaurants: Object.values(restaurantMap),
      getRestaurant,
      addRestaurant
    }),
    [restaurantMap, getRestaurant, addRestaurant]
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
