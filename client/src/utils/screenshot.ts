import html2canvas from "html2canvas";

interface HighlightBox {
  boundingBox: DOMRect;
  label: string;
  id: string;
}

export const takeScreenshot = async (
  element: HTMLElement = document.body,
  highlightElements?: HighlightBox[]
): Promise<string> => {
  try {
    // Calculate full page dimensions
    const scale = 1;
    const fullHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
    
    // Use viewport width but full height
    const viewportWidth = window.innerWidth;

    // Store original scroll position
    const originalScrollPos = {
      x: window.scrollX,
      y: window.scrollY
    };

    // Take the initial screenshot without modifications
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      allowTaint: true,
      scale,
      backgroundColor: '#ffffff',
      width: viewportWidth,
      height: fullHeight,
      windowWidth: viewportWidth, // Keep original viewport width
      windowHeight: window.innerHeight, // Keep original viewport height
      scrollX: -window.scrollX, // Adjust for scroll position
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // Fix any fixed position elements
        const fixed = clonedDoc.getElementsByClassName("fixed");
        Array.from(fixed).forEach((el) => {
          (el as HTMLElement).style.position = "absolute";
        });
      },
    });

    // If we have elements to highlight, draw them on the canvas
    if (highlightElements) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas.toDataURL("image/png");

      highlightElements.forEach(({ boundingBox, id }) => {
        // Calculate absolute position (relative to document, not viewport)
        const rect = {
          left: boundingBox.left,
          top: boundingBox.top,
          width: boundingBox.width,
          height: boundingBox.height
        };

        // Draw rectangle
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          rect.left,
          rect.top,
          rect.width,
          rect.height
        );

        // Draw label background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = '12px sans-serif';
        const labelMetrics = ctx.measureText(id);
        const labelHeight = 20;
        const labelPadding = 6;
        const labelY = Math.max(rect.top - labelHeight - 4, 0);
        
        ctx.fillRect(
          rect.left,
          labelY,
          labelMetrics.width + (labelPadding * 2),
          labelHeight
        );

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.fillText(
          id,
          rect.left + labelPadding,
          labelY + 14
        );
      });
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => 
      canvas.toBlob((blob) => resolve(blob!), 'image/png')
    );
    
    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Return data URL for storage/transmission if needed
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to take screenshot:", error);
    throw error;
  }
};
