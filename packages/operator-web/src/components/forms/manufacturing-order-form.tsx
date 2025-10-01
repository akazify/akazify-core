'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package, AlertCircle } from 'lucide-react'

type FormState = {
  orderNumber: string
  productName: string
  quantity: string
  uom: string
  priority: string
  plannedStartDate: string
  plannedEndDate: string
  description: string
}

interface ManufacturingOrderFormProps {
  onSubmit: (orderData: any, context: { mode: 'create' | 'edit' }) => void
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
  initialData?: Partial<FormState> & {
    notes?: string
    productId?: string
  }
  submitLabel?: string
}

const EMPTY_FORM_STATE: FormState = {
  orderNumber: '',
  productName: '',
  quantity: '',
  uom: 'EACH',
  priority: '3',
  plannedStartDate: '',
  plannedEndDate: '',
  description: ''
}

export function ManufacturingOrderForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create',
  initialData,
  submitLabel
}: ManufacturingOrderFormProps) {
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM_STATE)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Order number is optional - API will auto-generate it
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required'
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required'
    }
    if (!formData.plannedStartDate) {
      newErrors.plannedStartDate = 'Start date is required'
    }
    if (!formData.plannedEndDate) {
      newErrors.plannedEndDate = 'End date is required'
    }
    if (formData.plannedStartDate && formData.plannedEndDate && 
        new Date(formData.plannedStartDate) >= new Date(formData.plannedEndDate)) {
      newErrors.plannedEndDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildNotes = () => {
    const notesParts: string[] = []

    if (formData.productName.trim()) {
      notesParts.push(`Product: ${formData.productName.trim()}`)
    }

    if (formData.description.trim()) {
      notesParts.push(formData.description.trim())
    }

    return notesParts.length > 0 ? notesParts.join(' | ') : undefined
  }

  const DEFAULT_PRODUCT_ID = '1e0b8543-db3b-452e-8103-9716f63e978c'

  const normalizeDateTime = (value: string) => {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return undefined
    }
    return date.toISOString()
  }

  const formatDateTimeForInput = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const tzOffset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - tzOffset * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  const parseNotes = (notes?: string) => {
    if (!notes) {
      return { productName: '', description: '' }
    }

    const parts = notes.split('|').map(part => part.trim()).filter(Boolean)
    let productName = ''
    const descriptionParts: string[] = []

    for (const part of parts) {
      if (part.toLowerCase().startsWith('product:')) {
        productName = part.replace(/product:\s*/i, '').trim()
      } else {
        descriptionParts.push(part)
      }
    }

    return {
      productName,
      description: descriptionParts.join(' | ')
    }
  }

  useEffect(() => {
    if (!initialData) {
      setFormData(EMPTY_FORM_STATE)
      return
    }

    const notesInfo = parseNotes(initialData.notes)

    setFormData({
      orderNumber: initialData.orderNumber ?? '',
      productName: initialData.productName ?? notesInfo.productName ?? '',
      quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
      uom: initialData.uom ?? 'EACH',
      priority: initialData.priority !== undefined ? String(initialData.priority) : '3',
      plannedStartDate: formatDateTimeForInput(initialData.plannedStartDate),
      plannedEndDate: formatDateTimeForInput(initialData.plannedEndDate),
      description: initialData.description ?? notesInfo.description ?? ''
    })
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Transform form data to match API schema
      const notes = buildNotes()
      const orderData = {
        quantity: Number(formData.quantity),
        uom: formData.uom,
        plannedStartDate: normalizeDateTime(formData.plannedStartDate),
        plannedEndDate: normalizeDateTime(formData.plannedEndDate),
        priority: Number(formData.priority)
      } as Record<string, unknown>

      if (mode === 'create') {
        orderData.productId = initialData?.productId ?? DEFAULT_PRODUCT_ID
        if (notes !== undefined) {
          orderData.notes = notes
        }
      } else {
        orderData.notes = notes ?? ''
      }

      console.log('🚀 Submitting order data:', JSON.stringify(orderData, null, 2))
      onSubmit(orderData, { mode })
    }
  }

  const primaryButtonLabel = submitLabel ?? (mode === 'edit' ? 'Save Changes' : 'Create Order')
  const loadingLabel = mode === 'edit' ? 'Saving...' : 'Creating Order...'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Number & Product */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderNumber">Order Number (Optional)</Label>
          <Input
            id="orderNumber"
            value={formData.orderNumber}
            onChange={(e) => handleInputChange('orderNumber', e.target.value)}
            placeholder="Auto-generated if empty"
            className={errors.orderNumber ? 'border-red-500' : ''}
            disabled={mode === 'edit'}
            readOnly={mode === 'edit'}
          />
          <p className="text-xs text-gray-500">Leave empty to auto-generate</p>
          {errors.orderNumber && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.orderNumber}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => handleInputChange('productName', e.target.value)}
            placeholder="e.g., Standard Widget"
            className={errors.productName ? 'border-red-500' : ''}
          />
          {errors.productName && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.productName}
            </p>
          )}
        </div>
      </div>

      {/* Quantity & UOM */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            placeholder="100"
            className={errors.quantity ? 'border-red-500' : ''}
          />
          {errors.quantity && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.quantity}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="uom">Unit of Measure</Label>
          <select
            id="uom"
            value={formData.uom}
            onChange={(e) => handleInputChange('uom', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="EACH">Each</option>
            <option value="KG">Kilogram</option>
            <option value="LB">Pound</option>
            <option value="M">Meter</option>
            <option value="FT">Feet</option>
            <option value="L">Liter</option>
            <option value="GAL">Gallon</option>
          </select>
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((p) => (
            <Badge
              key={p}
              variant={formData.priority === String(p) ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 ${
                formData.priority === String(p) 
                  ? p <= 2 ? 'bg-red-500 hover:bg-red-600' : 
                    p === 3 ? 'bg-yellow-500 hover:bg-yellow-600' : 
                    'bg-green-500 hover:bg-green-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleInputChange('priority', String(p))}
            >
              {p} {p <= 2 ? '(High)' : p === 3 ? '(Medium)' : '(Low)'}
            </Badge>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plannedStartDate">Planned Start Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="plannedStartDate"
              type="datetime-local"
              value={formData.plannedStartDate}
              onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
              className={`pl-10 ${errors.plannedStartDate ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.plannedStartDate && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.plannedStartDate}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plannedEndDate">Planned End Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="plannedEndDate"
              type="datetime-local"
              value={formData.plannedEndDate}
              onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
              className={`pl-10 ${errors.plannedEndDate ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.plannedEndDate && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.plannedEndDate}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Additional notes or requirements..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          <Package className="h-4 w-4 mr-2" />
          {isLoading ? loadingLabel : primaryButtonLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
