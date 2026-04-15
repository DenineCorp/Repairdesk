import { useEffect, useRef } from 'react'

/**
 * Full-screen animated background — 3D particle field + grid overlay + brand orbs.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width, height, particles, animFrame

    const COLORS = [
      'rgba(79,156,249,',    // brand blue
      'rgba(50,173,230,',    // cyan
      'rgba(227,24,26,',     // ET red
      'rgba(255,255,255,',   // white
    ]

    function resize() {
      width  = canvas.width  = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    function makeParticle() {
      return {
        x:    (Math.random() - 0.5) * 2000,
        y:    (Math.random() - 0.5) * 2000,
        z:    Math.random() * 1200 + 100,
        vx:   (Math.random() - 0.5) * 0.35,
        vy:   (Math.random() - 0.5) * 0.35,
        vz:   -(Math.random() * 0.5 + 0.15),
        size: Math.random() * 2.2 + 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 140 }, makeParticle)
    }

    const FOV = 500

    function project(p) {
      const scale = FOV / (FOV + p.z)
      return {
        sx: p.x * scale + width  / 2,
        sy: p.y * scale + height / 2,
        scale,
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      particles.sort((a, b) => b.z - a.z)

      for (const p of particles) {
        const { sx, sy, scale } = project(p)
        if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20) continue

        const alpha = Math.min(1, scale * 0.85)
        const r     = p.size * scale

        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2)
        ctx.fillStyle = p.color + alpha.toFixed(2) + ')'
        ctx.fill()

        if (r > 1.5) {
          ctx.beginPath()
          ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = p.color + (alpha * 0.07).toFixed(3) + ')'
          ctx.fill()
        }
      }

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz
        if (p.z < 1) {
          p.x  = (Math.random() - 0.5) * 2000
          p.y  = (Math.random() - 0.5) * 2000
          p.z  = 1200
        }
      }

      animFrame = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Brand red orb — bottom left */}
      <div style={{
        position: 'fixed', bottom: -280, left: -180, zIndex: 0, pointerEvents: 'none',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(227,24,26,0.09) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      {/* Brand blue orb — top right */}
      <div style={{
        position: 'fixed', top: -200, right: -200, zIndex: 0, pointerEvents: 'none',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(79,156,249,0.07) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      {/* Top vignette */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(79,156,249,0.05) 0%, transparent 60%)',
      }} />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0, width: '100%', height: '100%',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
    </>
  )
}
