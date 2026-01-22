# Sprint - Setup Guide

## 1. Add Court Images

Add the following images to `/public/courts/`:

| Filename | Description |
|----------|-------------|
| `tennis.jpg` | Tennis court (green/blue with ball) |
| `pickleball.jpg` | Pickleball paddles on court |
| `padel.jpg` | Blue indoor padel court |
| `futsal.jpg` | Indoor futsal court with goal |
| `football.jpg` | Football field at sunset |
| `badminton.jpg` | Badminton court with rackets |

## 2. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (~2 minutes)

### Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from: **Project Settings > API**

### Initialize Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `/supabase/schema.sql`
3. Run the SQL to create tables and seed data

### Enable Authentication

1. Go to **Authentication > Providers**
2. Enable **Email** authentication
3. (Optional) Enable **Google** and **GitHub** OAuth

### Storage Setup (Optional)

1. Go to **Storage**
2. Create a bucket called `venue-images`
3. Set it to public for reading

## 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view Sprint.

## Project Structure

```
sprint-v2/
├── app/
│   ├── page.tsx              # Home page with hero
│   ├── (auth)/
│   │   ├── login/            # Login page
│   │   └── signup/           # Signup page
│   └── venues/
│       ├── page.tsx          # Venues listing
│       └── [id]/page.tsx     # Venue detail + booking
├── components/
│   ├── ui/                   # 3D UI components
│   ├── hero/                 # Hero section
│   ├── home/                 # Home page sections
│   ├── layout/               # Navbar, Footer
│   └── pricing/              # Pricing tiers
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── mock-data.ts          # Mock venue data
│   └── supabase/             # Supabase clients
└── public/
    └── courts/               # Court images
```

## Features Implemented

- [x] 3D Claymorphism/Glassmorphism design system
- [x] Interactive hero with background switcher (6 courts)
- [x] Floating booking card with all form fields
- [x] Featured courts with 3D tilt effect
- [x] Sport filter (Pickleball/Padel priority)
- [x] Venue detail page with booking flow
- [x] 3D availability grid
- [x] Pricing tiers with elevated Premium card
- [x] Login/Signup pages
- [x] Responsive design
- [x] Malaysian Ringgit (RM) currency
- [x] Klang Valley locations

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Tomato | `#F06038` | CTA buttons |
| Vista Blue | `#8C9EFF` | Navigation, borders |
| Chartreuse | `#D6F74C` | Badges, active states |
| Apricot | `#FCD9BE` | Secondary backgrounds |
| Teal Dark | `#0D4D4D` | Hero overlay, accents |
