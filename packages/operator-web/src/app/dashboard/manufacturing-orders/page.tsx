'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, Play, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { manufacturingOrdersApi, queryKeys } from '@/lib/api'
import { OperationProgressTracker } from '@/components/manufacturing/operation-progress-tracker'
import { Modal } from '@/components/ui/modal'
import { ManufacturingOrderForm } from '@/components/forms/manufacturing-order-form'

export default function ManufacturingOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  
  const { data: ordersData, isLoading } = useQuery({
    queryKey: queryKeys.manufacturingOrders.list({}),
    queryFn: () => manufacturingOrdersApi.getAll({}),
  })

  const { data: stats } = useQuery({
    queryKey: queryKeys.manufacturingOrders.statistics(),
    queryFn: manufacturingOrdersApi.getStatistics,
  })

  const queryClient = useQueryClient()

  // Mutation for creating new orders
  const createOrderMutation = useMutation({
    mutationFn: manufacturingOrdersApi.create,
    onSuccess: () => {
      // Refetch orders and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.all })
      setShowCreateModal(false)
    },
    onError: (error) => {
      console.error('Failed to create order:', error)
      // You could add toast notification here
    }
  })

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => manufacturingOrdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.all })
      setShowEditModal(false)
      setEditingOrderId(null)
    },
    onError: (error) => {
      console.error('Failed to update order:', error)
    }
  })

  const handleFormSubmit = (formData: any, { mode }: { mode: 'create' | 'edit' }) => {
    if (mode === 'edit') {
      if (!editingOrderId) {
        console.warn('No order selected for editing')
        return
      }
      updateOrderMutation.mutate({ id: editingOrderId, data: formData })
      return
    }

    createOrderMutation.mutate(formData)
  }

  const handleOpenEditModal = (orderId: string) => {
    setEditingOrderId(orderId)
    setShowEditModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manufacturing Orders</h1>
          <p className="text-gray-600">Plan, execute, and track production orders</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
          disabled={createOrderMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {stats.byStatus.find(s => s.status === 'IN_PROGRESS')?.count || 0}
                  </p>
                </div>
                <Play className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {stats.byStatus.find(s => s.status === 'COMPLETED')?.count || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Lead Time</p>
                  <p className="text-2xl font-bold">{Number(stats.avgLeadTime).toFixed(6)}h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {ordersData?.data?.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{order.orderNumber}</CardTitle>
                    <p className="text-gray-600">{order.productName}</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Play className="h-3 w-3 mr-1" />
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span> {order.quantity} {order.uom}
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span> {order.priority}
                  </div>
                  <div>
                    <span className="text-gray-600">Start:</span> {new Date(order.plannedStartDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-gray-600">End:</span> {new Date(order.plannedEndDate).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                    className="flex-1"
                  >
                    {selectedOrderId === order.id ? 'Hide Operations' : 'View Operations'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOpenEditModal(order.id)}
                  >
                    Edit Order
                  </Button>
                </div>

                {/* Operations Details */}
                {selectedOrderId === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <OperationProgressTracker 
                      manufacturingOrderId={order.id}
                      manufacturingOrderNumber={order.orderNumber}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Manufacturing Order"
        size="lg"
      >
        <ManufacturingOrderForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createOrderMutation.isPending}
          mode="create"
        />
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingOrderId(null)
        }}
        title="Edit Manufacturing Order"
        size="lg"
      >
        {editingOrderId && (
          <ManufacturingOrderForm
            mode="edit"
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowEditModal(false)
              setEditingOrderId(null)
            }}
            isLoading={updateOrderMutation.isPending}
            submitLabel="Save Changes"
            initialData={(() => {
              const order = ordersData?.data?.find((item) => item.id === editingOrderId)
              if (!order) return undefined
              return {
                orderNumber: order.orderNumber,
                productName: order.productName ?? '',
                quantity: order.quantity,
                uom: order.uom,
                priority: order.priority,
                plannedStartDate: order.plannedStartDate,
                plannedEndDate: order.plannedEndDate,
                notes: order.notes,
                productId: order.productId,
              }
            })()}
          />
        )}
      </Modal>
    </div>
  )
}
