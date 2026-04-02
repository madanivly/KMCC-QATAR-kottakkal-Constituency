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

  // Ensure your template is named poster.png in the /public folder
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

      // Set Poster Resolution (matching image_0.png aspect)
      canvas.width = 1080;
      canvas.height = 1350;

      // 1. Draw the base poster first (This puts the template in the background)
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 2. Draw User Photo over the black area on the LEFT
      const photoWidth = 370;
      const photoHeight = 450;
      const photoCenterX = 272; // Left side center
      const photoCenterY = 705; 

      const drawX = photoCenterX - photoWidth / 2;
      const drawY = photoCenterY - photoHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, photoWidth, photoHeight);

      // 3. Draw Name Text UNDER the photo on the LEFT
      const textCenterX = 272; // Matched with photoCenterX to keep it on the left
      const textCenterY = 985;
      const displayName = name.trim() || "YOUR NAME";

      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Font: Arial Black, Size: 30pt (approx 40px)
      ctx.font = "900 30pt 'Arial Black', Gadget, sans-serif";
      
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
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-2">
        
        {/* Editor Side */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10">
          <h1 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">
            Poster Generator
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Name</label>
              <input
                type="text"
                placeholder="Type name here..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {imageSrc && (
              <div className="space-y-4">
                <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden shadow-inner">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={370 / 450}
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
              className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isGenerating ? "Generating..." : "Generate Final Poster"}
            </button>
          </div>
        </div>

        {/* Preview Side */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[400px] sticky top-10">
            <h2 className="text-lg font-bold text-slate-700 mb-4">Final Result</h2>
            {!finalImage ? (
              <div className="aspect-[1080/1350] w-full bg-white rounded-3xl border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-center p-10">
                Preview will appear here after clicking generate
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={finalImage}
                  alt="Poster Preview"
                  className="w-full rounded-3xl shadow-2xl border-4 border-white"
                />
                <button
                  onClick={handleDownload}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Download Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
