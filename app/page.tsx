"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context not available");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

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
    if (!imageSrc || !croppedAreaPixels) {
      alert("Please upload and crop a photo first.");
      return;
    }

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

      // 1. White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. USER PHOTO (Adjusted Y to go further down)
      const photoWidth = 360;  
      const photoHeight = 480; // Increased height slightly to fill space
      const photoCenterX = 285; 
      const photoCenterY = 760; // Moved down from 705

      const drawX = photoCenterX - photoWidth / 2;
      const drawY = photoCenterY - photoHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, photoWidth, photoHeight);

      // 3. POSTER TEMPLATE (Drawn on top to frame the photo)
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 4. TEXT (Adjusted Y to go further down under the frame)
      const textCenterX = 285; 
      const textCenterY = 1060; // Moved down from 960
      const displayName = name.trim() || "YOUR NAME";

      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 34pt 'Arial Black', Gadget, sans-serif";
      
      ctx.fillText(displayName, textCenterX, textCenterY);

      setFinalImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
      alert("Error generating poster.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = `poster-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-2">
        
        {/* Settings */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">POSTER GENERATOR</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">FullName</label>
              <input
                type="text"
                placeholder="Enter Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-bold"
              />
            </div>

            {imageSrc && (
              <div className="space-y-4">
                <div className="relative w-full h-80 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={360 / 480}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!imageSrc || isGenerating}
              className="w-full bg-blue-600 text-white rounded-2xl py-5 font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isGenerating ? "GENERATING..." : "GENERATE POSTER"}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div className="sticky top-10 w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Preview</h2>
            {!finalImage ? (
              <div className="aspect-[1080/1350] w-full bg-white rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 p-10 text-center">
                Poster Preview will appear here.
              </div>
            ) : (
              <div className="space-y-6">
                <img
                  src={finalImage}
                  alt="Final Poster"
                  className="w-full rounded-3xl shadow-2xl border-8 border-white"
                />
                <button
                  onClick={handleDownload}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black"
                >
                  DOWNLOAD PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
