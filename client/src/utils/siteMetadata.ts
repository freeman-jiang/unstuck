export function getDomain(): string {
  return window.location.hostname;
}

async function getPageDescription(url?: string): Promise<string | null> {
  try {
    let doc: Document;
    
    if (!url) {
      // If no URL provided, use current document
      doc = document;
    } else {
      // Fetch and parse the page
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      doc = parser.parseFromString(text, 'text/html');
    }
    
    return (
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      null
    );
  } catch (error) {
    console.warn(`Failed to fetch description${url ? ` for ${url}` : ''}:`, error);
    return null;
  }
}

interface SitemapNode {
  url: string;
  text: string;
  description: string | null;
  children: SitemapNode[];
}

export async function getSitemap(): Promise<string> {
  const visited = new Set<string>();
  const root: SitemapNode = {
    url: window.location.pathname,
    text: document.title,
    description: await getPageDescription(),
    children: []
  };

  async function extractLinks(element: Element, parent: SitemapNode) {
    const links = element.querySelectorAll('a[href]');
    const promises: Promise<void>[] = [];
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Skip external links, anchors, and already visited links
      if (
        href.startsWith('http') || 
        href.startsWith('#') || 
        href.startsWith('mailto:') || 
        href.startsWith('tel:') ||
        visited.has(href)
      ) {
        return;
      }

      visited.add(href);
      
      // Convert relative URLs to absolute
      const absoluteUrl = new URL(href, window.location.origin).href;
      
      const promise = (async () => {
        const description = await getPageDescription(absoluteUrl);
        const node: SitemapNode = {
          url: href,
          text: link.textContent?.trim() || href,
          description,
          children: []
        };
        parent.children.push(node);
      })();

      promises.push(promise);
    });

    await Promise.all(promises);
  }

  // Start from the document body
  await extractLinks(document.body, root);

  // Format the sitemap as a string
  function formatSitemap(node: SitemapNode, level = 0): string {
    const indent = '  '.repeat(level);
    let result = `${indent}${node.text} (${node.url})\n`;
    
    if (node.description) {
      result += `${indent}  Description: ${node.description}\n`;
    }
    
    for (const child of node.children) {
      result += formatSitemap(child, level + 1);
    }
    
    return result;
  }

  return formatSitemap(root);
} 