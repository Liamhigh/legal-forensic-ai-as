import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Verify Spark SDK is loaded
setTimeout(() => {
  if (!(window as any).spark || !(window as any).spark.llm) {
    console.error('⚠️ Spark SDK failed to load. window.spark is not available.')
    console.error('This may be due to:')
    console.error('1. Spark backend service not running')
    console.error('2. Network issues preventing SDK initialization')
    console.error('3. Missing Spark configuration')
  } else {
    console.log('✅ Spark SDK loaded successfully')
  }
}, 1000)

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
