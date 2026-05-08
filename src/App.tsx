import { useState } from 'react'
import { Toaster } from 'sonner'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to Spark
          </h1>
          <p className="text-xl text-muted-foreground">
            Count: {count}
          </p>
          <Button onClick={() => setCount(count + 1)}>
            Increment
          </Button>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
