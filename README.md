# Music City Odia — Full-Stack Studio E-Commerce Website

> **No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio**

A full-stack music store and studio profile website for **Music City Odia** in Odisha, India.  
Visitors can browse Odia songs, listen to 30-second previews, purchase tracks via Razorpay, then stream or download their purchased songs.

---

## Features

- 🎵 **Music Store** — Browse, preview, and purchase Odia songs
- 🔐 **Auth** — Supabase Auth (email/password signup + login + password reset)
- 💳 **Payments** — Razorpay checkout (test & live modes)
- 📦 **Purchase Library** — Stream and download owned full-quality tracks
- 🔒 **Signed URLs** — Private song files expire in 5 minutes; unpurchased songs blocked at API level
- 🎛️ **Admin Dashboard** — Upload songs, manage catalog, view revenue stats and orders
- 🎬 **Studio Profile** — About, Services, Contact, YouTube channel integration
- 📱 **Mobile-first responsive** design with Odia script font support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI (Python) + Pydantic v2 |
| Database + Auth | Supabase (Postgres + Auth + Storage) |
| Payments | Razorpay (Orders API + Webhooks) |
| Audio | HTML5 `<audio>` with custom React player component |

---

## Project Structure

```
Music_City_Odia/
├── frontend/           # Vite + React app
│   ├── src/
│   │   ├── components/ # Navbar, Footer, AudioPlayer, ProtectedRoute, AdminRoute
│   │   ├── context/    # AuthContext, CartContext, AudioPlayerContext
│   │   ├── pages/      # All route pages
│   │   └── services/   # api.ts (FastAPI client), supabase.ts (auth client)
│   ├── .env            # Frontend env vars (fill in your keys)
│   └── index.html
├── backend/            # FastAPI app
│   ├── app/
│   │   ├── routers/    # songs.py, genres.py, orders.py, admin.py, webhooks.py
│   │   ├── auth.py     # JWT verification + get_current_user dependency
│   │   ├── config.py   # pydantic-settings from .env
│   │   ├── database.py # Supabase client (service role)
│   │   └── schemas.py  # Pydantic models
│   ├── .env            # Backend env vars (fill in your keys)
│   └── requirements.txt
└── supabase/
    └── migrations/
        └── 01_schema.sql  # All tables, triggers, RLS policies — run in Supabase SQL Editor
```

---

## Setup Guide

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** and run the full contents of `supabase/migrations/01_schema.sql`, then `02_seed_genres.sql`.
3. Under **Storage**, create three buckets:
   - `song-previews` → **Public** bucket
   - `song-covers` → **Public** bucket
   - `song-full` → **Private** bucket
4. Under **Authentication > Settings**:
   - Enable **Email** provider.
   - Enable **Confirm email** (users must verify before login).
5. Collect these values from **Settings > API**:
   - `Project URL`
   - `Anon (public) key`
   - `Service role key`
   - `JWT Secret` (under API > JWT Settings)

### 2. Razorpay Keys

1. Sign up at [razorpay.com](https://razorpay.com).
2. Go to **Settings > API Keys** and generate a key pair for **Test Mode**.
3. Note your `Key ID` (starts with `rzp_test_`) and `Key Secret`.
4. For webhooks: Go to **Settings > Webhooks**, create a webhook pointing to `https://your-backend.com/webhooks/razorpay`, and note the webhook secret.

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit backend/.env with your real values:
```

**`backend/.env`:**
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

```bash
# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit frontend/.env with your real values:
```

**`frontend/.env`:**
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

```bash
# Run the dev server
npm run dev
# Opens at http://localhost:5173
```

---

## Setting Admin Access

After signing up your first admin account, run this SQL in the Supabase SQL Editor:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@email.com');
```

---

## Contact & YouTube

- 📞 **Phone:** [+91 9937987978](tel:9937987978)
- 📧 **Email:** [musiccityodia@gmail.com](mailto:musiccityodia@gmail.com)
- 📍 **Location:** Odisha, India
- 🎬 **YouTube:** [youtube.com/@MusicCityOdia](https://www.youtube.com/@MusicCityOdia)

---

## Security Checklist

- [x] Logged-out users cannot access `/library`, `/admin/*`, or any `/download`/`/stream` endpoint.
- [x] Customers who have not purchased a song receive HTTP 403 from `/songs/{id}/download` and `/songs/{id}/stream`.
- [x] Razorpay payment signature is verified server-side before any `purchases` row is created.
- [x] Signed URLs for full songs expire in **5 minutes**.
- [x] Only `is_admin = true` users can reach admin endpoints (checked server-side via JWT + profile lookup).
- [x] RLS policies on every Supabase table are enabled.
