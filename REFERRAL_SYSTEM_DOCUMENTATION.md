# Sistem Referral Training Center

## Overview

Sistem referral yang komprehensif untuk platform training center yang memungkinkan trainer untuk membuat kode referral, memberikan diskon kepada peserta, dan mendapatkan komisi dari setiap referral yang berhasil.

## Fitur Utama

### 1. **Manajemen Kode Referral**
- Generate kode referral unik untuk setiap trainer
- Konfigurasi diskon (persentase atau jumlah tetap)
- Konfigurasi komisi (persentase atau jumlah tetap)
- Batas penggunaan dan masa berlaku
- Aktivasi/nonaktifasi kode

### 2. **Tracking & Analytics**
- Real-time tracking setiap penggunaan kode referral
- Statistik komprehensif per trainer
- Statistik per program
- Trend bulanan
- Dashboard interaktif

### 3. **Sistem Reward**
- Komisi otomatis untuk trainer
- Tracking pembayaran komisi
- Multiple reward types (persentase/amount)

### 4. **UI/UX**
- Form enrollment dengan input kode referral
- Validasi real-time
- Preview harga setelah diskon
- Dashboard trainer yang intuitif

## Database Schema

### Tabel Utama

#### 1. `referral_codes`
```sql
- id (UUID, Primary Key)
- trainer_id (UUID, Foreign Key ke user_profiles)
- code (VARCHAR(20), Unique)
- description (TEXT, Optional)
- is_active (BOOLEAN)
- max_uses (INTEGER, Optional)
- current_uses (INTEGER)
- discount_percentage (DECIMAL(5,2))
- discount_amount (DECIMAL(10,2))
- commission_percentage (DECIMAL(5,2))
- commission_amount (DECIMAL(10,2))
- valid_from (TIMESTAMP)
- valid_until (TIMESTAMP, Optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `referral_tracking`
```sql
- id (UUID, Primary Key)
- referral_code_id (UUID, Foreign Key)
- trainer_id (UUID, Foreign Key)
- participant_id (UUID, Foreign Key)
- enrollment_id (UUID, Foreign Key)
- program_id (UUID, Foreign Key)
- class_id (UUID, Foreign Key, Optional)
- discount_applied (DECIMAL(10,2))
- commission_earned (DECIMAL(10,2))
- status (VARCHAR(20)) -- pending, confirmed, cancelled
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `referral_rewards`
```sql
- id (UUID, Primary Key)
- trainer_id (UUID, Foreign Key)
- referral_tracking_id (UUID, Foreign Key)
- amount (DECIMAL(10,2))
- payment_status (VARCHAR(20)) -- pending, paid, cancelled
- payment_method (VARCHAR(50))
- payment_reference (TEXT)
- paid_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabel yang Dimodifikasi

#### `enrollments`
```sql
-- Field tambahan:
- referral_code_id (UUID, Foreign Key, Optional)
- referral_discount (DECIMAL(10,2))
- final_price (DECIMAL(10,2))
```

## API Endpoints

### 1. **Referral Codes Management**

#### `GET /api/referral/codes`
Mengambil daftar kode referral untuk trainer yang login.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "TRN001",
      "description": "Kode referral untuk program baru",
      "is_active": true,
      "max_uses": 100,
      "current_uses": 5,
      "discount_percentage": 10,
      "commission_percentage": 5,
      "stats": {
        "total_uses": 5,
        "confirmed": 3,
        "pending": 2,
        "total_commission": 50000
      }
    }
  ]
}
```

#### `POST /api/referral/codes`
Membuat kode referral baru.

**Request Body:**
```json
{
  "description": "Kode referral untuk program baru",
  "max_uses": 100,
  "discount_percentage": 10,
  "discount_amount": 0,
  "commission_percentage": 5,
  "commission_amount": 0,
  "valid_until": "2024-12-31T23:59:59Z"
}
```

#### `PUT /api/referral/codes`
Mengupdate kode referral.

#### `DELETE /api/referral/codes?id={id}`
Menghapus kode referral (hanya jika belum digunakan).

### 2. **Referral Application**

