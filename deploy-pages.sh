#!/bin/bash
set -e

# Build the project
npm run build

# Create a clean output directory for Cloudflare Pages
mkdir -p .next/pages-output

# Copy HTML files (server app)
cp -r .next/server/app/* .next/pages-output/ 2>/dev/null || true

# Copy static assets
cp -r .next/static .next/pages-output/_next 2>/dev/null || true

# Copy public assets
cp -r public/* .next/pages-output/ 2>/dev/null || true

# Rename index.html
if [ -f .next/pages-output/index.html ]; then
  echo "index.html found"
fi

echo "Pages output ready in .next/pages-output/"
ls .next/pages-output/ | head -20
