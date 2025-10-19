import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop Only */}
        <Sidebar />
        
        {/* Main Content */}
        <MainContent />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}