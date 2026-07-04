import { useState } from 'react'

export default function InputBar({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-emerald-800 bg-emerald-900 px-3 py-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Apna sawal likhein..."
        disabled={disabled}
        className="flex-1 rounded-full bg-emerald-950 px-4 py-2.5 text-sm text-white placeholder:text-emerald-200/40 outline-none ring-1 ring-emerald-700 focus:ring-gold-400/60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-emerald-950 transition disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 12h16m0 0-6-6m6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  )
}
