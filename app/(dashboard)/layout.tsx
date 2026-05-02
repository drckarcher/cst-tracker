import Link from 'next/link'
import { signOut } from '@/app/actions'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7]">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 tracking-tight">CST Tracker</span>
          <nav className="flex items-center gap-1">
            <Link
              href="/tasks"
              className="px-4 py-2 rounded-xl text-[15px] font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
            >
              Tasks
            </Link>
            <Link
              href="/reports"
              className="px-4 py-2 rounded-xl text-[15px] font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
            >
              Reports
            </Link>
            <form action={signOut} className="ml-1">
              <Button variant="ghost" size="sm" type="submit" className="text-[15px] text-gray-400 hover:text-gray-600">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">
        {children}
      </main>
    </div>
  )
}
