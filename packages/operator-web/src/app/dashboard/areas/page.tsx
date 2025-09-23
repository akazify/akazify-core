'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreHorizontal, Settings, MapPin, Building2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Modal } from '@/components/ui/modal'
import { AreaForm } from '@/components/forms/area-form'
import { sitesApi, areasApi, queryKeys, type AreaFilters } from '@/lib/api'
import type { Site, Area } from '@/lib/api'

export default function AreasPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  
  const queryClient = useQueryClient()

  // Fetch all sites for site selection
  const { data: sitesData } = useQuery({
    queryKey: queryKeys.sites.lists(),
    queryFn: () => sitesApi.getAll({ limit: 100 }),
  })

  // Fetch areas for selected site
  const { data: areasData, isLoading, error } = useQuery({
    queryKey: selectedSite ? queryKeys.areas.list(selectedSite.id, {}) : ['areas-empty'],
    queryFn: () => selectedSite ? areasApi.getBySite(selectedSite.id) : Promise.resolve({ data: [], pagination: { total: 0 } }),
    enabled: !!selectedSite,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ siteId, data }: { siteId: string; data: any }) => areasApi.createInSite(siteId, data),
    onSuccess: () => {
      if (selectedSite) {
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.bySite(selectedSite.id) })
      }
      setShowCreateModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ siteId, areaId, data }: { siteId: string; areaId: string; data: any }) => 
      areasApi.updateInSite(siteId, areaId, data),
    onSuccess: () => {
      if (selectedSite) {
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.bySite(selectedSite.id) })
      }
      setShowEditModal(false)
      setSelectedArea(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ siteId, areaId }: { siteId: string; areaId: string }) => 
      areasApi.deleteFromSite(siteId, areaId),
    onSuccess: () => {
      if (selectedSite) {
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.bySite(selectedSite.id) })
      }
      setShowDeleteModal(false)
      setSelectedArea(null)
    },
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement search filtering
  }

  // CRUD handlers
  const handleCreateArea = (data: any) => {
    if (selectedSite) {
      createMutation.mutate({ siteId: selectedSite.id, data })
    }
  }

  const handleEditArea = (area: Area) => {
    setSelectedArea(area)
    setShowEditModal(true)
  }

  const handleUpdateArea = (data: any) => {
    if (selectedSite && selectedArea) {
      updateMutation.mutate({ siteId: selectedSite.id, areaId: selectedArea.id, data })
    }
  }

  const handleDeleteArea = (area: Area) => {
    setSelectedArea(area)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (selectedSite && selectedArea) {
      deleteMutation.mutate({ siteId: selectedSite.id, areaId: selectedArea.id })
    }
  }

  const filteredAreas = areasData?.data?.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Areas Management</h1>
          <p className="text-gray-600">Manage functional areas within manufacturing sites</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
          disabled={!selectedSite}
        >
          <Plus className="h-4 w-4" />
          Add Area
        </Button>
      </div>

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Site
          </CardTitle>
          <CardDescription>Choose a site to manage its areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sitesData?.data?.map((site) => (
              <Card
                key={site.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSite?.id === site.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedSite(site)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-600">{site.code}</p>
                      <p className="text-xs text-gray-500 mt-1">{site.region}</p>
                    </div>
                    <StatusIndicator status={site.isActive ? 'active' : 'inactive'} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas List */}
      {selectedSite && (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {areasData?.data?.length || 0} areas in {selectedSite.name}
              </Badge>
            </div>
          </div>

          {/* Areas Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600">Error loading areas: {error.message}</p>
              </CardContent>
            </Card>
          ) : filteredAreas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {areasData?.data?.length === 0 ? 'No areas found' : 'No matching areas'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {areasData?.data?.length === 0 
                    ? 'Get started by creating your first area in this site.'
                    : 'Try adjusting your search criteria.'}
                </p>
                {areasData?.data?.length === 0 && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Area
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAreas.map((area) => (
                <Card key={area.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{area.name}</CardTitle>
                        <CardDescription className="font-mono">{area.code}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={area.isActive ? 'active' : 'inactive'} />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {area.description && (
                        <p className="text-sm text-gray-600">{area.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Level</span>
                        <Badge variant="outline">{area.level}</Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Created</span>
                        <span className="text-gray-900">
                          {new Date(area.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditArea(area)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteArea(area)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Area Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Area"
        description={`Add a new area to ${selectedSite?.name}`}
      >
        <AreaForm
          mode="create"
          siteId={selectedSite?.id}
          siteName={selectedSite?.name}
          onSubmit={handleCreateArea}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Area Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedArea(null)
        }}
        title="Edit Area"
        description={`Update ${selectedArea?.name} details`}
      >
        <AreaForm
          mode="edit"
          initialData={selectedArea}
          siteId={selectedSite?.id}
          siteName={selectedSite?.name}
          onSubmit={handleUpdateArea}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedArea(null)
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedArea(null)
        }}
        title="Delete Area"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{selectedArea?.name}</strong>? 
            This will permanently remove the area and may affect related work centers.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedArea(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Area'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
