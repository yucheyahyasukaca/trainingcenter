# 📁 Project Structure

Dokumentasi lengkap struktur folder dan file Training Center Management System.

## 🌳 Folder Tree

```
trainingcenter/
│
├── 📂 app/                          # Next.js App Router (Pages & Layouts)
│   ├── 📂 enrollments/              # Manajemen Pendaftaran
│   │   ├── 📂 [id]/                 # Dynamic route untuk edit
│   │   │   └── page.tsx             # Edit enrollment page
│   │   ├── 📂 new/                  # Route untuk create
│   │   │   └── page.tsx             # Form tambah enrollment
│   │   └── page.tsx                 # List enrollments page
│   │
│   ├── 📂 participants/             # Manajemen Peserta
│   │   ├── 📂 [id]/                 # Dynamic route untuk edit
│   │   │   └── page.tsx             # Edit participant page
│   │   ├── 📂 new/                  # Route untuk create
│   │   │   └── page.tsx             # Form tambah participant
│   │   └── page.tsx                 # List participants page
│   │
│   ├── 📂 programs/                 # Manajemen Program
│   │   ├── 📂 [id]/                 # Dynamic route untuk edit
│   │   │   └── page.tsx             # Edit program page
│   │   ├── 📂 new/                  # Route untuk create
│   │   │   └── page.tsx             # Form tambah program
│   │   └── page.tsx                 # Grid view programs
│   │
│   ├── 📂 statistics/               # Halaman Statistik & Analytics
│   │   └── page.tsx                 # Statistics dashboard
│   │
│   ├── 📂 trainers/                 # Manajemen Trainer
│   │   ├── 📂 [id]/                 # Dynamic route untuk edit
│   │   │   └── page.tsx             # Edit trainer page
│   │   ├── 📂 new/                  # Route untuk create
│   │   │   └── page.tsx             # Form tambah trainer
│   │   └── page.tsx                 # List trainers page
│   │
│   ├── globals.css                  # Global styles & Tailwind directives
│   ├── layout.tsx                   # Root layout dengan sidebar & header
│   └── page.tsx                     # Homepage/Dashboard
│
├── 📂 components/                   # Reusable React Components
│   ├── 📂 dashboard/                # Dashboard-specific components
│   │   ├── DashboardStats.tsx       # Stats cards (4 metric cards)
│   │   ├── EnrollmentStatusChart.tsx # Pie chart untuk status pendaftaran
│   │   ├── ProgramsChart.tsx        # Bar chart program per kategori
│   │   └── RecentEnrollments.tsx    # Tabel 5 pendaftaran terbaru
│   │
│   ├── 📂 layout/                   # Layout components
│   │   ├── Header.tsx               # Top header dengan search & user info
│   │   └── Sidebar.tsx              # Left sidebar navigation
│   │
│   └── 📂 statistics/               # Statistics page components
│       ├── MonthlyEnrollmentsChart.tsx  # Line chart tren bulanan
│       ├── ProgramRevenue.tsx       # List revenue per program
│       └── TrainerPerformance.tsx   # List performa trainer
│
├── 📂 lib/                          # Library & utility functions
│   ├── supabase.ts                  # Supabase client configuration
│   └── utils.ts                     # Helper functions (formatDate, formatCurrency)
│
├── 📂 supabase/                     # Supabase-related files
│   └── schema.sql                   # Database schema & sample data
│
├── 📂 types/                        # TypeScript type definitions
│   ├── database.ts                  # Auto-generated Supabase types
│   └── index.ts                     # Custom types & interfaces
│
├── 📄 .gitignore                    # Git ignore rules
├── 📄 FEATURES.md                   # Dokumentasi fitur lengkap
├── 📄 next.config.js                # Next.js configuration
├── 📄 package.json                  # Dependencies & scripts
├── 📄 postcss.config.js             # PostCSS configuration
├── 📄 QUICKSTART.md                 # Quick start guide (5 menit)
├── 📄 README.md                     # Project overview
├── 📄 SETUP.md                      # Setup guide lengkap
├── 📄 tailwind.config.js            # Tailwind CSS configuration
└── 📄 tsconfig.json                 # TypeScript configuration
```

## 📋 File Descriptions

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies, scripts, dan metadata project |
| `tsconfig.json` | TypeScript compiler configuration |
| `next.config.js` | Next.js framework configuration |
| `tailwind.config.js` | Tailwind CSS theme & plugin configuration |
| `postcss.config.js` | PostCSS plugins (Tailwind & Autoprefixer) |
| `.gitignore` | Files/folders yang tidak di-commit ke git |

### Application Files

#### 📂 `app/` - Pages
Menggunakan Next.js 14 App Router dengan file-based routing:

- **`layout.tsx`** - Root layout dengan sidebar dan header
- **`page.tsx`** - Homepage (Dashboard)
- **`globals.css`** - Global CSS & Tailwind directives

