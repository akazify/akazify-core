interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  disabled = false
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
          error 
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 text-gray-900'
        } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
