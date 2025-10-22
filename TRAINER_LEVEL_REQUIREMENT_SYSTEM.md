# 🎯 **Trainer Level Requirement System**

## 📋 **Overview**
Sistem ini memungkinkan setiap program memiliki spesifikasi minimal trainer level yang diperlukan untuk membuka kelas di program tersebut. Ini memastikan kualitas pelatihan dan mempertahankan standar yang sesuai dengan kompleksitas program.

## 🏗️ **Database Schema**

### **Tabel `programs`**
```sql
-- Kolom baru yang ditambahkan
min_trainer_level VARCHAR(20) DEFAULT 'trainer_l1' 
CHECK (min_trainer_level IN ('trainer_l1', 'trainer_l2', 'master_trainer'))
```

### **Level Hierarchy**
| Level | Hierarchy | Description | Access |
|-------|-----------|-------------|---------|
| `user` | 0 | Regular user | Hanya ikut program |
| `trainer_l1` | 1 | Trainer Level 1 | Buka kelas Level 1 |
| `trainer_l2` | 2 | Trainer Level 2 | Buka kelas Level 1 & 2 |
| `master_trainer` | 3 | Master Trainer | Buka kelas semua level |

## 🔧 **Database Functions**

### **1. `can_trainer_create_class(trainer_id, program_id)`**
```sql
-- Cek apakah trainer bisa buat kelas untuk program tertentu
SELECT can_trainer_create_class('trainer-uuid', 'program-uuid');
-- Returns: BOOLEAN
```

### **2. `get_program_trainer_requirements(program_id)`**
```sql
-- Dapatkan requirement trainer untuk program
SELECT * FROM get_program_trainer_requirements('program-uuid');
-- Returns: program_title, min_trainer_level, level_description, level_color
```

## 🎨 **UI Implementation**

### **1. Form Create/Edit Program**
- **Field**: "Level Trainer Minimum"
- **Options**: 
  - Trainer Level 1 (Dasar)
  - Trainer Level 2 (Menengah) 
  - Master Trainer (Mahir)
- **Default**: Trainer Level 1

### **2. Program Display**
- **Program Cards**: Menampilkan "Min Trainer: Level X" jika bukan Level 1
- **Icon**: BookOpen dengan warna biru
- **Conditional**: Hanya tampil jika min_trainer_level != 'trainer_l1'

### **3. Trainer Dashboard**
- **Class Creation**: Hanya tampilkan program yang bisa diakses trainer
- **Validation**: Cek level trainer vs requirement program
- **Filter**: Otomatis filter program berdasarkan level trainer

### **4. Trainer Classes Page**
- **Program Selection**: Dropdown hanya menampilkan program yang bisa diakses
- **Requirement Display**: Tampilkan "(Min: L2)" atau "(Min: Master)" di option
- **Error Message**: "Tidak ada program yang tersedia untuk level trainer Anda"

## 🔍 **Validation Logic**

### **Frontend Validation**
```typescript
const canCreateClassForProgram = (programMinLevel: string) => {
  const trainerLevel = profile?.trainer_level || 'user'
  const levelHierarchy = {
    'user': 0,
    'trainer_l1': 1,
    'trainer_l2': 2,
    'master_trainer': 3
  }
  
  return (levelHierarchy[trainerLevel] || 0) >= 
         (levelHierarchy[programMinLevel] || 0)
}
```

### **Backend Validation**
```sql
-- Function di database
CREATE OR REPLACE FUNCTION can_trainer_create_class(
    p_trainer_id UUID,
    p_program_id UUID
)
RETURNS BOOLEAN AS $$
-- Logic validation di sini
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 **Default Assignment**

### **Auto Assignment Berdasarkan Category**
```sql
UPDATE programs 
SET min_trainer_level = CASE 
    WHEN category = 'Leadership' THEN 'master_trainer'
    WHEN category = 'Management' THEN 'trainer_l2'
    WHEN category = 'Technology' THEN 'trainer_l1'
    WHEN category = 'Marketing' THEN 'trainer_l1'
    WHEN category = 'Finance' THEN 'trainer_l2'
    ELSE 'trainer_l1'
END
WHERE min_trainer_level IS NULL;
```

## 🎯 **User Experience**

### **Untuk Admin/Manager**
1. **Create Program**: Pilih level trainer minimum
2. **Edit Program**: Update requirement level
3. **View Programs**: Lihat requirement di program cards

### **Untuk Trainer**
1. **Dashboard**: Hanya lihat program yang bisa diakses
2. **Create Class**: Dropdown terfilter berdasarkan level
3. **Class Management**: Validasi otomatis saat buat kelas

### **Untuk User**
1. **Program List**: Lihat requirement level di program cards
2. **Enrollment**: Tidak terpengaruh oleh trainer level requirement

## 🔄 **Migration Steps**

### **Step 1: Database Migration**
```bash
# Jalankan di Supabase SQL Editor
psql -f supabase/ADD_MIN_TRAINER_LEVEL_TO_PROGRAMS.sql
```

### **Step 2: Update Types**
```typescript
// types/database.ts sudah diupdate
min_trainer_level: 'trainer_l1' | 'trainer_l2' | 'master_trainer'
```

### **Step 3: Update Forms**
- ✅ `app/programs/new/page.tsx` - Form create program
- ✅ `app/programs/[id]/edit/page.tsx` - Form edit program

### **Step 4: Update Trainer Pages**
- ✅ `components/dashboard/TrainerDashboard.tsx` - Dashboard trainer
- ✅ `app/trainer/classes/page.tsx` - Kelas trainer
- ✅ `app/trainer/classes/new/page.tsx` - Buat kelas baru

### **Step 5: Update Display**
- ✅ `app/programs/page.tsx` - Program list display

## 🎉 **Benefits**

### **1. Quality Control**
- Memastikan trainer dengan level yang sesuai mengajar program
- Mencegah trainer level rendah mengajar program kompleks

### **2. Clear Expectations**
- Trainer tahu program mana yang bisa diakses
- Admin tahu requirement untuk setiap program

### **3. Scalable System**
- Mudah menambah level trainer baru
- Flexible assignment berdasarkan category

### **4. User Experience**
- UI yang intuitif dengan validasi real-time
- Error message yang jelas dan helpful

## 🚀 **Next Steps**

1. **Test Migration**: Jalankan script database
2. **Test Forms**: Coba create/edit program dengan level requirement
3. **Test Trainer Flow**: Coba buat kelas sebagai trainer dengan level berbeda
4. **Monitor**: Lihat bagaimana sistem bekerja dengan data real

## 📝 **Notes**

- **Backward Compatibility**: Program existing otomatis dapat default 'trainer_l1'
- **Performance**: Index pada min_trainer_level untuk query cepat
- **Security**: Function dengan SECURITY DEFINER untuk validasi server-side
- **Flexibility**: Mudah diubah requirement per program

---

**Sistem ini memastikan kualitas pelatihan dengan mempertahankan standar yang sesuai dengan kompleksitas program!** 🎯
