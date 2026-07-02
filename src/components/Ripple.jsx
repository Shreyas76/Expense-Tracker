import { useState, useCallback } from 'react'

// Material ripple wrapper. Renders a tappable element with an expanding ripple.
export default function Ripple({
  as: Tag = 'button',
  className = '',
  color = 'rgba(255,255,255,0.25)',
  onClick,
  children,
  ...rest
}) {
  const [ripples, setRipples] = useState([])

  const createRipple = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2
    const id = Date.now() + Math.random()
    setRipples((prev) => [...prev, { id, x, y, size }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }, [])

  return (
    <Tag
      className={`relative overflow-hidden ${className}`}
      onClick={(e) => {
        createRipple(e)
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            backgroundColor: color,
            animation: 'ripple 600ms ease-out',
            transform: 'scale(0)'
          }}
        />
      ))}
    </Tag>
  )
}
