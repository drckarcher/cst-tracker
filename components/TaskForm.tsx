'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
import { getDurationOptions } from '@/lib/duration'
import type { Task } from '@/lib/types'

interface TaskFormProps {
  task?: Task
  action: (formData: FormData) => Promise<void>
}

export default function TaskForm({ task, action }: TaskFormProps) {
  const defaultDate = task ? new Date(task.task_date + 'T12:00:00') : new Date()
  const [date, setDate] = useState<Date>(defaultDate)
  const [category, setCategory] = useState(task?.category ?? '')
  const [duration, setDuration] = useState(String(task?.duration_minutes ?? 30))
  const [open, setOpen] = useState(false)

  const durationOptions = getDurationOptions()

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="task_date" value={format(date, 'yyyy-MM-dd')} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="duration_minutes" value={duration} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category <span className="text-red-500">*</span></Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? '')} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Date <span className="text-red-500">*</span></Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'd MMM yyyy') : 'Pick a date'}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setOpen(false) } }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Duration <span className="text-red-500">*</span></Label>
        <Select value={duration} onValueChange={(v) => setDuration(v ?? '30')} required>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project_name">Project / Registrar Name</Label>
        <Input
          id="project_name"
          name="project_name"
          defaultValue={task?.project_name ?? ''}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description / Notes</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ''}
          rows={3}
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" className="flex-1 sm:flex-none sm:w-32">
          {task ? 'Update' : 'Save Task'}
        </Button>
        <Link href="/tasks" className={buttonVariants({ variant: 'outline' })}>Cancel</Link>
      </div>
    </form>
  )
}
