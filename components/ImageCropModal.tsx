'use client';

import { useState, useEffect, ReactElement } from 'react';
import { Camera, ZoomIn, ZoomOut } from 'lucide-react';
import Modal from './Modal';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (croppedFile: File) => void;
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
}: ImageCropModalProps): ReactElement {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Calculate standard fitted image size inside the 256x256 circular frame
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const imgRatio = img.width / img.height;
      let width = 256;
      let height = 256;
      if (imgRatio > 1) {
        width = 256 * imgRatio;
      } else {
        height = 256 / imgRatio;
      }
      setImageSize({ width, height });
    };
  }, [imageSrc]);

  // Reset coordinates on open/source changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - startCoords.x;
    const dy = e.clientY - startCoords.y;
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
    setStartCoords({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startCoords.x;
    const dy = e.touches[0].clientY - startCoords.y;
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
    setStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleSaveCrop = () => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw solid white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 300, 300);

      // Scale matrix to match high-resolution output from displayed 256x256 dimensions
      const canvasScale = 300 / 256;
      
      const drawWidth = imageSize.width * zoom * canvasScale;
      const drawHeight = imageSize.height * zoom * canvasScale;
      
      const x = ((256 - imageSize.width * zoom) / 2 + position.x) * canvasScale;
      const y = ((256 - imageSize.height * zoom) / 2 + position.y) * canvasScale;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped_avatar.png', { type: 'image/png' });
          onSave(croppedFile);
        }
      }, 'image/png');
    };
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      <Camera size={18} className="text-[#001A72]" />
      <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Edit Headshot Framing</span>
    </div>
  );

  const modalFooter = (
    <div className="flex w-full gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition duration-200"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSaveCrop}
        className="flex-1 py-3 rounded-xl bg-[#001A72] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#001A72]/90 shadow-md shadow-[#001A72]/5 transition duration-200"
      >
        Save & Upload
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="sm"
      dismissable={true}
      showCloseButton={true}
      footer={modalFooter}
    >
      <div className="flex flex-col items-center justify-center space-y-5 py-2">
        {/* Alignment viewport circular wrapper */}
        <div
          className="w-64 h-64 relative overflow-hidden rounded-full border-4 border-gray-50 bg-gray-50 flex items-center justify-center cursor-move select-none shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Crop Target Preview"
            draggable={false}
            className="max-w-none pointer-events-none select-none"
            style={{
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
          />
          {/* Dashboard Gold active targeting bounds ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#FFB81C]/40 pointer-events-none" />
        </div>
        
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider text-center">
          Drag image to align · Scroll or use slider to zoom
        </p>

        {/* Dynamic Zoom Control */}
        <div className="w-full space-y-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-1"><ZoomOut size={10} /> Scale</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut size={12} className="text-gray-400 shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#001A72]"
            />
            <ZoomIn size={12} className="text-[#001A72] shrink-0" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
