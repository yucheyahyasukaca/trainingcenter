'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/components/ui/Notification'
import { AdminNotificationTemplates } from '@/components/admin/AdminNotificationUtils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  Building2, 
  DollarSign, 
  GraduationCap, 
  Users, 
  Megaphone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Manager {
  id: string
  name: string
  email: string
  phone: string
  division: string
  status: 'active' | 'inactive'
  created_at: string
  last_login: string
  managed_programs: number
  managed_participants: number
}

interface Division {
  id: string
  name: string
  description: string
  color: string
  icon: any
}

const divisions: Division[] = [
  { id: 'finance', name: 'Keuangan', description: 'Manajemen keuangan dan anggaran', color: 'bg-green-500', icon: DollarSign },
  { id: 'programs', name: 'Program', description: 'Pengembangan dan manajemen program', color: 'bg-blue-500', icon: GraduationCap },
  { id: 'people', name: 'Sumber Daya Manusia', description: 'Manajemen peserta dan trainer', color: 'bg-purple-500', icon: Users },
  { id: 'marketing', name: 'Publikasi', description: 'Marketing dan publikasi program', color: 'bg-orange-500', icon: Megaphone }
]

export function ManagerManagement() {
  const { addNotification } = useNotification()
  const [managers, setManagers] = useState<Manager[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDivision, setFilterDivision] = useState('all')

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockManagers: Manager[] = [
      {
        id: '1',
        name: 'Ahmad Manager',
        email: 'ahmad.manager@garuda.academy',
        phone: '+62 812-3456-7890',
        division: 'programs',
        status: 'active',
        created_at: '2024-01-15',
        last_login: '2024-01-20',
        managed_programs: 12,
        managed_participants: 150
      },
      {
        id: '2',
        name: 'Siti Finance',
        email: 'siti.finance@garuda.academy',
        phone: '+62 813-4567-8901',
        division: 'finance',
        status: 'active',
        created_at: '2024-01-10',
        last_login: '2024-01-19',
        managed_programs: 8,
        managed_participants: 200
      },
      {
        id: '3',
        name: 'Budi HR',
        email: 'budi.hr@garuda.academy',
        phone: '+62 814-5678-9012',
        division: 'people',
        status: 'inactive',
        created_at: '2024-01-05',
        last_login: '2024-01-15',
        managed_programs: 5,
        managed_participants: 80
      }
    ]
    
    setManagers(mockManagers)
    setLoading(false)
  }, [])

  const filteredManagers = managers.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDivision = filterDivision === 'all' || manager.division === filterDivision
    return matchesSearch && matchesDivision
  })

  const getDivisionInfo = (divisionId: string) => {
    return divisions.find(d => d.id === divisionId) || divisions[0]
  }

  const handleAddManager = (managerData: Partial<Manager>) => {
    const newManager: Manager = {
      id: Date.now().toString(),
      name: managerData.name || '',
      email: managerData.email || '',
      phone: managerData.phone || '',
      division: managerData.division || 'programs',
      status: 'active',
      created_at: new Date().toISOString().split('T')[0],
      last_login: 'Never',
      managed_programs: 0,
      managed_participants: 0
    }
    
    setManagers([...managers, newManager])
    setShowAddForm(false)
    
    // Show success notification
    const divisionInfo = getDivisionInfo(newManager.division)
    addNotification({
      type: 'success',
      title: 'Manager Berhasil Ditambahkan',
      message: `${newManager.name} telah berhasil ditambahkan ke divisi ${divisionInfo.name}`,
      duration: 5000
    })
  }

  const handleEditManager = (managerData: Partial<Manager>) => {
    if (editingManager) {
      const updatedManager = { ...editingManager, ...managerData }
      setManagers(managers.map(m => 
        m.id === editingManager.id ? updatedManager : m
      ))
      setEditingManager(null)
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Manager Berhasil Diperbarui',
        message: `Data ${updatedManager.name} telah berhasil diperbarui`,
        duration: 5000
      })
    }
  }

  const handleDeleteManager = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId)
    if (confirm('Apakah Anda yakin ingin menghapus manager ini?')) {
      setManagers(managers.filter(m => m.id !== managerId))
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Manager Berhasil Dihapus',
        message: `${manager?.name} telah berhasil dihapus dari sistem`,
        duration: 5000
      })
    }
  }

  const handleToggleStatus = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId)
    const newStatus = manager?.status === 'active' ? 'inactive' : 'active'
    
    setManagers(managers.map(m => 
      m.id === managerId ? { ...m, status: newStatus } : m
    ))
    
    // Show status change notification
    addNotification({
      type: newStatus === 'active' ? 'success' : 'warning',
      title: `Manager ${newStatus === 'active' ? 'Diaktifkan' : 'Dinonaktifkan'}`,
      message: `${manager?.name} telah ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'} dari sistem`,
      duration: 5000
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Manager</h2>
          <p className="text-gray-600">Kelola manager dan tugaskan ke divisi tertentu</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Manager
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {divisions.map(division => {
          const Icon = division.icon
          const count = managers.filter(m => m.division === division.id).length
          return (
            <div key={division.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${division.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">{division.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{division.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Semua Divisi</option>
            {divisions.map(division => (
              <option key={division.id} value={division.id}>{division.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Manager
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Divisi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Peserta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredManagers.map(manager => {
                const divisionInfo = getDivisionInfo(manager.division)
                const Icon = divisionInfo.icon
                
                return (
                  <tr key={manager.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-700">
                            {manager.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{manager.name}</div>
                          <div className="text-sm text-gray-500 truncate">{manager.email}</div>
                          <div className="text-xs text-gray-400 truncate">{manager.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-6 h-6 ${divisionInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-900 truncate">{divisionInfo.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(manager.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          manager.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {manager.status === 'active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {manager.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {manager.managed_programs}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {manager.managed_participants}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingManager(manager)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                          title="Edit Manager"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteManager(manager.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus Manager"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Manager Modal */}
      {(showAddForm || editingManager) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingManager ? 'Edit Manager' : 'Tambah Manager Baru'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const data = Object.fromEntries(formData.entries())
              
              // Basic validation
              if (!data.name || !data.email || !data.phone) {
                addNotification({
                  type: 'error',
                  title: 'Data Tidak Lengkap',
                  message: 'Mohon lengkapi semua field yang wajib diisi',
                  duration: 5000
                })
                return
              }
              
              // Email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(data.email as string)) {
                addNotification({
                  type: 'error',
                  title: 'Email Tidak Valid',
                  message: 'Mohon masukkan alamat email yang valid',
                  duration: 5000
                })
                return
              }
              
              // Check for duplicate email
              const isDuplicate = managers.some(m => 
                m.email === data.email && m.id !== editingManager?.id
              )
              if (isDuplicate) {
                addNotification({
                  type: 'error',
                  title: 'Email Sudah Digunakan',
                  message: 'Alamat email ini sudah digunakan oleh manager lain',
                  duration: 5000
                })
                return
              }
              
              if (editingManager) {
                handleEditManager(data)
              } else {
                handleAddManager(data)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingManager?.name || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingManager?.email || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingManager?.phone || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Divisi
                  </label>
                  <select
                    name="division"
                    defaultValue={editingManager?.division || 'programs'}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {divisions.map(division => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingManager(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingManager ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
