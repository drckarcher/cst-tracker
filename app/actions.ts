'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Category } from '@/lib/types'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    category: formData.get('category') as Category,
    project_name: (formData.get('project_name') as string) || null,
    description: (formData.get('description') as string) || null,
    task_date: formData.get('task_date') as string,
    start_time: (formData.get('start_time') as string) || null,
    duration_minutes: parseInt(formData.get('duration_minutes') as string),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  redirect('/tasks')
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('tasks').update({
    category: formData.get('category') as Category,
    project_name: (formData.get('project_name') as string) || null,
    description: (formData.get('description') as string) || null,
    task_date: formData.get('task_date') as string,
    start_time: (formData.get('start_time') as string) || null,
    duration_minutes: parseInt(formData.get('duration_minutes') as string),
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  redirect('/tasks')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
