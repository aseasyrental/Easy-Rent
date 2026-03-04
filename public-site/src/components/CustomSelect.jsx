import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(prev => !prev)
    }
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      const idx = options.findIndex(o => o.value === value)
      if (idx < options.length - 1) onChange(options[idx + 1].value)
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      const idx = options.findIndex(o => o.value === value)
      if (idx > 0) onChange(options[idx - 1].value)
    }
  }

  return (
    <div className={`cselect ${className}`} ref={ref}>
      <button
        type="button"
        className={`cselect__trigger ${open ? 'cselect__trigger--open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="cselect__value">{selected.label}</span>
        <span className={`cselect__chevron ${open ? 'cselect__chevron--open' : ''}`} />
      </button>
      {open && (
        <ul className="cselect__panel" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`cselect__option ${opt.value === value ? 'cselect__option--selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="cselect__check">&#10003;</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
