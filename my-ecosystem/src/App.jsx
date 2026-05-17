import { Suspense, lazy } from 'react'

const InteractiveEcosystemScene = lazy(() => import('./InteractiveEcosystemScene.jsx'))

export default function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #06070a 0%, #0e1726 100%)',
            color: '#e5e7eb',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Loading ecosystem...
        </div>
      }
    >
      <InteractiveEcosystemScene />
    </Suspense>
  )
}
