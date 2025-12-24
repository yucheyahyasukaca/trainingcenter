
import React from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps {
    id?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export const Checkbox = ({
    id,
    checked = false,
    onCheckedChange,
    disabled,
    className = ''
}: CheckboxProps) => {
    return (
        <button
            type="button"
            id={id}
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onCheckedChange?.(!checked)}
            className={`
        peer h-5 w-5 shrink-0 rounded border border-gray-300 ring-offset-white 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50 
        ${checked ? 'bg-primary-600 border-primary-600' : 'bg-white hover:bg-gray-50'}
        flex items-center justify-center transition-colors
        ${className}
      `}
        >
            {checked && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
        </button>
    )
}
