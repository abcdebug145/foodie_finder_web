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

---

## ⚙️ Biến môi trường khi Deployment (Environment Variables)

Khi deploy ứng dụng Frontend lên các hosting (Vercel, Netlify, Render, Cloudflare Pages,...), bạn cần cấu hình các biến môi trường sau để kết nối với Backend:

*   `VITE_API_URL`: URL gốc của Backend FastAPI (ví dụ: `https://api.foodiefinder.com`).
    *   *Nếu không cấu hình, hệ thống sẽ sử dụng URL tương đối (`/api/v1/...`). Điều này chỉ hoạt động khi bạn deploy Frontend và Backend trên cùng một domain hoặc có cấu hình Reverse Proxy (Nginx) định tuyến `/api` về Backend.*
*   `VITE_WS_URL`: URL WebSocket của server Backend (ví dụ: `wss://api.foodiefinder.com/api/v1/notifications/ws`).
    *   *Nếu không cấu hình, hệ thống sẽ tự động suy ra giao thức (`ws://`/`wss://`) và domain từ `VITE_API_URL`.*
