'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { markdownToHtml } from '@/lib/utils'
import { 
  ChevronLeft, FileText, Pencil, CheckCircle, Search, Settings, 
  Menu, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, X,
  Video, File, HelpCircle, Play, Download
} from 'lucide-react'

interface LearningContent {
  id: string
  title: string
  description: string | null
  content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
  content_data: any
  order_index: number
  is_free: boolean
  status: string
  is_required: boolean
  estimated_duration: number | null
}

interface Progress {
  id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  time_spent: number
  last_position: number
  completed_at: string | null
}

export default function LearnPage({ params }: { params: { programId: string; moduleId: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [moduleTitle, setModuleTitle] = useState<string>('')
  const [contents, setContents] = useState<LearningContent[]>([])
  const [currentContent, setCurrentContent] = useState<LearningContent | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [progress, setProgress] = useState<{[key: string]: Progress}>({})
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [unlockedContents, setUnlockedContents] = useState<Set<string>>(new Set())
  const [hasReferralUsed, setHasReferralUsed] = useState<boolean>(false)
  
  const [readingSettings, setReadingSettings] = useState({
    theme: 'light',
    fontType: 'default',
    fontSize: 'medium',
    readingWidth: 'full'
  })

  // Theme color configurations
  const themeColors = {
    light: {
      mainBg: '#ffffff',
      contentBg: '#ffffff',
      text: '#000000',
      headerBg: '#ffffff',
      borderColor: '#e5e7eb'
    },
    warm: {
      mainBg: '#F5E6D3',
      contentBg: '#FFF8E7',
      text: '#4A3520',
      headerBg: '#E8D5B7',
      borderColor: '#D4C5A9'
    },
    dark: {
      mainBg: '#1a1a1a',
      contentBg: '#242424',
      text: '#ffffff',
      headerBg: '#0f0f0f',
      borderColor: '#333333'
    }
  }

  const currentTheme = themeColors[readingSettings.theme as keyof typeof themeColors] || themeColors.light

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [params.programId, params.moduleId, profile])

  // Validate and fix currentContent access after contents, progress, and referral status are loaded
  useEffect(() => {
    if (contents.length > 0 && currentContent && unlockedContents.size > 0) {
      // Check if current content is accessible using unlockedContents
      const isCurrentAccessible = unlockedContents.has(currentContent.id) || 
        (currentContent.parent_id && unlockedContents.has(currentContent.parent_id))
      
      // If current content is not accessible, find first accessible content
      if (!isCurrentAccessible) {
        // Find first accessible content
        let foundAccessible = false
        for (let i = 0; i < contents.length; i++) {
          const content = contents[i]
          const isAccessible = unlockedContents.has(content.id) || 
            (content.parent_id && unlockedContents.has(content.parent_id))
          
          if (isAccessible) {
            setCurrentContent(content)
            setCurrentIndex(i)
            foundAccessible = true
            break
          }
        }
        
        // If no accessible content found, at least show first material (should always be accessible)
        if (!foundAccessible && contents.length > 0) {
          setCurrentContent(contents[0])
          setCurrentIndex(0)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents, unlockedContents])

  function organizeHierarchicalData(data: LearningContent[]): any[] {
    const mainMaterials: any[] = []
    const subMaterialsMap = new Map<string, LearningContent[]>()
    
    // Separate main materials and sub materials
    data.forEach((item: any) => {
      if (item.material_type === 'main' || !item.parent_id) {
        mainMaterials.push({ ...item, sub_materials: [] })
      } else if (item.parent_id) {
        if (!subMaterialsMap.has(item.parent_id)) {
          subMaterialsMap.set(item.parent_id, [])
        }
        subMaterialsMap.get(item.parent_id)!.push(item)
      }
    })
    
    // Attach sub materials to their parents
    mainMaterials.forEach((main: any) => {
      const subMaterials = subMaterialsMap.get(main.id) || []
      main.sub_materials = subMaterials.sort((a, b) => a.order_index - b.order_index)
    })
    
    // Sort main materials by order_index
    return mainMaterials.sort((a, b) => a.order_index - b.order_index)
  }

  async function fetchData() {
    try {
      // Fetch class/module details
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', params.moduleId)
        .maybeSingle()
      
      if (classData) setModuleTitle((classData as any).name)

      // Check enrollment - first get participant, then check enrollment
      let participantId = null
      if (profile?.id) {
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle()
        
        participantId = (participant as any)?.id
      }

      // Check enrollment using participant ID
      if (participantId) {
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('participant_id', participantId)
          .eq('class_id', params.moduleId)
          .eq('status', 'approved')
          .maybeSingle()
        
        setEnrollment(enrollmentData)
      }

      // Fetch learning contents
      const { data: contentsData, error: contentsError } = await supabase
        .from('learning_contents')
        .select('*')
        .eq('class_id', params.moduleId)
        .eq('status', 'published')
        .order('order_index', { ascending: true })

      if (contentsError) throw contentsError

      if (contentsData && contentsData.length > 0) {
        // Organize content into hierarchical structure matching ContentManagement
        const organizedContents = organizeHierarchicalData(contentsData)
        
        // Flatten hierarchical structure for display
        const flattenedContents: LearningContent[] = []
        organizedContents.forEach((mainContent: any) => {
          // Add main material
          flattenedContents.push(mainContent)
          
          // Add sub materials if they exist
          if (mainContent.sub_materials && mainContent.sub_materials.length > 0) {
            mainContent.sub_materials.forEach((subMaterial: any) => {
              flattenedContents.push(subMaterial)
            })
          }
        })
        
        setContents(flattenedContents)
        
        // Check if there's a specific content parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const contentId = urlParams.get('content')
        
        if (contentId) {
          const targetContentIndex = flattenedContents.findIndex(c => c.id === contentId)
          if (targetContentIndex !== -1) {
            setCurrentContent(flattenedContents[targetContentIndex])
            setCurrentIndex(targetContentIndex)
          } else {
            setCurrentContent(flattenedContents[0])
            setCurrentIndex(0)
          }
        } else {
          setCurrentContent(flattenedContents[0])
          setCurrentIndex(0)
        }

        // Fetch progress for all contents
        if (profile) {
          const { data: progressData } = await supabase
            .from('learning_progress')
            .select('*')
            .eq('user_id', profile.id)
            .in('content_id', contentsData.map((c: any) => c.id))

          if (progressData) {
            const progressMap: {[key: string]: Progress} = {}
            progressData.forEach((p: any) => {
              progressMap[p.content_id] = {
                id: p.id,
                status: p.status || 'not_started',
                progress_percentage: p.progress_percentage || 0,
                time_spent: p.time_spent || 0,
                last_position: p.last_position || 0,
                completed_at: p.completed_at || null
              }
            })
            console.log('📊 Progress loaded:', Object.keys(progressMap).length, 'entries')
            setProgress(progressMap)

            // Calculate overall progress
            const completed = contentsData.filter((content: any) => {
              const contentProgress = progressData.find((p: any) => p.content_id === content.id)
              return (contentProgress as any)?.status === 'completed'
            }).length
            const total = contentsData.length
            setOverallProgress(total > 0 ? Math.round((completed / total) * 100) : 0)
          }
        }
      }

      // Check referral usage to determine if last 3 materials should be unlocked
      if (profile?.id) {
        await checkReferralUsage()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkReferralUsage() {
    if (!profile?.id) {
      console.log('🔗 checkReferralUsage: No profile.id')
      return
    }

    try {
      console.log('🔗 checkReferralUsage: Starting check for user_id:', profile.id)
      
      console.log('🔗 CORRECT LOGIC: Checking if user\'s referral codes have been USED BY OTHERS (not if user used others\' codes)')

      // CORRECT LOGIC: Check if referral codes CREATED BY THIS USER have been used by others
      // Get all referral codes created by this user (where trainer_id = profile.id)
      const { data: userReferralCodes, error: codesError } = await supabase
        .from('referral_codes')
        .select('id, code, trainer_id')
        .eq('trainer_id', profile.id)
        .eq('is_active', true)
        .limit(50)

      console.log('🔍 Query 1 - Referral codes created by user:', {
        error: codesError,
        dataLength: userReferralCodes?.length || 0,
        codes: userReferralCodes?.map((rc: any) => ({ id: rc.id, code: rc.code })) || []
      })

      if (codesError || !userReferralCodes || userReferralCodes.length === 0) {
        console.log('⚠️ User has no referral codes created')
        setHasReferralUsed(false)
        return
      }

      const userReferralCodeIds = userReferralCodes.map((rc: any) => rc.id)
      console.log('📋 User referral code IDs:', userReferralCodeIds)

      // Check if any of user's referral codes have been used by others (status = 'confirmed')
      // This means someone else used this user's referral code
      const { data: trackingData, error: trackingError } = await supabase
        .from('referral_tracking')
        .select('id, status, participant_id, referral_code_id, trainer_id')
        .in('referral_code_id', userReferralCodeIds)
        .in('status', ['confirmed', 'pending'])
        .limit(50)

      console.log('🔍 Query 2 - Referral tracking where user\'s codes are used by others:', {
        error: trackingError,
        dataLength: trackingData?.length || 0,
        data: trackingData?.map((rt: any) => ({
          id: rt.id,
          referral_code_id: rt.referral_code_id,
          participant_id: rt.participant_id,
          status: rt.status,
          trainer_id: rt.trainer_id
        })) || []
      })

      if (trackingError) {
        console.error('❌ Error checking referral tracking:', trackingError)
        setHasReferralUsed(false)
        return
      }

      // Count confirmed referrals (someone else used user's code and it's confirmed)
      const confirmedReferrals = trackingData?.filter((r: any) => r.status === 'confirmed') || []
      const hasUsed = confirmedReferrals.length >= 1
      
      console.log('🔗 Referral usage check (CORRECT LOGIC):', {
        userReferralCodesCount: userReferralCodes.length,
        trackingRecordsFound: trackingData?.length || 0,
        confirmedCount: confirmedReferrals.length,
        hasUsed: hasUsed ? '✅ User\'s referral codes have been used by others' : '❌ No one has used user\'s referral codes yet'
      })
      
      setHasReferralUsed(hasUsed)
    } catch (error) {
      console.error('❌ Error checking referral usage:', error)
      setHasReferralUsed(false)
    }
  }

  // Update unlocked contents whenever contents, progress, or referral status changes
  useEffect(() => {
    if (contents.length > 0) {
      updateUnlockedContents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents, progress, hasReferralUsed])

  async function updateProgress(contentId: string, updates: any) {
    if (!profile) return

    try {
      // Check if progress exists
      const existing = progress[contentId]
      
      if (existing && (existing as any).id) {
        // Update existing
        const { data, error } = await (supabase as any)
          .from('learning_progress')
          .update(updates)
          .eq('id', (existing as any).id)
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      } else {
        // Create new or upsert
        const { data, error } = await supabase
          .from('learning_progress')
          .upsert([{
            user_id: profile.id,
            content_id: contentId,
            enrollment_id: enrollment?.id,
            ...updates
          }] as any, {
            onConflict: 'user_id,content_id'
          })
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      }

      // Update overall progress
      updateOverallProgress()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  async function markAsComplete(contentId: string) {
    try {
      console.log('Marking as complete:', contentId)
      
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }
      
      // First check if table exists by trying to select from it
      const { error: tableError } = await supabase
        .from('learning_progress')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.error('Table learning_progress does not exist:', tableError)
        showNotification('error', 'Tabel progress belum tersedia. Silakan hubungi administrator.')
        return
      }
      
      // Update progress in database
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, referral_code_id, status')
        .eq('participant_id', participantId)
        .not('referral_code_id', 'is', null)
        .limit(10)

      console.log('🔍 Query 2b - Enrollments with referral_code_id:', {
        error: enrollmentError,
        dataLength: enrollmentData?.length || 0,
        data: enrollmentData
      })

      // If no tracking data, check if enrollment has referral_code_id (use enrollment as fallback)
      // Check both enrollmentData (filtered) and allEnrollments (all records)
      const enrollmentsWithReferral = enrollmentData || []
      const allEnrollmentsList = allEnrollments || []
      
      // Check if any enrollment (approved or pending) has referral_code_id
      const enrollmentsWithReferralCode = allEnrollmentsList.filter((e: any) => e.referral_code_id != null)
      
      console.log('🔍 Enrollment analysis:', {
        totalEnrollments: allEnrollmentsList.length,
        enrollmentsWithReferralCode: enrollmentsWithReferralCode.length,
        enrollmentsWithReferralCodeDetails: enrollmentsWithReferralCode.map((e: any) => ({
          id: e.id,
          status: e.status,
          referral_code_id: e.referral_code_id
        }))
      })
      
      if ((!trackingData || trackingData.length === 0) && enrollmentsWithReferralCode.length > 0) {
        console.log('⚠️ Found enrollments with referral_code_id but no tracking data')
        // Use enrollment as proxy - if enrollment exists with referral_code_id and is approved, count as used
        const approvedEnrollments = enrollmentsWithReferralCode.filter((e: any) => e.status === 'approved' && e.referral_code_id)
        const pendingEnrollments = enrollmentsWithReferralCode.filter((e: any) => e.status === 'pending' && e.referral_code_id)
        
        console.log('🔍 Enrollment status breakdown:', {
          approved: approvedEnrollments.length,
          pending: pendingEnrollments.length
        })
        
        // Count as used if approved enrollment has referral code
        // OR if pending enrollment has referral code (user has used referral during enrollment)
        if (approvedEnrollments.length > 0 || pendingEnrollments.length > 0) {
          console.log('✅ Found enrollments with referral_code_id - counting as referral used')
          setHasReferralUsed(true)
          console.log('🔗 Referral usage check (via enrollments):', {
            approvedEnrollmentsWithReferral: approvedEnrollments.length,
            pendingEnrollmentsWithReferral: pendingEnrollments.length,
            hasUsed: '✅ Has used referral (via enrollment)'
          })
          return
        }
      }

      if (trackingError) {
        console.error('❌ Error checking referral usage:', trackingError)
      }

      console.log('📊 referral_tracking query result:', {
        foundRecords: trackingData?.length || 0,
        records: trackingData?.map((r: any) => ({
          id: r.id,
          status: r.status,
          participant_id: r.participant_id
        })) || []
      })

      // Count confirmed referrals
      const confirmedReferrals = trackingData?.filter((r: any) => r.status === 'confirmed') || []
      const hasUsed = confirmedReferrals.length >= 1
      
      console.log('🔗 Referral usage check:', {
        totalRecords: trackingData?.length || 0,
        confirmedCount: confirmedReferrals.length,
        hasUsed: hasUsed ? '✅ Has used referral' : '❌ No referral used'
      })
      
      setHasReferralUsed(hasUsed)
    } catch (error) {
      console.error('❌ Error checking referral usage:', error)
      setHasReferralUsed(false)
    }
  }

  // Update unlocked contents whenever contents, progress, or referral status changes
  useEffect(() => {
    if (contents.length > 0) {
      updateUnlockedContents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents, progress, hasReferralUsed])

  async function updateProgress(contentId: string, updates: any) {
    if (!profile) return

    try {
      // Check if progress exists
      const existing = progress[contentId]
      
      if (existing && (existing as any).id) {
        // Update existing
        const { data, error } = await (supabase as any)
          .from('learning_progress')
          .update(updates)
          .eq('id', (existing as any).id)
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      } else {
        // Create new or upsert
        const { data, error } = await supabase
          .from('learning_progress')
          .upsert([{
            user_id: profile.id,
            content_id: contentId,
            enrollment_id: enrollment?.id,
            ...updates
          }] as any, {
            onConflict: 'user_id,content_id'
          })
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      }

      // Update overall progress
      updateOverallProgress()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  async function markAsComplete(contentId: string) {
    try {
      console.log('Marking as complete:', contentId)
      
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }
      
      // First check if table exists by trying to select from it
      const { error: tableError } = await supabase
        .from('learning_progress')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.error('Table learning_progress does not exist:', tableError)
        showNotification('error', 'Tabel progress belum tersedia. Silakan hubungi administrator.')
        return
      }
      
      // Update progress in database
      const { data, error } = await supabase
        .from('learning_progress')
        .upsert([{
          user_id: profile.id,
          content_id: contentId,
          enrollment_id: enrollment?.id,
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        }] as any, {
          onConflict: 'user_id,content_id'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      // Update local state immediately
      setProgress(prev => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        }
      }))
      
      // NOTE: Sub-materials should be completed independently by the user
      // We do NOT automatically mark sub-materials as completed when main material is completed
      // Each sub-material must be accessed and completed by the user individually
      
      // Update overall progress
      updateOverallProgress()
      
      // CRITICAL: Update unlocked contents after marking as complete
      // This ensures that the next material unlocks immediately after current one is completed
      // Force a re-render by updating a state, then call updateUnlockedContents
      // Use multiple setTimeout calls to ensure state propagation
      setTimeout(() => {
        // Force update unlocked contents after state has propagated
        updateUnlockedContents()
        console.log('🔄 updateUnlockedContents called after markAsComplete for:', contentId)
        
        // Also log current progress to verify
        setTimeout(() => {
          console.log('🔍 Verifying unlocked contents after completion...')
          updateUnlockedContents()
        }, 200)
      }, 300)
      
      // Show success notification
      const content = contents.find(c => c.id === contentId)
      if (content) {
        showNotification('success', `Materi "${content.title}" berhasil ditandai selesai!`)
      }
    } catch (error: any) {
      console.error('Error marking as complete:', error)
      const errorMessage = error?.message || 'Terjadi kesalahan yang tidak diketahui'
      showNotification('error', `Gagal menandai materi sebagai selesai: ${errorMessage}`)
    }
  }

  function updateOverallProgress() {
    // Count all contents (main + sub materials)
    const totalCount = contents.length
    
    // Count completed contents
    const completedCount = contents.filter(content => {
      const contentProgress = progress[content.id]
      return contentProgress?.status === 'completed'
    }).length
    
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    setOverallProgress(percentage)
    
    console.log('Progress calculation:', {
      totalCount,
      completedCount,
      percentage,
      progress: Object.keys(progress).length,
      contents: contents.length
    })
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  const updateUnlockedContents = useCallback(() => {
    const unlocked = new Set<string>()
    
    // Filter only main materials (not sub-materials) for referral check
    // Main materials are those without parent_id
    const mainMaterials = contents.filter(c => !c.parent_id)
    
    console.log('🔓 updateUnlockedContents called', {
      mainMaterialsCount: mainMaterials.length,
      progressKeys: Object.keys(progress).length,
      hasReferralUsed,
      progressStatuses: mainMaterials.map((m, idx) => ({
        index: idx,
        id: m.id,
        title: m.title,
        status: progress[m.id]?.status || 'not_started'
      }))
    })
    
    if (mainMaterials.length > 0) {
      // Hanya materi pertama (index 0) yang selalu bisa diakses
      unlocked.add(mainMaterials[0].id)
      console.log('✅ Unlocked material 0:', mainMaterials[0].id, mainMaterials[0].title)
      
      // Progressive unlocking: unlock materi berikutnya hanya jika materi sebelumnya selesai
      for (let i = 1; i < mainMaterials.length; i++) {
        const currentMaterial = mainMaterials[i]
        
        // FIRST: Check if ALL previous materials are FULLY completed (sequential requirement)
        // This includes main material AND all sub-materials
        let allPreviousCompleted = true
        const incompleteMaterials: string[] = []
        for (let j = 0; j < i; j++) {
          const prevContent = mainMaterials[j]
          const isPrevFullyCompleted = isMaterialFullyCompleted(prevContent.id)
          
          if (!isPrevFullyCompleted) {
            allPreviousCompleted = false
            const prevMainProgress = progress[prevContent.id]
            const prevSubMaterials = contents.filter(c => c.parent_id === prevContent.id)
            const incompleteSubs = prevSubMaterials.filter(sub => {
              const subProgress = progress[sub.id]
              return subProgress?.status !== 'completed'
            })
            
            if (prevMainProgress?.status !== 'completed') {
              const status = prevMainProgress?.status || 'not_started'
              incompleteMaterials.push(`${prevContent.title} (main: ${status})`)
            } else if (incompleteSubs.length > 0) {
              incompleteMaterials.push(`${prevContent.title} (${incompleteSubs.length} sub-materials incomplete: ${incompleteSubs.map(s => s.title).join(', ')})`)
            } else {
              incompleteMaterials.push(`${prevContent.title} (not fully completed)`)
            }
          }
        }
        
        // If sequential requirement is NOT met, stop unlocking - lock semua materi berikutnya
        if (!allPreviousCompleted) {
          console.log(`🔒 Material ${i} (${currentMaterial.title}) LOCKED - Previous incomplete:`, incompleteMaterials)
          break
        }
        
        // SECOND: If sequential requirement is met, check referral for index >= 2
        if (i >= 2) {
          // Material index >= 2 requires referral code to be used
          if (hasReferralUsed) {
            unlocked.add(mainMaterials[i].id)
            console.log(`✅ Unlocked material ${i}:`, mainMaterials[i].title, '(all previous completed + referral used)')
          } else {
            // Sequential requirement met, but referral not used - lock it
            console.log(`🔒 Material ${i} (${currentMaterial.title}) LOCKED - Referral not used`)
            break
          }
        } else {
          // Material index 1, unlock if sequential requirement met (materi 0 selesai)
          unlocked.add(mainMaterials[i].id)
          console.log(`✅ Unlocked material ${i}:`, mainMaterials[i].title, '(all previous completed)')
        }
      }
      
      // Unlock sub-materials of unlocked main materials SEQUENTIALLY
      // Group sub-materials by parent
      const subMaterialsByParent = new Map<string, LearningContent[]>()
      contents.forEach((content) => {
        if (content.parent_id) {
          if (!subMaterialsByParent.has(content.parent_id)) {
            subMaterialsByParent.set(content.parent_id, [])
          }
          subMaterialsByParent.get(content.parent_id)!.push(content)
        }
      })
      
      // For each parent that is unlocked, unlock its sub-materials sequentially
      subMaterialsByParent.forEach((subMaterials, parentId) => {
        if (!unlocked.has(parentId)) {
          return // Skip if parent is not unlocked
        }
        
        const parentProgress = progress[parentId]
        const isParentCompleted = parentProgress?.status === 'completed'
        
        // Sort sub-materials by order_index to ensure sequential unlocking
        const sortedSubMaterials = [...subMaterials].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        
        // First sub-material can be unlocked if parent is completed
        if (sortedSubMaterials.length > 0 && isParentCompleted) {
          // Unlock first sub-material
          unlocked.add(sortedSubMaterials[0].id)
          console.log(`✅ Unlocked first sub-material: ${sortedSubMaterials[0].title} (parent: ${parentId})`)
          
          // Unlock subsequent sub-materials only if all previous sub-materials are completed
          for (let i = 1; i < sortedSubMaterials.length; i++) {
            let allPreviousSubCompleted = true
            
            for (let j = 0; j < i; j++) {
              const prevSub = sortedSubMaterials[j]
              const prevSubProgress = progress[prevSub.id]
              if (prevSubProgress?.status !== 'completed') {
                allPreviousSubCompleted = false
                console.log(`🔒 Sub-material ${i} (${sortedSubMaterials[i].title}) LOCKED - Previous sub incomplete: ${prevSub.title}`)
                break
              }
            }
            
            if (allPreviousSubCompleted) {
              unlocked.add(sortedSubMaterials[i].id)
              console.log(`✅ Unlocked sub-material ${i}: ${sortedSubMaterials[i].title}`)
            } else {
              // Stop unlocking remaining sub-materials
              break
            }
          }
        }
      })
      
      console.log('🔓 Final unlocked contents:', Array.from(unlocked))
    }
    
    setUnlockedContents(unlocked)
  }, [contents, progress, hasReferralUsed])

  function isContentUnlocked(contentId: string): boolean {
    return unlockedContents.has(contentId)
  }

  // Helper function to check if a main material (including all sub-materials) is fully completed
  function isMaterialFullyCompleted(mainMaterialId: string): boolean {
    // Check if main material itself is completed
    const mainProgress = progress[mainMaterialId]
    const isMainCompleted = mainProgress?.status === 'completed'
    
    if (!isMainCompleted) {
      return false
    }
    
    // Check if all sub-materials are completed
    const subMaterials = contents.filter(c => c.parent_id === mainMaterialId)
    if (subMaterials.length === 0) {
      // No sub-materials, so main material completion is enough
      return true
    }
    
    // Check each sub-material
    for (const subMaterial of subMaterials) {
      const subProgress = progress[subMaterial.id]
      const isSubCompleted = subProgress?.status === 'completed'
      if (!isSubCompleted) {
        console.log(`📋 Material "${contents.find(c => c.id === mainMaterialId)?.title}" not fully completed - sub-material "${subMaterial.title}" not completed`)
        return false
      }
    }
    
    return true
  }

  function canAccessContent(contentId: string): boolean {
    const content = contents.find(c => c.id === contentId)
    if (!content) {
      console.log('🚫 canAccessContent: content not found', contentId)
      return false
    }
    
    // Filter main materials
    const mainMaterials = contents.filter(c => !c.parent_id)
    const isMainMaterial = !content.parent_id
    
    if (isMainMaterial) {
      // Find the index of this material
      const materialIndex = mainMaterials.findIndex(m => m.id === contentId)
      
      if (materialIndex === -1) {
        console.log('🚫 canAccessContent: material not found in mainMaterials', contentId)
        return false
      }
      
      // Material index 0 is always accessible
      if (materialIndex === 0) {
        console.log(`✅ canAccessContent [${content.title}]: Always unlocked (index 0)`)
        return true
      }
      
      // For material index >= 1, STRICTLY check if ALL previous materials are FULLY completed
      // (including main material AND all sub-materials)
      for (let i = 0; i < materialIndex; i++) {
        const prevContent = mainMaterials[i]
        const isPrevFullyCompleted = isMaterialFullyCompleted(prevContent.id)
        
        if (!isPrevFullyCompleted) {
          const prevMainProgress = progress[prevContent.id]
          const prevSubMaterials = contents.filter(c => c.parent_id === prevContent.id)
          const incompleteSubs = prevSubMaterials.filter(sub => {
            const subProgress = progress[sub.id]
            return subProgress?.status !== 'completed'
          })
          
          if (prevMainProgress?.status !== 'completed') {
            console.log(`🔒 canAccessContent [${content.title}]: BLOCKED - Previous material "${prevContent.title}" main material not completed (status: ${prevMainProgress?.status || 'not_started'})`)
          } else if (incompleteSubs.length > 0) {
            console.log(`🔒 canAccessContent [${content.title}]: BLOCKED - Previous material "${prevContent.title}" has ${incompleteSubs.length} incomplete sub-material(s):`, incompleteSubs.map(s => s.title))
          }
          return false
        }
      }
      
      // If sequential requirement met, check referral requirement for index >= 2
      if (materialIndex >= 2) {
        if (!hasReferralUsed) {
          console.log(`🔒 canAccessContent [${content.title}]: BLOCKED - Referral code not used`)
          return false
        }
      }
      
      // Sequential requirement met and referral requirement (if applicable) met
      console.log(`✅ canAccessContent [${content.title}]: Allowed (index ${materialIndex}, previous completed, ${materialIndex >= 2 ? 'referral used' : 'no referral required'})`)
      return true
    }
    
    // For sub-materials, check parent is unlocked and parent is completed
    if (content.parent_id) {
      // First check if parent can be accessed
      const parentCanAccess = canAccessContent(content.parent_id)
      if (!parentCanAccess) {
        console.log(`🔒 canAccessContent [SUB: ${content.title}]: BLOCKED - Parent not accessible`)
        return false
      }
      
      // Check if parent is completed
      const parentProgress = progress[content.parent_id]
      const isParentCompleted = parentProgress?.status === 'completed'
      if (!isParentCompleted) {
        console.log(`🔒 canAccessContent [SUB: ${content.title}]: BLOCKED - Parent not completed`)
        return false
      }
      
      // Find all sub-materials of this parent
      const subMaterials = contents.filter(c => c.parent_id === content.parent_id)
      const sortedSubMaterials = [...subMaterials].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      const subIndex = sortedSubMaterials.findIndex(s => s.id === contentId)
      
      if (subIndex === -1) {
        console.log(`🔒 canAccessContent [SUB: ${content.title}]: BLOCKED - Sub-material not found`)
        return false
      }
      
      // First sub-material is unlocked if parent is completed
      if (subIndex === 0) {
        console.log(`✅ canAccessContent [SUB: ${content.title}]: Allowed (first sub-material, parent completed)`)
        return true
      }
      
      // For subsequent sub-materials, check if ALL previous sub-materials are completed
      for (let i = 0; i < subIndex; i++) {
        const prevSub = sortedSubMaterials[i]
        const prevSubProgress = progress[prevSub.id]
        if (prevSubProgress?.status !== 'completed') {
          console.log(`🔒 canAccessContent [SUB: ${content.title}]: BLOCKED - Previous sub-material "${prevSub.title}" not completed`)
          return false
        }
      }
      
      console.log(`✅ canAccessContent [SUB: ${content.title}]: Allowed (previous sub-materials completed)`)
      return true
    }
    
    console.log('🚫 canAccessContent: no parent_id and not main material', contentId)
    return false
  }

  function navigateToContent(direction: 'prev' | 'next') {
    if (direction === 'prev' && currentIndex > 0) {
      const prevContent = contents[currentIndex - 1]
      setCurrentContent(prevContent)
      setCurrentIndex(currentIndex - 1)
    } else if (direction === 'next' && currentIndex < contents.length - 1) {
      const nextContent = contents[currentIndex + 1]
      
      // Check if current content is completed before allowing to move to next
      const currentContentProgress = progress[contents[currentIndex].id]
      const isCurrentCompleted = currentContentProgress?.status === 'completed'
      
      if (!isCurrentCompleted) {
        showNotification('error', 'Harap selesaikan materi ini terlebih dahulu sebelum melanjutkan ke materi berikutnya.')
        return
      }
      
      // Check if next content is accessible
      if (canAccessContent(nextContent.id)) {
        setCurrentContent(nextContent)
        setCurrentIndex(currentIndex + 1)
      } else {
        // Check reason for blocking
        const mainMaterials = contents.filter(c => !c.parent_id)
        const nextMainIndex = mainMaterials.findIndex(c => c.id === nextContent.id || (nextContent.parent_id && c.id === nextContent.parent_id))
        
        if (nextMainIndex === -1) {
          showNotification('error', 'Materi ini tidak dapat diakses.')
          return
        }
        
        // Check if blocked due to sequential requirement
        let sequentialBlocked = false
        for (let i = 0; i < nextMainIndex; i++) {
          const mainContent = mainMaterials[i]
          const contentProgress = progress[mainContent.id]
          if (contentProgress?.status !== 'completed') {
            sequentialBlocked = true
            break
          }
        }
        
        if (sequentialBlocked) {
          showNotification('error', 'Anda harus menyelesaikan materi sebelumnya terlebih dahulu secara berurutan.')
        } else if (nextMainIndex >= 2 && !hasReferralUsed) {
          showNotification('error', 'Materi ini terkunci. Bagikan kode referral kamu ke teman/rekan dan tunggu mereka mendaftar untuk membuka materi ini.')
        } else {
          showNotification('error', 'Materi ini terkunci.')
        }
      }
    }
  }

  function selectContent(content: LearningContent, index: number) {
    // Check if content is accessible
    if (!canAccessContent(content.id)) {
      // Check reason for blocking
      const mainMaterials = contents.filter(c => !c.parent_id)
      const mainIndex = mainMaterials.findIndex(c => {
        return c.id === content.id || (content.parent_id && c.id === content.parent_id)
      })
      
      if (mainIndex === -1) {
        showNotification('error', 'Materi ini tidak dapat diakses.')
        return
      }
      
      // Check if blocked due to sequential requirement
      let sequentialBlocked = false
      for (let i = 0; i < mainIndex; i++) {
        const mainContent = mainMaterials[i]
        const contentProgress = progress[mainContent.id]
        if (contentProgress?.status !== 'completed') {
          sequentialBlocked = true
          break
        }
      }
      
      if (sequentialBlocked) {
        showNotification('error', 'Anda harus menyelesaikan materi sebelumnya terlebih dahulu secara berurutan.')
      } else if (mainIndex >= 2 && !hasReferralUsed) {
        showNotification('error', 'Materi ini terkunci. Bagikan kode referral kamu ke teman/rekan dan tunggu mereka mendaftar untuk membuka materi ini.')
      } else {
        showNotification('error', 'Materi ini terkunci.')
      }
      return
    }
    
    setCurrentContent(content)
    setCurrentIndex(index)
    setDrawerOpen(false)
  }

  const updateReadingSettings = (key: string, value: string) => {
    setReadingSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />
      case 'text': return <FileText className="w-5 h-5 text-blue-500" />
      case 'quiz': return <HelpCircle className="w-5 h-5 text-green-500" />
      case 'document': return <File className="w-5 h-5 text-purple-500" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Simplified access check - allow all users for now
  // if (!enrollment && !contents.some(c => c.is_free)) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="text-center">
  //         <p className="text-xl text-gray-700 mb-4">Anda belum terdaftar di kelas ini</p>
  //         <Link href={`/programs/${params.programId}`} className="text-primary-600 hover:underline">
  //           Kembali ke Program
  //         </Link>
  //       </div>
  //     </div>
  //   )
  // }

  if (contents.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Belum ada materi pembelajaran</p>
          <Link href={`/programs/${params.programId}/classes`} className="text-primary-600 hover:underline">
            Kembali ke Kelas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Add OpenDyslexic font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=OpenDyslexic:wght@400;700&display=swap');
      `}</style>
      
      <div className="min-h-screen flex flex-col content-area" style={{
        backgroundColor: currentTheme.mainBg,
        color: currentTheme.text,
        transition: 'all 0.3s ease'
      }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur border-b" style={{
        backgroundColor: `${currentTheme.headerBg}f2`,
        borderColor: currentTheme.borderColor,
        transition: 'all 0.3s ease'
      }}>
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="w-full px-3 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href={`/programs/${params.programId}/classes`} className="inline-flex items-center text-sm whitespace-nowrap transition-colors" style={{ color: currentTheme.text, opacity: 0.7 }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Link>
              <span className="font-semibold truncate text-lg" style={{ color: currentTheme.text }}>{moduleTitle || 'Belajar Modul'}</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg border transition-colors" 
                aria-label="Pengaturan"
                style={{
                  borderColor: currentTheme.borderColor,
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Settings className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
              <button 
                onClick={() => setDrawerOpen(true)} 
                className="p-2 rounded-lg border transition-colors" 
                aria-label="Menu"
                style={{
                  borderColor: currentTheme.borderColor,
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Menu className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden w-full px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/programs/${params.programId}/classes`} className="flex-shrink-0 p-2 rounded-lg transition-colors" style={{
              backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
            }}>
              <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
            </Link>
            <div className="flex-1 min-w-0 px-2">
              <h1 className="text-sm font-semibold truncate text-center" style={{ color: currentTheme.text }}>
                {moduleTitle || 'Belajar Modul'}
              </h1>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg transition-colors" 
                style={{
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Settings className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
              <button 
                onClick={() => setDrawerOpen(true)} 
                className="p-2 rounded-lg transition-colors" 
                aria-label="Menu"
                style={{
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Menu className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6 pb-20">
        {currentContent && (
          <ContentRenderer
            content={currentContent}
            theme={currentTheme}
            readingSettings={readingSettings}
            progress={progress[currentContent.id]}
            onComplete={() => markAsComplete(currentContent.id)}
            onUpdateProgress={(updates) => updateProgress(currentContent.id, updates)}
          />
        )}
      </div>

      {/* Adaptive Reading Settings Modal */}
      <AdaptiveReadingModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={readingSettings}
        onUpdate={updateReadingSettings}
      />

      {/* Slide-out drawer for content list */}
      <ContentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contents={contents}
        progress={progress}
        overallProgress={overallProgress}
        currentContentId={currentContent?.id || ''}
        onSelectContent={selectContent}
        getContentIcon={getContentIcon}
        isContentUnlocked={isContentUnlocked}
        canAccessContent={canAccessContent}
      />

      {/* Bottom navigation */}
      <BottomNavigation
        currentIndex={currentIndex}
        totalContents={contents.length}
        currentContent={currentContent}
        onNavigate={navigateToContent}
        theme={currentTheme}
        readingSettings={readingSettings}
        contents={contents}
        progress={progress}
        canAccessContent={canAccessContent}
      />

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

// Content Renderer Component
interface ContentRendererProps {
  content: LearningContent
  theme: any
  readingSettings: any
  progress: Progress | undefined
  onComplete: () => void
  onUpdateProgress: (updates: Partial<Progress>) => void
}

function ContentRenderer({ content, theme, readingSettings, progress, onComplete, onUpdateProgress }: ContentRendererProps) {
  const renderContent = () => {
    switch (content.content_type) {
      case 'video':
        return <VideoContent content={content} progress={progress} onUpdateProgress={onUpdateProgress} />
      case 'text':
        return <TextContent content={content} theme={theme} readingSettings={readingSettings} />
      case 'quiz':
        return <QuizContent content={content} progress={progress} onComplete={onComplete} />
      case 'document':
        return <DocumentContent content={content} />
      case 'assignment':
        return <AssignmentContent content={content} onComplete={onComplete} />
      default:
        return <div className="text-center py-12 text-gray-500">Tipe konten tidak dikenali</div>
    }
  }

  return (
    <div className="reading-content" style={{
      backgroundColor: theme.contentBg,
      color: theme.text,
      fontFamily: readingSettings.fontType === 'serif' ? 'Georgia, "Times New Roman", serif' : 
                 readingSettings.fontType === 'dyslexic' ? 'OpenDyslexic, Arial, sans-serif' : 
                 'Inter, system-ui, sans-serif',
      fontSize: readingSettings.fontSize === 'small' ? '14px' : 
               readingSettings.fontSize === 'large' ? '18px' : '16px',
      maxWidth: readingSettings.readingWidth === 'medium' ? '800px' : '900px',
      margin: '0 auto',
      padding: '3rem 2rem',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      textAlign: 'left',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lineHeight: '1.7'
    }}>
      {/* Content Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: theme.text }}>
          {content.title}
        </h1>
        {content.description && (
          <p className="text-xl opacity-80 max-w-2xl mx-auto" style={{ color: theme.text }}>
            {content.description}
          </p>
        )}
        {progress?.status === 'completed' && (
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Selesai</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="max-w-3xl mx-auto">
        {renderContent()}
      </div>

      {/* Complete Button */}
      {progress?.status !== 'completed' && content.content_type !== 'quiz' && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <Check className="w-7 h-7" />
            Tandai Selesai
          </button>
        </div>
      )}
    </div>
  )
}

// Video Content Component
function VideoContent({ content, progress, onUpdateProgress }: any) {
  const videoData = content.content_data || {}
  
  useEffect(() => {
    // Mark as in progress when video is viewed
    if (!progress || progress.status === 'not_started') {
      onUpdateProgress({ status: 'in_progress', progress_percentage: 0 })
    }
  }, [])

  // Extract video ID from YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = (match && match[2].length === 11) ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const embedUrl = videoData.video_url ? getYouTubeEmbedUrl(videoData.video_url) : ''

  return (
    <div className="space-y-6">
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Video URL tidak valid</p>
        </div>
      )}
      
      {videoData.duration && (
        <p className="text-sm text-gray-600">Durasi: {Math.floor(videoData.duration / 60)} menit</p>
      )}
    </div>
  )
}

// Text Content Component
function TextContent({ content, theme, readingSettings }: any) {
  const textData = content.content_data || {}
  const body = textData.body || ''
  const htmlContent = markdownToHtml(body)

  return (
    <div className="prose prose-lg max-w-none" style={{ color: theme.text }}>
      <style jsx>{`
        div :global(h1) {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
          color: ${theme.text};
        }
        div :global(h2) {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
          color: ${theme.text};
        }
        div :global(h3) {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
          color: ${theme.text};
        }
        div :global(p) {
          margin-bottom: 1em;
          line-height: 1.7;
        }
        div :global(p:last-child) {
          margin-bottom: 0;
        }
        div :global(ul) {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        div :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        div :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        div :global(a) {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}

// Quiz Content Component
function QuizContent({ content, progress, onComplete }: any) {
  const [QuizPlayer, setQuizPlayer] = useState<any>(null)

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/components/learn/QuizPlayer').then((mod) => {
      setQuizPlayer(() => mod.QuizPlayer)
    })
  }, [])

  if (!QuizPlayer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <QuizPlayer contentId={content.id} onComplete={onComplete} />
}

// Document Content Component
function DocumentContent({ content }: any) {
  const docData = content.content_data || {}
  
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <File className="w-12 h-12 text-purple-600" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900">Dokumen</h3>
            <p className="text-sm text-purple-700">
              Tipe: {docData.file_type?.toUpperCase() || 'PDF'}
            </p>
          </div>
          {docData.file_url && (
            <a
              href={docData.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
      
      {docData.file_url && docData.file_type === 'pdf' && (
        <div className="w-full h-[800px]">
          <iframe
            src={docData.file_url}
            className="w-full h-full border border-gray-200 rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

// Assignment Content Component  
function AssignmentContent({ content, onComplete }: any) {
  const { profile } = useAuth()
  const assignmentData = content.content_data || {}
  const [answer, setAnswer] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false) // Track if already submitted
  const [isEditing, setIsEditing] = useState(false) // Track if in revision mode
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null)
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState<number>(1)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(true)
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // Load existing submission on mount and reset state when content changes
  useEffect(() => {
    // Reset all state when content changes
    setAnswer('')
    setSelectedFile(null)
    setUploadedFileUrl(null)
    setIsSubmitted(false)
    setIsEditing(false)
    setIsSubmitting(false)
    setSubmitMessage(null)
    setCurrentSubmissionId(null)
    setCurrentAttemptNumber(1)
    setIsLoadingSubmission(true)
    
    if (!profile) {
      setIsLoadingSubmission(false)
      return
    }
    
    async function loadExistingSubmission() {
      try {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('content_id', content.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error('Error loading submission:', error)
          return
        }
        
        if (data) {
          setIsSubmitted(true)
          setIsEditing(false)
          setAnswer(data.answer_text || '')
          setUploadedFileUrl(data.file_url || null)
          setCurrentSubmissionId(data.id)
          setCurrentAttemptNumber(data.attempt_number || 1)
        }
      } catch (error) {
        console.error('Error loading submission:', error)
      } finally {
        setIsLoadingSubmission(false)
      }
    }
    
    loadExistingSubmission()
  }, [profile, content.id])
  
  // Image compression function
  const compressImage = async (
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      mimeType?: string
    } = {}
  ): Promise<Blob> => {
    const {
      maxWidth = 1600,
      maxHeight = 1200,
      quality = 0.8,
      mimeType = 'image/jpeg'
    } = options

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            mimeType,
            quality
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (10MB max - we'll compress anyway)
      if (file.size > 10 * 1024 * 1024) {
        setSubmitMessage({type: 'error', text: 'File terlalu besar. Maksimal 10MB'})
        return
      }
      
      setSelectedFile(file)
      setUploadedFileUrl(null)
      
      setIsUploading(true)
      setSubmitMessage(null)
      
      try {
        // Compress image first if it's an image
        let fileToUpload: Blob = file
        let fileName = file.name
        let contentType = file.type
        
        if (file.type.startsWith('image/')) {
          setSubmitMessage({type: 'success', text: 'Mengompress gambar...'})
          
          try {
            fileToUpload = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1200,
              quality: 0.8,
              mimeType: 'image/jpeg'
            })
            fileName = `${Date.now()}.jpg`
            contentType = 'image/jpeg'
            
            // Show compression result
            const originalSize = (file.size / 1024).toFixed(2)
            const compressedSize = (fileToUpload.size / 1024).toFixed(2)
            const savings = ((1 - fileToUpload.size / file.size) * 100).toFixed(0)
            
            console.log(`📦 Kompresi: ${originalSize}KB → ${compressedSize}KB (hemat ${savings}%)`)
            setSubmitMessage({type: 'success', text: `Dikompres: ${originalSize}KB → ${compressedSize}KB`})
          } catch (compressError) {
            console.warn('Compression failed, using original:', compressError)
            fileName = `${Date.now()}.${file.name.split('.').pop()}`
          }
        } else {
          fileName = `${Date.now()}.${file.name.split('.').pop()}`
        }
        
        // Upload to Supabase Storage
        const filePath = `${profile?.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('forum-attachments')
          .upload(filePath, fileToUpload, {
            contentType: contentType,
            upsert: false
          })
        
        if (uploadError) throw uploadError
        
        // Use public URL directly
        setUploadedFileUrl(`https://supabase.garuda-21.com/storage/v1/object/public/forum-attachments/${filePath}`)
        setSubmitMessage({type: 'success', text: 'File berhasil diupload'})
      } catch (error: any) {
        console.error('Upload error:', error)
        setSubmitMessage({type: 'error', text: error.message || 'Gagal mengupload file'})
      } finally {
        setIsUploading(false)
      }
    }
  }
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setSubmitMessage({type: 'error', text: 'Pilih file terlebih dahulu'})
      return
    }
    
    setIsUploading(true)
    setSubmitMessage(null)
    
    try {
      // Compress image first if it's an image
      let fileToUpload: Blob = selectedFile
      let fileName = selectedFile.name
      let contentType = selectedFile.type
      
      if (selectedFile.type.startsWith('image/')) {
        setSubmitMessage({type: 'success', text: 'Mengompress gambar...'})
        
        try {
          fileToUpload = await compressImage(selectedFile, {
            maxWidth: 1600,
            maxHeight: 1200,
            quality: 0.8,
            mimeType: 'image/jpeg'
          })
          fileName = `${Date.now()}.jpg`
          contentType = 'image/jpeg'
          
          // Show compression result
          const originalSize = (selectedFile.size / 1024).toFixed(2)
          const compressedSize = (fileToUpload.size / 1024).toFixed(2)
          const savings = ((1 - fileToUpload.size / selectedFile.size) * 100).toFixed(0)
          
          console.log(`📦 Kompresi: ${originalSize}KB → ${compressedSize}KB (hemat ${savings}%)`)
          setSubmitMessage({type: 'success', text: `Dikompres: ${originalSize}KB → ${compressedSize}KB`})
        } catch (compressError) {
          console.warn('Compression failed, using original:', compressError)
          const normalizedFileName = selectedFile.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase()
          fileName = `${Date.now()}.${normalizedFileName.split('.').pop()}`
        }
      } else {
        const normalizedFileName = selectedFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/\s+/g, '_')
          .toLowerCase()
        fileName = `${Date.now()}.${normalizedFileName.split('.').pop()}`
      }
      
      // Upload to assignments bucket
      const filePath = `${profile?.id}/${fileName}`.replace(/\s+/g, '_')
      
      console.log('Uploading to:', `assignments/${filePath}`)
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, fileToUpload, {
          contentType: contentType,
          upsert: false
        })
      
      if (uploadError) throw uploadError
      
      // Use public URL directly (like payment-proofs)
      const publicUrl = `https://supabase.garuda-21.com/storage/v1/object/public/assignments/${filePath}`
      
      setUploadedFileUrl(publicUrl)
      setSubmitMessage({type: 'success', text: 'File berhasil diupload'})
    } catch (error: any) {
      console.error('Upload error:', error)
      setSubmitMessage({type: 'error', text: error.message || 'Gagal mengupload file'})
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleRevision = () => {
    setIsEditing(true)
    setIsSubmitted(false)
    setSubmitMessage(null)
  }
  
  const handleSubmit = async () => {
    if (!profile) {
      setSubmitMessage({type: 'error', text: 'Anda harus login untuk mengirim tugas'})
      return
    }
    
    if (!isEditing && isSubmitted) {
      setSubmitMessage({type: 'error', text: 'Tugas sudah dikirim. Klik "Revisi" untuk mengubah.'})
      return
    }
    
    if (!answer && !uploadedFileUrl) {
      setSubmitMessage({type: 'error', text: 'Tulis jawaban atau upload file terlebih dahulu'})
      return
    }
    
    setIsSubmitting(true)
    setSubmitMessage(null)
    
    try {
      let data, error
      
      // If editing existing submission, update it or create new attempt
      if (isEditing && currentSubmissionId) {
        // Try to update existing submission first
        const updateResult = await supabase
          .from('assignment_submissions')
          .update({
            answer_text: answer || null,
            file_url: uploadedFileUrl || null,
            status: 'submitted',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubmissionId)
          .select()
          .single()
        
        if (updateResult.error && updateResult.error.code !== '42501') { // Ignore RLS errors, try insert instead
          // If update fails (maybe due to RLS), create new attempt
          const newAttemptNumber = currentAttemptNumber + 1
          const insertResult = await supabase
            .from('assignment_submissions')
            .insert({
              user_id: profile.id,
              content_id: content.id,
              answer_text: answer || null,
              file_url: uploadedFileUrl || null,
              status: 'submitted',
              attempt_number: newAttemptNumber
            })
            .select()
            .single()
          
          data = insertResult.data
          error = insertResult.error
          
          if (!error && data) {
            setCurrentAttemptNumber(newAttemptNumber)
            setCurrentSubmissionId(data.id)
          }
        } else {
          data = updateResult.data
          error = updateResult.error
        }
      } else {
        // New submission
        const insertResult = await supabase
          .from('assignment_submissions')
          .insert({
            user_id: profile.id,
            content_id: content.id,
            answer_text: answer || null,
            file_url: uploadedFileUrl || null,
            status: 'submitted',
            attempt_number: 1
          })
          .select()
          .single()
        
        data = insertResult.data
        error = insertResult.error
        
        if (!error && data) {
          setCurrentSubmissionId(data.id)
          setCurrentAttemptNumber(1)
        }
      }
      
      if (error) {
        console.error('Submit error:', error)
        throw new Error(error.message || 'Gagal menyimpan submission ke database')
      }
      
      if (!data) {
        throw new Error('Submission tidak berhasil disimpan')
      }
      
      // Only mark as submitted and complete after successful save
      const wasEditing = isEditing // Capture before state change
      setIsSubmitted(true)
      setIsEditing(false)
      setSubmitMessage({type: 'success', text: wasEditing ? 'Revisi tugas berhasil dikirim' : 'Tugas berhasil dikirim'})
      
      // Automatically mark content as completed
      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      setSubmitMessage({type: 'error', text: error.message || 'Gagal mengirim tugas'})
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-900 mb-4">Instruksi Tugas</h3>
        <div 
          className="text-orange-800 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: assignmentData.instructions?.replace(/\n/g, '<br />') || '' }}
        />
        
        {assignmentData.deadline && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-sm text-orange-700">
              <strong>Deadline:</strong> {new Date(assignmentData.deadline).toLocaleString('id-ID')}
            </p>
          </div>
        )}
        
        {assignmentData.max_score && (
          <div className="mt-2">
            <p className="text-sm text-orange-700">
              <strong>Skor Maksimal:</strong> {assignmentData.max_score}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold text-gray-900 mb-4">Submit Tugas Anda</h4>
        {isLoadingSubmission ? (
          <div className="py-8 text-center text-gray-500">
            Memuat data tugas...
          </div>
        ) : (
          <>
            <textarea
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 ${
                isSubmitted && !isEditing ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
              }`}
              rows={6}
              placeholder="Tulis jawaban Anda di sini..."
              value={answer}
              onChange={(e) => !isSubmitted || isEditing ? setAnswer(e.target.value) : undefined}
              readOnly={isSubmitted && !isEditing}
            />
        
        {/* File Upload Section */}
        {selectedFile && !uploadedFileUrl && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-900">{selectedFile.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}
        
        {uploadedFileUrl && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-900">File berhasil diupload</span>
            </div>
              {(!isSubmitted || isEditing) && (
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setUploadedFileUrl(null)
                }}
                className="text-sm text-green-700 hover:text-green-900"
              >
                Remove
              </button>
            )}
          </div>
        )}
        
        {/* Message Display */}
        {submitMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            submitMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-900' 
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            {submitMessage.text}
          </div>
        )}
        
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (isSubmitted && !isEditing) || (!answer && !uploadedFileUrl)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Mengirim...' : isEditing ? 'Kirim Revisi' : isSubmitted ? 'Sudah Dikirim' : 'Submit'}
          </button>
          {isSubmitted && !isEditing && (
            <button
              onClick={handleRevision}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Revisi Tugas
            </button>
          )}
          {(!isSubmitted || isEditing) && (
            <label className="cursor-pointer px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <input 
                type="file"
                className="hidden" 
                onChange={handleFileSelect}
                disabled={isSubmitted && !isEditing}
              />
              Pilih File
            </label>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  )
}

// Adaptive Reading Modal Component
function AdaptiveReadingModal({ open, onClose, settings, onUpdate }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pengaturan Baca</h2>
              <p className="text-sm text-gray-600">Sesuaikan pengalaman belajar Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/50 transition-colors duration-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Tema */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              Tema Visual
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  key: 'light', 
                  label: 'Terang', 
                  description: 'Tema standar yang nyaman',
                  bgColor: '#ffffff', 
                  textColor: '#000000',
                  icon: '☀️',
                  gradient: 'from-yellow-400 to-orange-500'
                },
                { 
                  key: 'warm', 
                  label: 'Hangat', 
                  description: 'Nyaman untuk mata, mengurangi kelelahan',
                  bgColor: '#FFF8E7', 
                  textColor: '#4A3520',
                  icon: '🌅',
                  gradient: 'from-amber-400 to-yellow-500'
                },
                { 
                  key: 'dark', 
                  label: 'Gelap', 
                  description: 'Ideal untuk membaca di malam hari',
                  bgColor: '#1f1f1f', 
                  textColor: '#ffffff',
                  icon: '🌙',
                  gradient: 'from-slate-600 to-slate-800'
                }
              ].map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => onUpdate('theme', theme.key)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.theme === theme.key 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.theme === theme.key && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-2xl`}>
                      {theme.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{theme.label}</h4>
                      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                      <div 
                        className="w-full h-12 border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                      >
                        <span className="text-sm font-medium">Contoh teks bacaan</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Font */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              Jenis Font
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  key: 'default', 
                  label: 'Inter (Default)', 
                  description: 'Font modern dan mudah dibaca',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  icon: '🔤'
                },
                { 
                  key: 'serif', 
                  label: 'Georgia (Serif)', 
                  description: 'Font klasik untuk bacaan panjang',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  icon: '📚'
                },
                { 
                  key: 'dyslexic', 
                  label: 'Open Dyslexic', 
                  description: 'Dirancang khusus untuk disleksia',
                  fontFamily: 'OpenDyslexic, Arial, sans-serif',
                  icon: '♿'
                }
              ].map((font) => (
                <button
                  key={font.key}
                  onClick={() => onUpdate('fontType', font.key)}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.fontType === font.key 
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.fontType === font.key && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl">
                      {font.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-gray-900 mb-1">{font.label}</h4>
                      <p className="text-sm text-gray-600 mb-2">{font.description}</p>
                      <div 
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        Contoh teks dengan font ini
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Font */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              Ukuran Font
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'small', label: 'Kecil', size: '14px', icon: 'A' },
                { key: 'medium', label: 'Sedang', size: '16px', icon: 'A' },
                { key: 'large', label: 'Besar', size: '18px', icon: 'A' }
              ].map((size) => (
                <button
                  key={size.key}
                  onClick={() => onUpdate('fontSize', size.key)}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.fontSize === size.key 
                      ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-orange-300 hover:shadow-md hover:scale-105 bg-white'
                  }`}
                >
                  {settings.fontSize === size.key && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div 
                      className="text-4xl font-bold text-gray-900 mb-2"
                      style={{ fontSize: size.size }}
                    >
                      {size.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{size.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lebar Bacaan */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              Lebar Bacaan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { 
                  key: 'medium', 
                  label: 'Medium', 
                  description: 'Lebar optimal untuk fokus',
                  width: '60%',
                  icon: '📖'
                },
                { 
                  key: 'full', 
                  label: 'Full-width', 
                  description: 'Menggunakan seluruh lebar layar',
                  width: '100%',
                  icon: '📄'
                }
              ].map((width) => (
                <button
                  key={width.key}
                  onClick={() => onUpdate('readingWidth', width.key)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.readingWidth === width.key 
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.readingWidth === width.key && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-3">{width.icon}</div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">{width.label}</h4>
                    <p className="text-xs text-gray-600 mb-3">{width.description}</p>
                    <div className="w-full bg-gray-200 rounded-lg h-3 relative">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg h-3 transition-all duration-300"
                        style={{ width: width.width }}
                      ></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="text-center text-sm text-gray-500">
            Pengaturan akan disimpan otomatis
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Drawer Component
function ContentDrawer({ open, onClose, contents, progress, overallProgress, currentContentId, onSelectContent, getContentIcon, isContentUnlocked, canAccessContent }: any) {
  if (!open) return null

  // Organize contents into main materials and sub-materials
  // Main materials: no parent_id (top-level materials)
  // Sub materials: has parent_id pointing to main material
  const mainMaterials = contents.filter((c: any) => !c.parent_id)
  const subMaterials = contents.filter((c: any) => c.parent_id)

  return (
    <div className="fixed inset-x-0 top-[60px] bottom-[60px] z-40">
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Daftar Materi</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Kemajuan Belajar</h4>
            <span className="text-sm font-bold text-green-600">{overallProgress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }} 
              />
            </div>
            <div className="text-xs text-gray-500">
              {contents.filter((c: any) => progress[c.id]?.status === 'completed').length} / {contents.length}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-3">
            {mainMaterials.map((content: LearningContent, index: number) => {
              const contentProgress = progress[content.id]
              const isCompleted = contentProgress?.status === 'completed'
              const isCurrent = content.id === currentContentId
              const isUnlocked = isContentUnlocked(content.id)
              const canAccess = canAccessContent(content.id)
              const relatedSubMaterials = subMaterials.filter((sub: any) => sub.parent_id === content.id)

              return (
                <div key={content.id} className="space-y-2">
                  {/* Main Material */}
                  <button
                    onClick={() => canAccess ? onSelectContent(content, index) : null}
                    disabled={!canAccess}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                      !canAccess
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                        : isCompleted
                        ? 'border-green-300 bg-green-50 hover:bg-green-100'
                        : isCurrent 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${
                        !canAccess
                          ? 'bg-gray-200 text-gray-400'
                          : isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isCurrent 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {!canAccess ? (
                          <X className="w-4 h-4" />
                        ) : (
                          getContentIcon(content.content_type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            !canAccess
                              ? 'text-gray-500'
                              : isCompleted 
                              ? 'text-green-900' 
                              : isCurrent 
                              ? 'text-blue-900' 
                              : 'text-gray-900 group-hover:text-blue-900'
                          }`}>
                            {content.title}
                          </h4>
                          {!canAccess && (
                            <div className="flex items-center gap-1">
                              <X className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Terkunci</span>
                            </div>
                          )}
                          {isCompleted && canAccess && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {!canAccess ? (
                            <span className="text-gray-400">Selesaikan materi sebelumnya untuk membuka</span>
                          ) : (
                            <>
                              <span className="capitalize">{content.content_type}</span>
                              {content.estimated_duration && (
                                <>
                                  <span>•</span>
                                  <span>{content.estimated_duration}m</span>
                                </>
                              )}
                              {isCurrent && !isCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">Sedang dipelajari</span>
                                </>
                              )}
                              {isCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">Selesai</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Sub Materials */}
                  {relatedSubMaterials.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {relatedSubMaterials.map((subContent: any, subIndex: number) => {
                        const subProgress = progress[subContent.id]
                        const isSubCompleted = subProgress?.status === 'completed'
                        const isSubCurrent = subContent.id === currentContentId
                        const canAccessSub = canAccessContent(subContent.id)

                        return (
                          <button
                            key={subContent.id}
                            onClick={() => canAccessSub ? onSelectContent(subContent, contents.indexOf(subContent)) : null}
                            disabled={!canAccessSub}
                            className={`w-full text-left p-2 rounded-md border transition-all duration-200 group ${
                              !canAccessSub
                                ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                : isSubCompleted
                                ? 'border-green-300 bg-green-50 hover:bg-green-100'
                                : isSubCurrent 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-100 hover:border-blue-200 hover:bg-blue-25'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                !canAccessSub
                                  ? 'bg-gray-300'
                                  : isSubCompleted 
                                  ? 'bg-green-600' 
                                  : 'bg-blue-600'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className={`text-xs font-medium ${
                                    !canAccessSub
                                      ? 'text-gray-400'
                                      : isSubCompleted 
                                      ? 'text-green-900' 
                                      : isSubCurrent 
                                      ? 'text-blue-900' 
                                      : 'text-gray-700 group-hover:text-blue-900'
                                  }`}>
                                    {subContent.title}
                                  </h5>
                                  {!canAccessSub && (
                                    <X className="w-3 h-3 text-gray-400" />
                                  )}
                                  {isSubCompleted && canAccessSub && (
                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <span className="capitalize">{subContent.content_type}</span>
                                  {subContent.estimated_duration && (
                                    <>
                                      <span>•</span>
                                      <span>{subContent.estimated_duration}m</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-sm text-gray-500">
            {contents.length} materi tersedia
          </div>
        </div>
      </div>
    </div>
  )
}

// Bottom Navigation Component
function BottomNavigation({ currentIndex, totalContents, currentContent, onNavigate, theme, readingSettings, contents, progress, canAccessContent }: any) {
  // Check if current content is completed
  const currentContentProgress = progress[currentContent?.id]
  const isCurrentCompleted = currentContentProgress?.status === 'completed'
  
  // Check if next content exists and is accessible
  const hasNext = currentIndex < totalContents - 1
  const nextContent = hasNext ? contents[currentIndex + 1] : null
  const canAccessNext = nextContent ? canAccessContent(nextContent.id) : false
  const isNextDisabled = !hasNext || !isCurrentCompleted || !canAccessNext
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur border-t" style={{
      backgroundColor: `${theme.headerBg}f2`,
      borderColor: theme.borderColor,
      transition: 'all 0.3s ease'
    }}>
      {/* Desktop Footer */}
      <div className="hidden md:block">
        <div className="w-full px-3 py-4 grid grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className={`text-left rounded-lg p-3 transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
          >
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Sebelumnya</div>
            <div className="text-sm truncate" style={{ color: theme.text }}>
              {currentIndex > 0 ? contents[currentIndex - 1]?.title || '← Prev' : 'Tidak ada'}
            </div>
          </button>
          <div className="text-center flex flex-col justify-center">
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Saat Ini</div>
            <div className="text-sm font-semibold truncate" style={{ color: theme.text }}>
              {currentContent?.title || ''}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('next')}
            disabled={isNextDisabled}
            className={`text-right rounded-lg p-3 transition-colors ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
            title={isNextDisabled && !isCurrentCompleted ? 'Selesaikan materi ini terlebih dahulu' : ''}
          >
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Selanjutnya</div>
            <div className="text-sm truncate" style={{ color: theme.text }}>
              {currentIndex < totalContents - 1 ? contents[currentIndex + 1]?.title || 'Next →' : 'Tidak ada'}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden w-full px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: theme.text }} />
          </button>
          <div className="text-center flex-1 min-w-0 px-2">
            <div className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.text }}>
              {currentContent?.title || ''}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('next')}
            disabled={isNextDisabled}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isNextDisabled && !isCurrentCompleted ? 'Selesaikan materi ini terlebih dahulu' : ''}
          >
            <ArrowRight className="w-5 h-5" style={{ color: theme.text }} />
          </button>
        </div>
      </div>
    </div>
  )
}
