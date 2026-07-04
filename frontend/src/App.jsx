import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ChatScreen from './components/ChatScreen'

function ChatPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-emerald-950 sm:p-6">
      <ChatScreen />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
