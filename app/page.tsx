"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

// ==========================================================
// MANUAL POSITION SETTINGS (Adjusted +16.8889 Right, +62.8147 Down)
// ==========================================================
const POSITION_SETTINGS = {
  photoWidth: 350,    
  photoHeight: 450,   
  photoX: 307.8889,   // New H Position
  photoY: 951.8147,   // New V Position

  textX: 307.8889,    // Aligned with photo center
  textY: 1226.8147,   // Adjusted down to maintain spacing below photo
  fontSize: 34,       
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

export default function Page() {
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
      if (!ctx) throw new Error("Canvas context error");

      canvas.width = 1080;
      canvas.height = 1350;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Photo Layer (Behind)
      const drawX = POSITION_SETTINGS.photoX - POSITION_SETTINGS.photoWidth / 2;
      const drawY = POSITION_SETTINGS.photoY - POSITION_SETTINGS.photoHeight / 2;
      ctx.drawImage(userImage, drawX, drawY, POSITION_SETTINGS.photoWidth, POSITION_SETTINGS.photoHeight);

      // Poster Layer (On Top)
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // Name Layer
      ctx.fillStyle = POSITION_SETTINGS.fontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${POSITION_SETTINGS.fontSize}pt 'Arial Black', sans-serif`;
      ctx.fillText(name.trim() || "YOUR NAME", POSITION_SETTINGS.textX, POSITION_SETTINGS.textY);

      setFinalImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
      alert("Could not generate poster.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "poster.png";
    link.click();
  };

  const shareNative = async () => {
    if (!finalImage) return;
    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();
      const file = new File([blob], "poster.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Poster", text: "We support from Qatar", files: [file] });
      } else {
        alert("Share works only on supported mobile devices/browsers.");
      }
    } catch (error) {
      alert("Could not open share dialog.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2ee] py-10 px-4">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center text-[#1f2d24]">Generate Poster</h1>
          <p className="text-center text-gray-600 mt-2">Type name, upload photo, crop it, then generate.</p>

          <div className="mt-6">
            <label className="block text-sm font-semibold mb-2">Type Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold mb-2">Upload Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full border rounded-2xl p-3" />
          </div>

          {imageSrc && (
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">Crop Photo</label>
              <div className="relative w-full h-[420px] bg-black rounded-2xl overflow-hidden">
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
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">Zoom</label>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={!imageSrc || isGenerating}
                className="flex-1 bg-green-700 text-white rounded-2xl py-3 font-bold hover:bg-green-800 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Poster"}
              </button>
              <button onClick={handleDownload} disabled={!finalImage} className="flex-1 bg-gray-900 text-white rounded-2xl py-3 font-bold disabled:opacity-50">
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-4">Preview</h2>
          {!finalImage ? (
            <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-slate-400 text-center p-8">
              Final poster preview will appear here
            </div>
          ) : (
            <div className="space-y-4">
              <img src={finalImage} alt="Final poster" className="w-full rounded-2xl shadow-lg border-4 border-white" />
              <button onClick={shareNative} className="w-full bg-slate-700 text-white py-3 rounded-2xl font-bold hover:bg-slate-800">
                Share
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
