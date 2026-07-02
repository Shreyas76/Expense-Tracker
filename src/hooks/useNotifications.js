import { useCallback, useEffect, useRef, useState } from 'react'

// Lightweight in-app reminder scheduler with optional Web Notifications.
// Because there is no backend/push server, "push" here means locally
// scheduled Notification popups while the app/service worker is alive,
// with graceful fallback to in-app toasts.
const REMINDERS = [
  {
    id: 'daily-9pm',
    test: (d) => d.getHours() === 21 && d.getMinutes() === 0,
    title: 'Expense reminder',
    body: 'Did you log today’s expenses? 📝'
  },
  {
    id: 'day-25',
    test: (d) => d.getDate() === 25 && d.getHours() === 10 && d.getMinutes() === 0,
    title: 'Allocate your surplus',
    body: 'You may have unallocated funds — consider investing before month end 💸'
  },
  {
    id: 'day-1',
    test: (d) => d.getDate() === 1 && d.getHours() === 9 && d.getMinutes() === 0,
    title: 'New month started',
    body: 'Your investments are reset. Time to SIP! 📈'
  }
]

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const firedRef = useRef(new Set())

  const supported = typeof Notification !== 'undefined'

  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported'
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      return 'denied'
    }
  }, [supported])

  const notify = useCallback(
    (title, body) => {
      if (supported && permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })
          return true
        } catch {
          return false
        }
      }
      return false
    },
    [supported, permission]
  )

  // Minute-tick loop that fires due reminders once per matching minute.
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const minuteKey = `${now.toDateString()}-${now.getHours()}-${now.getMinutes()}`
      REMINDERS.forEach((r) => {
        const key = `${r.id}-${minuteKey}`
        if (r.test(now) && !firedRef.current.has(key)) {
          firedRef.current.add(key)
          notify(r.title, r.body)
          window.dispatchEvent(
            new CustomEvent('app-reminder', { detail: { title: r.title, body: r.body } })
          )
        }
      })
    }
    const interval = setInterval(tick, 30000)
    tick()
    return () => clearInterval(interval)
  }, [notify])

  return { permission, supported, requestPermission, notify }
}
