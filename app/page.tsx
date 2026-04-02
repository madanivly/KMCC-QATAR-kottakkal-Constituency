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

  // Path to your base poster (should be image_0.png)
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

      // 1. Load all assets first
      const croppedPhotoData = await getCroppedImg(imageSrc, croppedAreaPixels);
      const userImage = await createImage(croppedPhotoData);
      const posterOverlay = await createImage(posterSrc);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // Set Canvas Resolution (Standard 1080x1350)
      canvas.width = 1080;
      canvas.height = 1350;

      // --- NEW LAYERING LOGIC ---

      // LAYER 1: Draw the Base Poster Image (Image_0.png) FIRST
      // This includes the black rectangle.
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // LAYER 2: Draw User Photo over the Black Space
      // Calculated coordinates for the center of the black cutout area.
      const photoWidth = 370.0;
      const photoHeight = 450.0;
      const photoCenterX = 272.0;
      const photoCenterY = 705.0;

      // Calculate top-left based on center point to fit the space
      const drawX = photoCenterX - photoWidth / 2;
      const drawY = photoCenterY - photoHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, photoWidth, photoHeight);

      // LAYER 3: Draw Text on Top
      const textCenterX = 272.0;
      const textCenterY = 985.0; // Positioned under the photo
      const displayName = name.trim() || "YOUR NAME";

      ctx.fillStyle = "#000000"; // Black color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 30pt is approx 40px
      ctx.font = "900 30pt 'Arial Black', Gadget, sans-serif";
      
      ctx.fillText(displayName, textCenterX, textCenterY);

      setFinalImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
      alert("Error generating poster. Check console for details.");
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2">
        {/* Input Column */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Poster Creator</h1>
            <p className="text-slate-500 mt-1">Customize and download your poster.</p>
          </header>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Photo Upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {imageSrc && (
              <div className="animate-in fade-in duration-500">
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Adjust Crop
                </label>
                <div className="relative w-full h-80 bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={370.0 / 450.0} // Aspect ratio for the cutout
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
                  className="w-full mt-4 accent-blue-600"
                />
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={!imageSrc || isGenerating}
                className="flex-1 bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md active:scale-95 transition-all"
              >
                {isGenerating ? "Processing..." : "Generate Poster"}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="flex flex-col items-center">
          <div className="sticky top-12 w-full">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Preview</h2>
            {!finalImage ? (
              <div className="aspect-[4/5] w-full rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 p-12 text-center">
                Your generated poster will appear here
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <img
                  src={finalImage}
                  alt="Final Result"
                  className="w-full rounded-3xl shadow-2xl ring-8 ring-white"
                />
                <button
                  onClick={handleDownload}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black shadow-lg flex items-center justify-center gap-2"
                >
                  Download Result
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
