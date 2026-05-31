import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const icon = type === 'success' ? '✓' : '✕'

  return (
    <div className={`toast ${type}`}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  )
}
