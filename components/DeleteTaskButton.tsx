'use client'

import { useTransition } from 'react'
import { deleteTask } from '@/app/actions'
import { Button } from '@/components/ui/button'

export default function DeleteTaskButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this task?')) return
    startTransition(() => deleteTask(id))
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? '…' : 'Delete'}
    </Button>
  )
}
