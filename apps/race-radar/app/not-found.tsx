import Link from "next/link"
import { Home, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-block p-6 rounded-full bg-primary/10 mb-4">
          <Activity className="h-16 w-16 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warning">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">Race Not Found</h2>
          <p className="text-muted-foreground">
            Looks like this runner took a wrong turn! The race you're looking for doesn't exist.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
