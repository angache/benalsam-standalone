/**
 * Similarity Utility Functions
 * 
 * Ortak benzerlik hesaplama fonksiyonları
 */

export interface SimilarityOptions {
  threshold?: number;
  caseSensitive?: boolean;
  normalize?: boolean;
}

/**
 * Text normalization utility
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Calculate similarity between two strings
 */
export const calculateSimilarity = (text1: string, text2: string, options: SimilarityOptions = {}): number => {
  const {
    threshold = 0.8,
    caseSensitive = false,
    normalize = true
  } = options;

  let str1 = text1;
  let str2 = text2;

  if (!caseSensitive) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }

  if (normalize) {
    str1 = normalizeText(str1);
    str2 = normalizeText(str2);
  }

  // Simple Levenshtein distance based similarity
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return maxLength > 0 ? 1 - (distance / maxLength) : 0;
};

/**
 * Find similar items in a collection
 */
export const findSimilarItems = <T>(
  items: T[],
  targetText: string,
  textExtractor: (item: T) => string,
  options: SimilarityOptions = {}
): Array<{ item: T; similarity: number }> => {
  const { threshold = 0.8 } = options;

  return items
    .map(item => ({
      item,
      similarity: calculateSimilarity(targetText, textExtractor(item), options)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
};

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Jaccard similarity for sets
 */
export const calculateJaccardSimilarity = <T>(set1: Set<T>, set2: Set<T>): number => {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Cosine similarity for vectors
 */
export const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
};
