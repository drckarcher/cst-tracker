'use client'

import { useTransition } from 'react'
import { deleteTask } from '@/app/actions'
import { cn } from '@/lib/utils'

export default function DeleteTaskButton({ id, className }: { id: string; className?: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this task?')) return
    startTransition(() => deleteTask(id))
  }

  return (
    <button
      className={cn(
        'text-gray-400 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-2xl transition-colors text-[14px] font-bold w-full flex-1',
        className
      )}
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}
