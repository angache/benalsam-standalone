/**
 * Chatbot Service
 * Smart FAQ matching with fuzzy search and context awareness
 */

import { CHATBOT_FAQ, type FAQItem } from '@/data/chatbotFAQ'

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: FAQItem['action']
  relatedQuestions?: string[]
}

export interface ChatContext {
  currentPage: string
  userLoggedIn: boolean
  previousQuestions: string[]
}

export interface MatchResult {
  faq: FAQItem
  score: number
  matchType: 'exact' | 'keyword' | 'fuzzy' | 'fallback'
}

// ============================================================================
// FUZZY MATCHING ALGORITHM
// ============================================================================

/**
 * Calculate Levenshtein distance (edit distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  const longerLength = longer.length
  if (longerLength === 0) return 1.0
  
  const distance = levenshteinDistance(shorter, longer)
  return (longerLength - distance) / longerLength
}

/**
 * Normalize Turkish text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text)
  const words = normalized.split(/\s+/).filter(word => word.length > 2)
  
  // Remove common stop words
  const stopWords = ['bir', 'bu', 'şu', 'var', 'yok', 'gibi', 'için', 'ile', 'veya', 'ama', 'fakat', 've', 'ya', 'ki', 'mi', 'mu', 'mı', 'mü']
  return words.filter(word => !stopWords.includes(word))
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Find exact match
 */
function findExactMatch(query: string): MatchResult | null {
  const normalizedQuery = normalizeText(query)
  
  for (const faq of CHATBOT_FAQ) {
    const normalizedQuestion = normalizeText(faq.question)
    if (normalizedQuestion === normalizedQuery) {
      return {
        faq,
        score: 1.0,
        matchType: 'exact'
      }
    }
  }
  
  return null
}

/**
 * Find keyword matches
 */
