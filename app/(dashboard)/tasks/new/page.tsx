import TaskForm from '@/components/TaskForm'
import { createTask } from '@/app/actions'

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="text-[28px] font-bold text-gray-900 pt-1 mb-6">New Task</h1>
      <TaskForm action={createTask} />
    </div>
  )
}
