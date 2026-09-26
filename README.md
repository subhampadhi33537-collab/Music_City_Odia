# 🎵 Music City Odia — Full-Stack Audio Studio & Music Store

> **"No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio"**

A modern, full-stack digital music store and audio production studio platform built for **Music City Odia** in Odisha, India. Visitors can discover premium Odia tracks, listen to seamless 30-second previews, purchase songs through Razorpay, unlock secure high-bitrate streaming/downloads, and book recording studio sessions.

---

## 🌟 Highlights & Key Features

- **🎧 Immersive Music Experience**:
  - Global bottom floating audio player with scrub bar, volume, queue, and preview streaming.
  - Interactive 3D Vinyl artwork visualizer and dynamic ambient sound atmosphere canvas.
  - Categorized catalog filtering across Odia Devotional, Sambalpuri, Romantic, Dance/DJ, Folk, and Modern tracks.

- **💳 Seamless Digital E-Commerce**:
  - Shopping cart with instant checkout.
  - Full **Razorpay Payment Gateway** integration (test & live modes).
  - Server-side HMAC-SHA256 signature verification and automated webhook processing for purchase confirmation.

- **☁️ Cloud Audio Storage (Google Drive Integration)**:
  - Master full-length audio tracks stored securely in Google Drive cloud storage.
  - Server-mediated streaming and temporary signed download links to prevent unauthorized distribution.
  - Local caching layer for fast preview playback and high-performance cover art delivery.

- **🔐 Robust Authentication & Role-Based Access Control**:
  - Dual-mode JWT authentication (native bcrypt + HS256 tokens and Supabase Auth support).
  - Strict route protection for user libraries, streaming downloads, and admin dashboards.

- **🎛️ Comprehensive Admin Dashboard**:
  - Direct file upload for song audio files (`.mp3`, `.wav`) and album covers.
  - Full catalog management: edit pricing, artist metadata, lyrics, and genres.
  - Real-time revenue tracking, order histories, and studio booking inquiry manager.

- **🎙️ Studio Profile & Booking System**:
  - Showcase studio recording, audio mixing, dubbing, mastering, and music arrangement services.
  - Interactive session booking form with automated backend reservation tracking.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 | Ultra-fast reactive single page application |
| **Styling** | Tailwind CSS v4, Lucide Icons | Responsive luxury dark-mode aesthetic with custom animations |
| **Backend** | Python 3.10+, FastAPI, ASGI | High-performance asynchronous REST API server |
| **Database** | PostgreSQL (Supabase / Direct) | Relational database with `psycopg2` connection pooling |
| **Audio Storage** | Google Drive API + Local Cache | Cloud audio repository for full master recordings |
| **Payments** | Razorpay Python SDK & JS Checkout | Orders API, client checkout modal, webhook verification |
| **Security** | PyJWT, Bcrypt, Cryptography | Password hashing and signed token verification |

---

## 📁 Repository Structure

```text
Music_City_Odia/
├── backend/                        # FastAPI REST API Backend
│   ├── app/
│   │   ├── routers/
│   │   │   ├── admin.py            # Song upload, stats, and catalog admin routes
│   │   │   ├── auth.py             # Signup, login, profile, and password reset
│   │   │   ├── bookings.py         # Studio session booking inquiries
│   │   │   ├── genres.py           # Genre taxonomy listing
│   │   │   ├── orders.py           # Razorpay order generation & verification
│   │   │   ├── songs.py            # Public catalog, streaming & download endpoints
│   │   │   └── webhooks.py         # Razorpay webhook handling
│   │   ├── auth.py                 # JWT token decoding & user dependencies
│   │   ├── config.py               # Pydantic BaseSettings environment config
│   │   ├── database.py             # PostgreSQL pool & query execution engine
│   │   ├── google_drive.py         # Google Drive API file streamer & uploader
│   │   ├── main.py                 # FastAPI application initialization & CORS
│   │   └── schemas.py              # Pydantic request/response models
│   ├── data/                       # Local database storage (gitignored)
│   ├── scripts/
│   │   ├── setup_postgres.py       # PostgreSQL schema setup & seed script
│   │   └── make_admin.py           # Admin promotion utility
│   ├── static/                     # Uploaded media (gitignored, kept via .gitkeep)
│   │   ├── audio/                  # Cached audio preview files
│   │   └── covers/                 # Album cover art images
│   ├── asgi.py                     # ASGI server entrypoint
│   ├── requirements.txt            # Python dependencies
│   ├── test_api_suite.py           # Backend verification suite
│   ├── .env.example                # Backend environment template
│   └── .gitignore                  # Backend-specific gitignore
│
├── frontend/                       # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── assets/                 # Brand assets & logos
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Atmosphere3D.tsx    # Ambient canvas background
│   │   │   ├── AudioPlayer.tsx     # Global audio streaming bar
│   │   │   ├── Card3D.tsx          # 3D interactive song card
│   │   │   ├── Navbar.tsx          # Navigation header with cart/auth badges
│   │   │   ├── Footer.tsx          # Site footer & studio contact
│   │   │   └── VinylArtwork3D.tsx  # Rotating vinyl disk visualizer
│   │   ├── context/                # Global React Contexts
│   │   │   ├── AuthContext.tsx     # Session management & user tokens
│   │   │   ├── CartContext.tsx     # Shopping cart state & local storage
│   │   │   └── AudioPlayerContext.tsx # Audio playback state & track queue
│   │   ├── pages/                  # Application views
│   │   │   ├── Home.tsx            # Landing page with hero & featured tracks
│   │   │   ├── Catalog.tsx         # Searchable & filterable track catalog
│   │   │   ├── SongDetail.tsx      # Individual song profile, lyrics & preview
│   │   │   ├── Login.tsx           # User authentication
│   │   │   ├── Signup.tsx          # Account registration
│   │   │   ├── ResetPassword.tsx   # Password recovery
│   │   │   ├── AdminDashboard.tsx  # Sales stats, catalog and bookings
│   │   │   ├── AdminNewSong.tsx    # Audio/cover upload form
│   │   │   └── AdminSongs.tsx      # Track list editor & deletion
│   │   ├── services/
│   │   │   ├── api.ts              # Axios / Fetch client for FastAPI backend
│   │   │   └── supabase.ts         # Supabase client helper
│   │   ├── App.tsx                 # Route declarations
│   │   ├── index.css               # Tailwind CSS v4 styling & theme tokens
│   │   └── main.tsx                # React DOM mounting
│   ├── package.json                # Frontend package configuration
│   ├── vite.config.ts              # Vite bundler configuration
│   ├── .env.example                # Frontend environment template
│   └── .gitignore                  # Frontend-specific gitignore
│
├── .gitignore                      # Root git ignore rules
├── README.md                       # Main project documentation
└── render.yaml                     # Render deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v18.0+ (recommended v20+)
- **Python**: v3.10+ (recommended v3.11+)
- **Git**
- A **PostgreSQL** database (e.g. from [Supabase](https://supabase.com))
- A **Razorpay** account for payment testing ([razorpay.com](https://razorpay.com))

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Music_City_Odia.git
cd Music_City_Odia
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   ```bash
   # Windows:
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `backend/.env` with your credentials:
   ```env
   # PostgreSQL Connection String (Supabase Transaction Pooler recommended)
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

   # Supabase Configuration
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret-string

   # Razorpay Credentials
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

   # CORS Configuration
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

   # Google Drive Storage Config
   GOOGLE_DRIVE_FOLDER_ID=1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m
   GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE=service_account.json
   ```

