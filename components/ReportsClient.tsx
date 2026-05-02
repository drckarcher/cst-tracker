'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, differenceInWeeks } from 'date-fns'
import { CalendarIcon, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/types'
import { formatDuration } from '@/lib/duration'
import type { Task } from '@/lib/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ViewMode = 'weekly' | 'monthly'

interface SummaryRow {
  period: string
  sortKey: string
  [cat: string]: string | number
  total: number
}

function computeCategoryTotals(tasks: Task[]) {
  return CATEGORIES.map(cat => ({
    category: cat,
    hours: parseFloat(
      (tasks.filter(t => t.category === cat).reduce((s, t) => s + t.duration_minutes, 0) / 60).toFixed(2)
    ),
  })).filter(c => c.hours > 0)
}

function computeSummary(tasks: Task[], viewMode: ViewMode): SummaryRow[] {
  const map = new Map<string, SummaryRow>()

  for (const task of tasks) {
    const date = parseISO(task.task_date)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

    const sortKey = viewMode === 'weekly'
      ? format(weekStart, 'yyyy-MM-dd')
      : format(date, 'yyyy-MM')

    const label = viewMode === 'weekly'
      ? `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`
      : format(date, 'MMM yyyy')

    if (!map.has(sortKey)) {
      const row: SummaryRow = { period: label, sortKey, total: 0 }
      CATEGORIES.forEach(cat => { row[cat] = 0 })
      map.set(sortKey, row)
    }
    const row = map.get(sortKey)!
    row[task.category] = (row[task.category] as number) + task.duration_minutes
    row.total = (row.total as number) + task.duration_minutes
  }

  return [...map.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

function minutesToHours(min: number) {
  return min === 0 ? '—' : (min / 60).toFixed(1) + 'h'
}

function exportCSV(tasks: Task[], startDate: Date, endDate: Date) {
  const header = ['Date', 'Category', 'Project / Registrar', 'Description', 'Duration (min)', 'Duration (h)']
  const rows = tasks.map(t => [
    t.task_date,
    t.category,
    t.project_name ?? '',
    t.description ?? '',
    String(t.duration_minutes),
    (t.duration_minutes / 60).toFixed(2),
  ])
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportPDF(
  tasks: Task[],
  summary: SummaryRow[],
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const title = `Work Summary: ${format(startDate, 'd MMM yyyy')} – ${format(endDate, 'd MMM yyyy')}`
  doc.setFontSize(14)
  doc.text(title, 14, 18)

  const totalHours = tasks.reduce((s, t) => s + t.duration_minutes, 0) / 60
  doc.setFontSize(10)
  doc.text(`Total: ${totalHours.toFixed(1)}h across ${tasks.length} tasks`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [[viewMode === 'weekly' ? 'Week' : 'Month', ...CATEGORIES, 'Total']],
    body: summary.map(row => [
      row.period,
      ...CATEGORIES.map(cat => minutesToHours(row[cat] as number)),
      minutesToHours(row.total as number),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  const afterTable = (doc as any).lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: afterTable,
    head: [['Date', 'Category', 'Project / Registrar', 'Duration']],
    body: tasks.map(t => [
      t.task_date,
      t.category,
      t.project_name ?? '',
      formatDuration(t.duration_minutes),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  doc.save(`tasks_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`)
}

function computeWeeklyAverage(allTasks: { task_date: string; duration_minutes: number }[]): number | null {
  if (allTasks.length === 0) return null
  const firstDate = parseISO(allTasks[0].task_date)
  const firstMonday = startOfWeek(firstDate, { weekStartsOn: 1 })
  const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const numWeeks = Math.max(1, differenceInWeeks(thisMonday, firstMonday) + 1)
  const totalMinutes = allTasks.reduce((s, t) => s + t.duration_minutes, 0)
  return totalMinutes / numWeeks / 60
}

export default function ReportsClient() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [weeklyAvg, setWeeklyAvg] = useState<number | null>(null)

  // Fetch lifetime stats once on mount
  useEffect(() => {
    async function fetchLifetime() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tasks')
        .select('task_date, duration_minutes')
        .order('task_date', { ascending: true })
      if (data) setWeeklyAvg(computeWeeklyAverage(data))
    }
    fetchLifetime()
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .gte('task_date', format(startDate, 'yyyy-MM-dd'))
      .lte('task_date', format(endDate, 'yyyy-MM-dd'))
      .order('task_date', { ascending: true })
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const categoryTotals = computeCategoryTotals(tasks)
  const summary = computeSummary(tasks, viewMode)
  const totalHours = tasks.reduce((s, t) => s + t.duration_minutes, 0) / 60

  return (
    <div className="space-y-6">
      {/* Lifetime average — always visible */}
      {weeklyAvg !== null && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-orange-500 uppercase tracking-wide font-medium">Avg per week (all time, Mon–Sun)</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">{weeklyAvg.toFixed(1)}h</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">From</p>
          <DatePicker date={startDate} onSelect={setStartDate} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">To</p>
          <DatePicker date={endDate} onSelect={setEndDate} />
        </div>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('weekly')}
          >Week</Button>
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('monthly')}
          >Month</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No tasks in this date range.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Hours</p>
                <p className="text-2xl font-semibold mt-1">{totalHours.toFixed(1)}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks</p>
                <p className="text-2xl font-semibold mt-1">{tasks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Top Category</p>
                <p className="text-2xl font-semibold mt-1">
                  {categoryTotals.sort((a, b) => b.hours - a.hours)[0]?.category ?? '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Hours by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryTotals} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="h" />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Hours']} />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {categoryTotals.map((entry) => (
                      <rect key={entry.category} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Summary
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV(tasks, startDate, endDate)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPDF(tasks, summary, startDate, endDate, viewMode)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6 w-44">Period</TableHead>
                      {CATEGORIES.map(cat => (
                        <TableHead key={cat} className="text-right text-xs">{cat}</TableHead>
                      ))}
                      <TableHead className="text-right font-semibold pr-6">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((row) => (
                      <TableRow key={row.sortKey}>
                        <TableCell className="pl-6 text-sm font-medium whitespace-nowrap">{row.period}</TableCell>
                        {CATEGORIES.map(cat => (
                          <TableCell key={cat} className="text-right text-sm text-gray-600">
                            {minutesToHours(row[cat] as number)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right text-sm font-semibold pr-6">
                          {minutesToHours(row.total as number)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell className="pl-6 text-sm">Total</TableCell>
                      {CATEGORIES.map(cat => (
                        <TableCell key={cat} className="text-right text-sm">
                          {minutesToHours(tasks.filter(t => t.category === cat).reduce((s, t) => s + t.duration_minutes, 0))}
                        </TableCell>
                      ))}
                      <TableCell className="text-right text-sm pr-6">
                        {totalHours.toFixed(1)}h
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function DatePicker({ date, onSelect }: { date: Date; onSelect: (d: Date) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-36 justify-start text-left font-normal')}>
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {format(date, 'd MMM yyyy')}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { if (d) { onSelect(d); setOpen(false) } }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
