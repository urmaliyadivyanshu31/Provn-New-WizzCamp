import { useEffect, useState, ReactNode } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import Content from "./grants-content"

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={`flex h-screen`}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 dark:border-[#1F1F23] flex-shrink-0">
          <TopNav />
          
        </header>
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0F0F12]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Layout>
      <Content />
    </Layout>
  )
}
