import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Loader2 } from 'lucide-react'

interface LandingPageProps {
  onSignIn: () => Promise<void>
  authInProgress?: boolean
}

export function LandingPage({ onSignIn, authInProgress = false }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await onSignIn()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.12_0.02_240)] via-[oklch(0.15_0.03_260)] to-[oklch(0.12_0.02_280)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, oklch(0.62 0.19 250) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 text-center px-6 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          ARGOS Co‑Sell IQ
        </h1>

        <p className="text-[#94a3b8] text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ fontSize: '0.95rem' }}>
          Thank you for using ARGOS Co‑Sell IQ. This AI-powered capability scans your emails, chats and meeting transcripts to identify potential co-sell scenarios, cross-checks it with existing partner referrals and opportunities and allows you to properly document the co-sell engagement in case you haven't found the time yet to do it yourself. In order for this to work seamlessly, please authenticate and grant permissions – in return we'll do our best to save you the hassle of documenting partner engagements in MSX. Last but not least – this is currently a proof of concept; as with anything that involves AI, please validate the output for accuracy and provide feedback or report concerns to kennethf@microsoft.com.
        </p>

        <Button
          size="lg"
          onClick={handleSignIn}
          disabled={isLoading || authInProgress}
          className="px-8 py-6 text-base rounded-full hover:scale-105 transition-all duration-200"
        >
          {isLoading || authInProgress ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in with Azure Active Directory'
          )}
        </Button>

        <p className="mt-12 text-sm text-muted-foreground">
          Proof of Concept · ARGOS · 2026
        </p>
      </div>
    </div>
  )
}
