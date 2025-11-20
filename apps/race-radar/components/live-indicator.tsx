export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75" />
        <div className="relative w-2 h-2 bg-destructive rounded-full" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-destructive">Live</span>
    </div>
  )
}
