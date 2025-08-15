"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,  } from "@/components/ui/dropdown-menu"
import { Bell, ChevronRight, Search, User2, Settings } from "lucide-react"
import { Link } from "react-router"
import { useAuth, useAuthState, useModal } from '@campnetwork/origin/react'
import { useUserProfile } from '../../hooks/useUserProfile'

interface BreadcrumbItem {
  label: string
  href?: string
}

export default function TopNav() {
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }, { label: "Home" }]
  const { walletAddress: address } = useAuth()
  const { authenticated: isConnected } = useAuthState()
  const { openModal } = useModal()
  const { profile, isRegistered, getDisplayName } = useUserProfile()

  const handleConnectWallet = async () => {
    try {
      await openModal()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  return (
    <nav className="px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] h-full">
      <div className="font-medium text-sm flex items-center space-x-1">
        <img src="/sobro-icon.png" alt="Sobro" className="h-6 w-6 mr-2" />
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-1" />}
            {item.href ? (
              <Link
                to={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
       

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
          <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>


        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 relative">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {!isConnected && (
          <button 
            onClick={handleConnectWallet}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        )}

        {isConnected && (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <User2 className="w-5 h-5 text-white" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 p-0 bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={profile?.avatar || (address ? `https://api.dicebear.com/7.x/identicon/svg?seed=${address}` : 'https://api.dicebear.com/7.x/identicon/svg?seed=default')}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full bg-white/20 p-1"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm truncate">
                      {getDisplayName()}
                    </div>
                    <div className="text-blue-100 text-xs">
                      {isRegistered ? 'Registered User' : 'New User'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Camp Network
                  </span>
                </div>
                
                {address && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {`${address.slice(0, 8)}...${address.slice(-8)}`}
                    </span>
                  </div>
                )}
                
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Link 
                    to="/Profile" 
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Profile
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Camp Network wallet is connected
                  </div>
                </div>
              </div>
              
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  )
}
