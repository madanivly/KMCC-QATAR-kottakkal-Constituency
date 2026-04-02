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

      // Standard Poster Resolution
      canvas.width = 1080;
      canvas.height = 1350;

      // 1. Fill background white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. DRAW USER PHOTO FIRST (Layered behind the frame)
      // These coordinates center the photo inside the white frame area
      const photoWidth = 360;  
      const photoHeight = 440; 
      const photoCenterX = 285; 
      const photoCenterY = 705; 

      const drawX = photoCenterX - photoWidth / 2;
      const drawY = photoCenterY - photoHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, photoWidth, photoHeight);

      // 3. DRAW POSTER TEMPLATE ON TOP
      // This will cover the edges of the photo for a clean look
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 4. DRAW TEXT (Below the frame)
      const textCenterX = 285; 
      const textCenterY = 960; // Adjusted to be clearly below the frame
      const displayName = name.trim() || "YOUR NAME";

      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 32pt 'Arial Black', Gadget, sans-serif";
      
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-2">
        
        {/* Editor Panel */}
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-black text-slate-900 mb-6">POSTER EDITOR</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">FullName</label>
              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            {imageSrc && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Adjust Position</label>
                <div className="relative w-full h-80 bg-slate-900 rounded-3xl overflow-hidden ring-4 ring-slate-50">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={360 / 440}
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
              className="w-full bg-blue-600 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all transform active:scale-95"
            >
              {isGenerating ? "GENERATING..." : "GENERATE POSTER"}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col">
          <div className="sticky top-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Final Preview</h2>
            {!finalImage ? (
              <div className="aspect-[1080/1350] w-full bg-white rounded-[2rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">🖼️</div>
                <p className="font-medium">Your poster will appear here after generation.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <img
                  src={finalImage}
                  alt="Poster Preview"
                  className="w-full rounded-[2rem] shadow-2xl border-8 border-white"
                />
                <button
                  onClick={handleDownload}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black shadow-lg transition-all"
                >
                  DOWNLOAD POSTER
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
