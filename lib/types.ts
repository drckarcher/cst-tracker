export const CATEGORIES = ['Administration', 'Education', 'Research', 'Meetings', 'SOT', 'MDS', 'Other'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_COLORS: Record<Category, string> = {
  Administration: '#3b82f6',
  Education: '#10b981',
  Research: '#8b5cf6',
  Meetings: '#f59e0b',
  SOT: '#ef4444',
  MDS: '#06b6d4',
  Other: '#6b7280',
}

export interface Task {
  id: string
  user_id: string
  category: Category
  project_name: string | null
  description: string | null
  task_date: string
  duration_minutes: number
  created_at: string
  updated_at: string
}
