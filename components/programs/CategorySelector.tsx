'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
}

interface CategorySelectorProps {
  value: string
  onChange: (category: string) => void
  required?: boolean
}

export default function CategorySelector({ value, onChange, required = false }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('program_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function handleAddCategory() {
    if (!newCategory.name.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('program_categories')
        .insert([{
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
      
      // Select the new category
      onChange(data.name)
      
      // Reset form
      setNewCategory({ name: '', description: '' })
      setShowAddDialog(false)
    } catch (error: any) {
      console.error('Error adding category:', error)
      if (error.message?.includes('duplicate')) {
        alert('Kategori dengan nama ini sudah ada!')
      } else {
        alert('Gagal menambahkan kategori: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setIsTyping(true)
            }}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setTimeout(() => setIsTyping(false), 200)}
            required={required}
            className="input w-full"
            placeholder="Ketik atau pilih kategori..."
            list="categories-datalist"
          />
          <datalist id="categories-datalist">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
          
          {/* Dropdown suggestions */}
          {isTyping && value && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {categories
                .filter(cat => cat.name.toLowerCase().includes(value.toLowerCase()))
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onChange(cat.name)
                      setIsTyping(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{cat.name}</div>
                    {cat.description && (
                      <div className="text-sm text-gray-500">{cat.description}</div>
                    )}
                  </button>
                ))}
              {categories.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())).length === 0 && (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  Tidak ada kategori yang cocok. Klik tombol + untuk menambahkan.
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="btn-secondary flex items-center gap-2"
          title="Tambah kategori baru"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Add Category Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Kategori Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nama Kategori *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="input w-full"
                  placeholder="Contoh: Digital Marketing"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Deskripsi (Opsional)</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Deskripsi singkat tentang kategori ini..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={loading || !newCategory.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false)
                    setNewCategory({ name: '', description: '' })
                  }}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

