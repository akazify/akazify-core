'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Cog } from 'lucide-react'
import { workCentersApi, queryKeys } from '@/lib/api'

interface OperationFormProps {
  onSubmit: (operationData: any) => void
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
  manufacturingOrderId: string
  initialData?: {
    id?: string
    operationId?: string
    workCenterId?: string
    sequence?: number
    plannedQuantity?: number
    plannedStartTime?: string
    plannedEndTime?: string
  }
}

export function OperationForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create',
  manufacturingOrderId,
  initialData 
}: OperationFormProps) {
  const [formData, setFormData] = useState({
    operationId: initialData?.operationId || '',
    workCenterId: initialData?.workCenterId || '',
    sequence: initialData?.sequence?.toString() || '',
    plannedQuantity: initialData?.plannedQuantity?.toString() || '',
    plannedStartTime: initialData?.plannedStartTime || '',
    plannedEndTime: initialData?.plannedEndTime || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch work centers for the dropdown
  const { data: workCentersData } = useQuery({
    queryKey: queryKeys.workCenters.lists(),
    queryFn: () => workCentersApi.getAll({ isActive: true }),
  })

  const workCenters = workCentersData?.data || []

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.operationId.trim()) {
      newErrors.operationId = 'Operation ID is required'
    }
    if (!formData.workCenterId) {
      newErrors.workCenterId = 'Work center is required'
    }
    if (!formData.sequence || Number(formData.sequence) < 1) {
      newErrors.sequence = 'Valid sequence number is required'
    }
    if (!formData.plannedQuantity || Number(formData.plannedQuantity) <= 0) {
      newErrors.plannedQuantity = 'Valid quantity is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatDateTimeForInput = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const tzOffset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - tzOffset * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  const normalizeDateTime = (value: string) => {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString()
  }

  useEffect(() => {
    if (initialData) {
      setFormData({
        operationId: initialData.operationId || '',
        workCenterId: initialData.workCenterId || '',
        sequence: initialData.sequence?.toString() || '',
        plannedQuantity: initialData.plannedQuantity?.toString() || '',
        plannedStartTime: formatDateTimeForInput(initialData.plannedStartTime),
        plannedEndTime: formatDateTimeForInput(initialData.plannedEndTime),
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const operationData: any = {
        operationId: formData.operationId,
        workCenterId: formData.workCenterId,
        sequence: Number(formData.sequence),
        plannedQuantity: Number(formData.plannedQuantity),
      }

      if (formData.plannedStartTime) {
        operationData.plannedStartTime = normalizeDateTime(formData.plannedStartTime)
      }
      if (formData.plannedEndTime) {
        operationData.plannedEndTime = normalizeDateTime(formData.plannedEndTime)
      }

      if (mode === 'create') {
        operationData.manufacturingOrderId = manufacturingOrderId
      }

      onSubmit(operationData)
    }
  }

  const primaryButtonLabel = mode === 'edit' ? 'Save Changes' : 'Create Operation'
  const loadingLabel = mode === 'edit' ? 'Saving...' : 'Creating...'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Operation ID & Work Center */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="operationId">Operation ID *</Label>
          <Input
            id="operationId"
            value={formData.operationId}
            onChange={(e) => handleInputChange('operationId', e.target.value)}
            placeholder="e.g., 010, 020, 030"
            className={errors.operationId ? 'border-red-500' : ''}
          />
          {errors.operationId && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.operationId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="workCenterId">Work Center *</Label>
          <select
            id="workCenterId"
            value={formData.workCenterId}
            onChange={(e) => handleInputChange('workCenterId', e.target.value)}
            className={`flex h-9 w-full rounded-md border ${errors.workCenterId ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
          >
            <option value="">Select work center</option>
            {workCenters.map((wc: any) => (
              <option key={wc.id} value={wc.id}>
                {wc.name} ({wc.code})
              </option>
            ))}
          </select>
          {errors.workCenterId && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.workCenterId}
            </p>
          )}
        </div>
      </div>

      {/* Sequence & Quantity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sequence">Sequence *</Label>
          <Input
            id="sequence"
            type="number"
            min="1"
            value={formData.sequence}
            onChange={(e) => handleInputChange('sequence', e.target.value)}
            placeholder="1"
            className={errors.sequence ? 'border-red-500' : ''}
          />
          {errors.sequence && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.sequence}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plannedQuantity">Planned Quantity *</Label>
          <Input
            id="plannedQuantity"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.plannedQuantity}
            onChange={(e) => handleInputChange('plannedQuantity', e.target.value)}
            placeholder="100"
            className={errors.plannedQuantity ? 'border-red-500' : ''}
          />
          {errors.plannedQuantity && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.plannedQuantity}
            </p>
          )}
        </div>
      </div>

      {/* Planned Start & End Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plannedStartTime">Planned Start Time</Label>
          <Input
            id="plannedStartTime"
            type="datetime-local"
            value={formData.plannedStartTime}
            onChange={(e) => handleInputChange('plannedStartTime', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plannedEndTime">Planned End Time</Label>
          <Input
            id="plannedEndTime"
            type="datetime-local"
            value={formData.plannedEndTime}
            onChange={(e) => handleInputChange('plannedEndTime', e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          <Cog className="h-4 w-4 mr-2" />
          {isLoading ? loadingLabel : primaryButtonLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
