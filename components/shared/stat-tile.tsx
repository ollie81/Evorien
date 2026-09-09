/** A single "Ollieen Progress" counter — always fed by a live query, never a hard-coded number. */
export function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="space-y-0.5">
      <p className="font-heading text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
