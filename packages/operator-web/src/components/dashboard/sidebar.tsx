'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  Wrench, 
  BarChart3,
  Package,
  Users,
  Activity,
  MapPin,
  Cog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Sites',
    href: '/dashboard/sites',
    icon: Building2,
  },
  {
    name: 'Areas',
    href: '/dashboard/areas',
    icon: MapPin,
  },
  {
    name: 'Work Centers',
    href: '/dashboard/work-centers',
    icon: Settings,
  },
  {
    name: 'Equipment',
    href: '/dashboard/equipment',
    icon: Cog,
  },
  {
    name: 'Manufacturing Orders',
    href: '/dashboard/manufacturing-orders',
    icon: Package,
  },
  {
    name: 'Work Orders',
    href: '/dashboard/work-orders',
    icon: Wrench,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Quality',
    href: '/dashboard/quality',
    icon: Activity,
  },
]

const secondaryNavigation = [
  {
    name: 'Locations',
    href: '/dashboard/locations',
    icon: MapPin,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="dashboard-sidebar">
      <div className="flex h-full flex-col">
        {/* Main navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Secondary navigation */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Management
            </h3>
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>Akazify Core v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
            <p className="mt-1">Manufacturing Execution System</p>
          </div>
        </div>
      </div>
    </div>
  )
}
