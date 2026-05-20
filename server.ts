import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";

// 🚀 Highly optimized persistent TCP/TLS Keep-Alive agents to avoid handshake overhead
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 150, keepAliveMsecs: 10000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 150, keepAliveMsecs: 10000 });

// 🚀 In-Memory Caches for supercharged performance & zero network latency on repeated loads
interface CacheEntry {
  contentType: string | undefined;
  statusCode: number;
  data: Buffer;
  timestamp: number;
}

const imageResultCache = new Map<string, CacheEntry>();
const urlRedirectCache = new Map<string, string>();
const MAX_CACHE_SIZE_MB = 100; // Safe memory budget (100MB) to prevent container memory bloat
let currentCacheSizeByte = 0;

function addToImageCache(originalUrl: string, contentType: string | undefined, statusCode: number, data: Buffer) {
  const size = data.length;
  if (size > 15 * 1024 * 1024) return; // Ignore single images that are realistically too large to keep in RAM

  // Sliding LRU eviction
  while (currentCacheSizeByte + size > MAX_CACHE_SIZE_MB * 1024 * 1024 && imageResultCache.size > 0) {
    const oldestKey = imageResultCache.keys().next().value;
    if (oldestKey) {
      const entry = imageResultCache.get(oldestKey);
      if (entry) {
        currentCacheSizeByte -= entry.data.length;
      }
      imageResultCache.delete(oldestKey);
    } else {
      break;
    }
  }

  imageResultCache.set(originalUrl, {
    contentType,
    statusCode,
    data,
    timestamp: Date.now()
  });
  currentCacheSizeByte += size;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to convert typical cloud URLs to direct download links
  function convertUrlToDirect(url: string): string {
    if (!url || typeof url !== "string") return url;
    const trimmedUrl = url.trim();

    // 1. Google Drive
    const gdRegex1 = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
    const gdRegex2 = /(?:drive|docs)\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i;

    let fileId: string | null = null;
    const m1 = trimmedUrl.match(gdRegex1);
    const m2 = trimmedUrl.match(gdRegex2);

    if (m1) {
      fileId = m1[1];
    } else if (m2) {
      fileId = m2[1];
    }

    if (fileId) {
      return `https://docs.google.com/uc?export=download&id=${fileId}`;
    }

    // 2. OneDrive Personal
    if (trimmedUrl.includes("onedrive.live.com")) {
      if (trimmedUrl.includes("redir?")) {
        return trimmedUrl.replace("redir?", "download?");
      }
      if (trimmedUrl.includes("embed?")) {
        return trimmedUrl.replace("embed?", "download?");
      }
      try {
        const urlObj = new URL(trimmedUrl);
        const resid = urlObj.searchParams.get("resid");
        const authkey = urlObj.searchParams.get("authkey");
        if (resid) {
          let downloadUrl = `https://onedrive.live.com/download?resid=${resid}`;
          if (authkey) downloadUrl += `&authkey=${authkey}`;
          return downloadUrl;
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. Dropbox
    if (trimmedUrl.includes("dropbox.com")) {
      if (trimmedUrl.includes("dl=0")) {
        return trimmedUrl.replace("dl=0", "raw=1");
      }
      if (!trimmedUrl.includes("raw=1") && !trimmedUrl.includes("dl=1")) {
        const separator = trimmedUrl.includes("?") ? "&" : "?";
        return trimmedUrl + separator + "raw=1";
      }
    }

    // 4. SharePoint & OneDrive for Business (handles modern short links and classic sharing URLs)
    if (
      trimmedUrl.includes("sharepoint.com") ||
      trimmedUrl.includes("_layouts/15/") ||
      trimmedUrl.includes("onedrive.aspx") ||
      trimmedUrl.includes("Doc.aspx") ||
      /(\/:[a-zA-Z]:)\/[a-zA-Z]\//gi.test(trimmedUrl)
    ) {
      const spShortPattern = /https?:\/\/([^/]+)\/(?::[a-zA-Z]:)\/[a-zA-Z]\/(.+)\/([^/?#]+)/i;
      const match = trimmedUrl.match(spShortPattern);
      if (match) {
        const host = match[1];
        const sitePath = match[2];
        const token = match[3];

        let eParam = "";
        try {
          const urlObj = new URL(trimmedUrl);
          const e = urlObj.searchParams.get("e");
          if (e) eParam = `&e=${e}`;
        } catch (err) {
          // ignore
        }

        return `https://${host}/${sitePath}/_layouts/15/download.aspx?share=${token}${eParam}`;
      }

      let spUrl = trimmedUrl;

      // Replace viewer scripts with download script to fetch binary stream directly
      if (spUrl.includes("onedrive.aspx")) {
        spUrl = spUrl.replace(/onedrive\.aspx/gi, "download.aspx");
      }
      if (spUrl.includes("Doc.aspx")) {
        spUrl = spUrl.replace(/Doc\.aspx/gi, "download.aspx");
      }

      // Force download query parameter if not already a short direct download link
      if (!spUrl.includes("download=1")) {
        const separator = spUrl.includes("?") ? "&" : "?";
        spUrl = spUrl + separator + "download=1";
      }

      return spUrl;
    }

    return trimmedUrl;
  }

  // Header-based proxy endpoint to bypass CORS blocks for cloud-hosted images (Google Drive, OneDrive, Dropbox, etc.)
  app.get("/api/proxy-image", (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(400).send("Parameter 'url' is required");
    }

    // ⚡ Peak Performance: Check memory buffer cache first
    const cachedImage = imageResultCache.get(imageUrl);
    if (cachedImage && (Date.now() - cachedImage.timestamp < 120 * 60 * 1000)) { // 2 hour cache window
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Standard browser-side asset caching
      if (cachedImage.contentType) {
        res.setHeader("content-type", cachedImage.contentType);
      }
      res.status(cachedImage.statusCode);
      res.send(cachedImage.data);
      return;
    }

    try {
      // ⚡ Redirect Optimization: Bypass redirections by utilizing previously resolved direct endpoint targets
      let targetUrl = urlRedirectCache.get(imageUrl);
      if (!targetUrl) {
        targetUrl = convertUrlToDirect(imageUrl);
      }

      const parsedUrl = new URL(targetUrl);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(400).send("Invalid protocol");
      }

      fetchUrlFollowRedirect(imageUrl, targetUrl, res, 0);
    } catch (e) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(400).send("Invalid URL");
    }
  });

  // Helper function to safely follow up to 15 redirection hops on cloud providers
  function fetchUrlFollowRedirect(originalImageUrl: string, currentUrl: string, res: any, redirectCount: number) {
    if (redirectCount > 15) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      return res.status(500).send("Too many redirects (exceeded limit of 15)");
    }

    try {
      const parsedUrl = new URL(currentUrl);
      const client = parsedUrl.protocol === "https:" ? https : http;
      const agent = parsedUrl.protocol === "https:" ? httpsAgent : httpAgent;

      const proxyReq = client.get(currentUrl, {
        agent: agent, // Use Keep-Alive agent to preserve SSL/TLS connections
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*, */*'
        }
      }, (proxyRes) => {
        // Handle redirect status codes (301, 302, 303, 307, 308)
        if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          const rawLocation = proxyRes.headers.location;
          let destUrl = rawLocation.startsWith("http") 
            ? rawLocation 
            : new URL(rawLocation, parsedUrl.origin).toString();
          
          destUrl = convertUrlToDirect(destUrl);
          
          fetchUrlFollowRedirect(originalImageUrl, destUrl, res, redirectCount + 1);
          return;
        }

        // Cache the redirection resolution pathway to bypass future handshake hops
        if (originalImageUrl !== currentUrl) {
          urlRedirectCache.set(originalImageUrl, currentUrl);
        }

        // Add explicit CORS and Cache response headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Inform browser it package remains long-term valid

        if (proxyRes.headers["content-type"]) {
          res.setHeader("content-type", proxyRes.headers["content-type"]);
        }
        if (proxyRes.headers["content-length"]) {
          res.setHeader("content-length", proxyRes.headers["content-length"]);
        }

        res.status(proxyRes.statusCode || 200);

        // Perform parallel chunked stream writing and buffer accumulation
        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk) => {
          chunks.push(chunk);
          res.write(chunk);
        });

        proxyRes.on("end", () => {
          res.end();
          const buffer = Buffer.concat(chunks);
          if (proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
            addToImageCache(originalImageUrl, proxyRes.headers["content-type"], proxyRes.statusCode, buffer);
          }
        });

        proxyRes.on("error", (err) => {
          console.error("proxyRes stream error:", err);
          if (!res.headersSent) {
            res.status(500).send("Error reading image data stream");
          }
        });
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy request redirect helper error:", err);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET");
        res.status(500).send("Error fetching image from source");
      });
    } catch (e) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.status(400).send("Invalid URL in redirect handler");
    }
  }

  // Vite middleware for development vs static asset serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
