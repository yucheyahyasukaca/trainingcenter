'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check, User } from 'lucide-react'

interface Trainer {
  id: string
  name: string
  email?: string
}

interface MultiSelectTrainerProps {
  trainers: Trainer[]
  selectedTrainers: string[]
  onSelectionChange: (selectedIds: string[]) => void
  primaryTrainer: string
  onPrimaryChange: (primaryId: string) => void
  className?: string
  disabled?: boolean
  label?: string
  error?: string
}

export function MultiSelectTrainer({
  trainers,
  selectedTrainers,
  onSelectionChange,
  primaryTrainer,
  onPrimaryChange,
  className = "",
  disabled = false,
  label = "Trainer",
  error
}: MultiSelectTrainerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.email && trainer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedTrainerObjects = trainers.filter(trainer => 
    selectedTrainers.includes(trainer.id)
  )

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredTrainers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTrainers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredTrainers[highlightedIndex]) {
          handleToggleTrainer(filteredTrainers[highlightedIndex].id)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
    }
  }

  const handleToggleTrainer = (trainerId: string) => {
    if (selectedTrainers.includes(trainerId)) {
      // Remove trainer
      const newSelection = selectedTrainers.filter(id => id !== trainerId)
      onSelectionChange(newSelection)
      
      // If removing primary trainer, clear primary
      if (primaryTrainer === trainerId) {
        onPrimaryChange('')
      }
    } else {
      // Add trainer
      onSelectionChange([...selectedTrainers, trainerId])
    }
  }

  const handleRemoveTrainer = (trainerId: string) => {
    const newSelection = selectedTrainers.filter(id => id !== trainerId)
    onSelectionChange(newSelection)
    
    if (primaryTrainer === trainerId) {
      onPrimaryChange('')
    }
  }

  const handleClearAll = () => {
    onSelectionChange([])
    onPrimaryChange('')
  }

  const getDisplayText = () => {
    if (selectedTrainers.length === 0) {
      return "Pilih trainer..."
    } else if (selectedTrainers.length === 1) {
      const trainer = trainers.find(t => t.id === selectedTrainers[0])
      return trainer?.name || "1 trainer dipilih"
    } else {
      return `${selectedTrainers.length} trainer dipilih`
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm
            flex items-center justify-between min-h-[42px]
            ${error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500'
            }
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
              : 'bg-white hover:border-gray-400 cursor-pointer'
            }
          `}
        >
          <div className="flex-1 flex flex-wrap gap-1">
            {selectedTrainerObjects.length === 0 ? (
              <span className="text-gray-500">Pilih trainer...</span>
            ) : (
              selectedTrainerObjects.map(trainer => (
                <span
                  key={trainer.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                >
                  {trainer.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTrainer(trainer.id)
                    }}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {selectedTrainers.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearAll()
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari trainer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setHighlightedIndex(-1)
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredTrainers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {searchTerm ? 'Tidak ada trainer ditemukan' : 'Tidak ada trainer tersedia'}
                </div>
              ) : (
                filteredTrainers.map((trainer, index) => {
                  const isSelected = selectedTrainers.includes(trainer.id)
                  const isPrimary = primaryTrainer === trainer.id
                  
                  return (
                    <div
                      key={trainer.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleTrainer(trainer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleToggleTrainer(trainer.id)
                        }
                      }}
                      className={`
                        w-full px-3 py-2 text-left text-sm transition-colors
                        flex items-center justify-between
                        ${index === highlightedIndex 
                          ? 'bg-primary-100 text-primary-900' 
                          : 'hover:bg-gray-50'
                        }
                        ${isSelected ? 'bg-primary-50' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`
                            w-4 h-4 border-2 rounded flex items-center justify-center
                            ${isSelected 
                              ? 'bg-primary-600 border-primary-600' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{trainer.name}</div>
                          {trainer.email && (
                            <div className="text-xs text-gray-500">{trainer.email}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPrimaryChange(isPrimary ? '' : trainer.id)
                            }}
                            className={`
                              px-2 py-1 text-xs rounded-full transition-colors
                              ${isPrimary 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }
                            `}
                          >
                            {isPrimary ? 'Utama' : 'Set Utama'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Trainers Summary */}
      {selectedTrainerObjects.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Trainer Terpilih:</div>
          <div className="space-y-1">
            {selectedTrainerObjects.map(trainer => (
              <div key={trainer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{trainer.name}</span>
                  {primaryTrainer === trainer.id && (
                    <span className="px-2 py-1 text-xs bg-primary-600 text-white rounded-full">
                      Utama
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTrainer(trainer.id)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
