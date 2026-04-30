import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDuration, computeEndTime } from '@/lib/duration'
import { CATEGORY_COLORS } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import type { Task } from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link href="/tasks/new" className={cn(buttonVariants(), 'h-11 text-base px-5')}>
          + New Task
        </Link>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No tasks yet.</p>
          <Link href="/tasks/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
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

            return (
              <li key={task.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                {/* Row 1: date + category */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {format(new Date(task.task_date + 'T12:00:00'), 'EEE d MMM yyyy')}
                  </span>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: color + '20',
                      color: color,
                      borderColor: color + '40',
                    }}
                    className="border text-xs font-semibold px-2.5 py-0.5"
                  >
                    {task.category}
                  </Badge>
                </div>

                {/* Row 2: time range + duration */}
                <div className="flex items-baseline gap-2">
                  {task.start_time ? (
                    <>
                      <span className="text-2xl font-bold font-mono tabular-nums">
                        {task.start_time.slice(0, 5)}
                      </span>
                      <span className="text-lg text-gray-400">→</span>
                      <span className="text-2xl font-bold font-mono tabular-nums">
                        {endTime}
                      </span>
                      <span className="text-sm text-gray-400 ml-1">
                        ({formatDuration(task.duration_minutes)})
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-700">
                      {formatDuration(task.duration_minutes)}
                    </span>
                  )}
                </div>

                {/* Row 3: project/registrar */}
                {task.project_name && (
                  <p className="text-base font-semibold text-gray-800">{task.project_name}</p>
                )}

                {/* Row 4: description */}
                {task.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                )}

                {/* Row 5: actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 px-4 text-sm')}
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
