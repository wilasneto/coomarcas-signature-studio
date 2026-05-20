import http from "http";
import https from "https";
import { URL } from "url";

export default function handler(req, res) {
  // Extract custom 'url' query parameter
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== "string") {
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
}

function fetchUrlFollowRedirect(url, clientRes, redirectCount) {
  if (redirectCount > 5) {
    return clientRes.status(500).send("Too many redirects");
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
      // Handle HTTP redirects (301, 302, 303, 307, 308)
      if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const rawLocation = proxyRes.headers.location;
        const destUrl = rawLocation.startsWith("http") 
          ? rawLocation 
          : new URL(rawLocation, parsedUrl.origin).toString();
        
        fetchUrlFollowRedirect(destUrl, clientRes, redirectCount + 1);
        return;
      }

      // Copy status code
      clientRes.status(proxyRes.statusCode || 200);

      // Set matching Content-Type if present
      if (proxyRes.headers["content-type"]) {
        clientRes.setHeader("content-type", proxyRes.headers["content-type"]);
      }

      // Add CORS and public caching headers (1 year cache for speed)
      clientRes.setHeader("Access-Control-Allow-Origin", "*");
      clientRes.setHeader("Access-Control-Allow-Methods", "GET");
      clientRes.setHeader("Cache-Control", "public, max-age=31536000");

      proxyRes.pipe(clientRes);
    });

    proxyReq.on("error", (err) => {
      console.error("Vercel Serverless proxy error:", err);
      clientRes.status(500).send("Error fetching image");
    });
  } catch (e) {
    clientRes.status(400).send("Invalid redirect URL");
  }
}
