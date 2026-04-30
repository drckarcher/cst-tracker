import Link from 'next/link'
import { signOut } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">CST Work Tracker</span>
            <Separator orientation="vertical" className="h-5" />
            <nav className="flex gap-4">
              <Link href="/tasks" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Tasks
              </Link>
              <Link href="/reports" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Reports
              </Link>
            </nav>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
