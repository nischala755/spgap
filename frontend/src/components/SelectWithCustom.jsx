import { useState, useEffect } from 'react'

const CUSTOM_VALUE = '__custom__'

/**
 * Dropdown with a built-in "Custom / Other" option that reveals a text input.
 */
export default function SelectWithCustom({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  customPlaceholder = 'Enter custom value...',
  label,
  helpText,
  required = false,
}) {
  const isCustom = value && !options.includes(value)
  const [showCustom, setShowCustom] = useState(isCustom)
  const [customText, setCustomText] = useState(isCustom ? value : '')

  useEffect(() => {
    const custom = value && !options.includes(value)
    setShowCustom(custom)
    if (custom) setCustomText(value)
  }, [value, options])

  const handleSelect = (e) => {
    const selected = e.target.value
    if (selected === CUSTOM_VALUE) {
      setShowCustom(true)
      onChange(customText || '')
    } else {
      setShowCustom(false)
      onChange(selected)
    }
  }

  const handleCustomChange = (e) => {
    const text = e.target.value
    setCustomText(text)
    onChange(text)
  }

  const selectValue = showCustom || (value && !options.includes(value))
    ? CUSTOM_VALUE
    : (value || '')

  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      {helpText && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{helpText}</p>
      )}
      <select
        className="select-field"
        value={selectValue}
        onChange={handleSelect}
        required={required && !showCustom}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value={CUSTOM_VALUE}>✏️ Custom / Other...</option>
      </select>
      {showCustom && (
        <input
          className="input-field"
          style={{ marginTop: 8 }}
          placeholder={customPlaceholder}
          value={customText}
          onChange={handleCustomChange}
          required={required}
        />
      )}
    </div>
  )
}
