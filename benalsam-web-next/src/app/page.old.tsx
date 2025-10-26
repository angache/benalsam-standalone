import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'

export default function HomePage() {
  return (
    <div className="flex flex-1">
      {/* Sidebar - Desktop Only */}
      <Sidebar />
      
      {/* Main Content */}
      <MainContent />
    </div>
  )
}