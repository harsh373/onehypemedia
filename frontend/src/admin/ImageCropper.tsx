import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import type { Crop } from "../api/images";

type Props = {
  src: string;
  aspect: number;
  initialCrop?: Crop;
  title?: string;
  onConfirm: (crop: Crop) => void;
  onCancel: () => void;
};

export default function ImageCropper({
  src,
  aspect,
  initialCrop,
  title = "CROP IMAGE",
  onConfirm,
  onCancel,
}: Props) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const handleComplete = useCallback((_area: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  function confirm() {
    if (!area) return;
    onConfirm({
      x: Math.round(area.x),
      y: Math.round(area.y),
      width: Math.round(area.width),
      height: Math.round(area.height),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      <div className="px-4 py-3 text-xs font-semibold tracking-widest text-white">
        {title}{" "}
        <span className="text-neutral-400">
          — drag to move, scroll or use the slider to zoom
        </span>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={position}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setPosition}
          onZoomChange={setZoom}
          onCropComplete={handleComplete}
          initialCroppedAreaPixels={initialCrop}
        />
      </div>

      <div className="flex flex-col gap-4 bg-neutral-900 px-4 py-4 sm:flex-row sm:items-center">
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="flex-1"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border border-neutral-600 px-5 py-2 text-xs font-semibold tracking-widest text-white"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!area}
            className="bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-950 disabled:opacity-50"
          >
            CONFIRM CROP
          </button>
        </div>
      </div>
    </div>
  );
}