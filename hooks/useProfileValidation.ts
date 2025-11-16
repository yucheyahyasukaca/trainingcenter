import { useRouter } from 'next/navigation'
import { useNotification } from '@/components/ui/Notification'
import { validateProfileCompleteness } from '@/lib/profileValidation'

interface UseProfileValidationOptions {
  /**
   * The URL to return to after completing profile
   */
  returnUrl?: string
  /**
   * Custom message to show in notification
   */
  customMessage?: string
  /**
   * Duration of the notification in milliseconds
   */
  notificationDuration?: number
  /**
   * Delay before redirecting in milliseconds
   */
  redirectDelay?: number
}

/**
 * Custom hook to validate profile completeness and handle redirects
 * @param options - Configuration options
 * @returns Object with checkProfile function
 */
export function useProfileValidation(options: UseProfileValidationOptions = {}) {
  const router = useRouter()
  const { addNotification } = useNotification()

  const {
    returnUrl = '',
    customMessage,
    notificationDuration = 5000,
    redirectDelay = 1500
  } = options

  /**
   * Check if user profile is complete. If not, show notification and redirect to edit profile page.
   * @param userId - The user ID to validate
   * @returns Promise<boolean> - Returns true if profile is complete, false otherwise
   */
  const checkProfile = async (userId: string): Promise<boolean> => {
    try {
      const { isComplete, missingFields } = await validateProfileCompleteness(userId)

      if (!isComplete) {
        const defaultMessage = 'Untuk mendaftar program, Anda harus melengkapi data profil terlebih dahulu. Silakan lengkapi data di halaman edit profil.'
        
        addNotification({
          type: 'warning',
          title: 'Data Profil Belum Lengkap',
          message: customMessage || defaultMessage,
          duration: notificationDuration
        })

        console.log('➡️ Redirecting to edit profile page to complete data first')
        console.log('📋 Missing fields:', missingFields.join(', '))
        
        const returnQuery = returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''
        
        setTimeout(() => {
          router.push(`/profile/edit${returnQuery}`)
        }, redirectDelay)

        return false
      }

      return true
    } catch (error) {
      console.error('Error checking profile completeness:', error)
      
      addNotification({
        type: 'warning',
        title: 'Lengkapi Data Profil',
        message: 'Untuk mendaftar program, silakan lengkapi data profil Anda terlebih dahulu.',
        duration: notificationDuration
      })
      
      const returnQuery = returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''
      
      setTimeout(() => {
        router.push(`/profile/edit${returnQuery}`)
      }, redirectDelay)

      return false
    }
  }

  return { checkProfile }
}

