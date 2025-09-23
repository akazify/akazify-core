'use client'

import { useState } from 'react'
import { FormInput } from '../ui/form-input'
import { FormSelect } from '../ui/form-select'

interface AreaFormData {
  name: string
  code: string
  description: string
  level: string
  isActive: boolean
}

interface AreaFormProps {
  initialData?: any
  onSubmit: (data: AreaFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
  siteId?: string
  siteName?: string
}

const levelOptions = [
  { value: '1', label: 'Level 1 - Primary Area' },
  { value: '2', label: 'Level 2 - Sub Area' },
  { value: '3', label: 'Level 3 - Section' },
  { value: '4', label: 'Level 4 - Zone' },
  { value: '5', label: 'Level 5 - Cell' }
]

export function AreaForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  mode,
  siteId,
  siteName 
}: AreaFormProps) {
  const [formData, setFormData] = useState<AreaFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    level: initialData?.level?.toString() || '1',
    isActive: initialData?.isActive ?? true
  })

  const [errors, setErrors] = useState<Partial<Record<keyof AreaFormData, string>>>({})

  const updateField = (field: keyof AreaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof AreaFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Area name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Area code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens'
    }

    if (!formData.level) {
      newErrors.level = 'Level is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const submitData = {
        ...formData,
        level: parseInt(formData.level),
        isActive: formData.isActive
      }
      onSubmit(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Site Info Display */}
      {siteName && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Site:</strong> {siteName}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          label="Area Name"
          name="name"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="e.g., Main Production Floor"
          required
          error={errors.name}
          disabled={isLoading}
        />

        <FormInput
          label="Area Code"
          name="code"
          value={formData.code}
          onChange={(value) => updateField('code', value.toUpperCase())}
          placeholder="e.g., PROD-A"
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
        placeholder="Brief description of the area"
        error={errors.description}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Level"
          name="level"
          value={formData.level}
          onChange={(value) => updateField('level', value)}
          options={levelOptions}
          placeholder="Select level"
          required
          error={errors.level}
          disabled={isLoading}
        />

        <div className="flex items-center space-x-2 pt-6">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
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
          {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Area' : 'Update Area')}
        </button>
      </div>
    </form>
  )
}
