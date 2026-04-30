export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getDurationOptions() {
  const options: { value: number; label: string }[] = []
  for (let i = 15; i <= 600; i += 15) {
    options.push({ value: i, label: formatDuration(i) })
  }
  return options
}