function findKeywordMatches(query: string): MatchResult[] {
  const queryKeywords = extractKeywords(query)
  if (queryKeywords.length === 0) return []
  
  const matches: MatchResult[] = []
  
  for (const faq of CHATBOT_FAQ) {
    let matchCount = 0
    let totalWeight = 0
    
    // Check against FAQ keywords
    for (const keyword of faq.keywords) {
      for (const queryKeyword of queryKeywords) {
        const similarity = calculateSimilarity(queryKeyword, normalizeText(keyword))
        if (similarity > 0.7) {
          matchCount++
          totalWeight += similarity
        }
      }
    }
    
    // Check against question text
    const questionKeywords = extractKeywords(faq.question)
    for (const questionKeyword of questionKeywords) {
      for (const queryKeyword of queryKeywords) {
        const similarity = calculateSimilarity(queryKeyword, questionKeyword)
        if (similarity > 0.8) {
          matchCount++
          totalWeight += similarity * 0.8 // Slightly lower weight
        }
      }
    }
    
    if (matchCount > 0) {
      const score = totalWeight / queryKeywords.length
      matches.push({
        faq,
        score,
        matchType: 'keyword'
      })
    }
  }
  
  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Find fuzzy matches
 */
function findFuzzyMatches(query: string): MatchResult[] {
  const normalizedQuery = normalizeText(query)
  const matches: MatchResult[] = []
  
  for (const faq of CHATBOT_FAQ) {
    const normalizedQuestion = normalizeText(faq.question)
    const similarity = calculateSimilarity(normalizedQuery, normalizedQuestion)
    
    if (similarity > 0.5) {
      matches.push({
        faq,
        score: similarity,
        matchType: 'fuzzy'
      })
    }
  }
  
  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Get context-aware suggestions based on current page
 */
function getContextSuggestions(context: ChatContext): FAQItem[] {
  const suggestions: FAQItem[] = []
  
  // Page-specific suggestions
  if (context.currentPage.includes('/ilan-olustur')) {
    suggestions.push(
      ...CHATBOT_FAQ.filter(faq => 
        ['ilan-nasil-verilir', 'fotograf-ekleme', 'ilan-onay'].includes(faq.id)
      )
    )
  } else if (context.currentPage.includes('/ilanlar')) {
    suggestions.push(
      ...CHATBOT_FAQ.filter(faq => 
        ['teklif-nasil-gonderilir', 'ilan-nasil-verilir'].includes(faq.id)
      )
    )
  } else if (context.currentPage.includes('/mesajlarim')) {
    suggestions.push(
      ...CHATBOT_FAQ.filter(faq => 
        ['mesajlasma', 'bildirim', 'spam'].includes(faq.id)
      )
    )
  }
  
  // Auth status suggestions
  if (!context.userLoggedIn) {
    suggestions.push(
      ...CHATBOT_FAQ.filter(faq => 
        ['hesap-olustur', 'giris-yap'].includes(faq.id)
      )
    )
  }
  
  return suggestions.slice(0, 4)
}

// ============================================================================
// MAIN CHATBOT FUNCTIONS
// ============================================================================

/**
 * Process user message and find best answer
 */
export function processUserMessage(
  message: string,
  context: ChatContext
): ChatMessage {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 1. Try exact match
  const exactMatch = findExactMatch(message)
  if (exactMatch && exactMatch.score > 0.95) {
    return createAssistantMessage(messageId, exactMatch.faq)
  }
  
  // 2. Try keyword matching
  const keywordMatches = findKeywordMatches(message)
  if (keywordMatches.length > 0 && keywordMatches[0].score > 0.6) {
    return createAssistantMessage(messageId, keywordMatches[0].faq)
  }
  
  // 3. Try fuzzy matching
  const fuzzyMatches = findFuzzyMatches(message)
  if (fuzzyMatches.length > 0 && fuzzyMatches[0].score > 0.65) {
    return createAssistantMessage(messageId, fuzzyMatches[0].faq)
  }
  
  // 4. Check for greetings
  const greetingKeywords = ['merhaba', 'selam', 'hey', 'hi', 'hello']
  const normalizedMessage = normalizeText(message)
  if (greetingKeywords.some(keyword => normalizedMessage.includes(keyword))) {
    const welcomeFAQ = CHATBOT_FAQ.find(faq => faq.id === 'welcome')
    if (welcomeFAQ) {
      return createAssistantMessage(messageId, welcomeFAQ)
    }
  }
  
  // 5. Fallback response with suggestions
  return createFallbackMessage(messageId, context)
}

/**
 * Create assistant message from FAQ
 */
function createAssistantMessage(id: string, faq: FAQItem): ChatMessage {
  // Get related questions
  const relatedQuestions = faq.relatedQuestions
    ?.map(id => CHATBOT_FAQ.find(f => f.id === id))
    .filter(Boolean)
    .map(f => f!.question)
    .slice(0, 3)
  
  return {
    id,
    role: 'assistant',
    content: faq.answer,
    timestamp: new Date(),
    action: faq.action,
    relatedQuestions
  }
}

/**
 * Create fallback message when no match found
 */
function createFallbackMessage(id: string, context: ChatContext): ChatMessage {
  const suggestions = getContextSuggestions(context)
  const suggestionsText = suggestions.length > 0
    ? '\n\n💡 Belki şunlardan biri işinize yarar:\n' + 
      suggestions.map((s, i) => `${i + 1}. ${s.question}`).join('\n')
    : ''
  
  return {
    id,
    role: 'assistant',
    content: `🤔 Üzgünüm, bu konuda tam olarak emin olamadım.\n\n📞 Size daha iyi yardımcı olabilmek için:\n• Sorunuzu farklı kelimelerle sorun\n• Destek ekibimizle iletişime geçin\n• Aşağıdaki popüler sorulardan birine bakın${suggestionsText}`,
    timestamp: new Date(),
    relatedQuestions: suggestions.map(s => s.question)
  }
}

/**
 * Get quick reply suggestions
 */
export function getQuickReplies(context: ChatContext): string[] {
  const contextSuggestions = getContextSuggestions(context)
  
  if (contextSuggestions.length > 0) {
    return contextSuggestions.map(s => s.question)
  }
  
  // Default quick replies
  return [
    'İlan nasıl veririm?',
    'Ücretsiz mi?',
    'Nasıl çalışır?',
    'Destek ekibi'
  ]
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('chatbot_history', JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): ChatMessage[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('chatbot_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }
  return []
}

/**
 * Clear chat history
 */
export function clearChatHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('chatbot_history')
  }
}

/**
 * Track chatbot analytics
 */
export function trackChatbotEvent(
  event: 'open' | 'close' | 'message' | 'action_click',
  data?: Record<string, any>
): void {
  if (typeof window !== 'undefined') {
    // Integration with analytics (Google Analytics, Mixpanel, etc.)
    console.log('[Chatbot Analytics]', event, data)
    
    // You can integrate with your analytics service here
    // Example: gtag('event', 'chatbot_' + event, data)
  }
}

