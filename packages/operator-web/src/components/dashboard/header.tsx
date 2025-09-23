'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Menu, Settings, User, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { healthApi, queryKeys } from '@/lib/api'
import { StatusIndicator } from '@/components/ui/status-indicator'

export function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Health check for system status
  const { data: health } = useQuery({
    queryKey: queryKeys.health.basic(),
    queryFn: healthApi.getHealth,
    refetchInterval: 30000, // Check every 30 seconds
  })

  return (
    <header className="dashboard-header h-16 px-6">
      <div className="flex h-full items-center justify-between">
        {/* Left section - Logo and navigation */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Akazify Operator</h1>
              <p className="text-xs text-muted-foreground">Manufacturing Execution System</p>
            </div>
          </div>
        </div>

        {/* Center section - System status */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted/50">
            <StatusIndicator 
              status={health?.status === 'healthy' ? 'operational' : 'alarm'} 
              size="sm" 
            />
            <span className="text-sm font-medium">
              {health?.status === 'healthy' ? 'System Online' : 'System Alert'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>
              {health?.uptime ? `${Math.floor(health.uptime / 3600)}h uptime` : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Right section - User actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">Operator</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <StatusIndicator 
                status={health?.status === 'healthy' ? 'operational' : 'alarm'} 
                size="sm" 
              />
              <span className="text-sm font-medium">
                {health?.status === 'healthy' ? 'System Online' : 'System Alert'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>
                {health?.uptime ? `${Math.floor(health.uptime / 3600)}h uptime` : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
