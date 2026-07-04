import { useEffect, useRef, useState } from 'react'
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
  const scrollRef = useRef(null)

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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
      className={`flex h-[100dvh] w-full flex-col overflow-hidden bg-emerald-950 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:rounded-3xl sm:shadow-2xl sm:shadow-black/40 sm:ring-1 sm:ring-emerald-800 ${
        expanded ? 'sm:h-[85vh] sm:max-w-sm' : 'sm:h-[480px] sm:max-w-[340px]'
      }`}
    >
      <Header />
      <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}
        {pending && <MessageBubble role="assistant" pending />}
      </div>
      <InputBar onSend={handleSend} disabled={pending} />
    </div>
  )
}
