import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTask } from '@/app/actions'
import TaskForm from '@/components/TaskForm'
import type { Task } from '@/lib/types'

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!task) notFound()

  const boundAction = updateTask.bind(null, id)

  return (
    <div>
      <h1 className="text-[28px] font-bold text-gray-900 pt-1 mb-6">Edit Task</h1>
      <TaskForm task={task as Task} action={boundAction} />
    </div>
  )
}
