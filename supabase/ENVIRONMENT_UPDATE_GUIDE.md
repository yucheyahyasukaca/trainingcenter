# Environment Variables Update Guide

## Supabase Cloud to Self-Hosting Migration

After running the migration scripts, update your environment variables:

### 1. Update `.env.local`

```bash
# Old Supabase Cloud (remove these)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# New Supabase Self-Hosting
NEXT_PUBLIC_SUPABASE_URL=http://your-self-hosted-domain:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### 2. Update `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 3. Verify Connection

Add this to your `lib/supabase.ts` for testing:

```typescript
// Test connection
supabase.from('user_profiles').select('count').then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error)
  } else {
    console.log('Supabase connected successfully!')
  }
})
```

### 4. Update Storage URLs

If you changed domains, update storage URLs in your code:

```typescript
// In file upload functions
const { data: { publicUrl } } = supabase.storage
  .from('payment-proofs')
  .getPublicUrl(filePath)

// Or use signed URLs (recommended)
const { data: signedUrlData } = await supabase.storage
  .from('payment-proofs')
  .createSignedUrl(filePath, 3600)
```

### 5. Test All Features

1. **Authentication**: Login/logout
2. **Database**: CRUD operations
3. **Storage**: File upload/download
4. **RLS**: Row Level Security
5. **Real-time**: Subscriptions (if used)

### 6. DNS and Domain Setup

If using custom domain:

```bash
# Update your DNS records
# Point your domain to your self-hosted Supabase instance

# Update environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-custom-domain.com
```

### 7. SSL Certificate

For production, ensure SSL is configured:

```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com

# Or using Docker with SSL
# Update your docker-compose.yml with SSL configuration
```

### 8. Backup Strategy

Set up regular backups:

```bash
# Database backup
pg_dump -h your-db-host -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Storage backup
# Copy storage files to backup location
```

### 9. Monitoring

Monitor your self-hosted instance:

```bash
# Check logs
docker logs supabase-db
docker logs supabase-api

# Check health
curl http://your-domain:8000/health
```

### 10. Troubleshooting

Common issues and solutions:

1. **Connection refused**: Check if services are running
2. **Authentication errors**: Verify JWT secret configuration
3. **RLS errors**: Check policy definitions
4. **Storage errors**: Verify bucket permissions
5. **CORS errors**: Update CORS settings in Supabase config

### 11. Performance Optimization

For better performance:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_enrollments_user_program 
ON enrollments(participant_id, program_id);

-- Analyze tables for query optimization
ANALYZE user_profiles;
ANALYZE programs;
ANALYZE enrollments;
```

### 12. Security Checklist

- [ ] Change default passwords
- [ ] Update JWT secret
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption

## Migration Complete! 🎉

Your Supabase self-hosting instance is now ready for production use.
