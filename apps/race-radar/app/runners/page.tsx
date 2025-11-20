"use client"

import { useState } from "react"
import { Search, User } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { RunnerCard } from "@/components/runner-card"
import { getAllRunners } from "@/lib/mock-data"

export default function RunnersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const allRunners = getAllRunners()

  const filteredRunners = allRunners.filter((runner) => {
    const query = searchQuery.toLowerCase()
    return (
      runner.name.toLowerCase().includes(query) ||
      runner.participantId.toLowerCase().includes(query) ||
      runner.participantPublicKey.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground text-balance">
              Runner{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Profiles</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore runner profiles and racing histories
            </p>
          </div>
        </div>
      </section>

      {/* Search and Results */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by runner name or account ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-muted-foreground">
              {filteredRunners.length} {filteredRunners.length === 1 ? "runner" : "runners"} found
            </p>
          </div>

          {/* Runner Cards */}
          {filteredRunners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRunners.map((runner) => (
                <RunnerCard key={runner.participantId} runner={runner} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-6 rounded-full bg-secondary mb-4">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No Runners Found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
