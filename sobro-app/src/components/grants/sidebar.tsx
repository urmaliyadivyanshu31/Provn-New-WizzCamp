import {
  BarChart2,
  Wallet,
  Settings,
  HelpCircle,
  Menu,
  Clock,
  MapPin,
  Award,
  ChevronLeft,
  Sailboat,
} from "lucide-react"
import { Home } from "lucide-react"
import { Link } from "react-router"
import { useState } from "react"
import type React from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    return (
      <Link
        to={href}
        onClick={handleNavigation}
        className="flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23] hover:shadow-sm group"
        title={isCollapsed ? children?.toString() : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {!isCollapsed && (
          <>
            <span className="ml-3 transition-all duration-200 group-hover:translate-x-1">{children}</span>
          </>
        )}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>

      <nav
        className={`
          fixed inset-y-0 left-0 z-[70] bg-white dark:bg-[#0F0F12] transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static border-r border-gray-200 dark:border-[#1F1F23]
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-16" : "lg:w-64"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-[#1F1F23] transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8">
              <img src="/sobro-icon.png" alt="logo" className="w-8 h-8"/>
              </div>
              {!isCollapsed && (
                <span className="text-lg font-semibold hover:cursor-pointer text-gray-900 dark:text-white transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400">
                  <img src="/logo.png" alt="logo" className="w-20"/>
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <ChevronLeft
                className={`h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dashboard
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="/" icon={Home}>
                    Home
                  </NavItem>
                  <NavItem href="/Journey" icon={Sailboat}>
                    Journey
                  </NavItem>
                  <NavItem href="/sobro-agent" icon={Award}>
                    Sobro Agent
                  </NavItem>
                  <NavItem href="/Memories" icon={Sailboat}>
                    Memories
                  </NavItem>
                  <NavItem href="/dash" icon={MapPin}>
                    Discover Grants
                  </NavItem>
                </div>
              </div>

              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Content
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="#" icon={BarChart2}>
                    Analytics
                  </NavItem>
                  <NavItem href="#" icon={Wallet}>
                    Earnings
                  </NavItem>
                  <NavItem href="#" icon={Clock}>
                    History
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23] hover:shadow-sm group cursor-pointer">
                    <Settings className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {!isCollapsed && (
                      <span className="ml-3 transition-all duration-200 group-hover:translate-x-1">Settings</span>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-56 z-[80]">
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/Profile" 
                      className="w-full px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      Manage Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NavItem href="#" icon={HelpCircle}>
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
