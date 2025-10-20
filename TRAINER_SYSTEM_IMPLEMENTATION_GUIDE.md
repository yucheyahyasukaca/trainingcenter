# Trainer System Implementation Guide

## Overview
This guide explains how to implement the complete trainer system for the Training Center application. The system includes trainer management, program assignment, class management, and all necessary relationships.

## Database Schema Changes

### 1. Core Tables Created/Updated

#### `user_profiles` Table
- Central user management with roles (admin, manager, trainer, user)
- Links to all other entities

#### `trainers` Table
- Enhanced with additional fields:
  - `user_id`: Links to user_profiles
  - `hourly_rate`: Trainer's hourly rate
  - `availability_schedule`: JSON field for schedule management
  - `skills`: Array of trainer skills
  - `languages`: Array of languages spoken
  - `updated_at`: Timestamp tracking

#### `programs` Table
- Enhanced with additional fields:
  - `created_by`: User who created the program
  - `requirements`: Program requirements
  - `learning_objectives`: Array of learning objectives
  - `prerequisites`: Array of prerequisites
  - `updated_at`: Timestamp tracking

#### `classes` Table
- Enhanced with additional fields:
  - `materials_needed`: Array of required materials
  - `notes`: Additional class notes
  - `updated_at`: Timestamp tracking

#### `class_trainers` Table (New)
- Many-to-many relationship between classes and trainers
- Fields:
  - `class_id`: References classes table
  - `trainer_id`: References trainers table
  - `role`: Trainer role (instructor, assistant, mentor, coach)
  - `is_primary`: Whether this is the primary trainer
  - `assigned_date`: When trainer was assigned

#### `enrollments` Table
- Enhanced with additional fields:
  - `class_id`: Specific class enrollment
  - `completion_date`: When enrollment was completed
  - `certificate_issued`: Whether certificate was issued
  - `status`: Added 'cancelled' status
  - `payment_status`: Added 'refunded' status
  - `updated_at`: Timestamp tracking

### 2. Database Views Created

#### `trainer_statistics`
- Aggregated statistics for each trainer
- Includes total classes, programs, enrollments, and average hourly rate

#### `programs_with_trainers`
- Programs with trainer details and statistics
- Includes trainer name, email, specialization, experience
- Shows total classes and enrollments per program

#### `classes_with_trainers`
- Classes with trainer information and program details
- Shows all trainers assigned to each class
- Includes enrolled participant count

### 3. RLS Policies
- All tables have Row Level Security enabled
- Currently set to allow all operations (for development)
- Can be customized based on user roles and authentication

## TypeScript Types Updated

### New Interfaces Added

#### `TrainerWithStats`
```typescript
interface TrainerWithStats extends Trainer {
  total_classes?: number
  total_programs?: number
  total_enrollments?: number
  avg_hourly_rate?: number
}
```

#### `TrainerWithClasses`
```typescript
interface TrainerWithClasses extends Trainer {
  classes?: ClassWithTrainers[]
  programs?: Program[]
}
```

#### `TrainerAvailability`
```typescript
interface TrainerAvailability {
  trainer_id: string
  date: string
  available_slots: string[]
  is_available: boolean
}
```

#### `ClassSchedule`
```typescript
interface ClassSchedule {
  class_id: string
  class_name: string
  program_title: string
  trainer_name: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  room: string
  status: string
  enrolled_count: number
  max_participants: number
}
```

## Implementation Steps

### 1. Run Database Migration
Execute the `COMPLETE_TRAINER_SYSTEM_SETUP.sql` script in Supabase SQL Editor:

```sql
-- This will create all tables, relationships, indexes, and sample data
-- Run the entire script in Supabase SQL Editor
```

### 2. Update Frontend Components

#### Trainer Management
- Create trainer list page with filtering and search
- Add trainer creation/editing forms
- Implement trainer profile pages
- Add trainer availability management

#### Program Management
- Update program forms to include trainer assignment
- Add trainer selection dropdown
- Show trainer information in program details

#### Class Management
- Update class forms to support multiple trainers
- Add trainer assignment interface
- Show trainer roles and responsibilities

#### Dashboard Updates
- Add trainer statistics to dashboard
- Show trainer performance metrics
- Display upcoming classes by trainer

### 3. API Functions to Implement

#### Trainer Functions
```typescript
// Get all trainers with optional filtering
async function getTrainers(filters?: {
  status?: 'active' | 'inactive'
  specialization?: string
  skills?: string[]
})

// Get trainer by ID with statistics
async function getTrainerById(id: string): Promise<TrainerWithStats>

// Create new trainer
async function createTrainer(trainer: TrainerInsert): Promise<Trainer>

// Update trainer
async function updateTrainer(id: string, updates: TrainerUpdate): Promise<Trainer>

// Assign trainer to class
async function assignTrainerToClass(classId: string, trainerId: string, role: string, isPrimary: boolean)

// Get trainer availability
async function getTrainerAvailability(trainerId: string, dateRange: { start: string, end: string })
```

#### Class Functions
```typescript
// Get classes with trainer information
async function getClassesWithTrainers(programId?: string): Promise<ClassWithTrainers[]>

// Assign multiple trainers to class
async function assignTrainersToClass(classId: string, trainers: {
  trainerId: string
  role: string
  isPrimary: boolean
}[])

// Get class schedule
async function getClassSchedule(dateRange: { start: string, end: string }): Promise<ClassSchedule[]>
```

### 4. Sample Data Included

The migration script includes sample data:
- 3 trainers with different specializations
- 3 programs with assigned trainers
- 4 classes with trainer assignments
- 4 participants with enrollments
- User profiles for all entities

### 5. Key Features Implemented

#### Trainer Roles
- **Instructor**: Primary teaching role
- **Assistant**: Supporting role
- **Mentor**: Guidance and support
- **Coach**: Performance improvement

#### Program-Trainer Relationship
- Programs can have a primary trainer
- Multiple trainers can be assigned to classes within programs
- Trainer specialization matching

#### Class Management
- Multiple trainers per class
- Role-based trainer assignments
- Primary trainer designation
- Materials and notes management

#### Enrollment System
- Class-specific enrollments
- Certificate tracking
- Completion status
- Payment status with refunds

## Next Steps

1. **Run the migration script** in Supabase
2. **Test the database** with sample queries
3. **Update frontend components** to use new types
4. **Implement API functions** for trainer management
5. **Add trainer-specific UI components**
6. **Test the complete workflow**

## Troubleshooting

### Common Issues

1. **Trainer table not found**: Make sure to run the complete migration script
2. **RLS errors**: Check that RLS policies are properly set up
3. **Type errors**: Ensure all TypeScript types are updated
4. **Foreign key errors**: Verify that referenced records exist

### Verification Queries

```sql
-- Check if trainers table exists
SELECT * FROM trainers LIMIT 5;

-- Check trainer statistics
SELECT * FROM trainer_statistics;

-- Check programs with trainers
SELECT * FROM programs_with_trainers;

-- Check classes with trainers
SELECT * FROM classes_with_trainers;
```

## Security Considerations

1. **RLS Policies**: Update policies based on user roles
2. **Data Validation**: Implement proper validation for all inputs
3. **Access Control**: Ensure users can only access appropriate data
4. **Audit Trail**: Consider adding audit logging for sensitive operations

This implementation provides a complete trainer management system with all necessary relationships and functionality for the Training Center application.
