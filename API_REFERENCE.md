# 🔌 API Reference

Dokumentasi lengkap untuk Supabase queries dan operations di Training Center Management System.

## 📚 Table of Contents

- [Trainers API](#trainers-api)
- [Programs API](#programs-api)
- [Participants API](#participants-api)
- [Enrollments API](#enrollments-api)
- [Statistics Queries](#statistics-queries)

---

## Trainers API

### Get All Trainers

```typescript
const { data, error } = await supabase
  .from('trainers')
  .select('*')
  .order('created_at', { ascending: false })
```

**Response:**
```typescript
Trainer[] // Array of trainer objects
```

### Get Single Trainer

```typescript
const { data, error } = await supabase
  .from('trainers')
  .select('*')
  .eq('id', trainerId)
  .single()
```

**Response:**
```typescript
Trainer // Single trainer object
```

### Create Trainer

```typescript
const { error } = await supabase
  .from('trainers')
  .insert([{
    name: string,
    email: string,
    phone: string,
    specialization: string,
    bio?: string,
    experience_years: number,
    certification?: string,
    status: 'active' | 'inactive'
  }])
```

### Update Trainer

```typescript
const { error } = await supabase
  .from('trainers')
  .update({
    name?: string,
    email?: string,
    // ... other fields
  })
  .eq('id', trainerId)
```

### Delete Trainer

```typescript
const { error } = await supabase
  .from('trainers')
  .delete()
  .eq('id', trainerId)
```

### Filter Active Trainers

```typescript
const { data, error } = await supabase
  .from('trainers')
  .select('*')
  .eq('status', 'active')
  .order('name')
```

---

## Programs API

### Get All Programs

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .order('created_at', { ascending: false })
```

### Get Programs with Trainer Info

```typescript
const { data, error } = await supabase
  .from('programs')
  .select(`
    *,
    trainer:trainers(id, name, specialization)
  `)
  .order('created_at', { ascending: false })
```

**Response:**
```typescript
ProgramWithTrainer[] // Programs with nested trainer data
```

### Get Single Program

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .eq('id', programId)
  .single()
```

### Create Program

```typescript
const { error } = await supabase
  .from('programs')
  .insert([{
    title: string,
    description: string,
    category: string,
    duration_days: number,
    max_participants: number,
    price: number,
    status: 'draft' | 'published' | 'archived',
    start_date: string, // ISO date string
    end_date: string,   // ISO date string
    trainer_id?: string // UUID or null
  }])
```

### Update Program

```typescript
const { error } = await supabase
  .from('programs')
  .update({
    title?: string,
    description?: string,
    // ... other fields
  })
  .eq('id', programId)
```

### Delete Program

```typescript
const { error } = await supabase
  .from('programs')
  .delete()
  .eq('id', programId)
```

### Filter Published Programs

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .eq('status', 'published')
  .order('start_date')
```

### Filter by Category

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .eq('category', 'Leadership')
```

---

## Participants API

### Get All Participants

```typescript
const { data, error } = await supabase
  .from('participants')
  .select('*')
  .order('created_at', { ascending: false })
```

### Get Single Participant

```typescript
const { data, error } = await supabase
  .from('participants')
  .select('*')
  .eq('id', participantId)
  .single()
```

### Create Participant

```typescript
const { error } = await supabase
  .from('participants')
  .insert([{
    name: string,
    email: string,
    phone: string,
    company?: string,
    position?: string,
    address?: string,
    date_of_birth?: string,
    gender: 'male' | 'female' | 'other',
    status: 'active' | 'inactive'
  }])
```

### Update Participant

```typescript
const { error } = await supabase
  .from('participants')
  .update({
    name?: string,
    email?: string,
    // ... other fields
  })
  .eq('id', participantId)
```

### Delete Participant

```typescript
const { error } = await supabase
  .from('participants')
  .delete()
  .eq('id', participantId)
```

### Filter Active Participants

```typescript
const { data, error } = await supabase
  .from('participants')
  .select('*')
  .eq('status', 'active')
  .order('name')
```

---

## Enrollments API

### Get All Enrollments

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('*')
  .order('created_at', { ascending: false })
```

### Get Enrollments with Relations

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    program:programs(id, title, price),
    participant:participants(id, name, email, phone)
  `)
  .order('created_at', { ascending: false })
```

**Response:**
```typescript
EnrollmentWithDetails[] // Enrollments with nested program & participant
```

### Get Single Enrollment

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('*')
  .eq('id', enrollmentId)
  .single()
```

### Create Enrollment

```typescript
const { error } = await supabase
  .from('enrollments')
  .insert([{
    program_id: string,     // UUID
    participant_id: string, // UUID
    status: 'pending' | 'approved' | 'rejected' | 'completed',
    payment_status: 'unpaid' | 'partial' | 'paid',
    amount_paid: number,
    notes?: string
  }])
```

### Update Enrollment

```typescript
const { error } = await supabase
  .from('enrollments')
  .update({
    status?: 'pending' | 'approved' | 'rejected' | 'completed',
    payment_status?: 'unpaid' | 'partial' | 'paid',
    amount_paid?: number,
    notes?: string
  })
  .eq('id', enrollmentId)
```

### Delete Enrollment

```typescript
const { error } = await supabase
  .from('enrollments')
  .delete()
  .eq('id', enrollmentId)
```

### Filter by Status

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('*')
  .eq('status', 'approved')
```

### Filter by Payment Status

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('*')
  .eq('payment_status', 'paid')
```

### Get Enrollments for a Program

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    participant:participants(name, email)
  `)
  .eq('program_id', programId)
```

### Get Enrollments for a Participant

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    program:programs(title, start_date, end_date)
  `)
  .eq('participant_id', participantId)
```

---

## Statistics Queries

### Count All Records

```typescript
// Count programs
const { count: programCount } = await supabase
  .from('programs')
  .select('id', { count: 'exact', head: true })

// Count participants
const { count: participantCount } = await supabase
  .from('participants')
  .select('id', { count: 'exact', head: true })

// Count trainers
const { count: trainerCount } = await supabase
  .from('trainers')
  .select('id', { count: 'exact', head: true })

// Count enrollments
const { count: enrollmentCount } = await supabase
  .from('enrollments')
  .select('id', { count: 'exact', head: true })
```

### Programs by Category

```typescript
const { data: programs } = await supabase
  .from('programs')
  .select('category')

// Group in JavaScript
const categoryCounts = programs?.reduce((acc, program) => {
  acc[program.category] = (acc[program.category] || 0) + 1
  return acc
}, {})
```

### Enrollments by Status

```typescript
const { data: enrollments } = await supabase
  .from('enrollments')
  .select('status')

// Group in JavaScript
const statusCounts = enrollments?.reduce((acc, enrollment) => {
  acc[enrollment.status] = (acc[enrollment.status] || 0) + 1
  return acc
}, {})
```

### Recent Enrollments (Last 5)

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    program:programs(title),
    participant:participants(name, email)
  `)
  .order('created_at', { ascending: false })
  .limit(5)
```

### Monthly Enrollments Trend

```typescript
const { data: enrollments } = await supabase
  .from('enrollments')
  .select('enrollment_date')
  .order('enrollment_date')

// Group by month in JavaScript
const monthCounts = {}
enrollments?.forEach((enrollment) => {
  const date = new Date(enrollment.enrollment_date)
  const monthKey = date.toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'short' 
  })
  monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
})
```

### Revenue by Program

```typescript
const { data } = await supabase
  .from('programs')
  .select(`
    id,
    title,
    price,
    enrollments(amount_paid)
  `)

// Calculate revenue in JavaScript
const programsWithRevenue = data?.map((program) => ({
  title: program.title,
  price: program.price,
  revenue: program.enrollments?.reduce(
    (sum, e) => sum + (e.amount_paid || 0), 
    0
  ) || 0,
  enrollmentCount: program.enrollments?.length || 0
}))
```

### Trainer Performance

```typescript
const { data: programs } = await supabase
  .from('programs')
  .select(`
    *,
    trainer:trainers(id, name)
  `)

// Group by trainer in JavaScript
const trainerStats = {}
programs?.forEach((program) => {
  if (program.trainer) {
    const trainerId = program.trainer.id
    if (!trainerStats[trainerId]) {
      trainerStats[trainerId] = {
        name: program.trainer.name,
        totalPrograms: 0
      }
    }
    trainerStats[trainerId].totalPrograms += 1
  }
})
```

---

## 🔍 Advanced Queries

### Full Text Search (Programs)

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .textSearch('title', 'leadership', {
    type: 'websearch',
    config: 'english'
  })
```

### Range Queries (Date)

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .gte('start_date', '2025-01-01')
  .lte('end_date', '2025-12-31')
```

### Pagination

```typescript
const pageSize = 10
const page = 0

const { data, error } = await supabase
  .from('programs')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
```

### Combining Filters

```typescript
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .eq('status', 'published')
  .eq('category', 'Leadership')
  .gte('price', 1000000)
  .order('start_date')
```

---

## ⚠️ Error Handling

All queries return an object with `data` and `error`:

```typescript
const { data, error } = await supabase.from('table').select('*')

if (error) {
  console.error('Error:', error.message)
  // Handle error
  return
}

// Use data
console.log(data)
```

### Common Error Codes

- `PGRST116` - No rows found (404)
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42501` - Insufficient privilege (RLS)

---

## 🔐 Row Level Security (RLS)

Current policies (from schema.sql):

```sql
-- All tables allow full access for development
-- In production, implement proper RLS based on user roles
CREATE POLICY "Enable read access for all users" ON table_name FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON table_name FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON table_name FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON table_name FOR DELETE USING (true);
```

### Production RLS Example

```sql
-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert" 
  ON trainers FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can only update their own data
CREATE POLICY "Users can update own data" 
  ON participants FOR UPDATE 
  USING (auth.uid() = user_id);
```

---

## 📝 Type Safety

All queries are type-safe with TypeScript:

```typescript
import { Trainer, Program, Participant, Enrollment } from '@/types'

const { data, error } = await supabase
  .from('trainers')
  .select('*')

// data is typed as Trainer[] | null
// TypeScript autocomplete works!
```

---

## 🚀 Best Practices

1. **Always handle errors**
   ```typescript
   if (error) {
     console.error(error)
     // Show user-friendly message
     return
   }
   ```

2. **Use specific selects**
   ```typescript
   // Good - only select needed fields
   .select('id, name, email')
   
   // Avoid - select all if not needed
   .select('*')
   ```

3. **Add loading states**
   ```typescript
   const [loading, setLoading] = useState(true)
   setLoading(false) // after query
   ```

4. **Use relations wisely**
   ```typescript
   // Good - one query with join
   .select('*, trainer:trainers(name)')
   
   // Avoid - multiple queries
   const program = await getProgram()
   const trainer = await getTrainer(program.trainer_id)
   ```

5. **Implement pagination for large datasets**
   ```typescript
   .range(start, end)
   ```

