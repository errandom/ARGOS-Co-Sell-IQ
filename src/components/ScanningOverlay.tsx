export function ScanningOverlay() {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div
            className="absolute inset-4 rounded-full border-4 border-primary/40 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute inset-8 rounded-full border-4 border-primary/60 animate-ping"
            style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
          />
          <div
            className="absolute inset-12 rounded-full border-4 border-primary animate-ping"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Scanning your communications...</h2>
          <p className="text-muted-foreground">Analyzing emails, chats, and meeting transcripts</p>
        </div>
      </div>
    </div>
  )
}
