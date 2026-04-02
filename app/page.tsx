"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

// ==========================================================
// ADJUST THESE VALUES MANUALLY TO POSITION YOUR CONTENT
// ==========================================================
const POSITION_SETTINGS = {
  photoWidth: 360,    
  photoHeight: 480,   
  photoX: 883.2815,        // <--- H Value (Horizontal)
  photoY: 709.4579
  textX: 883.2452,         // <--- H Value for Name
  textY: 989.9445,        // <--- V Value for Name
  fontSize: 30,       
  fontColor: "#000000"
};
// ==========================================================

type Area = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas error");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL("image/png");
}

export default function PosterPage() {
  const [name, setName] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const posterSrc = useMemo(() => "/poster.png", []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result?.toString() || null);
      setFinalImage(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsGenerating(true);

      const croppedPhotoData = await getCroppedImg(imageSrc, croppedAreaPixels);
      const userImage = await createImage(croppedPhotoData);
      const posterOverlay = await createImage(posterSrc);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      canvas.width = 1080;
      canvas.height = 1350;

      // 1. White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw User Photo (Behind Frame)
      const drawX = POSITION_SETTINGS.photoX - POSITION_SETTINGS.photoWidth / 2;
      const drawY = POSITION_SETTINGS.photoY - POSITION_SETTINGS.photoHeight / 2;
      ctx.drawImage(userImage, drawX, drawY, POSITION_SETTINGS.photoWidth, POSITION_SETTINGS.photoHeight);

      // 3. Draw Template (Frame)
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 4. Draw Name
      ctx.fillStyle = POSITION_SETTINGS.fontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${POSITION_SETTINGS.fontSize}pt 'Arial Black', sans-serif`;
      ctx.fillText(name.trim() || "YOUR NAME", POSITION_SETTINGS.textX, POSITION_SETTINGS.textY);

      setFinalImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
      alert("Error generating poster.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-black mb-6">POSTER EDITOR</h1>
          <div className="space-y-6">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />
            <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500" />
            
            {imageSrc && (
              <div className="space-y-4">
                <div className="relative w-full h-80 bg-black rounded-3xl overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={POSITION_SETTINGS.photoWidth / POSITION_SETTINGS.photoHeight}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!imageSrc || isGenerating}
              className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700"
            >
              {isGenerating ? "GENERATING..." : "GENERATE POSTER"}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="sticky top-10 w-full max-w-[450px]">
            <h2 className="text-lg font-bold mb-4 px-2">Preview</h2>
            {!finalImage ? (
              <div className="aspect-[1080/1350] bg-white rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                Generate to see result
              </div>
            ) : (
              <div className="space-y-4">
                <img src={finalImage} alt="Result" className="w-full rounded-3xl shadow-2xl border-4 border-white" />
                <button 
                  onClick={() => { const link = document.createElement("a"); link.href = finalImage; link.download = "poster.png"; link.click(); }} 
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold"
                >
                  DOWNLOAD
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
