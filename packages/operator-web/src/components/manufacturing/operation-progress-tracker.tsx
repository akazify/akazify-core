'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manufacturingOrderOperationsApi, queryKeys } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { OperationForm } from '@/components/forms/operation-form'
import { QualityChecksPanel } from './quality-checks-panel'
import { LaborAssignmentsPanel } from './labor-assignments-panel'
import { MaterialConsumptionPanel } from './material-consumption-panel'
import { BarcodeScanner } from './barcode-scanner'
import { NonConformancePanel } from './non-conformance-panel'
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  ArrowRight,
  Timer,
  Package,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

// Mock data for demonstration
const sampleOperations = [
  {
    id: '1',
    operationId: '010',
    sequence: 1,
    workCenterName: 'Material Prep Station',
    workCenterCode: 'PREP-001',
    status: 'COMPLETED' as const,
    plannedQuantity: 100,
    completedQuantity: 100,
    plannedDuration: 30, // minutes
    actualDuration: 25,
    plannedStartTime: '2025-09-23T08:00:00Z',
    actualStartTime: '2025-09-23T08:00:00Z',
    plannedEndTime: '2025-09-23T08:30:00Z',
    actualEndTime: '2025-09-23T08:25:00Z',
  },
  {
    id: '2',
    operationId: '020',
    sequence: 2,
    workCenterName: 'Advanced CNC Station',
    workCenterCode: 'CNC-ADV-001',
    status: 'IN_PROGRESS' as const,
    plannedQuantity: 100,
    completedQuantity: 75,
    plannedDuration: 120, // minutes
    actualDuration: 85, // current elapsed
    plannedStartTime: '2025-09-23T08:30:00Z',
    actualStartTime: '2025-09-23T08:30:00Z',
    plannedEndTime: '2025-09-23T10:30:00Z',
    actualEndTime: undefined,
  },
  {
    id: '3',
    operationId: '030',
    sequence: 3,
    workCenterName: 'Quality Control Station',
    workCenterCode: 'QC-001',
    status: 'WAITING' as const,
    plannedQuantity: 100,
    completedQuantity: 0,
    plannedDuration: 15,
    actualDuration: undefined,
    plannedStartTime: '2025-09-23T10:30:00Z',
    actualStartTime: undefined,
    plannedEndTime: '2025-09-23T10:45:00Z',
    actualEndTime: undefined,
  },
  {
    id: '4',
    operationId: '040',
    sequence: 4,
    workCenterName: 'Packaging Station',
    workCenterCode: 'PKG-001',
    status: 'WAITING' as const,
    plannedQuantity: 100,
    completedQuantity: 0,
    plannedDuration: 20,
    actualDuration: undefined,
    plannedStartTime: '2025-09-23T10:45:00Z',
    actualStartTime: undefined,
    plannedEndTime: '2025-09-23T11:05:00Z',
    actualEndTime: undefined,
  }
]

type OperationStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'

interface Operation {
  id: string
  operationId: string
  sequence: number
  workCenterName: string
  workCenterCode: string
  status: OperationStatus
  plannedQuantity: number
  completedQuantity: number
  plannedDuration: number
  actualDuration?: number
  plannedStartTime: string
  actualStartTime?: string
  plannedEndTime: string
  actualEndTime?: string
}

interface OperationProgressTrackerProps {
  manufacturingOrderId?: string
  manufacturingOrderNumber?: string
}

