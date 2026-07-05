import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'

const WELCOME = {
  role: 'assistant',
  text: "Greetings! \nI'm Kafi, Noor's support assistant. Ask me anything Noor related in English, Urdu, or a mix of both.\n\nAssalam-o-Alaikum!\nMain 'Kafi' hoon, Noor ka assistant, aap apna koi bhi Noor se related sawal English, Urdu, ya dono mila kar likh sakte hain.",
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([WELCOME])
  const [pending, setPending] = useState(false)
  // Two-phase entrance: mount at the hero mockup's size so the route morph
  // lands 1:1, then grow to full chat height once settled in the center.
  const [expanded, setExpanded] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const scrollRef = useRef(null)
  const navigate = useNavigate()

  const goHome = () => navigate('/', { viewTransition: true })

  // Keep the dialog mounted while its exit animation plays, then unmount.
  const closeModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setConfirmLeave(false)
      setModalClosing(false)
    }, 180)
  }

  // Only warn when there's a conversation to lose — the welcome
  // message alone isn't worth a modal.
  const handleBack = () => {
    if (messages.length > 1) {
      setConfirmLeave(true)
    } else {
      goHome()
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(true), 420)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { role: 'user', text }])
    setPending(true)

    try {
      // Short rolling context: the last few turns ride along with each
      // request so follow-up questions can be resolved server-side.
      const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Maazrat, kuch masla ho gaya. Please dobara try karein.' },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      style={{ viewTransitionName: 'kafi-chat' }}
      className={`relative flex h-[100dvh] w-full flex-col overflow-hidden bg-emerald-950 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:rounded-3xl sm:shadow-2xl sm:shadow-black/40 sm:ring-1 sm:ring-emerald-800 ${
        expanded ? 'sm:h-[85vh] sm:max-w-sm' : 'sm:h-[480px] sm:max-w-[340px]'
      }`}
    >
      <Header onBack={handleBack} />
      <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}
        {pending && <MessageBubble role="assistant" pending />}
      </div>
      <InputBar onSend={handleSend} disabled={pending} />
      {confirmLeave && (
        <div
          className={`modal-overlay absolute inset-0 z-10 flex items-center justify-center bg-emerald-950/70 p-6 backdrop-blur-sm ${modalClosing ? 'closing' : ''}`}
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="End this chat?"
            onClick={(e) => e.stopPropagation()}
            className={`modal-pop w-full max-w-xs rounded-2xl bg-emerald-900 p-5 shadow-2xl shadow-black/40 ring-1 ring-emerald-700 ${modalClosing ? 'closing' : ''}`}
          >
            <h2 className="text-base font-semibold text-white">End this chat?</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/70">
              Going back ends this session. Kafi won&apos;t remember this
              conversation when you visit again.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-emerald-100 ring-1 ring-emerald-700 transition hover:bg-emerald-800"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={goHome}
                className="cursor-pointer rounded-full bg-gold-400 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-gold-300"
              >
                End chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
