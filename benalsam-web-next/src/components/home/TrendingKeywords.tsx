/**
 * TrendingKeywords Component
 * Display trending search keywords
 */

'use client'

import { TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

const TRENDING_KEYWORDS = [
  { text: 'iPhone 15', searches: 245 },
  { text: 'Satılık Daire', searches: 189 },
  { text: 'Kiralık Ev', searches: 156 },
  { text: 'Araba', searches: 134 },
  { text: 'Laptop', searches: 98 },
  { text: 'PS5', searches: 87 },
]

export default function TrendingKeywords() {
  const router = useRouter()

  const handleKeywordClick = (keyword: string) => {
    router.push(`/ilanlar?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span className="font-medium">Popüler:</span>
      </div>
      {TRENDING_KEYWORDS.map((keyword, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => handleKeywordClick(keyword.text)}
        >
          {keyword.text}
        </Badge>
      ))}
    </div>
  )
}

