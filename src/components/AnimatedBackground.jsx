import { useEffect, useRef } from 'react'

/**
 * Full-screen 3D particle field — matches Elect Technologies website aesthetic.
 * Uses canvas for performance; draws floating depth-sorted particles with
 * subtle perspective projection to create a genuine 3D effect.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width, height, particles, animFrame

    const COLORS = [
      'rgba(0,113,227,',    // apple blue
      'rgba(50,173,230,',   // cyan
      'rgba(227,24,26,',    // ET red
      'rgba(255,255,255,',  // white
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
        vx:   (Math.random() - 0.5) * 0.4,
        vy:   (Math.random() - 0.5) * 0.4,
        vz:   -(Math.random() * 0.6 + 0.2),
        size: Math.random() * 2.5 + 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 160 }, makeParticle)
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

      // Draw particles back-to-front (already sorted by z desc)
      particles.sort((a, b) => b.z - a.z)

      for (const p of particles) {
        const { sx, sy, scale } = project(p)
        if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20) continue

        const alpha = Math.min(1, scale * 0.9)
        const r     = p.size * scale

        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2)
        ctx.fillStyle = p.color + alpha.toFixed(2) + ')'
        ctx.fill()

        // Subtle glow on larger near particles
        if (r > 1.5) {
          ctx.beginPath()
          ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = p.color + (alpha * 0.08).toFixed(3) + ')'
          ctx.fill()
        }
      }

      // Move
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz

        // Respawn at back when it comes too close
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
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
