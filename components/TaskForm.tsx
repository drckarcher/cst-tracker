'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { format } from 'date-fns'
import { CalendarIcon, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/types'
import { getDurationOptions, computeEndTime } from '@/lib/duration'
import type { Task, Category } from '@/lib/types'

interface TaskFormProps {
  task?: Task
  action: (formData: FormData) => Promise<void>
}

function parseStartTime(t: string | null | undefined) {
  if (!t) return { hour: 8, minute: 0 }
  const [h, m] = t.split(':').map(Number)
  return { hour: h, minute: m }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[17px] font-bold text-gray-900 mb-2">{children}</p>
}

function Stepper({ display, onUp, onDown }: { display: string; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={onUp}
        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200 touch-manipulation">
        <ChevronUp className="w-6 h-6 text-gray-600" />
      </button>
      <span className="text-4xl font-bold font-mono tabular-nums w-14 text-center text-gray-900">{display}</span>
      <button type="button" onClick={onDown}
        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200 touch-manipulation">
        <ChevronDown className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  )
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

export default function TaskForm({ task, action }: TaskFormProps) {
  const defaultDate = task ? new Date(task.task_date + 'T12:00:00') : new Date()
  const { hour: defaultHour, minute: defaultMinute } = parseStartTime(task?.start_time)

  const [date, setDate] = useState<Date>(defaultDate)
  const [category, setCategory] = useState<Category | ''>(task?.category ?? '')
  const [duration, setDuration] = useState(String(task?.duration_minutes ?? 60))
  const [calOpen, setCalOpen] = useState(false)
  const [hour, setHour] = useState(defaultHour)
  const [minute, setMinute] = useState(defaultMinute)

  const startTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const endTimeStr = computeEndTime(startTimeStr, parseInt(duration))

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="task_date" value={format(date, 'yyyy-MM-dd')} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="duration_minutes" value={duration} />
      <input type="hidden" name="start_time" value={startTimeStr} />

      {/* Category pills */}
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
                  selected ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                )}
                style={selected ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Date */}
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

      {/* Start time */}
      <div>
        <SectionLabel>Start Time</SectionLabel>
        <div className="bg-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4">
          <Stepper
            display={String(hour).padStart(2, '0')}
            onUp={() => setHour(h => (h + 1) % 24)}
            onDown={() => setHour(h => (h - 1 + 24) % 24)}
          />
          <span className="text-4xl font-bold text-gray-300 pb-1">:</span>
          <Stepper
            display={String(minute).padStart(2, '0')}
            onUp={() => setMinute(m => (m + 15) % 60)}
            onDown={() => setMinute(m => (m - 15 + 60) % 60)}
          />
          <div className="ml-auto text-right">
            <p className="text-[12px] text-gray-400 uppercase tracking-wide font-medium">End time</p>
            <p className="text-3xl font-bold font-mono text-gray-900 tabular-nums">{endTimeStr}</p>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div>
        <SectionLabel>Duration <span className="text-red-400">*</span></SectionLabel>
        <Select value={duration} onValueChange={(v) => setDuration(v ?? '60')} required>
          <SelectTrigger className="h-13 bg-gray-100 border-0 rounded-2xl text-[16px] font-medium text-gray-900 px-4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getDurationOptions().map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)} className="text-[16px] py-3">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project / Registrar */}
      <div>
        <SectionLabel>Project / Registrar</SectionLabel>
        <input
          name="project_name"
          defaultValue={task?.project_name ?? ''}
          placeholder="Optional"
          className="w-full h-13 bg-gray-100 rounded-2xl px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-200 transition-colors"
        />
      </div>

      {/* Description */}
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

      {/* Buttons */}
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
