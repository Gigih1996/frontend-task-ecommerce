# ShopEase — Angular 18 + Tailwind CSS

E-commerce mini-app dibangun dengan **Angular 18 (standalone components)**, **Tailwind CSS**, **lucide-angular** untuk icon, dan **DummyJSON** sebagai backend dummy.

## Fitur

- 🔐 **Login** dengan validasi reactive forms + integrasi `https://dummyjson.com/auth/login`
- 🛡️ **Route guard** — hanya user terautentikasi yang bisa mengakses Home & Product Detail
- 🏠 **Home page** — slider hero (auto-play), filter kategori, search, dan product list
- 📦 **Product detail** — image gallery, quantity selector, tabs (Description / Specifications / Reviews)
- 🚪 **Logout** — tersedia di dropdown navbar
- 📱 Responsive penuh: **mobile, tablet, desktop**
- 🧩 Type interfaces dipisah di folder `core/models/`
- 🔁 Komponen dinamis: `app-product-card`, `app-product-grid`, `app-slider`, `app-rating-stars`, `app-loader`
- 🧠 Pakai Angular Signals + RxJS

## Catatan API DummyJSON

Endpoint write bersifat **simulasi** (tidak benar-benar mengubah server):

| Endpoint | Sifat | Response |
| --- | --- | --- |
| `POST /products/add` | Simulasi | New created product dengan id baru, **tidak persisted** |
| `PUT/PATCH /products/:id` | Simulasi | Updated product dengan modified data, **tidak persisted** |
| `DELETE /products/:id` | Simulasi | Product dengan flag `isDeleted` & `deletedOn`, **tidak benar-benar dihapus** |

Query param yang didukung pada `GET /products`:

- `limit`, `skip` — pagination (gunakan `limit=0` untuk fetch semua)
- `select` — comma-separated field names untuk select specific data
- `sortBy` + `order` — `sortBy` adalah field name, `order` = `asc` / `desc`
- `q` — untuk endpoint `/products/search`

## Cara menjalankan

```bash
npm install
npm start
# atau: npx ng serve
```

App akan jalan di `http://localhost:4200`.

### Demo credentials

```
username: emilys
password: emilyspass
```

(Tombol **"Use demo credentials"** di halaman login akan auto-fill.)

## Struktur folder

```
src/
├── environments/
│   ├── environment.ts          # apiUrl, authUrl, productUrl
│   └── environment.prod.ts
└── app/
    ├── app.component.{ts,html} # root + <router-outlet>
    ├── app.config.ts           # providers (router, http + interceptor)
    ├── app.routes.ts           # route definitions + guards
    ├── core/
    │   ├── guards/
    │   │   └── auth.guard.ts          # authGuard + guestGuard
    │   ├── interceptors/
    │   │   └── auth.interceptor.ts    # inject Bearer token
    │   ├── models/                    # ← TYPE INTERFACES (dipisah)
    │   │   ├── auth.model.ts
    │   │   ├── product.model.ts
    │   │   ├── slide.model.ts
    │   │   └── index.ts
    │   └── services/
    │       ├── auth.service.ts        # login / logout / signal user state
    │       └── product.service.ts     # all dummyjson product endpoints
    ├── shared/
    │   ├── icons.ts                   # registry icon Lucide
    │   └── components/                # ← KOMPONEN REUSABLE
    │       ├── navbar/                # navbar.component.ts + .html
    │       ├── footer/
    │       ├── slider/                # slider hero w/ auto-play
    │       ├── product-card/          # dynamic card by @Input product
    │       ├── product-grid/          # dynamic grid w/ loading/empty state
    │       ├── rating-stars/          # 5-star rating display
    │       └── loader/
    └── features/
        ├── login/                     # /login
        ├── home/                      # /home
        └── product-detail/            # /product/:id
```

Setiap component memisahkan template (`.html`) dari logika (`.ts`).

## Tech stack

- Angular 18 standalone API
- Tailwind CSS 3.4 + custom design tokens (warna `primary`, animasi `fade-in`, `slide-up`)
- lucide-angular (icon library, bukan inline SVG)
- RxJS (debounce search, switchMap)
- TypeScript strict mode
