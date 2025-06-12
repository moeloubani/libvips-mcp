# 🎨 libvips MCP Server Enhanced Edition - Complete Capabilities

## Overview
**30 Professional Image Processing Tools** powered by libvips, Sharp, and wasm-vips

---

## 📊 Basic Information & Analysis (3 tools)

### `image_info`
Get comprehensive image metadata including dimensions, format, color space, channels, resolution, and file statistics.

### `image_histogram` 
Generate detailed histogram statistics for image analysis with configurable bin counts.

### `image_advanced_stats`
Calculate comprehensive image statistics using wasm-vips including min/max, averages, histograms, field analysis, and enhanced metadata.

---

## 🔧 Basic Operations (5 tools)

### `image_resize`
Resize images with various fit modes (cover, contain, fill, inside, outside) and advanced kernel options (nearest, linear, cubic, mitchell, lanczos).

### `image_convert`
Convert between formats (JPEG, PNG, WebP, TIFF, AVIF, HEIF, GIF, BMP) with quality control and compression options.

### `image_crop`
Extract rectangular regions from images with precise coordinate control.

### `image_rotate`
Rotate images by any angle with configurable background colors.

### `image_flip`
Flip images horizontally or vertically.

---

## 🎨 Image Enhancement (6 tools)

### `image_blur`
Apply Gaussian blur with configurable sigma values for various blur intensities.

### `image_sharpen`
Apply unsharp mask sharpening with configurable sigma, flat, and jagged parameters.

### `image_adjust_brightness`
Adjust image brightness (-100 to +100 range).

### `image_adjust_contrast`
Adjust image contrast (0.1 to 3.0 multiplier).

### `image_adjust_saturation`
Adjust color saturation (0.0 to 2.0 multiplier).

### `image_grayscale`
Convert images to grayscale.

---

## 🔬 Morphological Operations (1 tool)

### `image_morphology`
Apply erosion, dilation, opening, and closing operations with custom kernel sizes and iteration counts. Powered by wasm-vips with Sharp fallbacks.

---

## ✏️ Drawing Operations (2 tools)

### `image_draw_line`
Draw lines with custom colors, widths, and precise coordinate control.

### `image_draw_circle`
Draw circles and filled circles with custom colors and radius control.

---

## 🔍 Edge Detection (1 tool)

### `image_edge_detection`
Apply advanced edge detection algorithms: Sobel, Prewitt, Roberts, and Laplacian filters with threshold control.

---

## 🔬 Advanced Scientific Operations (8 tools)

### `image_fft`
Apply Fast Fourier Transform for frequency domain analysis and filtering, with inverse FFT support.

### `image_custom_convolution`
Apply custom convolution kernels for advanced filtering effects with scale and offset parameters.

### `image_colorspace_convert`
Convert between color spaces: sRGB, LAB, HSV, CMYK, XYZ, scRGB, and LCH.

### `image_add_noise`
Add various types of noise: Gaussian, uniform, or salt-and-pepper with configurable intensity.

### `image_texture_analysis`
Analyze image texture using statistical measures and window-based analysis.

### `image_perspective_transform`
Apply perspective transformations with custom corner point definitions.

### `image_flood_fill`
Fill connected regions with specified colors and tolerance levels.

### `image_create_pyramid`
Create image pyramids for multi-resolution processing and analysis with configurable levels and scale factors.

---

## 🎭 Composition & Effects (2 tools)

### `image_composite`
Composite multiple images with various blend modes (over, multiply, screen, overlay, darken, lighten, etc.).

### `image_thumbnail`
Create thumbnails with optional square cropping and size control.

---

## 🎨 Channel Operations (1 tool)

### `image_extract_channel`
Extract individual color channels (Red, Green, Blue, Alpha) from images.

---

## 🎨 Creative Tools (1 tool)

### `create_solid_color`
Generate solid color images of any size with hex color specification.

---

## 🚀 Technology Stack

- **wasm-vips**: Access to full libvips API (300+ operations)
- **Sharp**: High-performance image processing (built on libvips)
- **Graceful Fallbacks**: Sharp approximations when wasm-vips unavailable
- **TypeScript**: Full type safety and IntelliSense support
- **MCP Protocol**: Compatible with all MCP clients

---

## 📈 Performance Characteristics

- **Memory Efficient**: Processes images larger than RAM using streaming
- **Thread Safe**: Automatic parallelization across CPU cores
- **Streaming**: Demand-driven processing minimizes memory usage
- **Caching**: Operation results cached for repeated operations
- **Linear Scaling**: Performance scales with CPU cores (up to 32+ threads)

---

## 🎯 Use Cases

### Professional Photography
- RAW processing, color correction, format conversion
- Batch processing, watermarking, metadata extraction

### Scientific Imaging
- Medical imaging analysis, microscopy processing
- Frequency domain analysis, texture analysis

### Web Development
- Thumbnail generation, format optimization
- Responsive image creation, compression

### Computer Vision
- Preprocessing for ML models, edge detection
- Morphological operations, noise reduction

### Creative Arts
- Digital art creation, effect application
- Perspective correction, artistic filters

---

## 📊 Supported Formats

### Input Formats
JPEG, PNG, TIFF, WebP, AVIF, HEIF, GIF, SVG, PDF, BMP, and many scientific formats

### Output Formats
JPEG, PNG, WebP, TIFF, AVIF, HEIF, GIF, BMP with quality and compression control

---

*Total: **30 Professional Tools** for comprehensive image processing* 