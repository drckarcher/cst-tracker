import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TaskForm from '@/components/TaskForm'
import { createTask } from '@/app/actions'

export default function NewTaskPage() {
  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm action={createTask} />
        </CardContent>
      </Card>
    </div>
  )
}
