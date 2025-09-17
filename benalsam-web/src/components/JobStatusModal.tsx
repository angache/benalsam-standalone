import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JobStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobStatus: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
  } | null;
  isPolling: boolean;
  attempts: number;
  onCancel?: () => void;
  title?: string;
}

export const JobStatusModal: React.FC<JobStatusModalProps> = ({
  isOpen,
  onClose,
  jobStatus,
  isPolling,
  attempts,
  onCancel,
  title = "İlan Oluşturuluyor"
}) => {
  const getStatusIcon = () => {
    if (!jobStatus) return <Clock className="h-6 w-6 text-blue-500" />;
    
    switch (jobStatus.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!jobStatus) return "Başlatılıyor...";
    
    switch (jobStatus.status) {
      case 'completed':
        return "İlan başarıyla oluşturuldu!";
      case 'failed':
        return "İlan oluşturulamadı";
      case 'processing':
        return "İlan işleniyor...";
      default:
        return "Bekleniyor...";
    }
  };

  const getStatusColor = () => {
    if (!jobStatus) return "text-blue-600";
    
    switch (jobStatus.status) {
      case 'completed':
        return "text-green-600";
      case 'failed':
        return "text-red-600";
      case 'processing':
        return "text-blue-600";
      default:
        return "text-blue-600";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status Icon and Text */}
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <span className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>

              {/* Progress Bar */}
              {jobStatus && jobStatus.status !== 'completed' && jobStatus.status !== 'failed' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>İlerleme</span>
                    <span>{jobStatus.progress}%</span>
                  </div>
                  <Progress value={jobStatus.progress} className="h-2" />
                </div>
              )}

              {/* Polling Info */}
              {isPolling && (
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Durum kontrol ediliyor... (Deneme: {attempts})</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {jobStatus?.status === 'failed' && jobStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{jobStatus.error}</p>
                </div>
              )}

              {/* Success Message */}
              {jobStatus?.status === 'completed' && jobStatus.result && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    İlan başarıyla oluşturuldu! ID: {jobStatus.result.id}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {jobStatus?.status === 'completed' && (
                  <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                    Tamam
                  </Button>
                )}
                
                {jobStatus?.status === 'failed' && (
                  <Button onClick={onClose} variant="outline">
                    Kapat
                  </Button>
                )}
                
                {isPolling && onCancel && (
                  <Button onClick={onCancel} variant="outline">
                    İptal Et
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
