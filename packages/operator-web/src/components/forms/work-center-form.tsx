'use client'

import { useState, useEffect } from 'react'
import { FormInput } from '../ui/form-input'
import { FormSelect } from '../ui/form-select'
import { useQuery } from '@tanstack/react-query'
import { sitesApi, areasApi, queryKeys } from '@/lib/api'

interface WorkCenterFormData {
  name: string
  code: string
  description: string
  category: string
  capacity: string
  siteId: string
  areaId: string
}

interface WorkCenterFormProps {
  initialData?: Partial<WorkCenterFormData>
  onSubmit: (data: WorkCenterFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

const categoryOptions = [
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'QUALITY', label: 'Quality Control' },
  { value: 'MAINTENANCE', label: 'Maintenance' }
]

export function WorkCenterForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: WorkCenterFormProps) {
  const [formData, setFormData] = useState<WorkCenterFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    capacity: initialData?.capacity || '',
    siteId: initialData?.siteId || '',
    areaId: initialData?.areaId || ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof WorkCenterFormData, string>>>({})

  // Fetch sites for site selection
  const { data: sitesData } = useQuery({
    queryKey: queryKeys.sites.lists(),
    queryFn: () => sitesApi.getAll({ limit: 100 }),
  })

  // Fetch areas for selected site
  const { data: areasData } = useQuery({
    queryKey: queryKeys.areas.list(formData.siteId, {}),
    queryFn: () => areasApi.getBySite(formData.siteId),
    enabled: !!formData.siteId, // Only fetch when site is selected
  })

  const siteOptions = sitesData?.data?.map(site => ({
    value: site.id,
    label: `${site.name} (${site.code})`
  })) || []

  const areaOptions = areasData?.data?.map(area => ({
    value: area.id,
    label: `${area.name} (${area.code})`
  })) || []

  const updateField = (field: keyof WorkCenterFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      // If site changes, clear area selection
      if (field === 'siteId') {
        newData.areaId = ''
      }
      return newData
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof WorkCenterFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Work center name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Work center code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.siteId) {
      newErrors.siteId = 'Site is required'
    }

    if (!formData.areaId) {
      newErrors.areaId = 'Area is required'
    }

    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 0)) {
      newErrors.capacity = 'Capacity must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          label="Work Center Name"
          name="name"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="e.g., Assembly Line 1"
          required
          error={errors.name}
          disabled={isLoading}
        />

        <FormInput
          label="Work Center Code"
          name="code"
          value={formData.code}
          onChange={(value) => updateField('code', value.toUpperCase())}
          placeholder="e.g., ASM-001"
          required
          error={errors.code}
          disabled={isLoading}
        />
      </div>

      <FormInput
        label="Description"
        name="description"
        value={formData.description}
        onChange={(value) => updateField('description', value)}
        placeholder="Brief description of the work center"
        error={errors.description}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Category"
          name="category"
          value={formData.category}
          onChange={(value) => updateField('category', value)}
          options={categoryOptions}
          placeholder="Select category"
          required
          error={errors.category}
          disabled={isLoading}
        />

        <FormInput
          label="Capacity (units/hour)"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={(value) => updateField('capacity', value)}
          placeholder="e.g., 100"
          error={errors.capacity}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Site"
          name="siteId"
          value={formData.siteId}
          onChange={(value) => updateField('siteId', value)}
          options={siteOptions}
          placeholder="Select site first"
          required
          error={errors.siteId}
          disabled={isLoading}
        />

        <FormSelect
          label="Area"
          name="areaId"
          value={formData.areaId}
          onChange={(value) => updateField('areaId', value)}
          options={areaOptions}
          placeholder={formData.siteId ? "Select area" : "Select site first"}
          required
          error={errors.areaId}
          disabled={isLoading || !formData.siteId}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Work Center' : 'Update Work Center'}
        </button>
      </div>
    </form>
  )
}
