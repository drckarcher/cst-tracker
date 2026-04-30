'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { format } from 'date-fns'
import { CalendarIcon, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/types'
import { getDurationOptions, computeEndTime } from '@/lib/duration'
import type { Task } from '@/lib/types'

interface TaskFormProps {
  task?: Task
  action: (formData: FormData) => Promise<void>
}

function parseStartTime(t: string | null | undefined): { hour: number; minute: number } {
  if (!t) return { hour: 8, minute: 0 }
  const [h, m] = t.split(':').map(Number)
  return { hour: h, minute: m }
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="flex-1 h-12 text-base" disabled={pending}>
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Saving…
        </span>
      ) : label}
    </Button>
  )
}

function Stepper({
  value,
  onUp,
  onDown,
  display,
}: {
  value: number
  onUp: () => void
  onDown: () => void
  display: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 text-gray-700 touch-manipulation"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
      <span className="text-4xl font-mono font-bold w-14 text-center tabular-nums">{display}</span>
      <button
        type="button"
        onClick={onDown}
        className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 text-gray-700 touch-manipulation"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  )
}

export default function TaskForm({ task, action }: TaskFormProps) {
  const defaultDate = task ? new Date(task.task_date + 'T12:00:00') : new Date()
  const { hour: defaultHour, minute: defaultMinute } = parseStartTime(task?.start_time)

  const [date, setDate] = useState<Date>(defaultDate)
  const [category, setCategory] = useState(task?.category ?? '')
  const [duration, setDuration] = useState(String(task?.duration_minutes ?? 60))
  const [calOpen, setCalOpen] = useState(false)
  const [hour, setHour] = useState(defaultHour)
  const [minute, setMinute] = useState(defaultMinute)

  const startTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const endTimeStr = computeEndTime(startTimeStr, parseInt(duration))
  const durationOptions = getDurationOptions()

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="task_date" value={format(date, 'yyyy-MM-dd')} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="duration_minutes" value={duration} />
      <input type="hidden" name="start_time" value={startTimeStr} />

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Category <span className="text-red-500">*</span></Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? '')} required>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="text-base py-3">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Date <span className="text-red-500">*</span></Label>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-12 justify-start text-left text-base font-normal')}
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            {format(date, 'EEEE, d MMM yyyy')}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { if (d) { setDate(d); setCalOpen(false) } }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Start Time */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Start Time</Label>
        <div className="flex items-center gap-3 py-2">
          <Stepper
            value={hour}
            display={String(hour).padStart(2, '0')}
            onUp={() => setHour(h => (h + 1) % 24)}
            onDown={() => setHour(h => (h - 1 + 24) % 24)}
          />
          <span className="text-4xl font-bold text-gray-400 pb-1">:</span>
          <Stepper
            value={minute}
            display={String(minute).padStart(2, '0')}
            onUp={() => setMinute(m => (m + 15) % 60)}
            onDown={() => setMinute(m => (m - 15 + 60) % 60)}
          />
          <div className="ml-3 text-gray-500 text-base">
            <span className="text-xs uppercase tracking-wide text-gray-400 block">End time</span>
            <span className="text-2xl font-mono font-semibold text-gray-700">{endTimeStr}</span>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Duration <span className="text-red-500">*</span></Label>
        <Select value={duration} onValueChange={(v) => setDuration(v ?? '60')} required>
          <SelectTrigger className="h-12 text-base w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)} className="text-base py-3">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project / Registrar */}
      <div className="space-y-2">
        <Label htmlFor="project_name" className="text-base font-semibold">Project / Registrar Name</Label>
        <Input
          id="project_name"
          name="project_name"
          defaultValue={task?.project_name ?? ''}
          placeholder="Optional"
          className="h-12 text-base"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">Description / Notes</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ''}
          rows={3}
          placeholder="Optional"
          className="text-base"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={task ? 'Update Task' : 'Save Task'} />
        <Link href="/tasks" className={cn(buttonVariants({ variant: 'outline' }), 'h-12 text-base px-6')}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
