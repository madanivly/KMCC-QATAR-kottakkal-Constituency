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

      // 1. Draw Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Photo Layer (Positioned inside the left frame)
      const photoWidth = 370;
      const photoHeight = 450;
      const photoCenterX = 272; // Adjusted for left-side placement
      const photoCenterY = 705; 

      const drawX = photoCenterX - photoWidth / 2;
      const drawY = photoCenterY - photoHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, photoWidth, photoHeight);

      // 3. Poster Overlay (The frame)
      ctx.drawImage(posterOverlay, 0, 0, canvas.width, canvas.height);

      // 4. Text Layer (Centered under the frame)
      const textCenterX = 272; 
      const textCenterY = 985;
      const displayName = name.trim() || "YOUR NAME";

      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 30pt 'Arial Black', Gadget, sans-serif";
      
      ctx.fillText(displayName, textCenterX, textCenterY);

      setFinalImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };
