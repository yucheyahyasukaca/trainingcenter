# Supabase Self-Hosting Setup Guide

## Garuda Academy - GARUDA-21 Training Center

### Prerequisites

1. **Docker & Docker Compose** installed
2. **Git** installed
3. **Supabase CLI** (optional but recommended)

### Step 1: Setup Environment

1. **Clone or download** this project
2. **Navigate** to the `supabase` directory
3. **Create** `.env` file:

```bash
# Database
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# API Keys (generate these)
ANON_KEY=your-anon-key-here
SERVICE_ROLE_KEY=your-service-role-key-here

# URLs
SUPABASE_URL=http://localhost:8000
SITE_URL=http://localhost:3000
```

### Step 2: Generate Keys

Generate your API keys using Supabase CLI or online tools:

```bash
# Install Supabase CLI
npm install -g supabase

# Generate keys
supabase gen keys
```

Or use online JWT generator for:
- `JWT_SECRET`: 32+ character random string
- `ANON_KEY`: JWT token with `anon` role
- `SERVICE_ROLE_KEY`: JWT token with `service_role` role

### Step 3: Start Supabase

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Run Migration Scripts

1. **Connect** to your database:
   - Host: `localhost`
   - Port: `54322`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `postgres`

2. **Run scripts in order**:
   ```sql
   -- 1. Complete migration script
   \i COMPLETE_MIGRATION_SCRIPT.sql
   
   -- 2. Setup user roles
   \i SETUP_USER_ROLES.sql
   
   -- 3. Setup specific users
   \i SETUP_SPECIFIC_USERS.sql
   ```

### Step 5: Create Users

1. **Open** Supabase Dashboard: http://localhost:8000
2. **Go to** Authentication > Users
3. **Create users**:
   - `admin@garuda-21.com` (password: `AdminGaruda21!`)
   - `managers@garuda-21.com` (password: `ManagerGaruda21!`)
   - `user@garuda-21.com` (password: `UserGaruda21!`)

### Step 6: Update User Profiles

1. **Get UUIDs** from Authentication > Users
2. **Update** `SETUP_SPECIFIC_USERS.sql` with actual UUIDs
3. **Run** the script again

### Step 7: Update Application

Update your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 8: Test Application

1. **Start** your Next.js app:
   ```bash
   npm run dev
   ```

2. **Test** each user role:
   - Admin: Full access to all features
   - Manager: Access to programs and enrollments
   - User: Can view and enroll in programs

### Troubleshooting

#### Database Connection Issues
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

#### API Issues
```bash
# Check API logs
docker-compose logs api

# Restart API
docker-compose restart api
```

#### Storage Issues
```bash
# Check storage logs
docker-compose logs storage

# Check storage permissions
docker-compose exec storage ls -la /var/lib/storage
```

### Production Setup

For production deployment:

1. **Use** a reverse proxy (Nginx)
2. **Enable** SSL/TLS certificates
3. **Set up** proper backups
4. **Configure** monitoring
5. **Update** environment variables

### Backup & Restore

#### Backup Database
```bash
# Create backup
docker-compose exec db pg_dump -U postgres postgres > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres postgres < backup.sql
```

#### Backup Storage
```bash
# Copy storage files
docker cp supabase-storage:/var/lib/storage ./storage-backup
```

### Monitoring

Check service health:

```bash
# All services
docker-compose ps

# Database
curl http://localhost:54322/health

# API
curl http://localhost:9999/health

# Storage
curl http://localhost:5000/health

# Dashboard
curl http://localhost:8000/health
```

### Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable SSL in production
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption

### Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Check database connectivity
4. Verify API keys
5. Check RLS policies

### Migration Complete! 🎉

Your Supabase self-hosting instance is now ready for production use with:

- ✅ Complete database schema
- ✅ User roles and permissions
- ✅ Storage bucket setup
- ✅ RLS policies
- ✅ Sample data
- ✅ All application features

**Next steps:**
1. Test all functionality
2. Deploy to production
3. Set up monitoring
4. Configure backups
