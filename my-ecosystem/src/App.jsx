import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function InteractiveEcosystem() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, z: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.002);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a, 1);
    const container = containerRef.current;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particle system
    const particleCount = 150;
    const particles = [];
    
    // Geometry for instanced particles
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    // Create connection lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      
      const particle = {
        mesh,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 50
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.1
        ),
        originalPosition: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 50
        ),
        mass: 0.5 + Math.random() * 1.5
      };

      mesh.position.copy(particle.position);
      scene.add(mesh);
      particles.push(particle);
    }

    particlesRef.current = particles;

    // Mouse interaction
    const handleMouseMove = (event) => {
      targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Smooth mouse position
      mouseRef.current.x += (targetMouseRef.current.x * 50 - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y * 50 - mouseRef.current.y) * 0.05;

      const mousePosition = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0);

      // Update particles
      let lineIndex = 0;
      const positions = lineGeometry.attributes.position.array;

      particles.forEach((particle, i) => {
        // Mouse attraction/repulsion
        const distanceToMouse = particle.position.distanceTo(mousePosition);
        const mouseInfluence = Math.max(0, 30 - distanceToMouse);
        
        if (mouseInfluence > 0) {
          const direction = new THREE.Vector3()
            .subVectors(particle.position, mousePosition)
            .normalize();
          
          // Repel from mouse
          const force = direction.multiplyScalar(mouseInfluence * 0.008 / particle.mass);
          particle.velocity.add(force);
        }

        // Particle-to-particle interaction
        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const distance = particle.position.distanceTo(otherParticle.position);
            
            if (distance < 15 && distance > 0) {
              const direction = new THREE.Vector3()
                .subVectors(particle.position, otherParticle.position)
                .normalize();
              
              // Slight repulsion to prevent clustering
              const repulsion = direction.multiplyScalar(0.01 / distance);
              particle.velocity.add(repulsion);

              // Draw connection line
              if (distance < 12) {
                positions[lineIndex * 3] = particle.position.x;
                positions[lineIndex * 3 + 1] = particle.position.y;
                positions[lineIndex * 3 + 2] = particle.position.z;
                lineIndex++;
                positions[lineIndex * 3] = otherParticle.position.x;
                positions[lineIndex * 3 + 1] = otherParticle.position.y;
                positions[lineIndex * 3 + 2] = otherParticle.position.z;
                lineIndex++;
              }
            }
          }
        });

        // Attraction to original position
        const returnForce = new THREE.Vector3()
          .subVectors(particle.originalPosition, particle.position)
          .multiplyScalar(0.001);
        particle.velocity.add(returnForce);

        // Apply velocity with damping
        particle.velocity.multiplyScalar(0.95);
        particle.position.add(particle.velocity);

        // Update mesh position
        particle.mesh.position.copy(particle.position);

        // Pulse effect based on velocity
        const speed = particle.velocity.length();
        const scale = 1 + speed * 2;
        particle.mesh.scale.setScalar(scale);

        // Opacity based on z-position
        const opacity = THREE.MathUtils.mapLinear(particle.position.z, -25, 25, 0.3, 1);
        particle.mesh.material.opacity = Math.max(0.2, Math.min(1, opacity));
      });

      // Clear unused line positions
      for (let i = lineIndex * 3; i < positions.length; i++) {
        positions[i] = 0;
      }
      lineGeometry.attributes.position.needsUpdate = true;

      // Subtle camera rotation
      camera.position.x = Math.sin(Date.now() * 0.0001) * 2;
      camera.position.y = Math.cos(Date.now() * 0.0001) * 2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      
      particles.forEach(particle => {
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
      });
      
      scene.remove(lines);
      lineGeometry.dispose();
      lineMaterial.dispose();
      
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ pointerEvents: 'auto' }} />

      
      {/* UI Overlay - Increased z-index to ensure visibility */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="container mx-auto px-8 h-full flex flex-col justify-between py-12">
          {/* Header */}
          <header className="flex justify-between items-start">
            <div>
              <div 
                className="text-[10px] font-mono tracking-[0.3em] text-gray-500 mb-6"
                style={{ 
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 1s ease-in 0.5s'
                }}
              >
                V1.0_STABLE
              </div>
              <h1 
                className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-none"
                style={{ 
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 1s ease-in 0.7s, transform 1s ease-out 0.7s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
                }}
              >
                Interactive<br />Ecosystem
              </h1>
            </div>
            
            <div 
              className="text-right"
              style={{ 
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 1s ease-in 1s'
              }}
            >
              <div className="text-xs font-mono text-gray-600 mb-2">SYSTEM STATUS</div>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-gray-400">ACTIVE</span>
              </div>
            </div>
          </header>

          {/* Footer Info */}
          <footer className="flex justify-between items-end">
            <div 
              className="space-y-1"
              style={{ 
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 1s ease-in 1.2s'
              }}
            >
              <div className="text-xs font-mono text-gray-600">PHYSICS ENGINE</div>
              <div className="text-sm text-gray-400">Particle Dynamics System</div>
            </div>
            
            <div 
              className="text-right space-y-1"
              style={{ 
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 1s ease-in 1.2s'
              }}
            >
              <div className="text-xs font-mono text-gray-600">INTERACTION</div>
              <div className="text-sm text-gray-400">Move cursor to influence nodes</div>
            </div>
          </footer>
        </div>
      </div>

      {/* Corner Accents */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-gray-800 z-40"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in 1.5s'
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-gray-800 z-40"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in 1.5s'
        }}
      />

      {/* Scanline Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in 1s'
        }}
      />
    </div>
  );
}