export function OperationProgressTracker({ 
  manufacturingOrderId = '1',
  manufacturingOrderNumber = 'MO-2025-000001' 
}: OperationProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<'operations' | 'quality' | 'labor' | 'materials' | 'tracking'>('operations')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  // Fetch operations from API
  const { data: operationsData, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations', manufacturingOrderId],
    queryFn: () => manufacturingOrderOperationsApi.getByManufacturingOrder(manufacturingOrderId),
    enabled: !!manufacturingOrderId,
  })

  // Use real data if available, fallback to sample data
  const operations = operationsData || (sampleOperations as Operation[])

  // Mutation for updating operation status
  const updateStatusMutation = useMutation({
    mutationFn: ({ operationId, status }: { operationId: string; status: OperationStatus }) =>
      manufacturingOrderOperationsApi.updateStatus(operationId, status),
    onSuccess: () => {
      // Refetch operations data
      queryClient.invalidateQueries({ queryKey: ['operations', manufacturingOrderId] })
    },
    onError: (error) => {
      console.error('Failed to update operation status:', error)
    }
  })

  // Mutation for creating operation
  const createOperationMutation = useMutation({
    mutationFn: manufacturingOrderOperationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', manufacturingOrderId] })
      setShowCreateModal(false)
    },
    onError: (error) => {
      console.error('Failed to create operation:', error)
    }
  })

  // Mutation for updating operation
  const updateOperationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      manufacturingOrderOperationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', manufacturingOrderId] })
      setShowEditModal(false)
      setEditingOperationId(null)
    },
    onError: (error) => {
      console.error('Failed to update operation:', error)
    }
  })

  // Mutation for deleting operation
  const deleteOperationMutation = useMutation({
    mutationFn: manufacturingOrderOperationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', manufacturingOrderId] })
    },
    onError: (error) => {
      console.error('Failed to delete operation:', error)
    }
  })

  // Mutation for updating quantity
  const updateQuantityMutation = useMutation({
    mutationFn: ({ operationId, quantity }: { operationId: string; quantity: number }) =>
      manufacturingOrderOperationsApi.updateQuantity(operationId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', manufacturingOrderId] })
    },
    onError: (error) => {
      console.error('Failed to update quantity:', error)
    }
  })

  // Handle start operation (WAITING → IN_PROGRESS)
  const handleStartOperation = (operationId: string) => {
    updateStatusMutation.mutate({ 
      operationId, 
      status: 'IN_PROGRESS'
    })
  }

  // Handle resume operation (BLOCKED → IN_PROGRESS)
  const handleResumeOperation = (operationId: string) => {
    updateStatusMutation.mutate({ 
      operationId, 
      status: 'IN_PROGRESS'
    })
  }

  // Handle pause operation (IN_PROGRESS → BLOCKED)
  const handlePauseOperation = (operationId: string) => {
    updateStatusMutation.mutate({ 
      operationId, 
      status: 'BLOCKED'
    })
  }

  // Handle complete operation (IN_PROGRESS → COMPLETED)
  const handleCompleteOperation = (operationId: string) => {
    updateStatusMutation.mutate({ 
      operationId, 
      status: 'COMPLETED'
    })
  }

  // Handle update quantity
  const handleUpdateQuantity = (operationId: string, quantity: number) => {
    updateQuantityMutation.mutate({ 
      operationId, 
      quantity
    })
  }

  // Handle create operation
  const handleCreateOperation = (operationData: any) => {
    createOperationMutation.mutate(operationData)
  }

  // Handle edit operation
  const handleOpenEditModal = (operationId: string) => {
    setEditingOperationId(operationId)
    setShowEditModal(true)
  }

  const handleUpdateOperation = (operationData: any) => {
    if (!editingOperationId) return
    updateOperationMutation.mutate({ id: editingOperationId, data: operationData })
  }

  // Handle delete operation
  const handleDeleteOperation = (operationId: string) => {
    if (window.confirm('Are you sure you want to delete this operation?')) {
      deleteOperationMutation.mutate(operationId)
    }
  }
  
  const getStatusColor = (status: OperationStatus) => {
    switch (status) {
      case 'WAITING': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case 'WAITING': return Clock
      case 'IN_PROGRESS': return Play
      case 'COMPLETED': return CheckCircle
      case 'BLOCKED': return AlertCircle
      default: return Clock
    }
  }

  const getQuantityProgress = (completed: number, planned: number) => {
    return planned > 0 ? (completed / planned) * 100 : 0
  }

  const completedOperations = operations.filter(op => op.status === 'COMPLETED').length
  const totalOperations = operations.length
  const overallProgress = (completedOperations / totalOperations) * 100

  const currentOperation = operations.find(op => op.status === 'IN_PROGRESS') || 
                          operations.find(op => op.status === 'WAITING')

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--'
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manufacturing Execution</h2>
          <p className="text-gray-600">{manufacturingOrderNumber} - Standard Widget</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {completedOperations}/{totalOperations} Operations Complete
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'operations'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Operations
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'quality'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Quality
        </button>
        <button
          onClick={() => setActiveTab('labor')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'labor'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Labor
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'materials'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'tracking'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tracking
        </button>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <Badge variant="outline">
              {Math.round(overallProgress)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-2 mb-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Operation:</span>
              <p className="font-medium">{currentOperation?.operationId} - {currentOperation?.workCenterName}</p>
            </div>
            <div>
              <span className="text-gray-600">Expected Completion:</span>
              <p className="font-medium">Today at 11:05 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'operations' && (
        <div className="space-y-4">
          {/* Create Operation Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Operation
            </Button>
          </div>

          {operationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading operations...</p>
              </div>
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No operations found for this manufacturing order.</p>
            </div>
          ) : (
            operations.map((operation, index) => {
          const StatusIcon = getStatusIcon(operation.status)
          const quantityProgress = getQuantityProgress(operation.completedQuantity, operation.plannedQuantity)
          const isActive = operation.status === 'IN_PROGRESS'
          const isCompleted = operation.status === 'COMPLETED'
          
          return (
            <Card key={operation.id} className={`${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <StatusIcon className={`w-4 h-4 ${
                        isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base">
                          Operation {operation.operationId}
                        </CardTitle>
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        {operation.workCenterName} ({operation.workCenterCode})
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* WAITING: Show Start button */}
                    {operation.status === 'WAITING' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStartOperation(operation.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}

                    {/* IN_PROGRESS: Show Pause and Complete buttons */}
                    {isActive && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePauseOperation(operation.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleCompleteOperation(operation.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}

                    {/* BLOCKED: Show Resume button */}
                    {operation.status === 'BLOCKED' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleResumeOperation(operation.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}

                    {/* Edit and Delete buttons for non-completed operations */}
                    {!isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(operation.id)}
                          disabled={deleteOperationMutation.isPending}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOperation(operation.id)}
                          disabled={deleteOperationMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quantity Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Quantity Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {operation.completedQuantity}/{operation.plannedQuantity} EACH
                        </span>
                        {isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const newQty = prompt(`Update completed quantity (current: ${operation.completedQuantity}, max: ${operation.plannedQuantity}):`, String(operation.completedQuantity))
                              if (newQty && !isNaN(Number(newQty))) {
                                const qty = Number(newQty)
                                if (qty >= 0 && qty <= operation.plannedQuantity) {
                                  handleUpdateQuantity(operation.id, qty)
                                } else {
                                  alert('Quantity must be between 0 and planned quantity')
                                }
                              }
                            }}
                            disabled={updateQuantityMutation.isPending}
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                    <Progress value={quantityProgress} className="h-1" />
                  </div>

                  {/* Time Information */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Timer className="w-3 h-3" />
                        <span>Duration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Planned:</span>
                        <span className="font-medium">{formatDuration(operation.plannedDuration)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Actual:</span>
                        <span className={`font-medium ${
                          operation.actualDuration && operation.actualDuration < operation.plannedDuration 
                            ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatDuration(operation.actualDuration)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>Schedule</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Start:</span>
                        <span className="font-medium">{formatTime(operation.actualStartTime || operation.plannedStartTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">End:</span>
                        <span className="font-medium">{formatTime(operation.actualEndTime || operation.plannedEndTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  {isCompleted && operation.actualDuration && (
                    <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
                      <div className={`flex items-center space-x-1 text-xs ${
                        operation.actualDuration < operation.plannedDuration ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {operation.actualDuration < operation.plannedDuration ? 'Ahead' : 'Behind'} by {' '}
                          {Math.abs(operation.actualDuration - operation.plannedDuration)} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <Package className="w-3 h-3" />
                        <span>100% Quality Pass</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {/* Connection Line */}
              {index < operations.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-gray-300 -mt-2 mb-2" />
                </div>
              )}
            </Card>
          )
        }))}
        </div>
      )}

      {activeTab === 'quality' && (
        <QualityChecksPanel 
          operationId={currentOperation?.id}
          manufacturingOrderId={manufacturingOrderId}
        />
      )}

      {activeTab === 'labor' && (
        <LaborAssignmentsPanel 
          operationId={currentOperation?.id}
        />
      )}

      {activeTab === 'materials' && (
        <MaterialConsumptionPanel operationId={currentOperation?.id} />
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <BarcodeScanner operationId={currentOperation?.id} />
          <NonConformancePanel operationId={currentOperation?.id} />
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Adjust Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Operation"
        size="lg"
      >
        <OperationForm
          mode="create"
          manufacturingOrderId={manufacturingOrderId}
          onSubmit={handleCreateOperation}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createOperationMutation.isPending}
        />
      </Modal>

      {/* Edit Operation Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingOperationId(null)
        }}
        title="Edit Operation"
        size="lg"
      >
        {editingOperationId && (
          <OperationForm
            mode="edit"
            manufacturingOrderId={manufacturingOrderId}
            onSubmit={handleUpdateOperation}
            onCancel={() => {
              setShowEditModal(false)
              setEditingOperationId(null)
            }}
            isLoading={updateOperationMutation.isPending}
            initialData={(() => {
              const operation = operations.find((op) => op.id === editingOperationId)
              if (!operation) return undefined
              return {
                id: operation.id,
                operationId: operation.operationId,
                workCenterId: operation.workCenterId,
                sequence: operation.sequence,
                plannedQuantity: operation.plannedQuantity,
                plannedStartTime: operation.plannedStartTime,
                plannedEndTime: operation.plannedEndTime,
              }
            })()}
          />
        )}
      </Modal>
    </div>
  )
}
