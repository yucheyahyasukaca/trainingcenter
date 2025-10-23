# 🎯 Sistem Referral Policy - Solusi Terkontrol

## 📋 Overview

Sistem referral policy yang baru memberikan kontrol penuh kepada admin untuk mengatur diskon dan komisi referral, menghilangkan potensi abuse dan memastikan konsistensi pricing.

## 🚀 Keunggulan Sistem Baru

### ✅ **Admin-Controlled Policy System**
- **Admin set policy per program** → Kontrol penuh atas diskon & komisi
- **Consistent pricing** → Semua kode referral sama untuk program yang sama
- **No abuse potential** → Trainer tidak bisa set diskon 100%
- **Business logic** → Sesuai dengan strategi bisnis

### ✅ **Trainer Experience**
- **Simple process** → Trainer hanya buat kode, tidak perlu setting
- **Focus on promotion** → Fokus pada promosi, bukan angka
- **Guaranteed commission** → Komisi sudah ditentukan admin
- **No confusion** → Tidak perlu mikir diskon berapa

### ✅ **User Experience**
- **Consistent discount** → Semua kode sama untuk program yang sama
- **Clear pricing** → User tahu pasti diskon yang didapat
- **No confusion** → Tidak ada kode dengan diskon berbeda
- **Trust** → Percaya dengan sistem yang konsisten

## 🏗️ Arsitektur Sistem

### **Database Schema**

#### 1. **referral_policies** (Tabel Utama)
```sql
CREATE TABLE referral_policies (
    id UUID PRIMARY KEY,
    program_id UUID REFERENCES programs(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Policy untuk peserta (diskon)
    participant_discount_percentage DECIMAL(5,2) DEFAULT 0,
    participant_discount_amount DECIMAL(10,2) DEFAULT 0,
    participant_discount_type VARCHAR(20) DEFAULT 'percentage',
    
    -- Policy untuk referrer (komisi)
    referrer_commission_percentage DECIMAL(5,2) DEFAULT 0,
    referrer_commission_amount DECIMAL(10,2) DEFAULT 0,
    referrer_commission_type VARCHAR(20) DEFAULT 'percentage',
    
    -- Batasan penggunaan
    max_uses_per_code INTEGER DEFAULT NULL,
    max_total_uses INTEGER DEFAULT NULL,
    
    -- Validitas
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Metadata
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **referral_codes** (Updated)
```sql
-- Hapus kolom diskon dan komisi (sekarang dari policy)
ALTER TABLE referral_codes 
DROP COLUMN IF EXISTS discount_percentage,
DROP COLUMN IF EXISTS discount_amount,
DROP COLUMN IF EXISTS commission_percentage,
DROP COLUMN IF EXISTS commission_amount;

