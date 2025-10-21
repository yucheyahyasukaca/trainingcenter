# Admin Notification System Guide

## 🎯 Overview
Sistem notifikasi admin yang komprehensif untuk GARUDA-21 Training Center dengan fitur auto-close, duplicate prevention, dan management tools.

## 🚀 Features

### ✅ **Fixed Issues:**
- **Auto-close**: Notifikasi otomatis menutup setelah 5 detik (default)
- **Close Button**: Tombol X berfungsi dengan animasi smooth
- **Duplicate Prevention**: Mencegah notifikasi duplikat
- **Max Limit**: Maksimal 5 notifikasi sekaligus
- **Session Management**: Mencegah notifikasi duplikat saat refresh

### 🎨 **UI Components:**
1. **NotificationProvider** - Context provider untuk notifikasi
2. **AdminNotificationPanel** - Panel notifikasi dengan filter dan search
3. **NotificationTestPanel** - Panel testing untuk development
4. **NotificationReset** - Tools untuk reset dan clear

## 📱 **Usage**

### Basic Notification
```tsx
import { useNotification } from '@/components/ui/Notification'

const { addNotification } = useNotification()

addNotification({
  type: 'success',
  title: 'Berhasil!',
  message: 'Data telah disimpan',
  duration: 5000 // 5 detik, 0 = tidak auto-close
})
```

### Admin Notifications
```tsx
import { useAdminNotifications } from '@/components/admin/AdminNotificationSystem'

const { addNotification } = useAdminNotifications()

addNotification({
  type: 'user',
  priority: 'high',
  title: 'Pendaftaran Baru',
  message: '5 peserta baru mendaftar',
  actionRequired: true
})
```

## 🎛️ **Notification Types**

### Toast Notifications (useNotification)
- `success` - Hijau dengan checkmark
- `error` - Merah dengan X
- `warning` - Kuning dengan alert
- `info` - Biru dengan info

### Admin Notifications (useAdminNotifications)
- `user` - Pengguna
- `program` - Program
- `payment` - Pembayaran
- `system` - Sistem
- `security` - Keamanan
- `maintenance` - Pemeliharaan

### Priority Levels
- `low` - Biru
- `medium` - Kuning
- `high` - Orange
- `critical` - Merah

## 🔧 **Configuration**

### Auto-close Duration
```tsx
// Default: 5000ms (5 detik)
addNotification({
  type: 'success',
  title: 'Success',
  message: 'Message',
  duration: 3000 // 3 detik
})

// No auto-close
addNotification({
  type: 'info',
  title: 'Info',
  message: 'Message',
  duration: 0 // Tidak auto-close
})
```

### Max Notifications
```tsx
// Di NotificationProvider
const MAX_NOTIFICATIONS = 5 // Default: 5
```

## 🧪 **Testing**

### Test Panel Location
- Buka Admin Dashboard
- Pilih tab "Analisis"
- Scroll ke bawah untuk melihat "Test Notification System"

### Test Features
- **Auto Notifications**: Toggle untuk enable/disable auto-generate
- **Clear All**: Hapus semua notifikasi
- **Reset**: Reset semua dan reload halaman
- **Category Tests**: Test berbagai jenis notifikasi

## 🐛 **Troubleshooting**

### Notifikasi Tidak Auto-close
1. Pastikan `duration` tidak 0
2. Check console untuk error
3. Gunakan "Reset" button untuk clear session

### Notifikasi Duplikat
1. Sistem sudah prevent duplikat otomatis
2. Jika masih ada, gunakan "Clear All"
3. Check apakah ada multiple `useEffect` yang trigger

### Notifikasi Menumpuk
1. Max limit sudah di-set ke 5
2. Notifikasi lama akan otomatis dihapus
3. Gunakan "Clear All" untuk reset

## 📝 **Best Practices**

### 1. **Duration Guidelines**
- Success: 3000-5000ms
- Error: 8000-10000ms
- Warning: 5000-8000ms
- Info: 3000-5000ms

### 2. **Priority Guidelines**
- Critical: Security alerts, system down
- High: Payment issues, deadline warnings
- Medium: User actions, program updates
- Low: System status, backups

### 3. **Message Guidelines**
- Keep title short (< 50 chars)
- Message should be descriptive
- Use Indonesian language
- Include relevant data (amounts, names, etc.)

## 🔄 **Reset & Clear**

### Session Storage Keys
- `admin-notifications-initialized` - Prevent duplicate welcome notifications
- `admin-auto-notifications` - Enable/disable auto notifications

### Manual Reset
```javascript
// Clear session storage
sessionStorage.clear()

// Or specific keys
sessionStorage.removeItem('admin-notifications-initialized')
sessionStorage.removeItem('admin-auto-notifications')

// Reload page
window.location.reload()
```

## 🎉 **Ready to Use!**

Sistem notifikasi admin sudah siap digunakan dengan semua fitur yang diperlukan untuk memberikan feedback yang baik kepada admin dalam mengelola sistem GARUDA-21.
