import { createRoot } from 'react-dom/client'
import './index.css'
import AdminScreen from './components/AdminScreen'

function StandaloneAdmin() {
  return (
    <AdminScreen
      onBack={() => {
        localStorage.removeItem('admin_token')
        window.location.reload()
      }}
    />
  )
}

createRoot(document.getElementById('root')!).render(<StandaloneAdmin />)
