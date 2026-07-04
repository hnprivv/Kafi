export default function MessageBubble({ role, text, pending }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'rounded-br-sm bg-emerald-600 text-white'
            : 'rounded-bl-sm bg-emerald-800/70 text-emerald-50 ring-1 ring-gold-400/20'
        }`}
      >
        {pending ? (
          <span className="flex gap-1 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300" />
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  )
}
