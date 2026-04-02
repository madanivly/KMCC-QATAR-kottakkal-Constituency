"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

// ==========================================================
// MANUAL POSITIONING SETTINGS
// Adjust these numbers to move things around
// ==========================================================
const POSITION_SETTINGS = {
  // PHOTO FRAME SETTINGS
  photoWidth: 350,    // Width of the photo
  photoHeight: 450,   // Height of the photo
  photoX: 272,        // HORIZONTAL (H): 272 is the center of the left frame
  photoY: 715,        // VERTICAL (V): 715 is the center of the frame area

  // NAME SETTINGS
  textX: 272,         // HORIZONTAL (H): Keep same as photoX to stay centered
  textY: 990,         // VERTICAL (V): Positioned in the white area below photo
  fontSize: 34,       // Font size in points
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

      // High Resolution Template Size
      canvas.width = 1080;
      canvas.height = 1350;

      // 1. CLEAR CANVAS & DRAW BACKGROUND
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. DRAW PHOTO FIRST (Behind the frame)
      const drawX = POSITION_SETTINGS.photoX - POSITION_SETTINGS.photoWidth / 2;
      const drawY = POSITION_SETTINGS.photoY - POSITION_SETTINGS.photoHeight / 2;
      ctx.drawImage(userImage, drawX, drawY, POSITION_SETTINGS.photoWidth, POSITION_SETTINGS.photoHeight);

      // 3. DRAW POSTER TEMPLATE SECOND (Over the photo)
      // This ensures the colorful border hides the edges of the user's photo
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 4. DRAW NAME LAST
      ctx.fillStyle = POSITION_SETTINGS.fontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${POSITION_SETTINGS.fontSize}pt 'Arial Black', Gadget, sans-serif`;
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
        
        {/* Editor Section */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
          <h1 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">POSTER GENERATOR</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">FullName</label>
              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white transition-all outline-none"
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
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative w-full h-80 bg-slate-900 rounded-3xl overflow-hidden shadow-inner">
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
              className="w-full bg-blue-600 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isGenerating ? "GENERATING..." : "GENERATE POSTER"}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center">
          <div className="sticky top-10 w-full max-w-[420px]">
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-2 tracking-tight">Final Result</h2>
            {!finalImage ? (
              <div className="aspect-[1080/1350] w-full bg-white rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 p-10 text-center">
                <p className="font-medium">The generated poster will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <img
                  src={finalImage}
                  alt="Final Poster"
                  className="w-full rounded-[2.5rem] shadow-2xl border-8 border-white"
                />
                <button
                  onClick={() => { const link = document.createElement("a"); link.href = finalImage; link.download = "poster.png"; link.click(); }}
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
