import html2canvas from "html2canvas";

export const takeScreenshot = async (
  element: HTMLElement = document.body
): Promise<string> => {
  try {
    // Wait for any images to load
    await Promise.all(
      Array.from(element.getElementsByTagName("img")).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(null);
            } else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          })
      )
    );

    // Wait a frame to ensure DOM is painted
    await new Promise(requestAnimationFrame);

    // https://html2canvas.hertzen.com/faq
    // Why aren't my images rendered?
    // html2canvas does not get around content policy restrictions set by your browser. Drawing images that reside outside of the origin of the current page taint the canvas that they are drawn upon. If the canvas gets tainted, it cannot be read anymore. As such, html2canvas implements methods to check whether an image would taint the canvas before applying it. If you have set the allowTaint option to false, it will not draw the image.

    // If you wish to load images that reside outside of your pages origin, you can use a proxy to load the images.
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      allowTaint: true, //
      scale: window.devicePixelRatio,
      backgroundColor: null,
      foreignObjectRendering: true,
      removeContainer: true,
      imageTimeout: 15000, // Increase timeout for image loading
      // onclone: (clonedDoc) => {
      //   // Fix any fixed position elements in the clone
      //   const fixed = clonedDoc.getElementsByClassName("fixed");
      //   Array.from(fixed).forEach((el) => {
      //     (el as HTMLElement).style.position = "absolute";
      //   });
      // },
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to take screenshot:", error);
    throw error;
  }
};
