import React from 'react';
import useAISuggestions from '../hooks/useAISuggestions';

const AISuggestions = ({ 
  query = '', 
  categoryId = null, 
  onSuggestionClick = null,
  maxSuggestions = 10,
  showTrending = true,
  showPopular = true,
  className = ''
}) => {
  const {
    suggestions,
    groupedSuggestions,
    isLoading,
    error,
    hasSuggestions
  } = useAISuggestions(query, categoryId);

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'trending':
        return '🔥';
      case 'popular':
        return '⭐';
      case 'category':
        return '📂';
      case 'search':
        return '🔍';
      default:
        return '💡';
    }
  };

  const getSuggestionBadge = (suggestion) => {
    if (suggestion.metadata?.trending) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Trending
        </span>
      );
    }
    
    if (suggestion.metadata?.searchCount) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {suggestion.metadata.searchCount} arama
        </span>
      );
    }

    return null;
  };

  const renderSuggestionItem = (suggestion) => (
    <div
      key={suggestion.id}
      onClick={() => handleSuggestionClick(suggestion)}
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{suggestion.text}</div>
          {suggestion.category && (
            <div className="text-sm text-gray-500">
              {suggestion.category.name}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {getSuggestionBadge(suggestion)}
        <div className="text-xs text-gray-400">
          {Math.round(suggestion.score * 100)}%
        </div>
      </div>
    </div>
  );

  const renderSuggestionsSection = (title, suggestions, icon) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2 px-3 py-2 bg-gray-50 rounded-t-lg">
          <span className="text-lg">{icon}</span>
          <h3 className="font-medium text-gray-700">{title}</h3>
          <span className="text-xs text-gray-500">({suggestions.length})</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden">
          {suggestions.slice(0, maxSuggestions).map(renderSuggestionItem)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">AI önerileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-600">⚠️</span>
          <span className="text-red-700">Öneriler yüklenirken hata oluştu</span>
        </div>
      </div>
    );
  }

  if (!hasSuggestions) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-lg">🤖</span>
          <p className="mt-1">Henüz öneri bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Trending Suggestions */}
      {showTrending && groupedSuggestions.trending.length > 0 && 
        renderSuggestionsSection(
          'Trending Öneriler', 
          groupedSuggestions.trending, 
          '🔥'
        )
      }

      {/* Popular Suggestions */}
      {showPopular && groupedSuggestions.popular.length > 0 && 
        renderSuggestionsSection(
          'Popüler Aramalar', 
          groupedSuggestions.popular, 
          '⭐'
        )
      }

      {/* Category Suggestions */}
      {groupedSuggestions.category.length > 0 && 
        renderSuggestionsSection(
          'Kategori Önerileri', 
          groupedSuggestions.category, 
          '📂'
        )
      }

      {/* Search Suggestions */}
      {groupedSuggestions.search.length > 0 && 
        renderSuggestionsSection(
          'Arama Önerileri', 
          groupedSuggestions.search, 
          '🔍'
        )
      }

      {/* General Suggestions (if no specific type) */}
      {suggestions.filter(s => !groupedSuggestions.trending.includes(s) && 
                               !groupedSuggestions.popular.includes(s) && 
                               !groupedSuggestions.category.includes(s) && 
                               !groupedSuggestions.search.includes(s)).length > 0 && 
        renderSuggestionsSection(
          'AI Önerileri', 
          suggestions.filter(s => !groupedSuggestions.trending.includes(s) && 
                                   !groupedSuggestions.popular.includes(s) && 
                                   !groupedSuggestions.category.includes(s) && 
                                   !groupedSuggestions.search.includes(s)), 
          '🤖'
        )
      }
    </div>
  );
};

export default AISuggestions;
