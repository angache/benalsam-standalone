import React from 'react';

const SimpleAISuggestions = ({ 
  query = '', 
  onSuggestionClick = null,
  className = ''
}) => {
  // Basit öneriler
  const suggestions = [
    {
      id: 'trending-1',
      text: 'iPhone 15 Pro',
      type: 'trending',
      score: 0.95
    },
    {
      id: 'trending-2',
      text: 'MacBook Air M2',
      type: 'trending',
      score: 0.92
    },
    {
      id: 'popular-1',
      text: 'Araba',
      type: 'popular',
      score: 0.88
    },
    {
      id: 'popular-2',
      text: 'Ev',
      type: 'popular',
      score: 0.85
    },
    {
      id: 'popular-3',
      text: 'Telefon',
      type: 'popular',
      score: 0.82
    }
  ];

  // Query'e göre filtrele
  const filteredSuggestions = query 
    ? suggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

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
      default:
        return '💡';
    }
  };

  if (filteredSuggestions.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-lg">🤖</span>
          <p className="mt-1">Henüz öneri bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">AI Önerileri</h3>
      </div>
      <div>
        {filteredSuggestions.slice(0, 8).map((suggestion) => (
          <div
            key={suggestion.id}
            onClick={() => handleSuggestionClick(suggestion)}
            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="font-medium text-gray-900">{suggestion.text}</div>
            </div>
            <div className="text-xs text-gray-400">
              {Math.round(suggestion.score * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleAISuggestions;
