import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import ComponentErrorBoundary from './ComponentErrorBoundary';

// Hata fırlatan test bileşeni
const BuggyComponent = ({ shouldThrow = false }) => {
  const [count, setCount] = useState(0);

  if (shouldThrow) {
    throw new Error('Bu bir test hatasıdır! 🐛');
  }

  if (count > 5) {
    throw new Error('Sayaç 5\'i geçti! 💥');
  }

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-2">Test Bileşeni</h3>
      <p className="mb-4">Sayaç: {count}</p>
      <div className="space-x-2">
        <Button 
          onClick={() => setCount(count + 1)}
          variant="outline"
          size="sm"
        >
          Artır
        </Button>
        <Button 
          onClick={() => setCount(0)}
          variant="outline"
          size="sm"
        >
          Sıfırla
        </Button>
      </div>
    </div>
  );
};

// Test sayfası bileşeni
const ErrorTestComponent = () => {
  const [showBuggy, setShowBuggy] = useState(false);
  const [throwImmediate, setThrowImmediate] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-yellow-800 mb-2">
          Error Boundary Test Sayfası
        </h2>
        <p className="text-yellow-700 mb-4">
          Bu sayfa error boundary'lerin düzgün çalışıp çalışmadığını test etmek için oluşturulmuştur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Normal bileşen */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Normal Bileşen</h3>
          <BuggyComponent />
        </div>

        {/* Error boundary ile sarılmış bileşen */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Error Boundary ile Sarılmış</h3>
          <ComponentErrorBoundary componentName="Test Bileşeni">
            <BuggyComponent />
          </ComponentErrorBoundary>
        </div>

        {/* Hata fırlatan bileşen */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Hata Fırlatan Bileşen</h3>
          <ComponentErrorBoundary componentName="Hatalı Bileşen">
            <BuggyComponent shouldThrow={true} />
          </ComponentErrorBoundary>
        </div>

        {/* Koşullu hata fırlatan bileşen */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Koşullu Hata</h3>
          <ComponentErrorBoundary componentName="Koşullu Hatalı Bileşen">
            <BuggyComponent />
          </ComponentErrorBoundary>
        </div>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Test Kontrolleri</h3>
        <div className="space-y-2">
          <Button 
            onClick={() => setShowBuggy(!showBuggy)}
            variant="outline"
          >
            {showBuggy ? 'Hatalı Bileşeni Gizle' : 'Hatalı Bileşeni Göster'}
          </Button>
          
          <Button 
            onClick={() => setThrowImmediate(!throwImmediate)}
            variant="outline"
            className="ml-2"
          >
            Anında Hata Fırlat
          </Button>
        </div>

        {showBuggy && (
          <div className="mt-4">
            <ComponentErrorBoundary componentName="Dinamik Hatalı Bileşen">
              <BuggyComponent shouldThrow={throwImmediate} />
            </ComponentErrorBoundary>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Test Senaryoları</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Normal bileşen çalışmalı</li>
          <li>Error boundary hataları yakalamalı</li>
          <li>Retry butonu çalışmalı</li>
          <li>Reset butonu çalışmalı</li>
          <li>Development modunda hata detayları görünmeli</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorTestComponent; 