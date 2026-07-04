import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Landing from './pages/Landing'
import Privacy from './pages/Privacy'
import ChatScreen from './components/ChatScreen'

function ChatPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-emerald-950 sm:p-6">
      <ChatScreen />
    </div>
  )
}

// Data router (not <BrowserRouter>): required for <Link viewTransition>
// to trigger the View Transitions API on navigation.
const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/privacy', element: <Privacy /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
