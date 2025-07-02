# Optimize Image/Video Command

Please optimize the media file: $ARGUMENTS

Follow this comprehensive optimization workflow:

## 1. Initial Analysis
- Verify the file exists and get its current size/format
- Determine if the file is in `apps/vitrine` or elsewhere to scope the search appropriately
- Check if the file is already optimized (has .webp/.avif versions or modern formats)

## 2. Usage Analysis
- Search the codebase for all references to this media file
- If in `apps/vitrine`, limit search to that directory for efficiency
- Identify usage patterns:
  - Simple `<img src>` references
  - CSS `background-image` properties
  - `<picture>` elements with multiple sources
  - Video `<source>` elements
  - Import statements in JavaScript/TypeScript

## 3. Cleanup Unused Files
- If the file has zero references, confirm it's safe to remove
- Delete unused files and report the space saved

## 4. SEO-Friendly Renaming
- Analyze the current filename for SEO quality
- If needed, suggest and implement a better name using only `[a-z0-9-]` characters
- Consider the content/context to choose descriptive, SEO-friendly names
- Update all code references to use the new filename

## 5. Optimization Strategy Planning
Based on usage analysis, determine:
- **For images**: Whether to create WebP/AVIF versions, responsive sizes, quality settings
- **For videos**: Whether to create WebM versions, different quality levels
- **Responsive needs**: If multiple sizes are needed based on usage context
- **Format strategy**: Modern format with fallbacks vs. direct replacement

## 6. Media Optimization
Execute optimizations using appropriate tools:

### For Images:
```bash
# WebP optimization (adjust quality based on content type)
cwebp -q 85 input.jpg -o input.webp
cwebp -q 90 input.png -o input.webp  # Higher quality for graphics

# AVIF for even better compression (if supported)
magick input.jpg -quality 80 input.avif

# Responsive sizes if needed
magick input.jpg -resize 800x input-w800.jpg
magick input.jpg -resize 400x input-w400.jpg
```

### For Videos:
```bash
# WebM optimization
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus input.webm

# Different quality levels if needed
ffmpeg -i input.mp4 -vf scale=1920:1080 -crf 23 input-1080p.mp4
ffmpeg -i input.mp4 -vf scale=1280:720 -crf 25 input-720p.mp4
```

## 7. Code Updates
- Replace simple image references with optimized versions
- Create `<picture>` elements for multi-format support:
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="description">
</picture>
```
- Update video elements with multiple sources:
```html
<video>
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</video>
```
- Handle CSS background images with fallbacks if needed

## 8. Final Cleanup
- Remove the original file if it's been fully replaced
- Verify all references work correctly
- Report optimization results (file size reduction, formats created)
- Update any relevant documentation or README files

## 9. Verification
- Run a final search to ensure no broken references
- Test that optimized media loads correctly
- Check file sizes and report the space savings achieved

Remember to:
- Preserve image quality while maximizing compression
- Maintain backwards compatibility with fallback formats
- Use appropriate quality settings based on content type (photos vs graphics)
- Consider the target audience's browser support when choosing formats
