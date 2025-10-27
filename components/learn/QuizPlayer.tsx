'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Check, X, ChevronRight, Award, RefreshCw, AlertCircle } from 'lucide-react'

interface QuizPlayerProps {
  contentId: string
  onComplete: () => void
}

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
  points: number
  explanation: string | null
  correct_answer: string | null
  options?: Option[]
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

interface Answer {
  question_id: string
  selected_option_id?: string
  answer_text?: string
}

export function QuizPlayer({ contentId, onComplete }: QuizPlayerProps) {
  const { profile } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: string]: Answer}>({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

      // Sort options
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

  function handleAnswer(questionId: string, answer: Partial<Answer>) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], question_id: questionId, ...answer }
    }))
  }

  function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  async function handleSubmitQuiz() {
    if (!profile) return

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      if (!confirm(`Ada ${unansweredQuestions.length} pertanyaan yang belum dijawab. Lanjutkan submit?`)) {
        return
      }
    }

    setSubmitting(true)
    try {
      // Submit answers to database
      const submissions = Object.values(answers).map(answer => ({
        user_id: profile.id,
        content_id: contentId,
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id || null,
        answer_text: answer.answer_text || null,
        attempt_number: 1 // TODO: Track attempt numbers
      }))

      console.log('Submitting quiz:', { submissions, profile: profile.id, contentId })

      const { data, error: submitError } = await (supabase as any)
        .from('quiz_submissions')
        .insert(submissions)
        .select()

      if (submitError) {
        console.error('Quiz submission error details:', submitError)
        throw new Error(`Gagal submit quiz: ${submitError.message || 'Unknown error'}`)
      }

      console.log('Quiz submitted successfully:', data)

      // Calculate results
      await calculateResults()
    } catch (error: any) {
      console.error('Error submitting quiz:', error)
      alert(`Gagal submit quiz: ${error?.message || 'Terjadi kesalahan yang tidak diketahui. Pastikan RLS policies sudah dikonfigurasi dengan benar.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function calculateResults() {
    let totalPoints = 0
    let earnedPoints = 0
    const questionResults: any[] = []

    for (const question of questions) {
      totalPoints += question.points
      const answer = answers[question.id]

      let isCorrect = false
      let correctAnswer = ''

      if (question.question_type === 'multiple_choice') {
        const selectedOption = question.options?.find(o => o.id === answer?.selected_option_id)
        isCorrect = selectedOption?.is_correct || false
        correctAnswer = question.options?.find(o => o.is_correct)?.option_text || ''
      } else if (question.question_type === 'true_false') {
        isCorrect = answer?.answer_text === question.correct_answer
        correctAnswer = question.correct_answer || ''
      }

      if (isCorrect) {
        earnedPoints += question.points
      }

      questionResults.push({
        question,
        answer,
        isCorrect,
        correctAnswer,
        pointsEarned: isCorrect ? question.points : 0
      })
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    setResults({
      totalPoints,
      earnedPoints,
      percentage,
      questionResults
    })

    setShowResults(true)

    // If passed, mark as complete
    if (percentage >= 75) {
      onComplete()
    }
  }

  function resetQuiz() {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setResults(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-bold text-yellow-900">Quiz belum tersedia</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Pertanyaan quiz belum ditambahkan oleh trainer. Silakan hubungi trainer Anda.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show Results
  if (showResults && results) {
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className={`rounded-lg p-6 ${
          results.percentage >= 75 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            {results.percentage >= 75 ? (
              <Award className="w-12 h-12 text-green-600" />
            ) : (
              <X className="w-12 h-12 text-red-600" />
            )}
            <div>
              <h2 className={`text-2xl font-bold ${
                results.percentage >= 75 ? 'text-green-900' : 'text-red-900'
              }`}>
                {results.percentage >= 75 ? 'Selamat! Anda Lulus' : 'Belum Lulus'}
              </h2>
              <p className={`text-lg ${
                results.percentage >= 75 ? 'text-green-700' : 'text-red-700'
              }`}>
                Skor Anda: {results.earnedPoints} / {results.totalPoints} ({results.percentage}%)
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {results.percentage >= 75 
                  ? 'Anda telah berhasil menyelesaikan quiz ini!'
                  : 'Minimal skor untuk lulus adalah 75%. Silakan coba lagi.'}
              </p>
            </div>
          </div>
        </div>

        {/* Question by Question Results */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Pembahasan</h3>
          {results.questionResults.map((result: any, index: number) => (
            <div
              key={result.question.id}
              className={`border-2 rounded-lg p-4 ${
                result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {result.isCorrect ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">Pertanyaan #{index + 1}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.pointsEarned} / {result.question.points} poin
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-2">{result.question.question_text}</p>
                  
                  {result.question.question_type === 'multiple_choice' && (
                    <div className="space-y-2 mt-3">
                      {result.question.options?.map((option: Option, optIndex: number) => {
                        const isSelected = option.id === result.answer?.selected_option_id
                        const isCorrectOption = option.is_correct
                        
                        return (
                          <div
                            key={option.id}
                            className={`p-2 rounded flex items-center gap-2 ${
                              isCorrectOption ? 'bg-green-100 border border-green-300' :
                              isSelected && !isCorrectOption ? 'bg-red-100 border border-red-300' :
                              'bg-white border border-gray-200'
                            }`}
                          >
                            <span className="text-sm font-medium text-gray-500 w-6">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-sm text-gray-700 flex-1">{option.option_text}</span>
                            {isSelected && <span className="text-xs text-gray-500">(Jawaban Anda)</span>}
                            {isCorrectOption && <Check className="w-4 h-4 text-green-600" />}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {result.question.question_type === 'true_false' && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700">
                        Jawaban Anda: <span className="font-medium">{result.answer?.answer_text || '-'}</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        Jawaban Benar: <span className="font-medium text-green-700">{result.correctAnswer}</span>
                      </p>
                    </div>
                  )}

                  {result.question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Penjelasan:</p>
                      <p className="text-sm text-blue-700">{result.question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Quiz Questions
  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Object.keys(answers).length} / {questions.length} dijawab
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700">
            {currentQuestion.points} poin
          </span>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
            {currentQuestion.question_type.replace('_', ' ')}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {currentQuestion.question_text}
        </h3>

        {/* Multiple Choice */}
        {currentQuestion.question_type === 'multiple_choice' && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentAnswer?.selected_option_id === option.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={currentAnswer?.selected_option_id === option.id}
                  onChange={() => handleAnswer(currentQuestion.id, { selected_option_id: option.id })}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-500 w-6">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-900 flex-1">{option.option_text}</span>
              </label>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQuestion.question_type === 'true_false' && (
          <div className="space-y-3">
            {['Benar', 'Salah'].map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentAnswer?.answer_text === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={currentAnswer?.answer_text === option}
                  onChange={() => handleAnswer(currentQuestion.id, { answer_text: option })}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Essay or Short Answer */}
        {(currentQuestion.question_type === 'essay' || currentQuestion.question_type === 'short_answer') && (
          <div>
            <textarea
              value={currentAnswer?.answer_text || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, { answer_text: e.target.value })}
              rows={currentQuestion.question_type === 'essay' ? 8 : 3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tulis jawaban Anda di sini..."
            />
            <p className="text-sm text-gray-500 mt-2">
              {currentQuestion.question_type === 'essay' 
                ? 'Jawaban essay akan dinilai manual oleh trainer'
                : 'Jawaban singkat akan dinilai manual oleh trainer'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Submit Quiz'}
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Selanjutnya
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Navigasi Pertanyaan</p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                index === currentQuestionIndex
                  ? 'bg-primary-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

