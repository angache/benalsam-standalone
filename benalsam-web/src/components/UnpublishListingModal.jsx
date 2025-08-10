import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const UnpublishListingModal = ({ isOpen, onOpenChange, onConfirm, isProcessing }) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    { value: 'Sattım', label: 'Ürünü sattım' },
    { value: 'Vazgeçtim', label: 'Satmaktan vazgeçtim' },
    { value: 'Diğer', label: 'Diğer' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setOtherReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const finalReason = reason === 'Diğer' ? otherReason.trim() : reason;
    if (!finalReason) return;
    
    const status = reason === 'Sattım' ? 'sold' : 'inactive';
    onConfirm(status, finalReason);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-effect">
        <DialogHeader>
          <DialogTitle>İlanı Yayından Kaldır</DialogTitle>
          <DialogDescription>
            İlanınızı neden yayından kaldırdığınızı belirtin. Bu bilgi, deneyiminizi iyileştirmemize yardımcı olur.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Neden
            </Label>
            <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="col-span-3 bg-input border-border">
                    <SelectValue placeholder="Bir neden seçin..." />
                </SelectTrigger>
                <SelectContent>
                    {reasons.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          {reason === 'Diğer' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="other-reason" className="text-right">
                Detay
              </Label>
              <Textarea
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="col-span-3 bg-input border-border"
                placeholder="Lütfen nedeninizi belirtin..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>İptal</Button>
          <Button onClick={handleConfirm} disabled={!reason || (reason === 'Diğer' && !otherReason.trim()) || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'İşleniyor...' : 'Onayla ve Kaldır'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnpublishListingModal;