# 📝 Changelog

All notable changes to Training Center Management System.

---

## [v2.0.0] - 2025-10-19

### 🔐 Added - Authentication System

#### New Features
- ✅ **Login System** - Email/password authentication dengan Supabase Auth
- ✅ **User Registration** - Self-service registration untuk new users
- ✅ **Logout Functionality** - Secure logout dengan session clearing
- ✅ **Protected Routes** - Middleware untuk protect semua routes
- ✅ **User Profiles** - Extended profiles dengan roles
- ✅ **Role Management** - 3 roles: Admin, Manager, User

#### New Files (10)
- `supabase/auth-setup.sql` - Database schema untuk authentication
- `lib/auth.ts` - Auth utility functions
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Registration page
- `middleware.ts` - Route protection middleware
- `components/AuthProvider.tsx` - Auth context provider
- `AUTH_SETUP.md` - Complete auth setup guide
- `AUTH_SUMMARY.md` - Auth feature summary
- `CHANGELOG.md` - This file

#### Modified Files (2)
- `components/layout/Header.tsx` - Added user info, logout button, dropdown menu
- `QUICKSTART.md` - Updated dengan auth setup instructions

#### Sample Users
- Admin: admin@trainingcenter.com (admin123)
- Manager: manager@trainingcenter.com (manager123)
- User: user@trainingcenter.com (user123)

#### Security
- Email/password authentication
- Session management dengan cookies
- Protected routes dengan middleware
- User profiles dengan roles
- RLS policies ready for production

---

## [v1.0.0] - 2025-10-19

### 🎉 Initial Release

#### Core Features
- ✅ **Dashboard** - Statistics, charts, recent enrollments
- ✅ **Trainer Management** - CRUD untuk trainers
- ✅ **Participant Management** - CRUD untuk participants
- ✅ **Program Management** - CRUD untuk training programs
- ✅ **Enrollment Management** - CRUD untuk enrollments
- ✅ **Statistics** - Advanced analytics dengan charts

#### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Recharts
- Lucide Icons

#### Database
- 4 main tables (trainers, programs, participants, enrollments)
- Sample data included
- RLS policies enabled
- Indexed for performance

#### Documentation
- README.md - Project overview
- QUICKSTART.md - 5-minute setup guide
- SETUP.md - Detailed setup instructions
- FEATURES.md - Complete feature documentation
- PROJECT_STRUCTURE.md - Code organization guide
- API_REFERENCE.md - Supabase query reference
- SUMMARY.md - Project summary

#### Sample Data
- 3 trainers
- 3 programs
- 4 participants
- 4 enrollments

---

## Upcoming Features

### v2.1.0 (Planned)
- [ ] Role-based permissions enforcement
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Profile editing page
- [ ] Avatar upload

### v2.2.0 (Planned)
- [ ] Advanced reporting (PDF/Excel export)
- [ ] Email notifications
- [ ] Certificate generation
- [ ] Payment gateway integration

### v3.0.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics dengan AI

---

## Migration Guide

### From v1.0.0 to v2.0.0

#### Step 1: Update Code
```bash
git pull origin main
npm install
```

#### Step 2: Run Auth Migration
```sql
-- Di Supabase SQL Editor
-- Copy & run supabase/auth-setup.sql
```

#### Step 3: Create Sample Users
Follow instructions di [AUTH_SETUP.md](./AUTH_SETUP.md)

#### Step 4: Test
1. Run `npm run dev`
2. Login dengan sample accounts
3. Test logout functionality
4. Verify protected routes working

#### Breaking Changes
- All routes now require authentication
- Homepage redirects to login if not authenticated
- Need to create user accounts to access app

---

## Bug Fixes

### v2.0.0
- None (initial auth release)

### v1.0.0
- None (initial release)

---

## Notes

### Authentication System
- Development mode: All authenticated users have full access
- Production mode: Uncomment RLS policies untuk role-based access
- Email verification disabled by default (enable di Supabase for production)

### Security
- Passwords hashed by Supabase Auth
- Sessions stored in secure httpOnly cookies
- CSRF protection via Supabase
- RLS enabled on all tables

---

**Questions or issues?** Check documentation atau create issue di GitHub.

