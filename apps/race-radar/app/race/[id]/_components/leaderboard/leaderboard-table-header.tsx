interface LeaderboardTableHeaderProps {
  showCheckpoint?: boolean;
}

export function LeaderboardTableHeader({ showCheckpoint = true }: LeaderboardTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pos
        </th>
        <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Runner
        </th>
        {showCheckpoint && (
          <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Last CP
          </th>
        )}
        <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Time
        </th>
        <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
  );
}
