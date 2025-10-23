'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X, Save, ChevronUp, ChevronDown, Check } from 'lucide-react'

interface QuizQuestion {
  id: string
  content_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
  order_index: number
  points: number
  explanation: string | null
  correct_answer: string | null
  options?: QuizOption[]
}

interface QuizOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

interface QuizManagementProps {
  contentId: string
  contentTitle: string
}

export function QuizManagement({ contentId, contentTitle }: QuizManagementProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [contentId])

  async function fetchQuestions() {
    try {
      const { data: questionsData, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          options:quiz_options(*)
        `)
        .eq('content_id', contentId)
        .order('order_index', { ascending: true })

      if (error) throw error

      // Sort options by order_index
      const questionsWithSortedOptions = questionsData?.map((q: any) => ({
        ...(q as any),
        options: q.options?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      }))

      setQuestions(questionsWithSortedOptions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) return

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setQuestions(questions.filter(q => q.id !== id))
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Gagal menghapus pertanyaan')
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const index = questions.findIndex(q => q.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newQuestions = [...questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[newIndex]
    newQuestions[newIndex] = temp

    try {
      await Promise.all([
        (supabase as any)
          .from('quiz_questions')
          .update({ order_index: newIndex })
          .eq('id', id),
        (supabase as any)
          .from('quiz_questions')
          .update({ order_index: index })
          .eq('id', newQuestions[index].id)
      ])

      setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })))
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Pertanyaan Quiz</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola pertanyaan untuk: {contentTitle}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Tambah Pertanyaan
        </button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Belum ada pertanyaan quiz</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Tambah pertanyaan pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Pertanyaan #{index + 1}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      {question.points} poin
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 capitalize">
                      {question.question_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{question.question_text}</p>
                  
                  {/* Options for multiple choice */}
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            option.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-500 w-6">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span className="text-sm text-gray-700 flex-1">{option.option_text}</span>
                          {option.is_correct && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct answer for true/false */}
                  {question.question_type === 'true_false' && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Jawaban benar: </span>
                      <span className="text-sm font-medium text-green-600">
                        {question.correct_answer}
                      </span>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Penjelasan:</p>
                      <p className="text-sm text-blue-700">{question.explanation}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleReorder(question.id, 'up')}
                    disabled={index === 0}
                    className={`p-2 rounded hover:bg-gray-100 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(question.id, 'down')}
                    disabled={index === questions.length - 1}
                    className={`p-2 rounded hover:bg-gray-100 ${index === questions.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingQuestion(question)}
                    className="p-2 rounded hover:bg-gray-100 text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-2 rounded hover:bg-gray-100 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {(showAddModal || editingQuestion) && (
        <QuestionFormModal
          contentId={contentId}
          question={editingQuestion}
          onClose={() => {
            setShowAddModal(false)
            setEditingQuestion(null)
          }}
          onSave={() => {
            setShowAddModal(false)
            setEditingQuestion(null)
            fetchQuestions()
          }}
        />
      )}
    </div>
  )
}

// Question Form Modal
interface QuestionFormModalProps {
  contentId: string
  question: QuizQuestion | null
  onClose: () => void
  onSave: () => void
}

function QuestionFormModal({ contentId, question, onClose, onSave }: QuestionFormModalProps) {
  const [formData, setFormData] = useState<Partial<QuizQuestion>>({
    content_id: contentId,
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'multiple_choice',
    points: question?.points || 1,
    explanation: question?.explanation || '',
    correct_answer: question?.correct_answer || '',
    order_index: question?.order_index || 0
  })

  const [options, setOptions] = useState<Partial<QuizOption>[]>(
    question?.options || [
      { option_text: '', is_correct: false, order_index: 0 },
      { option_text: '', is_correct: false, order_index: 1 }
    ]
  )

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!formData.question_text?.trim()) {
      alert('Pertanyaan harus diisi')
      return
    }

    if (formData.question_type === 'multiple_choice') {
      if (options.filter(o => o.option_text?.trim()).length < 2) {
        alert('Minimal harus ada 2 opsi jawaban')
        return
      }
      if (!options.some(o => o.is_correct)) {
        alert('Harus ada minimal 1 jawaban yang benar')
        return
      }
    }

    setSaving(true)
    try {
      if (question) {
        // Update existing question
        const { error: questionError } = await (supabase as any)
          .from('quiz_questions')
          .update({
            question_text: formData.question_text,
            question_type: formData.question_type,
            points: formData.points,
            explanation: formData.explanation,
            correct_answer: formData.correct_answer
          })
          .eq('id', question.id)

        if (questionError) throw questionError

        // Update options for multiple choice
        if (formData.question_type === 'multiple_choice') {
          // Delete old options
          await supabase
            .from('quiz_options')
            .delete()
            .eq('question_id', question.id)

          // Insert new options
          const validOptions = options.filter(o => o.option_text?.trim())
          if (validOptions.length > 0) {
            const { error: optionsError } = await (supabase as any)
              .from('quiz_options')
              .insert(
                validOptions.map((opt: any, index: number) => ({
                  question_id: question.id,
                  option_text: opt.option_text,
                  is_correct: opt.is_correct,
                  order_index: index
                }))
              )

            if (optionsError) throw optionsError
          }
        }
      } else {
        // Create new question
        const { data: newQuestion, error: questionError } = await (supabase as any)
          .from('quiz_questions')
          .insert([formData])
          .select()
          .single()

        if (questionError) throw questionError

        // Insert options for multiple choice
        if (formData.question_type === 'multiple_choice' && newQuestion) {
          const validOptions = options.filter(o => o.option_text?.trim())
          if (validOptions.length > 0) {
            const { error: optionsError } = await (supabase as any)
              .from('quiz_options')
              .insert(
                validOptions.map((opt: any, index: number) => ({
                  question_id: newQuestion.id,
                  option_text: opt.option_text,
                  is_correct: opt.is_correct,
                  order_index: index
                }))
              )

            if (optionsError) throw optionsError
          }
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Gagal menyimpan pertanyaan')
    } finally {
      setSaving(false)
    }
  }

  function addOption() {
    setOptions([...options, { option_text: '', is_correct: false, order_index: options.length }])
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, field: keyof QuizOption, value: any) {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {question ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pertanyaan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tulis pertanyaan di sini..."
            />
          </div>

          {/* Question Type and Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Pertanyaan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({ ...formData, question_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="multiple_choice">Pilihan Ganda</option>
                <option value="true_false">Benar/Salah</option>
                <option value="essay">Essay</option>
                <option value="short_answer">Jawaban Singkat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poin
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options for Multiple Choice */}
          {formData.question_type === 'multiple_choice' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Opsi Jawaban <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={addOption}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Tambah Opsi
                </button>
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Tulis opsi jawaban..."
                    />
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">Benar</span>
                    </label>
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer for True/False */}
          {formData.question_type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jawaban Benar <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.correct_answer || ''}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih jawaban...</option>
                <option value="Benar">Benar</option>
                <option value="Salah">Salah</option>
              </select>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penjelasan (opsional)
            </label>
            <textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Penjelasan akan ditampilkan setelah siswa menjawab..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

