'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/types'
import { computeEndTime, formatDuration } from '@/lib/duration'
import type { Task, Category } from '@/lib/types'

interface TaskFormProps {
  task?: Task
  action: (formData: FormData) => Promise<void>
}

// ─── Time input helpers ────────────────────────────────────────────────────

function parseTimeInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9:]/g, '').trim()
  if (!cleaned) return '08:00'

  let h: number, m: number

  if (cleaned.includes(':')) {
    const [hp, mp] = cleaned.split(':')
    h = parseInt(hp) || 0
    m = parseInt(mp) || 0
  } else if (cleaned.length <= 2) {
    h = parseInt(cleaned) || 0
    m = 0
  } else if (cleaned.length === 3) {
    h = parseInt(cleaned[0]) || 0
    m = parseInt(cleaned.slice(1)) || 0
  } else {
    h = parseInt(cleaned.slice(0, 2)) || 0
    m = parseInt(cleaned.slice(2, 4)) || 0
  }

  h = Math.min(23, Math.max(0, h))
  // Round minutes to nearest 15
  m = Math.round(m / 15) * 15
  if (m >= 60) { h = Math.min(23, h + 1); m = 0 }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseStartTime(t: string | null | undefined) {
  if (!t) return '08:00'
  return t.slice(0, 5)
}

// ─── Duration helpers ──────────────────────────────────────────────────────

function formatDurationDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${String(m).padStart(2, '0')} min`
}

const QUICK_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 h',    value: 60 },
  { label: '2 h',    value: 120 },
  { label: '4 h',    value: 240 },
  { label: '8 h',    value: 480 },
  { label: '10 h',   value: 600 },
]

const MIN_DURATION = 15
const MAX_DURATION = 600

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[16px] font-bold text-gray-700 mb-2">{children}</p>
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 h-14 rounded-2xl bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white text-[17px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Saving…
        </>
      ) : label}
    </button>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────

export default function TaskForm({ task, action }: TaskFormProps) {
  const defaultDate = task ? new Date(task.task_date + 'T12:00:00') : new Date()

  const [date, setDate] = useState<Date>(defaultDate)
  const [category, setCategory] = useState<Category | ''>(task?.category ?? '')
  const [duration, setDuration] = useState(task?.duration_minutes ?? 60)
  const [calOpen, setCalOpen] = useState(false)
  const [startTimeDisplay, setStartTimeDisplay] = useState(parseStartTime(task?.start_time))
  const startTimeRef = useRef<HTMLInputElement>(null)

  const startTimeFormatted = parseTimeInput(startTimeDisplay)
  const endTimeStr = computeEndTime(startTimeFormatted, duration)

  function handleTimeBlur() {
    setStartTimeDisplay(parseTimeInput(startTimeDisplay))
  }

  function handleTimeFocus() {
    startTimeRef.current?.select()
  }

  function adjustDuration(delta: number) {
    setDuration(d => Math.min(MAX_DURATION, Math.max(MIN_DURATION, d + delta)))
  }

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="task_date" value={format(date, 'yyyy-MM-dd')} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="duration_minutes" value={duration} />
      <input type="hidden" name="start_time" value={startTimeFormatted} />

      {/* ── Category ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Category <span className="text-red-400">*</span></SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const selected = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-[14px] font-semibold transition-all',
                  selected ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                )}
                style={selected ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Date ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Date <span className="text-red-400">*</span></SectionLabel>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger className="w-full h-13 bg-gray-100 rounded-2xl px-4 flex items-center gap-3 text-[16px] text-gray-900 font-medium text-left">
            <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
            {format(date, 'EEEE, d MMM yyyy')}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date}
              onSelect={(d) => { if (d) { setDate(d); setCalOpen(false) } }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Start time ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Start Time</SectionLabel>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              ref={startTimeRef}
              type="text"
              inputMode="numeric"
              value={startTimeDisplay}
              onChange={e => setStartTimeDisplay(e.target.value)}
              onBlur={handleTimeBlur}
              onFocus={handleTimeFocus}
              className="w-28 h-13 bg-gray-100 rounded-2xl px-4 text-[22px] font-bold font-mono text-gray-900 text-center outline-none focus:bg-gray-200 transition-colors tracking-widest"
            />
          </div>
          <div className="text-gray-400 font-semibold text-[15px]">→</div>
          <div className="w-28 h-13 bg-gray-50 border border-gray-100 rounded-2xl px-4 flex items-center justify-center text-[22px] font-bold font-mono text-gray-400 tracking-widest">
            {endTimeStr}
          </div>
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5 ml-1">
          Type: 8, 08, 0800, 08:00, 14, 1430 — auto-formats to 24h, 15-min steps
        </p>
      </div>

      {/* ── Duration ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Duration <span className="text-red-400">*</span></SectionLabel>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => adjustDuration(-15)}
            disabled={duration <= MIN_DURATION}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 text-2xl font-bold flex items-center justify-center transition-colors touch-manipulation"
          >
            −
          </button>
          <div className="flex-1 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-[18px] font-bold text-gray-900">
            {formatDurationDisplay(duration)}
          </div>
          <button
            type="button"
            onClick={() => adjustDuration(15)}
            disabled={duration >= MAX_DURATION}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 text-2xl font-bold flex items-center justify-center transition-colors touch-manipulation"
          >
            +
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_DURATIONS.map(q => (
            <button
              key={q.value}
              type="button"
              onClick={() => setDuration(q.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all',
                duration === q.value
                  ? 'bg-orange-400 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project / Registrar ───────────────────────────────────── */}
      <div>
        <SectionLabel>Project / Registrar</SectionLabel>
        <input
          name="project_name"
          defaultValue={task?.project_name ?? ''}
          placeholder="Optional"
          className="w-full h-13 bg-gray-100 rounded-2xl px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-200 transition-colors"
        />
      </div>

      {/* ── Notes ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Notes</SectionLabel>
        <textarea
          name="description"
          defaultValue={task?.description ?? ''}
          placeholder="Optional"
          rows={3}
          className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-200 transition-colors resize-none"
        />
      </div>

      {/* ── Buttons ───────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1 pb-4">
        <SubmitButton label={task ? 'Update Task' : 'Save Task'} />
        <Link
          href="/tasks"
          className="h-14 px-6 rounded-2xl border-2 border-orange-200 text-orange-400 text-[17px] font-bold flex items-center justify-center transition-colors hover:bg-orange-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
