'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, Settings, Cog, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { sitesApi, workCentersApi, queryKeys } from '@/lib/api'
import { MetricCard } from '@/components/dashboard/metric-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: siteStats, isLoading: sitesLoading } = useQuery({
    queryKey: queryKeys.sites.statistics(),
    queryFn: sitesApi.getStatistics,
  })

  const { data: workCenterStats, isLoading: workCentersLoading } = useQuery({
    queryKey: queryKeys.workCenters.statistics(),
    queryFn: workCentersApi.getStatistics,
  })

  const { data: capacityMetrics, isLoading: capacityLoading } = useQuery({
    queryKey: queryKeys.workCenters.capacityMetrics(),
    queryFn: () => workCentersApi.getCapacityMetrics(),
  })

  const isLoading = sitesLoading || workCentersLoading || capacityLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calculate overall metrics
  const totalCapacity = workCenterStats?.totalCapacity || 0
  const averageUtilization = capacityMetrics?.reduce((acc, metric) => acc + metric.utilizationPercentage, 0) / (capacityMetrics?.length || 1) || 0
  const activeOperations = capacityMetrics?.reduce((acc, metric) => acc + metric.activeOperations, 0) || 0
  const totalOperations = capacityMetrics?.reduce((acc, metric) => acc + metric.plannedOperations, 0) || 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manufacturing Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your manufacturing operations and key performance indicators
        </p>
      </div>

      {/* Key metrics grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Sites"
          value={siteStats?.active || 0}
          total={siteStats?.total || 0}
          icon={Building2}
          status="operational"
        />
        
        <MetricCard
          title="Work Centers"
          value={workCenterStats?.active || 0}
          total={workCenterStats?.total || 0}
          icon={Settings}
          status="operational"
        />
        
        <MetricCard
          title="Active Operations"
          value={activeOperations}
          total={totalOperations}
          icon={Activity}
          status={activeOperations > 0 ? "operational" : "offline"}
          subtitle={`${Math.round(averageUtilization)}% avg utilization`}
        />
        
        <MetricCard
          title="Total Capacity"
          value={Math.round(totalCapacity)}
          icon={TrendingUp}
          status="operational"
          subtitle="units/hour"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sites overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Sites Overview</span>
            </CardTitle>
            <CardDescription>
              Manufacturing sites by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {siteStats?.byRegion.map((region) => (
                <div key={region.region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="operational" size="sm" />
                    <span className="text-sm font-medium">{region.region || 'Unknown'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{region.count} sites</span>
                </div>
              ))}
              {!siteStats?.byRegion.length && (
                <p className="text-sm text-muted-foreground">No regional data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work center categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cog className="h-5 w-5" />
              <span>Work Centers</span>
            </CardTitle>
            <CardDescription>
              Distribution by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workCenterStats?.byCategory.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator 
                      status={category.category === 'PRODUCTION' ? 'operational' : 'maintenance'} 
                      size="sm" 
                    />
                    <span className="text-sm font-medium capitalize">
                      {category.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{category.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capacity utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Capacity Status</span>
            </CardTitle>
            <CardDescription>
              Current utilization levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capacityMetrics?.slice(0, 5).map((metric) => (
                <div key={metric.workCenterId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{metric.workCenterCode}</span>
                    <span className="text-muted-foreground">
                      {Math.round(metric.utilizationPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metric.utilizationPercentage > 80
                          ? 'bg-status-alarm'
                          : metric.utilizationPercentage > 60
                          ? 'bg-status-warning'
                          : 'bg-status-operational'
                      }`}
                      style={{ width: `${Math.min(metric.utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              
              {!capacityMetrics?.length && (
                <p className="text-sm text-muted-foreground">No capacity data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity or alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Current system health and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
            <StatusIndicator status="operational" showLabel />
            <div className="flex-1">
              <p className="text-sm font-medium">All systems operational</p>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
