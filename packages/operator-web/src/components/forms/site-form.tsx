'use client'

import { useState, useEffect } from 'react'
import { FormInput } from '../ui/form-input'
import { FormSelect } from '../ui/form-select'

interface SiteFormData {
  name: string
  code: string
  description: string
  address: string
  region: string
  timezone: string
}

interface SiteFormProps {
  initialData?: Partial<SiteFormData>
  onSubmit: (data: SiteFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

const regionOptions = [
  { value: 'North America', label: 'North America' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Asia Pacific', label: 'Asia Pacific' },
  { value: 'South America', label: 'South America' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Middle East', label: 'Middle East' }
]

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Detroit', label: 'America/Detroit (EST)' },
  { value: 'America/Tijuana', label: 'America/Tijuana (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' }
]

export function SiteForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: SiteFormProps) {
  const [formData, setFormData] = useState<SiteFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    address: initialData?.address || '',
    region: initialData?.region || '',
    timezone: initialData?.timezone || 'UTC'
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({})

  const updateField = (field: keyof SiteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof SiteFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Site code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens'
    }

    if (!formData.region) {
      newErrors.region = 'Region is required'
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required'
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
          label="Site Name"
          name="name"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="e.g., Manufacturing Plant A"
          required
          error={errors.name}
          disabled={isLoading}
        />

        <FormInput
          label="Site Code"
          name="code"
          value={formData.code}
          onChange={(value) => updateField('code', value.toUpperCase())}
          placeholder="e.g., MPA-001"
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
        placeholder="Brief description of the manufacturing site"
        error={errors.description}
        disabled={isLoading}
      />

      <FormInput
        label="Address"
        name="address"
        value={formData.address}
        onChange={(value) => updateField('address', value)}
        placeholder="Physical address of the site"
        error={errors.address}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Region"
          name="region"
          value={formData.region}
          onChange={(value) => updateField('region', value)}
          options={regionOptions}
          placeholder="Select region"
          required
          error={errors.region}
          disabled={isLoading}
        />

        <FormSelect
          label="Timezone"
          name="timezone"
          value={formData.timezone}
          onChange={(value) => updateField('timezone', value)}
          options={timezoneOptions}
          required
          error={errors.timezone}
          disabled={isLoading}
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
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Site' : 'Update Site'}
        </button>
      </div>
    </form>
  )
}
