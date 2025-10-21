// Admin notification utility functions

export interface AdminNotificationData {
  type: 'user' | 'program' | 'payment' | 'system' | 'security' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  actionRequired?: boolean
  data?: any
}

// Predefined notification templates for common admin actions
export const AdminNotificationTemplates = {
  // User management notifications
  userRegistered: (userName: string, programName: string): AdminNotificationData => ({
    type: 'user',
    priority: 'medium',
    title: 'Pendaftaran Baru',
    message: `${userName} mendaftar program ${programName}`,
    actionRequired: false
  }),

  userProfileUpdated: (userName: string): AdminNotificationData => ({
    type: 'user',
    priority: 'low',
    title: 'Profil Diperbarui',
    message: `Profil ${userName} telah diperbarui`,
    actionRequired: false
  }),

  userStatusChanged: (userName: string, status: string): AdminNotificationData => ({
    type: 'user',
    priority: 'medium',
    title: 'Status Pengguna Diubah',
    message: `${userName} status diubah menjadi ${status}`,
    actionRequired: true
  }),

  // Program management notifications
  programCreated: (programName: string): AdminNotificationData => ({
    type: 'program',
    priority: 'medium',
    title: 'Program Baru Dibuat',
    message: `Program "${programName}" telah dibuat`,
    actionRequired: false
  }),

  programUpdated: (programName: string): AdminNotificationData => ({
    type: 'program',
    priority: 'low',
    title: 'Program Diperbarui',
    message: `Program "${programName}" telah diperbarui`,
    actionRequired: false
  }),

  programDeleted: (programName: string): AdminNotificationData => ({
    type: 'program',
    priority: 'high',
    title: 'Program Dihapus',
    message: `Program "${programName}" telah dihapus`,
    actionRequired: true
  }),

  programDeadlineApproaching: (programName: string, daysLeft: number): AdminNotificationData => ({
    type: 'program',
    priority: daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'high' : 'medium',
    title: 'Program Mendekati Deadline',
    message: `Program "${programName}" akan berakhir dalam ${daysLeft} hari`,
    actionRequired: true
  }),

  // Payment notifications
  paymentReceived: (amount: number, userName: string): AdminNotificationData => ({
    type: 'payment',
    priority: 'medium',
    title: 'Pembayaran Diterima',
    message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} dari ${userName} telah diterima`,
    actionRequired: false
  }),

  paymentFailed: (amount: number, userName: string): AdminNotificationData => ({
    type: 'payment',
    priority: 'high',
    title: 'Pembayaran Gagal',
    message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} dari ${userName} gagal`,
    actionRequired: true
  }),

  paymentRefunded: (amount: number, userName: string): AdminNotificationData => ({
    type: 'payment',
    priority: 'high',
    title: 'Pembayaran Dikembalikan',
    message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} kepada ${userName} telah dikembalikan`,
    actionRequired: true
  }),

  // System notifications
  systemBackupCompleted: (): AdminNotificationData => ({
    type: 'system',
    priority: 'low',
    title: 'Backup Berhasil',
    message: 'Backup data harian telah berhasil diselesaikan',
    actionRequired: false
  }),

  systemMaintenanceScheduled: (date: string, time: string): AdminNotificationData => ({
    type: 'maintenance',
    priority: 'high',
    title: 'Pemeliharaan Sistem Dijadwalkan',
    message: `Pemeliharaan sistem akan dilakukan pada ${date} pukul ${time}`,
    actionRequired: true
  }),

  systemUpdateAvailable: (version: string): AdminNotificationData => ({
    type: 'system',
    priority: 'medium',
    title: 'Update Sistem Tersedia',
    message: `Versi ${version} telah tersedia dengan fitur keamanan yang ditingkatkan`,
    actionRequired: false
  }),

  // Security notifications
  securityAlert: (alertType: string, details: string): AdminNotificationData => ({
    type: 'security',
    priority: 'critical',
    title: 'Peringatan Keamanan',
    message: `${alertType}: ${details}`,
    actionRequired: true
  }),

  loginAttemptFailed: (email: string, attempts: number): AdminNotificationData => ({
    type: 'security',
    priority: attempts >= 5 ? 'critical' : 'high',
    title: 'Gagal Login Berulang',
    message: `${email} gagal login ${attempts} kali berturut-turut`,
    actionRequired: attempts >= 5
  }),

  // Manager management notifications
  managerCreated: (managerName: string, division: string): AdminNotificationData => ({
    type: 'user',
    priority: 'medium',
    title: 'Manager Baru Ditambahkan',
    message: `${managerName} telah ditambahkan sebagai manager divisi ${division}`,
    actionRequired: false
  }),

  managerUpdated: (managerName: string): AdminNotificationData => ({
    type: 'user',
    priority: 'low',
    title: 'Manager Diperbarui',
    message: `Data ${managerName} telah diperbarui`,
    actionRequired: false
  }),

  managerDeleted: (managerName: string): AdminNotificationData => ({
    type: 'user',
    priority: 'high',
    title: 'Manager Dihapus',
    message: `${managerName} telah dihapus dari sistem`,
    actionRequired: true
  }),

  managerStatusChanged: (managerName: string, status: string): AdminNotificationData => ({
    type: 'user',
    priority: 'medium',
    title: 'Status Manager Diubah',
    message: `${managerName} status diubah menjadi ${status}`,
    actionRequired: true
  })
}

// Helper function to create custom notifications
export const createCustomNotification = (
  type: AdminNotificationData['type'],
  priority: AdminNotificationData['priority'],
  title: string,
  message: string,
  actionRequired: boolean = false,
  data?: any
): AdminNotificationData => ({
  type,
  priority,
  title,
  message,
  actionRequired,
  data
})

// Helper function to get notification priority based on context
export const getPriorityByContext = (
  context: 'create' | 'update' | 'delete' | 'warning' | 'error' | 'info'
): AdminNotificationData['priority'] => {
  switch (context) {
    case 'delete':
    case 'error':
      return 'high'
    case 'warning':
      return 'medium'
    case 'create':
    case 'update':
    case 'info':
    default:
      return 'low'
  }
}

// Helper function to format notification messages with dynamic data
export const formatNotificationMessage = (
  template: string,
  data: Record<string, any>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match
  })
}
