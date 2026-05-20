import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Header-based proxy endpoint to bypass CORS blocks for cloud-hosted images (Google Drive, OneDrive, Dropbox, etc.)
  app.get("/api/proxy-image", (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("Parameter 'url' is required");
    }

    try {
      const parsedUrl = new URL(imageUrl);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return res.status(400).send("Invalid protocol");
      }

      fetchUrlFollowRedirect(imageUrl, res, 0);
    } catch (e) {
      res.status(400).send("Invalid URL");
    }
  });

  // Helper function to safely follow up to 5 redirection hops on cloud providers
  function fetchUrlFollowRedirect(url: string, res: any, redirectCount: number) {
    if (redirectCount > 5) {
      return res.status(500).send("Too many redirects");
    }

    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const proxyReq = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*, */*'
        }
      }, (proxyRes) => {
        // Handle redirect status codes (301, 302, 303, 307, 308)
        if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          const rawLocation = proxyRes.headers.location;
          // Resolve relative redirect paths against the current host if necessary
          const destUrl = rawLocation.startsWith("http") 
            ? rawLocation 
            : new URL(rawLocation, parsedUrl.origin).toString();
          
          fetchUrlFollowRedirect(destUrl, res, redirectCount + 1);
          return;
        }

        // Set matching Content-Type if present
        if (proxyRes.headers["content-type"]) {
          res.setHeader("content-type", proxyRes.headers["content-type"]);
        }

        // Add explicit CORS and Cache response headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache

        proxyRes.pipe(res);
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy request redirect helper error:", err);
        res.status(500).send("Error fetching image");
      });
    } catch (e) {
      res.status(400).send("Invalid redirect URL");
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
