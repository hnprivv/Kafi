import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'

const WELCOME = {
  role: 'assistant',
  text: "Assalam-o-Alaikum! Main Kafi hoon, Noor ka support assistant. Aap apna sawal Urdu, English, ya dono mila kar likh sakte hain — main madad karne ki koshish karoon ga.",
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([WELCOME])
  const [pending, setPending] = useState(false)
  const scrollRef = useRef(null)

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
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-emerald-950 sm:h-[85vh] sm:max-w-sm sm:rounded-3xl sm:shadow-2xl sm:shadow-black/40 sm:ring-1 sm:ring-emerald-800">
      <Header />
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}
        {pending && <MessageBubble role="assistant" pending />}
      </div>
      <InputBar onSend={handleSend} disabled={pending} />
    </div>
  )
}