-- Tambah kolom policy
ALTER TABLE referral_codes 
ADD COLUMN policy_id UUID REFERENCES referral_policies(id);
```

### **API Endpoints**

#### 1. **Admin Management**
- `GET /api/admin/referral-policies` - List semua policies
- `POST /api/admin/referral-policies` - Buat policy baru
- `PUT /api/admin/referral-policies/[id]` - Update policy
- `DELETE /api/admin/referral-policies/[id]` - Hapus policy

#### 2. **Program Management**
- `GET /api/programs` - List program untuk policy

#### 3. **Referral Code Management** (Updated)
- `POST /api/referral/codes` - Buat kode dengan policy
- `GET /api/referral/codes` - List kode dengan policy info

### **Functions**

#### 1. **create_referral_policy()**
```sql
CREATE FUNCTION create_referral_policy(
    p_program_id UUID,
    p_created_by UUID,
    p_participant_discount_percentage DECIMAL(5,2) DEFAULT 0,
    p_participant_discount_amount DECIMAL(10,2) DEFAULT 0,
    p_participant_discount_type VARCHAR(20) DEFAULT 'percentage',
    p_referrer_commission_percentage DECIMAL(5,2) DEFAULT 0,
    p_referrer_commission_amount DECIMAL(10,2) DEFAULT 0,
    p_referrer_commission_type VARCHAR(20) DEFAULT 'percentage',
    p_max_uses_per_code INTEGER DEFAULT NULL,
    p_max_total_uses INTEGER DEFAULT NULL,
    p_valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID
```

#### 2. **create_referral_code_with_policy()**
```sql
CREATE FUNCTION create_referral_code_with_policy(
    p_trainer_id UUID,
    p_trainer_name VARCHAR(255),
    p_program_id UUID,
    p_description TEXT DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE(id UUID, code VARCHAR(20), message TEXT)
```

#### 3. **apply_referral_code_with_policy()**
```sql
CREATE FUNCTION apply_referral_code_with_policy(
    p_referral_code VARCHAR(20),
    p_program_id UUID,
    p_participant_id UUID,
    p_enrollment_id UUID,
    p_class_id UUID DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    discount_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    message TEXT
)
```

## 🎯 Workflow Sistem

### **1. Admin Setup Policy**
```
Admin → /admin/referral-policies → Buat Policy
├── Pilih Program
├── Set Diskon Peserta (10% atau Rp 100.000)
├── Set Komisi Referrer (5% atau Rp 50.000)
├── Set Batasan Penggunaan
└── Set Validitas
```

### **2. Trainer Buat Kode**
```
Trainer → /trainer/referral → Buat Kode
├── Pilih Program (yang sudah ada policy)
├── Input Deskripsi
├── Set Max Penggunaan (optional)
└── System auto-apply policy
```

### **3. User Apply Kode**
```
User → Program Detail → Input Kode
├── System validate kode
├── System apply policy discount
├── System calculate commission
└── System track referral
```

## 📊 Contoh Implementasi

### **Scenario: AI Masterclass Program**

#### **Admin Set Policy:**
```
Program: "AI Masterclass" (Rp 1.000.000)
Policy:
├── Diskon peserta: 10% (Rp 100.000)
├── Komisi referrer: 5% (Rp 50.000)
├── Max penggunaan per kode: 100
├── Max total penggunaan: 1000
└── Berlaku hingga: 31 Des 2024
```

#### **Trainer Buat Kode:**
```
Trainer A: "REF001" - "Diskon 10% untuk AI Masterclass"
Trainer B: "REF002" - "Dapatkan diskon khusus AI Masterclass"
Trainer C: "REF003" - "Join AI Masterclass dengan harga special"
```

#### **User Experience:**
```
Semua kode memberikan diskon yang sama: 10% (Rp 100.000)
Harga final: Rp 900.000
Trainer dapat komisi: Rp 50.000
```

## 🔧 Komponen UI

### **1. Admin Interface**
- **ReferralPolicyManager.tsx** - Kelola policies
- **Policy Form** - Buat/edit policy dengan validasi
- **Policy List** - Tabel dengan filter dan search
- **Policy Stats** - Dashboard statistik

### **2. Trainer Interface**
- **ReferralDashboard.tsx** - Dashboard referral (updated)
- **ReferralCodeForm.tsx** - Form buat kode (simplified)
- **Code List** - List kode dengan policy info

### **3. User Interface**
- **ReferralCodeSection.tsx** - Tampilkan kode di program
- **ReferralCodeInput.tsx** - Input kode saat enroll

## 🚀 Keuntungan Bisnis

### **1. Kontrol Penuh**
- ✅ Admin kontrol 100% atas pricing
- ✅ Tidak ada abuse dari trainer
- ✅ Konsistensi brand dan pricing
- ✅ Sesuai dengan strategi bisnis

### **2. User Experience**
- ✅ Konsistensi diskon
- ✅ Kepercayaan user
- ✅ Tidak ada konfusi
- ✅ Transparansi pricing

### **3. Trainer Experience**
- ✅ Proses sederhana
- ✅ Fokus promosi
- ✅ Komisi terjamin
- ✅ Tidak perlu mikir angka

### **4. Scalability**
- ✅ Mudah tambah program baru
- ✅ Mudah update policy
- ✅ Tracking lengkap
- ✅ Analytics mendalam

## 📈 Monitoring & Analytics

### **1. Policy Performance**
- Total policies created
- Active vs inactive policies
- Most popular programs
- Policy effectiveness

### **2. Referral Performance**
- Total codes created
- Codes usage rate
- Conversion rate
- Revenue generated

### **3. Trainer Performance**
- Top performing trainers
- Commission earned
- Codes created
- Conversion rate

## 🔒 Security & Validation

### **1. RLS Policies**
- Admin: Full CRUD access
- Trainer: View policies for their programs
- User: No direct access

### **2. Validation**
- Policy must exist before creating code
- Code must be valid and active
- Usage limits enforced
- Expiration dates respected

### **3. Audit Trail**
- All changes logged
- User actions tracked
- Policy history maintained
- Commission calculations recorded

## 🎉 Kesimpulan

Sistem referral policy yang baru memberikan:

1. **Kontrol penuh** kepada admin
2. **Konsistensi** dalam pricing
3. **Kemudahan** untuk trainer
4. **Kepercayaan** dari user
5. **Scalability** untuk masa depan

Sistem ini menghilangkan masalah abuse, memberikan kontrol bisnis yang lebih baik, dan meningkatkan user experience secara keseluruhan.

---

**Next Steps:**
1. ✅ Database schema created
2. ✅ API endpoints implemented
3. ✅ Admin UI completed
4. ✅ Trainer UI updated
5. ✅ User UI enhanced
6. 🔄 Testing & validation
7. 🔄 Production deployment
