import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PostureSense — AI Posture Platform",
    short_name: "PostureSense",
    description: "AI posture analysis and exercise management for physio clinics and gyms.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    categories: ["health", "fitness", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Dashboard", url: "/provider", description: "Provider dashboard" },
      { name: "Clients",   url: "/provider/clients", description: "Manage clients" },
    ],
  };
}
