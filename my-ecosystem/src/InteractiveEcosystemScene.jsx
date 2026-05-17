import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const THEMES = {
  mono: { bg: 0x0a0a0a, particle: 0xffffff, line: 0x444444, accent: '#6b7280', glow: '#10b981' },
  blue: { bg: 0x0a0f1a, particle: 0x60a5fa, line: 0x1e3a8a, accent: '#3b82f6', glow: '#60a5fa' },
  purple: { bg: 0x0f0a1a, particle: 0xa78bfa, line: 0x4c1d95, accent: '#8b5cf6', glow: '#a78bfa' },
  cyan: { bg: 0x0a1a1a, particle: 0x22d3ee, line: 0x164e63, accent: '#06b6d4', glow: '#22d3ee' },
  red: { bg: 0x1a0a0a, particle: 0xf87171, line: 0x7f1d1d, accent: '#ef4444', glow: '#f87171' },
}

const PARTICLE_COUNT = 150
const PARTICLE_RANGE = 100
const PARTICLE_RANGE_Z = 50
const MOUSE_RANGE = 30
const MOUSE_RANGE_SQ = MOUSE_RANGE * MOUSE_RANGE
const PARTICLE_REPEL_RANGE = 15
const PARTICLE_REPEL_RANGE_SQ = PARTICLE_REPEL_RANGE * PARTICLE_REPEL_RANGE
const CONNECTION_RANGE = 12
const CONNECTION_RANGE_SQ = CONNECTION_RANGE * CONNECTION_RANGE

