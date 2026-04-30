import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDuration } from '@/lib/duration'
import { CATEGORY_COLORS } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import type { Task } from '@/lib/types'
import { format } from 'date-fns'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('task_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <Link href="/tasks/new" className={buttonVariants({ size: 'sm' })}>+ New Task</Link>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No tasks yet.</p>
          <p className="text-sm mt-1">
            <Link href="/tasks/new" className="text-blue-600 hover:underline">Add your first task</Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-24">Duration</TableHead>
                <TableHead>Project / Registrar</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tasks as Task[]).map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                    {format(new Date(task.task_date + 'T12:00:00'), 'd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: CATEGORY_COLORS[task.category] + '20',
                        color: CATEGORY_COLORS[task.category],
                        borderColor: CATEGORY_COLORS[task.category] + '40',
                      }}
                      className="border text-xs font-medium"
                    >
                      {task.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                    {formatDuration(task.duration_minutes)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 max-w-[160px] truncate">
                    {task.project_name ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {task.description ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/tasks/${task.id}/edit`} className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 px-2'}>Edit</Link>
                      <DeleteTaskButton id={task.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
