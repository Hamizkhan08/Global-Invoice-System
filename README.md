# Global Tours & Travels - Invoice System

A mobile-first, production-ready invoice management Progressive Web App (PWA) for tour and travel businesses.

## Features

- 📱 **Mobile-First Design** - Optimized for one-hand usage with large touch targets
- 📄 **PDF Invoice Generation** - Professional A4 invoices with auto-download
- 📱 **WhatsApp Sharing** - Share invoice details directly on WhatsApp
- 🔐 **Admin-Only Access** - Secure login with Supabase Auth
- 💾 **Draft Saving** - Form auto-saves to localStorage
- 📊 **Dashboard** - View, search, download, and delete invoices
- 📲 **PWA Support** - Install on home screen, works offline
- 🚀 **Fast & Lightweight** - Optimized for slow networks

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **PDF Generation**: html2pdf.js
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd global-invoice-system
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://app.supabase.com) and create a new project
2. Go to **SQL Editor** and run the SQL from `supabase-schema.sql`
3. Go to **Authentication > Users** and create an admin user (email/password)
4. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public Key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add the environment variables in Vercel project settings
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with PWA config
│   ├── page.tsx            # Invoice form (home)
│   ├── success/page.tsx    # Success screen
│   ├── login/page.tsx      # Admin login
│   └── dashboard/page.tsx  # Invoice management
├── components/
│   ├── InvoiceForm.tsx     # Main form component
│   └── InvoiceTemplate.tsx # PDF template
├── lib/
│   ├── supabase/           # Supabase clients
│   └── pdf.ts              # PDF generation
├── types/
│   └── invoice.ts          # TypeScript types
└── middleware.ts           # Auth protection
```

## Usage

1. **Login**: Open the app and login with your admin credentials
2. **Create Invoice**: Fill in the customer, journey, and payment details
3. **Submit**: Click "Create Invoice" - PDF downloads automatically
4. **Share**: Use WhatsApp button to share invoice details
5. **Manage**: Go to Dashboard to view, download, or delete invoices

## Company Details

- **Name**: Global Tours & Travels
- **Contact**: 98815 98109
- **Address**: Sainath Nagar, Nashik

## License

Private - For Global Tours & Travels use only.
