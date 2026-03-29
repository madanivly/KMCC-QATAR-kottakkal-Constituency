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

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

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

export default function Page() {
  const [name, setName] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const posterSrc = useMemo(() => "/Poster.png", []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || null;
      setImageSrc(result);
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

      const croppedPhoto = await getCroppedImg(imageSrc, croppedAreaPixels);
      const userImage = await createImage(croppedPhoto);
      const posterImage = await createImage(posterSrc);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      canvas.width = 1080;
      canvas.height = 1350;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Change these values to match your poster design
      const photoX = 90;
      const photoY = 170;
      const photoWidth = 900;
      const photoHeight = 900;

      ctx.drawImage(userImage, photoX, photoY, photoWidth, photoHeight);
      ctx.drawImage(posterImage, 0, 0, canvas.width, canvas.height);

      const safeName = name.trim() || "Your Name";

      // Change text style and position to match your poster
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 54px Arial";
      ctx.fillText(safeName, canvas.width / 2, 1210);

      const result = canvas.toDataURL("image/png");
      setFinalImage(result);
    } catch (error) {
      console.error(error);
      alert("Could not generate poster. Check that /public/poster.png exists.");
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

  const shareWhatsApp = () => {
    if (!finalImage) return;

    const text = "Check out my poster!";
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareFacebook = () => {
    if (!finalImage) return;

    const url = window.location.href;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, "_blank");
  };

  const shareInstagram = () => {
    if (!finalImage) return;
    alert("Instagram direct share is not supported from browser. Please download the image and upload it manually in Instagram.");
  };

  const shareNative = async () => {
    if (!finalImage) return;

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();
      const file = new File([blob], "poster.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My Poster",
          text: "Check out my poster!",
          files: [file],
        });
      } else {
        alert("Native sharing is not supported on this device/browser.");
      }
    } catch (error) {
      console.error(error);
      alert("Could not open share dialog.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2ee] py-10 px-4">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center text-[#1f2d24]">
            Generate Poster
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Type name, upload photo, crop it, then generate your poster.
          </p>

          <div className="mt-6">
            <label className="block text-sm font-semibold mb-2">
              Type Name
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold mb-2">
              Upload Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full border rounded-2xl p-3"
            />
          </div>

          {imageSrc && (
            <>
              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Crop Photo
                </label>

                <div className="relative w-full h-[420px] bg-black rounded-2xl overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
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

              <button
                onClick={handleDownload}
                disabled={!finalImage}
                className="flex-1 bg-gray-900 text-white rounded-2xl py-3 font-bold hover:bg-black disabled:opacity-50"
              >
                Download
              </button>
            </div>

            {finalImage && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={shareWhatsApp}
                    className="bg-green-500 text-white py-2 rounded-xl font-semibold hover:opacity-90"
                  >
                    WhatsApp
                  </button>

                  <button
                    onClick={shareFacebook}
                    className="bg-blue-600 text-white py-2 rounded-xl font-semibold hover:opacity-90"
                  >
                    Facebook
                  </button>

                  <button
                    onClick={shareInstagram}
                    className="bg-pink-500 text-white py-2 rounded-xl font-semibold hover:opacity-90"
                  >
                    Instagram
                  </button>
                </div>

                <button
                  onClick={shareNative}
                  className="w-full bg-slate-700 text-white py-3 rounded-2xl font-bold hover:bg-slate-800"
                >
                  Share (Mobile)
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-4">Preview</h2>

          {!finalImage ? (
            <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-center p-8">
              Final poster preview will appear here
            </div>
          ) : (
            <img
              src={finalImage}
              alt="Final poster"
              className="w-full rounded-2xl shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}