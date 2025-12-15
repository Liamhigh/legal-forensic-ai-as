import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Spark SDK loading verification
const SPARK_SDK_CHECK_TIMEOUT = 1000 // ms - time to wait before checking SDK availability

// Verify Spark SDK is loaded after initialization
const checkSparkSDK = () => {
  return new Promise<boolean>((resolve) => {
    const checkInterval = setInterval(() => {
      if ((window as any).spark && (window as any).spark.llm) {
        clearInterval(checkInterval)
        console.log('✅ Spark SDK loaded successfully')
        resolve(true)
      }
    }, 100)

    // Timeout after configured time
    setTimeout(() => {
      clearInterval(checkInterval)
      if (!(window as any).spark || !(window as any).spark.llm) {
        console.error('⚠️ Spark SDK failed to load. window.spark is not available.')
        console.error('This may be due to:')
        console.error('1. Spark backend service not running')
        console.error('2. Network issues preventing SDK initialization')
        console.error('3. Missing Spark configuration')
        resolve(false)
      }
    }, SPARK_SDK_CHECK_TIMEOUT)
  })
}

// Check Spark SDK availability
checkSparkSDK()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
