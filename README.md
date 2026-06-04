# 🍜 FoodieFinder — Nền tảng gợi ý nhà hàng (React, client-side)

Ứng dụng web front-end **hoàn toàn phía client** giúp người dùng khám phá nhà hàng,
đọc và viết đánh giá, "thả tim" yêu thích — tất cả được lưu trong `localStorage`
của trình duyệt. Không cần backend!

## ✨ Tính năng

- **Đăng ký / Đăng nhập** mô phỏng với `localStorage`
- **Danh sách nhà hàng động** với bộ lọc theo danh mục, tìm kiếm, sắp xếp
- **Trang chi tiết** hiển thị ảnh, mô tả, món đặc trưng, giờ mở cửa
- **Đánh giá & xếp hạng sao** — đọc và viết review, tính trung bình động
- **Yêu thích (Like)** nhà hàng kiểu Facebook, lưu theo từng user
- **Trang cá nhân** có thể chỉnh sửa avatar, bio và xem các review của mình
- **Responsive** hoàn toàn trên mobile / tablet / desktop
- **UI hiện đại** với gradient, typography kép, animation mượt mà

## 🛠 Công nghệ

- React 18 + React Hooks (`useState`, `useEffect`, `useMemo`, `useContext`)
- React Router v6 (client-side routing + protected routes)
- Context API (AuthContext, FavoritesContext, ReviewsContext)
- Vite build tool
- CSS thuần (biến CSS custom, grid, flexbox)

## 📁 Cấu trúc

```
src/
  components/       # Navbar, Footer, Card, ReviewForm, StarRating, ...
  context/          # AuthContext, FavoritesContext, ReviewsContext
  data/             # Dữ liệu mẫu nhà hàng, người dùng, review
  pages/            # Home, Login, Register, RestaurantDetail, Favorites, Profile
  App.jsx           # Định nghĩa router
  main.jsx          # Entry point
  index.css         # Global styles
```

## 🚀 Bắt đầu

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

## 👤 Tài khoản mẫu

| Email                 | Mật khẩu |
| --------------------- | -------- |
| minhanh@demo.com      | 123456   |
| tuankiet@demo.com     | 123456   |
| haiyen@demo.com       | 123456   |

Hoặc đăng ký tài khoản mới — mọi dữ liệu đều lưu trong trình duyệt của bạn.

## 📦 Scripts

- `npm run dev` — chạy dev server
- `npm run build` — build bản production
- `npm run preview` — preview bản build
