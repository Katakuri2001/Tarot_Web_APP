#!/bin/bash
set -e

# Build the project
npm run build

# Create a clean output directory for Cloudflare Pages
mkdir -p .next/pages-output

# Copy HTML files (server app)
cp -r .next/server/app/* .next/pages-output/ 2>/dev/null || true

# Copy static assets (preserve _next/static/ structure that HTML references)
mkdir -p .next/pages-output/_next
cp -r .next/static .next/pages-output/_next/static 2>/dev/null || true

# Copy public assets
cp -r public/. .next/pages-output/ 2>/dev/null || true

# Create _routes.json for Cloudflare Pages routing
cat > .next/pages-output/_routes.json << 'ROUTES'
{
  "includes": ["/readings/(.*)", "/readings/[type]/(.*)"],
  "exclude": ["/api/(.*)"]
}
ROUTES

# Verify index.html
if [ -f .next/pages-output/index.html ]; then
  echo "index.html found"
fi

echo "Pages output ready in .next/pages-output/"
ls .next/pages-output/ | head -20
echo "--- CSS files ---"
ls .next/pages-output/_next/static/css/ 2>/dev/null
echo "--- _routes.json ---"
cat .next/pages-output/_routes.json 2>/dev/null || echo "NOT FOUND"
