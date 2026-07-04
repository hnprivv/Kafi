import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="flex items-center gap-3 bg-emerald-900 px-4 py-3 shadow-md shadow-black/20">
      <Link
        to="/"
        aria-label="Back to Noor home"
        className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-200/70 transition hover:bg-emerald-800 hover:text-gold-300"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="m15 6-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 ring-1 ring-gold-400/40">
        <span className="font-naskh text-sm text-gold-300" dir="rtl">
          کافی
        </span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight text-gold-300">
          Kafi
        </span>
        <span className="text-xs text-emerald-200/70">
          AI Assistant
        </span>
      </div>
    </header>
  )
}
