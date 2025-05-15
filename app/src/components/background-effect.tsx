"use client"

import { useEffect, useRef } from "react"
import styles from "./background-effect.module.css"

export function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Particle class
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      alpha: number
      originalAlpha: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.originalAlpha = Math.random() * 0.5 + 0.1
        this.alpha = this.originalAlpha
        this.color = this.getRandomColor()
      }

      getRandomColor() {
        const colors = [
          "rgba(240, 185, 11, alpha)", // Yellow (WheatChain color)
          "rgba(255, 215, 0, alpha)", // Gold
          "rgba(255, 255, 255, alpha)", // White
        ]

        return colors[Math.floor(Math.random() * colors.length)].replace("alpha", this.alpha.toString())
      }

      update(mouseX?: number, mouseY?: number) {
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around edges
        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height

        // Interact with mouse
        if (mouseX !== undefined && mouseY !== undefined) {
          const dx = this.x - mouseX
          const dy = this.y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 150

          if (distance < maxDistance) {
            const force = (1 - distance / maxDistance) * 0.05
            this.speedX += dx * force
            this.speedY += dy * force
            this.alpha = this.originalAlpha * (1 + (1 - distance / maxDistance))
            this.color = this.getRandomColor()
          } else {
            this.alpha = this.originalAlpha
          }
        }
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }

    // Variables
    let particles: Particle[] = []
    let orbs: { x: number; y: number; size: number; color: string }[] = []
    let mouseX: number | undefined
    let mouseY: number | undefined
    let animationFrameId: number

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Initialize elements
    const initializeElements = () => {
      // Create particles
      particles = []
      const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 15000))

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }

      // Create gradient orbs
      orbs = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, size: canvas.width * 0.15, color: "rgba(240, 185, 11, 0.07)" },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, size: canvas.width * 0.2, color: "rgba(240, 185, 11, 0.05)" },
        { x: canvas.width * 0.5, y: canvas.height * 0.2, size: canvas.width * 0.1, color: "rgba(255, 255, 255, 0.03)" },
      ]
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const handleMouseLeave = () => {
      mouseX = undefined
      mouseY = undefined
    }

    // Touch interaction for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX
        mouseY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = () => {
      mouseX = undefined
      mouseY = undefined
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw orbs
      orbs.forEach((orb) => {
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
      ctx.lineWidth = 0.5

      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update(mouseX, mouseY)
        particle.draw()
      })

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(240, 185, 11, ${0.1 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    // Setup
    setCanvasDimensions()
    initializeElements()

    // Event listeners
    window.addEventListener("resize", () => {
      setCanvasDimensions()
      initializeElements()
    })

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("touchmove", handleTouchMove)
    canvas.addEventListener("touchend", handleTouchEnd)

    // Start animation
    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", () => {
        setCanvasDimensions()
        initializeElements()
      })
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className={styles.backgroundContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