#### `GET /api/referral/apply?code={code}&program_id={id}`
Validasi kode referral.

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "referral_code": "TRN001",
    "trainer_name": "John Doe",
    "original_price": 1000000,
    "discount_amount": 100000,
    "final_price": 900000,
    "discount_type": "percentage",
    "discount_value": 10
  }
}
```

#### `POST /api/referral/apply`
Menerapkan kode referral saat enrollment.

**Request Body:**
```json
{
  "referral_code": "TRN001",
  "program_id": "uuid"
}
```

### 3. **Statistics**

#### `GET /api/referral/stats?period={period}`
Mengambil statistik referral.

**Query Parameters:**
- `period`: `all`, `week`, `month`, `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_stats": {
      "total_referrals": 50,
      "confirmed_referrals": 45,
      "total_commission_earned": 5000000
    },
    "period_stats": {
      "total_referrals": 10,
      "confirmed_referrals": 8,
      "total_commission": 800000
    },
    "recent_referrals": [...],
    "program_stats": [...],
    "monthly_trend": [...]
  }
}
```

## Database Functions

### 1. `generate_referral_code(trainer_name)`
Generate kode referral unik berdasarkan nama trainer.

### 2. `create_trainer_referral_code(...)`
Membuat kode referral baru untuk trainer.

### 3. `apply_referral_code(code, program_id, participant_id)`
Menerapkan kode referral dan menghitung diskon/komisi.

### 4. `track_referral_enrollment(...)`
Tracking penggunaan kode referral saat enrollment.

### 5. `update_referral_status(enrollment_id, new_status)`
Update status referral saat status enrollment berubah.

## Views

### 1. `trainer_referral_stats`
Statistik referral per trainer.

### 2. `program_referral_stats`
Statistik referral per program.

## Triggers

### `trigger_enrollment_status_change`
Otomatis update status referral saat status enrollment berubah.

## Komponen UI

### 1. `ReferralCodeInput`
Komponen input kode referral di halaman enrollment.

**Props:**
- `programId`: ID program
- `onReferralApplied`: Callback saat referral berhasil diterapkan
- `onReferralRemoved`: Callback saat referral dihapus
- `initialCode`: Kode referral awal (dari URL)

### 2. `ReferralDashboard`
Dashboard lengkap untuk trainer mengelola referral.

**Fitur:**
- Statistik real-time
- Manajemen kode referral
- Tabel referral terbaru
- Statistik per program

### 3. `ReferralCodeForm`
Form untuk membuat/edit kode referral.

**Fitur:**
- Validasi input
- Preview konfigurasi
- Support diskon persentase/amount
- Support komisi persentase/amount

## Workflow

### 1. **Pembuatan Kode Referral**
1. Trainer login ke dashboard
2. Klik "Buat Kode Referral"
3. Isi form konfigurasi
4. Sistem generate kode unik
5. Kode siap digunakan

### 2. **Penggunaan Kode Referral**
1. Peserta buka halaman enrollment program
2. Masukkan kode referral (opsional)
3. Sistem validasi kode
4. Tampilkan preview harga setelah diskon
5. Peserta lanjutkan enrollment
6. Sistem tracking referral

### 3. **Tracking & Komisi**
1. Enrollment berhasil → status referral = "pending"
2. Enrollment approved → status referral = "confirmed"
3. Sistem create reward record
4. Trainer dapat lihat komisi di dashboard

## Security

### Row Level Security (RLS)
- Trainer hanya bisa akses kode referral mereka sendiri
- Peserta hanya bisa lihat referral tracking mereka
- Admin bisa akses semua data

### Validasi Input
- Kode referral harus unik
- Diskon/komisi tidak boleh negatif
- Persentase maksimal 100%
- Validasi tanggal masa berlaku

## Performance

### Indexes
- `idx_referral_codes_trainer_id`
- `idx_referral_codes_code`
- `idx_referral_tracking_trainer_id`
- `idx_referral_tracking_enrollment_id`

### Caching
- Statistik di-cache untuk performa dashboard
- Real-time updates untuk data penting

## Monitoring

### Logs
- Setiap penggunaan kode referral di-log
- Error tracking untuk debugging
- Performance monitoring

### Alerts
- Notifikasi saat kode referral hampir habis
- Alert untuk komisi yang belum dibayar

## Testing

### Unit Tests
- Database functions
- API endpoints
- UI components

### Integration Tests
- End-to-end referral workflow
- Payment integration
- Email notifications

## Deployment

### Database Migration
1. Jalankan `create-referral-system.sql`
2. Update existing enrollments dengan field baru
3. Test semua functions

### Application Update
1. Deploy API endpoints
2. Deploy UI components
3. Update navigation menu
4. Test end-to-end

## Maintenance

### Regular Tasks
- Cleanup expired referral codes
- Update statistics
- Process pending rewards
- Monitor performance

### Backup
- Backup referral data
- Backup reward records
- Test restore procedures

## Future Enhancements

### Planned Features
1. **Email Notifications**
   - Notifikasi saat referral berhasil
   - Reminder untuk komisi yang belum dibayar

2. **Advanced Analytics**
   - Conversion rate tracking
   - A/B testing untuk kode referral
   - Predictive analytics

3. **Multi-level Referral**
   - Referral chain (referral dari referral)
   - Tiered commission system

4. **Integration**
   - Payment gateway integration
   - CRM integration
   - Marketing automation

5. **Mobile App**
   - Mobile dashboard
   - Push notifications
   - QR code sharing

## Troubleshooting

### Common Issues

#### 1. Kode Referral Tidak Valid
**Penyebab:**
- Kode tidak aktif
- Sudah expired
- Mencapai batas penggunaan

**Solusi:**
- Cek status kode di dashboard
- Update konfigurasi jika perlu

#### 2. Komisi Tidak Muncul
**Penyebab:**
- Enrollment belum approved
- Error di tracking function

**Solusi:**
- Cek status enrollment
- Re-run tracking function

#### 3. Dashboard Loading Lambat
**Penyebab:**
- Data terlalu banyak
- Query tidak optimal

**Solusi:**
- Implement pagination
- Optimize queries
- Add caching

### Debug Mode
Aktifkan debug mode untuk melihat:
- Query logs
- Function execution
- Error details

## Support

### Documentation
- API documentation
- User guide
- Video tutorials

### Contact
- Technical support: tech@trainingcenter.com
- Feature requests: features@trainingcenter.com
- Bug reports: bugs@trainingcenter.com

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Author:** Training Center Development Team
