'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreHorizontal, Settings, Activity, Building2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Modal } from '@/components/ui/modal'
import { WorkCenterForm } from '@/components/forms/work-center-form'
import { workCentersApi, queryKeys, type WorkCenterFilters } from '@/lib/api'

export default function WorkCentersPage() {
  const [filters, setFilters] = useState<WorkCenterFilters>({
    page: 1,
    limit: 20,
    sortBy: 'wc.name',
    sortOrder: 'ASC',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<any>(null)
  
  const queryClient = useQueryClient()

  // Fetch work centers data
  const { data: workCentersData, isLoading, error } = useQuery({
    queryKey: queryKeys.workCenters.list(filters),
    queryFn: () => workCentersApi.getAll(filters),
  })

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: queryKeys.workCenters.statistics(),
    queryFn: workCentersApi.getStatistics,
  })

  // Fetch capacity metrics
  const { data: capacityMetrics } = useQuery({
    queryKey: queryKeys.workCenters.capacityMetrics(),
    queryFn: () => workCentersApi.getCapacityMetrics(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: workCentersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workCenters.all })
      setShowCreateModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => workCentersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workCenters.all })
      setShowEditModal(false)
      setSelectedWorkCenter(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: workCentersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workCenters.all })
      setShowDeleteModal(false)
      setSelectedWorkCenter(null)
    },
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters(prev => ({
      ...prev,
      code: query || undefined,
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // CRUD handlers
  const handleCreateWorkCenter = (data: any) => {
    // Format data for API (remove siteId since area implies site, convert capacity to number)
    const apiData = {
      areaId: data.areaId,
      name: data.name,
      code: data.code,
      description: data.description,
      category: data.category,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      isActive: true
    }
    createMutation.mutate(apiData)
  }

  const handleEditWorkCenter = (workCenter: any) => {
    setSelectedWorkCenter(workCenter)
    setShowEditModal(true)
  }

  const handleUpdateWorkCenter = (data: any) => {
    if (selectedWorkCenter) {
      updateMutation.mutate({ id: selectedWorkCenter.id, data })
    }
  }

  const handleDeleteWorkCenter = (workCenter: any) => {
    setSelectedWorkCenter(workCenter)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedWorkCenter) {
      deleteMutation.mutate(selectedWorkCenter.id)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PRODUCTION': return 'bg-hierarchy-workCenter text-white'
      case 'ASSEMBLY': return 'bg-status-operational text-white'
      case 'PACKAGING': return 'bg-status-warning text-white'
      case 'QUALITY': return 'bg-hierarchy-equipment text-white'
      case 'MAINTENANCE': return 'bg-status-maintenance text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 90) return 'alarm'
    if (utilization > 75) return 'warning'
    if (utilization > 0) return 'operational'
    return 'offline'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" label="Loading work centers..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Work Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load work centers data. Please try again.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage production work centers and monitor capacity utilization
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Work Center
        </Button>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Centers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <StatusIndicator status="operational" size="sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? Math.round((stats.active / stats.total) * 100) : 0}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.totalCapacity || 0)}</div>
            <p className="text-xs text-muted-foreground">units/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Capacity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.averageCapacity || 0)}</div>
            <p className="text-xs text-muted-foreground">units/hour per center</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Work Centers Directory</CardTitle>
              <CardDescription>
                Browse and manage all production work centers
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work centers..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Work centers grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workCentersData?.data.map((workCenter) => {
              const metrics = capacityMetrics?.find(m => m.workCenterId === workCenter.id)
              const utilization = metrics?.utilizationPercentage || 0
              
              return (
                <Card key={workCenter.id} className="equipment-card cursor-pointer hover:shadow-card-hover transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusIndicator 
                          status={workCenter.isActive ? getUtilizationStatus(utilization) : 'offline'} 
                          size="sm" 
                        />
                        <CardTitle className="text-base">{workCenter.name}</CardTitle>
                      </div>
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditWorkCenter(workCenter)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Work Center
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteWorkCenter(workCenter)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Work Center
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {workCenter.code}
                      </Badge>
                      <Badge className={`text-xs ${getCategoryColor(workCenter.category)}`}>
                        {workCenter.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Area information */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Area:</span>
                        <span className="font-medium">{workCenter.area.name}</span>
                      </div>

                      {/* Capacity information */}
                      {workCenter.capacity && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{workCenter.capacity} units/h</span>
                        </div>
                      )}

                      {/* Utilization */}
                      {metrics && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Utilization:</span>
                            <span className="font-medium">{Math.round(utilization)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                utilization > 90
                                  ? 'bg-status-alarm'
                                  : utilization > 75
                                  ? 'bg-status-warning'
                                  : utilization > 0
                                  ? 'bg-status-operational'
                                  : 'bg-status-offline'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Operations count */}
                      {metrics && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Active Operations:</span>
                          <span className="font-medium">{metrics.activeOperations}</span>
                        </div>
                      )}

                      {/* Description */}
                      {workCenter.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {workCenter.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty state */}
          {!workCentersData?.data.length && (
            <div className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No work centers found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery 
                  ? `No work centers match "${searchQuery}". Try adjusting your search.`
                  : 'Get started by adding your first work center.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Work Center
              </Button>
            </div>
          )}

          {/* Pagination */}
          {workCentersData?.pagination.totalPages && workCentersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((workCentersData.pagination.page - 1) * workCentersData.pagination.limit) + 1} to{' '}
                {Math.min(workCentersData.pagination.page * workCentersData.pagination.limit, workCentersData.pagination.total)} of{' '}
                {workCentersData.pagination.total} work centers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(workCentersData.pagination.page - 1)}
                  disabled={!workCentersData.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(workCentersData.pagination.page + 1)}
                  disabled={!workCentersData.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Work Center Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Work Center"
        size="lg"
      >
        <WorkCenterForm
          mode="create"
          onSubmit={handleCreateWorkCenter}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Work Center Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedWorkCenter(null)
        }}
        title="Edit Work Center"
        size="lg"
      >
        {selectedWorkCenter && (
          <WorkCenterForm
            mode="edit"
            initialData={selectedWorkCenter}
            onSubmit={handleUpdateWorkCenter}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedWorkCenter(null)
            }}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedWorkCenter(null)
        }}
        title="Delete Work Center"
        size="sm"
      >
        {selectedWorkCenter && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedWorkCenter.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedWorkCenter(null)
                }}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Work Center'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
