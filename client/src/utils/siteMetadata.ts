export function getDomain(): string {
  return window.location.hostname;
}

export function getDescription(): string | null {
  return (
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    null
  );
} 