5. **Initialize the Database**:
   Run the automated database setup script to create all tables, indexes, seed initial Odia music genres, and establish the default admin account:
   ```bash
   python scripts/setup_postgres.py
   ```

6. **Start the FastAPI Backend Server**:
   ```bash
   python asgi.py
   # Or using uvicorn directly:
   uvicorn asgi:app --host 0.0.0.0 --port 8000 --reload
   ```
   - API is live at: `http://localhost:8000`
   - Interactive Swagger docs at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `frontend/.env`:
   ```env
   # Backend API Base URL
   VITE_API_BASE_URL=http://localhost:8000

   # Supabase Configuration
   VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

   # Razorpay Public Key
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at: `http://localhost:5173`

---

## 📡 API Overview

The FastAPI backend exposes structured endpoints with automatic validation:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | System status and Google Drive configuration check |
| `GET` | `/genres` | Public | List all music genres (Devotional, Sambalpuri, etc.) |
| `GET` | `/songs` | Public | Paginated track catalog with genre/search filters |
| `GET` | `/songs/{id}` | Public | Song metadata, lyrics, artist details, and preview link |
| `GET` | `/songs/{id}/preview` | Public | Stream 30-second audio preview |
| `GET` | `/songs/{id}/stream` | Customer | Stream full master audio file (validates purchase) |
| `GET` | `/songs/{id}/download`| Customer | Download master track file (validates purchase) |
| `POST`| `/auth/signup` | Public | Register new user account |
| `POST`| `/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile |
| `POST`| `/orders/create` | Authenticated | Create Razorpay order for cart items |
| `POST`| `/orders/verify` | Authenticated | Verify Razorpay payment signature & record purchase |
| `GET` | `/orders/my-library` | Authenticated | Retrieve all songs purchased by user |
| `POST`| `/bookings/` | Public | Submit recording studio booking inquiry |
| `POST`| `/admin/songs/upload` | Admin | Upload audio master, cover image, and metadata |
| `GET` | `/admin/stats` | Admin | Overview of revenue, users, orders, and catalog |
| `DELETE`| `/admin/songs/{id}` | Admin | Delete track from catalog |

---

## 🔒 Security & Protection Policies

1. **Private Audio Stream Protection**: Full audio streaming (`/songs/{id}/stream`) and download links (`/songs/{id}/download`) require a valid JWT token and verify that the user's ID exists in the `purchases` database table. Unpurchased requests receive `403 Forbidden`.
2. **Server-Side Payment Signature Verification**: Every Razorpay order verification cryptographically re-calculates the HMAC signature with `RAZORPAY_KEY_SECRET` before granting access to digital files.
3. **Environment Security**: All sensitive keys, connection strings, and service accounts are isolated in `.env` files and excluded from Git commits via `.gitignore`.

---

## 🏢 Studio Information & Contact

- **Studio Name**: Music City Odia (Super Bass Sound Studio)
- **Tagline**: *No.1 Quality Audio Sound in Odisha*
- **Phone**: [+91 9937987978](tel:+919937987978)
- **Email**: [musiccityodia@gmail.com](mailto:musiccityodia@gmail.com)
- **Location**: Odisha, India
- **YouTube Channel**: [@MusicCityOdia](https://www.youtube.com/@MusicCityOdia)

---

## 📄 License

This project is proprietary and confidential.  
© 2026 **Music City Odia**. All rights reserved.
