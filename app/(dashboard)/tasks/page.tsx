import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDuration, computeEndTime } from '@/lib/duration'
import { CATEGORY_COLORS } from '@/lib/types'
import type { Task } from '@/lib/types'
import { format } from 'date-fns'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-0.5">
      <span className="text-[14px] text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-[15px] text-gray-800 text-right">{value}</span>
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
          className="bg-blue-500 hover:bg-blue-600 text-white text-[15px] font-semibold px-5 py-2.5 rounded-2xl transition-colors shadow-sm"
        >
          + New Task
        </Link>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No tasks yet</p>
          <Link href="/tasks/new" className="text-blue-500 text-[15px] mt-2 inline-block font-medium">
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
              <li key={task.id} className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[17px] font-bold text-gray-900 leading-snug">
                    {task.project_name || task.category}
                  </span>
                  <span
                    className="shrink-0 text-[12px] font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {task.category}
                  </span>
                </div>

                {/* Detail rows */}
                <div className="divide-y divide-gray-50">
                  <Row label="Date" value={format(new Date(task.task_date + 'T12:00:00'), 'EEE d MMM yyyy')} />
                  <Row label={task.start_time ? 'Time' : 'Duration'} value={timeValue} />
                  {task.project_name && task.project_name !== task.project_name && (
                    <Row label="Project" value={task.project_name} />
                  )}
                  {task.description && (
                    <Row label="Notes" value={task.description} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="flex-1 text-center text-[14px] font-semibold text-blue-500 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteInline id={task.id} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Inline client delete button import
import DeleteTaskButton from '@/components/DeleteTaskButton'

function DeleteInline({ id }: { id: string }) {
  return (
    <div className="flex-1">
      <DeleteTaskButton id={id} className="w-full text-[14px] font-semibold text-red-400 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors h-auto" />
    </div>
  )
}