Setiap feature memiliki struktur yang sama:
```
feature/
├── page.tsx          # List/Grid view
├── new/page.tsx      # Create form
└── [id]/page.tsx     # Edit form
```

#### 📂 `components/` - React Components

**Dashboard Components:**
- `DashboardStats.tsx` - 4 stat cards (Programs, Participants, Trainers, Enrollments)
- `ProgramsChart.tsx` - Bar chart untuk distribusi program per kategori
- `EnrollmentStatusChart.tsx` - Pie chart untuk status pendaftaran
- `RecentEnrollments.tsx` - Table dengan 5 enrollment terbaru

**Layout Components:**
- `Sidebar.tsx` - Navigasi sidebar dengan menu items
- `Header.tsx` - Top bar dengan search dan user info

**Statistics Components:**
- `MonthlyEnrollmentsChart.tsx` - Line chart tren pendaftaran
- `TrainerPerformance.tsx` - Performance metrics per trainer
- `ProgramRevenue.tsx` - Revenue analysis per program

#### 📂 `lib/` - Utilities

**`supabase.ts`**
```typescript
// Supabase client instance
export const supabase = createClient<Database>(url, key)
```

**`utils.ts`**
```typescript
// Helper functions
formatDate(dateString: string): string
formatCurrency(amount: number): string
formatDateTime(dateString: string): string
```

#### 📂 `types/` - TypeScript Types

**`database.ts`**
- Auto-generated dari Supabase schema
- Tipe untuk Row, Insert, Update operations
- Type-safe database queries

**`index.ts`**
- Custom types & interfaces
- Type exports untuk easy import
- Extended types dengan relations

## 🔄 Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Next.js    │ ← pages/components
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │ ← lib/supabase.ts
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │ ← Database (PostgreSQL)
│   Backend   │ ← Auth, Storage, RLS
└─────────────┘
```

## 🎨 Styling Architecture

### Tailwind CSS Layers

1. **Base Layer** (`@layer base`)
   - CSS variables
   - Global resets
   - Body styles

2. **Components Layer** (`@layer components`)
   - Reusable UI classes
   - Custom button styles
   - Card components
   - Form inputs
   - Badges

3. **Utilities Layer** (default Tailwind)
   - Margin, padding
   - Colors, typography
   - Layout utilities

### Custom Classes (in globals.css)

```css
.btn-primary      /* Primary button style */
.btn-secondary    /* Secondary button style */
.btn-danger       /* Danger/delete button style */
.card             /* Card container */
.input            /* Form input */
.label            /* Form label */
.badge            /* Status badge */
.badge-success    /* Green badge */
.badge-warning    /* Yellow badge */
.badge-danger     /* Red badge */
.badge-info       /* Blue badge */
```

## 📊 Database Schema

### Tables

```sql
trainers          (id, name, email, phone, specialization, ...)
programs          (id, title, description, category, price, ...)
participants      (id, name, email, phone, company, ...)
enrollments       (id, program_id, participant_id, status, ...)
```

### Relations

```
trainers ──────< programs
                    │
                    │
                    ▼
participants ───< enrollments >─── programs
```

## 🚀 Build & Deploy

### Development
```bash
npm run dev       # Start dev server on port 3000
```

### Production
```bash
npm run build     # Build for production
npm run start     # Start production server
```

### Linting
```bash
npm run lint      # Run ESLint
```

## 📦 Dependencies Overview

### Core
- **next** - React framework
- **react** & **react-dom** - React library
- **typescript** - Type safety

### UI & Styling
- **tailwindcss** - Utility-first CSS
- **lucide-react** - Icon library
- **recharts** - Chart library

### Backend & Data
- **@supabase/supabase-js** - Supabase client
- **@tanstack/react-query** - Data fetching (future use)
- **zustand** - State management (future use)

### Development
- **eslint** - Code linting
- **autoprefixer** - CSS vendor prefixes
- TypeScript type definitions

## 🔐 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## 📝 Naming Conventions

### Files & Folders
- **Components**: PascalCase (e.g., `DashboardStats.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Folders**: lowercase (e.g., `dashboard/`)

### Code
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## 🎯 Best Practices

1. **Component Organization**
   - One component per file
   - Group related components in folders
   - Export from index files for cleaner imports

2. **Type Safety**
   - Use TypeScript for all files
   - Define interfaces for props
   - Type database operations

3. **Styling**
   - Use Tailwind utility classes
   - Custom classes in globals.css
   - Consistent spacing & colors

4. **Data Fetching**
   - Use async/await
   - Handle loading states
   - Show empty states
   - Error handling

## 🔄 Future Structure Additions

Planned for future versions:

```
├── 📂 middleware/        # Next.js middleware for auth
├── 📂 hooks/            # Custom React hooks
├── 📂 context/          # React context providers
├── 📂 api/              # API routes
├── 📂 public/           # Static assets
└── 📂 tests/            # Unit & integration tests
```

