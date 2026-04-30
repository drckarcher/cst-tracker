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
        'text-red-400 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors text-[14px] font-semibold w-full',
        className
      )}
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}
