import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmptyState = ({ selectedStatus, statusConfig, onCreateClick }) => {
  return (
    <div className="text-center py-20 glass-effect rounded-2xl">
      <FileText className="w-20 h-20 text-primary mx-auto mb-6" />
      <h2 className="text-2xl font-semibold text-foreground mb-3">
        {selectedStatus === 'all' ? 'Henüz ilan oluşturmamışsınız' : `${statusConfig[selectedStatus].label} ilan bulunamadı`}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {selectedStatus === 'all' 
          ? 'İlk ilanınızı oluşturarak takas yapmaya başlayın!'
          : 'Bu durumda ilan bulunmuyor. Farklı bir filtre deneyin.'
        }
      </p>
      {selectedStatus === 'all' && (
        <Button onClick={onCreateClick} className="btn-primary text-primary-foreground px-8 py-3 text-lg">
          <Plus className="w-5 h-5 mr-2" />
          İlk İlanını Oluştur
        </Button>
      )}
    </div>
  );
};

export default EmptyState;