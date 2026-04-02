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

    if (!ctx) throw new Error("Canvas context not available");

    // Standard Poster Size (adjust if your base template is different)
    canvas.width = 1080;
    canvas.height = 1350;

    // 1. Background Fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Cropped Photo
    // Position: 883.24... is likely your center point or a specific anchor.
    // Based on your dimensions: 367x448
    const photoWidth = 367;
    const photoHeight = 448;
    
    // We calculate X/Y so that the CENTER of the photo is at your coordinate
    // or use it as the top-left depending on your design intent.
    // Assuming 883.24 / 709.45 is the TOP-LEFT of the photo frame:
    const photoX = 883; 
    const photoY = 709;

    ctx.drawImage(userImage, photoX, photoY, photoWidth, photoHeight);

    // 3. Draw Poster Frame (Overlay)
    ctx.drawImage(posterImage, 0, 0, canvas.width, canvas.height);

    // 4. Draw Text
    const safeName = name.trim() || "Your Name";
    const textX = 883; // Your provided X
    const textY = 990; // Your provided Y

    ctx.fillStyle = "#000000"; // Black color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // "30pt" is roughly 40px in canvas rendering
    ctx.font = "900 40px 'Arial Black', Gadget, sans-serif"; 
    
    ctx.fillText(safeName, textX, textY);

    const result = canvas.toDataURL("image/png");
    setFinalImage(result);
  } catch (error) {
    console.error(error);
    alert("Generation failed.");
  } finally {
    setIsGenerating(false);
  }
};
