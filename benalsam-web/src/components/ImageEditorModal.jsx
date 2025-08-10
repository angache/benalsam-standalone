import React, { useState, useRef } from 'react';
    import Cropper from 'react-cropper';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';
    import { blobToFile } from '@/lib/imageUtils';
    
    const ImageEditorModal = ({ isOpen, onOpenChange, image, onSave }) => {
      const [cropper, setCropper] = useState();
      const cropperRef = useRef(null);
    
      const handleSave = () => {
        if (typeof cropper !== 'undefined') {
          cropper.getCroppedCanvas().toBlob((blob) => {
            const file = blobToFile(blob, image.name);
            onSave(file);
            onOpenChange(false);
          }, 'image/jpeg', 0.9);
        }
      };
    
      const handleRotate = () => {
        if (cropper) {
          cropper.rotate(90);
        }
      };
    
      const handleZoom = (ratio) => {
        if (cropper) {
          cropper.zoom(ratio);
        }
      };
    
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Görseli Düzenle</DialogTitle>
            </DialogHeader>
            <div className="h-[450px] w-full bg-muted mt-4">
              <Cropper
                ref={cropperRef}
                src={image?.preview}
                style={{ height: '100%', width: '100%' }}
                initialAspectRatio={1}
                viewMode={1}
                guides={true}
                background={false}
                responsive={true}
                autoCropArea={1}
                checkOrientation={false}
                onInitialized={(instance) => {
                  setCropper(instance);
                }}
              />
            </div>
            <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-between w-full">
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-0">
                <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)} title="Yakınlaştır">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)} title="Uzaklaştır">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRotate} title="Döndür">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  <Check className="h-4 w-4 mr-2" /> Kaydet
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };
    
    export default ImageEditorModal;