export default function InteractiveEcosystemScene() {
  const containerRef = useRef(null)
  const [colorTheme, setColorTheme] = useState('mono')
  const currentTheme = THEMES[colorTheme]

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(currentTheme.bg, 0.002)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(currentTheme.bg, 1)

    container.appendChild(renderer.domElement)

    const particles = []
    const geometry = new THREE.SphereGeometry(0.15, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: currentTheme.particle, transparent: true, opacity: 0.8 })
    const lineMaterial = new THREE.LineBasicMaterial({
      color: currentTheme.line,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    })
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3)
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const mesh = new THREE.Mesh(geometry, material.clone())
      const particle = {
        mesh,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * PARTICLE_RANGE,
          (Math.random() - 0.5) * PARTICLE_RANGE,
          (Math.random() - 0.5) * PARTICLE_RANGE_Z,
        ),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1),
        originalPosition: new THREE.Vector3(
          (Math.random() - 0.5) * PARTICLE_RANGE,
          (Math.random() - 0.5) * PARTICLE_RANGE,
          (Math.random() - 0.5) * PARTICLE_RANGE_Z,
        ),
        mass: 0.5 + Math.random() * 1.5,
      }
      mesh.position.copy(particle.position)
      scene.add(mesh)
      particles.push(particle)
    }

    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0
    const mousePosition = new THREE.Vector3()
    const direction = new THREE.Vector3()
    const returnForce = new THREE.Vector3()

    const handleMouseMove = (event) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    let frameId
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      mouseX += (targetMouseX * 50 - mouseX) * 0.05
      mouseY += (targetMouseY * 50 - mouseY) * 0.05
      mousePosition.set(mouseX, mouseY, 0)

      let lineIndex = 0
      const positions = lineGeometry.attributes.position.array

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]
        const distanceToMouseSq = particle.position.distanceToSquared(mousePosition)

        if (distanceToMouseSq < MOUSE_RANGE_SQ) {
          const distanceToMouse = Math.sqrt(distanceToMouseSq)
          const mouseInfluence = MOUSE_RANGE - distanceToMouse

          if (mouseInfluence > 0) {
            direction.subVectors(particle.position, mousePosition).normalize()
            particle.velocity.add(direction.multiplyScalar((mouseInfluence * 0.008) / particle.mass))
          }
        }

        for (let j = i + 1; j < particles.length; j += 1) {
          const otherParticle = particles[j]
          const distanceSq = particle.position.distanceToSquared(otherParticle.position)

          if (distanceSq < PARTICLE_REPEL_RANGE_SQ && distanceSq > 0) {
            const distance = Math.sqrt(distanceSq)
            direction.subVectors(particle.position, otherParticle.position).normalize()
            const repulsion = direction.multiplyScalar(0.01 / distance)
            particle.velocity.add(repulsion)
            otherParticle.velocity.sub(repulsion)

            if (distanceSq < CONNECTION_RANGE_SQ) {
              positions[lineIndex * 3] = particle.position.x
              positions[lineIndex * 3 + 1] = particle.position.y
              positions[lineIndex * 3 + 2] = particle.position.z
              lineIndex += 1
              positions[lineIndex * 3] = otherParticle.position.x
              positions[lineIndex * 3 + 1] = otherParticle.position.y
              positions[lineIndex * 3 + 2] = otherParticle.position.z
              lineIndex += 1
            }
          }
        }

        returnForce.subVectors(particle.originalPosition, particle.position).multiplyScalar(0.001)
        particle.velocity.add(returnForce)
        particle.velocity.multiplyScalar(0.95)
        particle.position.add(particle.velocity)
        particle.mesh.position.copy(particle.position)

        const speed = particle.velocity.length()
        particle.mesh.scale.setScalar(1 + speed * 2)
        const opacity = THREE.MathUtils.mapLinear(particle.position.z, -25, 25, 0.3, 1)
        particle.mesh.material.opacity = Math.max(0.2, Math.min(1, opacity))
      }

      for (let index = lineIndex * 3; index < positions.length; index += 1) {
        positions[index] = 0
      }

      lineGeometry.attributes.position.needsUpdate = true
      camera.position.x = Math.sin(Date.now() * 0.0001) * 2
      camera.position.y = Math.cos(Date.now() * 0.0001) * 2
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameId)

      for (const particle of particles) {
        scene.remove(particle.mesh)
        particle.mesh.geometry.dispose()
        particle.mesh.material.dispose()
      }

      scene.remove(lines)
      lineGeometry.dispose()
      lineMaterial.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      geometry.dispose()
      renderer.dispose()
    }
  }, [currentTheme.bg, currentTheme.line, currentTheme.particle])

  const textStyle = {
    position: 'absolute',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1000,
    pointerEvents: 'none',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0a0a0a' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ ...textStyle, top: 40, left: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', marginBottom: 10, opacity: 0.7 }}>V1.2_STABLE</div>
          <h1 style={{ margin: 0, fontSize: 48, fontWeight: 'bold', lineHeight: 1 }}>
            Interactive<br />Ecosystem
          </h1>
        </div>

        <div style={{ ...textStyle, top: 40, right: 40 }}>
          <div style={{ fontSize: 11, marginBottom: 8, opacity: 0.7 }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, backgroundColor: currentTheme.glow, borderRadius: '50%' }} />
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>ACTIVE</span>
          </div>
        </div>

        <div style={{ ...textStyle, bottom: 40, left: 40 }}>
          <div style={{ fontSize: 11, marginBottom: 5, opacity: 0.7 }}>PHYSICS ENGINE</div>
          <div style={{ fontSize: 14 }}>Particle Dynamics System</div>
        </div>

        <div style={{ ...textStyle, bottom: 40, right: 40 }}>
          <div style={{ fontSize: 11, marginBottom: 5, opacity: 0.7 }}>INTERACTION</div>
          <div style={{ fontSize: 14 }}>Move cursor to influence nodes</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 30,
            transform: 'translateY(-50%)',
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          {Object.keys(THEMES).map((theme) => (
            <button
              key={theme}
              onClick={() => setColorTheme(theme)}
              style={{
                display: 'block',
                width: 50,
                height: 50,
                margin: '10px 0',
                borderRadius: '50%',
                border: `3px solid ${colorTheme === theme ? THEMES[theme].glow : '#444'}`,
                backgroundColor: colorTheme === theme ? THEMES[theme].accent : 'rgba(0,0,0,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              title={theme.toUpperCase()}
            />
          ))}
        </div>
      </div>
    </div>
  )
}