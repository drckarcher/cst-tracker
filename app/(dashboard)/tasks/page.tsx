import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDuration, computeEndTime } from '@/lib/duration'
import { CATEGORY_COLORS } from '@/lib/types'
import type { Task } from '@/lib/types'
import { format } from 'date-fns'
import DeleteTaskButton from '@/components/DeleteTaskButton'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-1.5">
      <span className="text-[13px] text-gray-400 font-medium shrink-0 uppercase tracking-wide">{label}</span>
      <span className="text-[15px] text-gray-800 text-right font-medium">{value}</span>
    </div>
  )
}

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('task_date', { ascending: false })
    .order('start_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-[28px] font-bold text-gray-900">Tasks</h1>
        <Link
          href="/tasks/new"
          className="bg-orange-400 hover:bg-orange-500 text-white text-[15px] font-bold px-5 py-2.5 rounded-2xl transition-colors shadow-sm"
        >
          + New Task
        </Link>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No tasks yet</p>
          <Link href="/tasks/new" className="text-orange-400 text-[15px] mt-2 inline-block font-semibold">
            Add your first task
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {(tasks as Task[]).map((task) => {
            const color = CATEGORY_COLORS[task.category]
            const endTime = task.start_time
              ? computeEndTime(task.start_time.slice(0, 5), task.duration_minutes)
              : null
            const timeValue = task.start_time
              ? `${task.start_time.slice(0, 5)} → ${endTime}  (${formatDuration(task.duration_minutes)})`
              : formatDuration(task.duration_minutes)

            return (
              <li key={task.id} className="bg-white rounded-3xl shadow-sm px-5 py-4 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[18px] font-bold text-gray-900 leading-snug">
                    {task.project_name || task.category}
                  </span>
                  <span
                    className="shrink-0 text-[12px] font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: color + '22', color }}
                  >
                    {task.category}
                  </span>
                </div>

                {/* Detail rows */}
                <div className="divide-y divide-gray-50">
                  <Row label="Date" value={format(new Date(task.task_date + 'T12:00:00'), 'EEE d MMM yyyy')} />
                  <Row label={task.start_time ? 'Time' : 'Duration'} value={timeValue} />
                  {task.description && <Row label="Notes" value={task.description} />}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="flex-1 text-center text-[14px] font-bold text-orange-400 bg-orange-50 hover:bg-orange-100 py-2.5 rounded-2xl transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteTaskButton id={task.id} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
