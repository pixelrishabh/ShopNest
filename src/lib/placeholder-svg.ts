import fs from "fs";
import path from "path";

export interface PlaceholderImageOptions {
  title: string;
  category: string;
  brand: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Electronics: ["#1e3a8a", "#3b82f6"],
  Mobiles: ["#0f172a", "#0284c7"],
  Fashion: ["#831843", "#ec4899"],
  "Home & Kitchen": ["#14532d", "#22c55e"],
  Beauty: ["#701a75", "#d946ef"],
  Appliances: ["#1e293b", "#64748b"],
  Books: ["#78350f", "#f59e0b"],
  Grocery: ["#14532d", "#16a34a"],
  Sports: ["#1e1b4b", "#6366f1"],
};

export function generateProductSvg({
  title,
  category,
  brand,
  primaryColor,
  secondaryColor,
}: PlaceholderImageOptions): string {
  const [col1, col2] = CATEGORY_COLORS[category] || [
    primaryColor || "#1e293b",
    secondaryColor || "#3b82f6",
  ];

  const safeTitle = title.replace(/[<>&"']/g, "");
  const safeBrand = brand.replace(/[<>&"']/g, "");
  const safeCategory = category.replace(/[<>&"']/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${col1}" />
      <stop offset="100%" stop-color="${col2}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="800" fill="url(#bgGrad)" />
  
  <!-- Subtle Grid Pattern -->
  <circle cx="400" cy="400" r="320" fill="none" stroke="${col2}" stroke-width="1.5" stroke-dasharray="8 8" opacity="0.25" />
  <circle cx="400" cy="400" r="260" fill="none" stroke="${col1}" stroke-width="1.5" opacity="0.15" />

  <!-- Center Card Illustration -->
  <rect x="180" y="160" width="440" height="420" rx="28" fill="url(#cardGrad)" filter="url(#shadow)" />
  
  <!-- Modern Geometric Motif on Card -->
  <rect x="220" y="200" width="360" height="180" rx="16" fill="#ffffff" fill-opacity="0.12" />
  <circle cx="400" cy="290" r="50" fill="#ffffff" fill-opacity="0.2" />
  
  <!-- Brand Badge inside Illustration -->
  <rect x="330" y="270" width="140" height="40" rx="20" fill="#ffffff" />
  <text x="400" y="295" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="${col1}" text-anchor="middle">${safeBrand}</text>

  <!-- Category Pill on Card -->
  <rect x="230" y="420" width="180" height="32" rx="16" fill="#ffffff" fill-opacity="0.18" />
  <text x="320" y="441" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">${safeCategory}</text>

  <!-- Quality Assurance Badge -->
  <g transform="translate(480, 416)">
    <rect width="100" height="32" rx="16" fill="#f59e0b" />
    <text x="50" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#1e293b" text-anchor="middle">★ VERIFIED</text>
  </g>

  <!-- Bottom Title Banner -->
  <rect x="60" y="620" width="680" height="120" rx="20" fill="#ffffff" filter="url(#shadow)" />
  
  <!-- Product Title -->
  <text x="400" y="666" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#0f172a" text-anchor="middle">${safeTitle.length > 40 ? safeTitle.slice(0, 37) + '...' : safeTitle}</text>
  
  <!-- Sub-label / Assured -->
  <text x="400" y="705" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">ShopNest Assured • Genuine Indian Stock • GST Invoice</text>
</svg>`;
}

export function saveProductSvgLocally(
  slug: string,
  options: PlaceholderImageOptions
): string {
  const publicDir = path.join(process.cwd(), "public", "images", "products");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgContent = generateProductSvg(options);
  const filePath = path.join(publicDir, `${slug}.svg`);
  fs.writeFileSync(filePath, svgContent, "utf-8");

  return `/images/products/${slug}.svg`;
}
