# 🎨 Libvips MCP Server Enhanced Edition (v1.2.0)

[![smithery badge](https://smithery.ai/badge/@moeloubani/libvips-mcp)](https://smithery.ai/server/@moeloubani/libvips-mcp)
[![npm version](https://badge.fury.io/js/@moeloubani%2Flibvips-mcp-server.svg)](https://badge.fury.io/js/@moeloubani%2Flibvips-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![wasm-vips](https://img.shields.io/badge/wasm--vips-enhanced-blue.svg)](https://www.npmjs.com/package/wasm-vips)

A Model Context Protocol (MCP) server that provides comprehensive image processing capabilities using both Sharp (libvips) and wasm-vips, offering **300+ image operations** with professional-grade processing power.

## Quick Start

```bash
# Install the package
npm install -g @moeloubani/libvips-mcp-server

# Run the server (for testing)
libvips-mcp-server

# Or use with npx (no global install needed)
npx @moeloubani/libvips-mcp-server
```

## Overview

This MCP server brings the power of libvips image processing to any MCP-compatible application. Libvips is a high-performance image processing library that:

- **Handles Large Images**: Can process images larger than available RAM using streaming
- **Scales with CPUs**: Performance scales linearly with CPU cores (up to 32+ threads)
- **Memory Efficient**: Uses demand-driven processing with minimal memory footprint
- **Format Support**: Works with JPEG, PNG, TIFF, WebP, AVIF, HEIF, and many more formats
- **300+ Operations**: Comprehensive image processing capabilities

## Features

### Image Information
- **image_info**: Get detailed metadata about images including dimensions, format, color space, channels, and statistics

### Basic Operations
- **image_resize**: Resize images with various fit modes (cover, contain, fill, inside, outside)
- **image_convert**: Convert between formats (JPEG, PNG, WebP, TIFF, AVIF, HEIF) with quality control
- **image_crop**: Extract rectangular regions from images
- **image_rotate**: Rotate images by any angle with configurable background
- **image_flip**: Flip images horizontally or vertically

### Image Enhancement
- **image_blur**: Apply Gaussian blur with configurable sigma
- **image_sharpen**: Apply unsharp mask sharpening
- **image_adjust_brightness**: Adjust image brightness (-100 to +100)
- **image_adjust_contrast**: Adjust image contrast (0.1 to 3.0 multiplier)
- **image_adjust_saturation**: Adjust color saturation (0.0 to 2.0 multiplier)
- **image_grayscale**: Convert images to grayscale

### Advanced Operations
- **image_composite**: Composite multiple images with various blend modes (over, multiply, screen, overlay, etc.)
- **image_thumbnail**: Create thumbnails with optional square cropping
- **image_extract_channel**: Extract individual color channels (R, G, B, Alpha)
- **image_histogram**: Generate histogram statistics for image analysis

### Creative Tools
- **create_solid_color**: Generate solid color images of any size

## 🚀 Enhanced Operations (v1.1.0) - New!

### Morphological Operations (wasm-vips powered)
- **image_morphology**: Apply erosion, dilation, opening, and closing operations with custom kernel sizes and iterations

### Drawing Operations
- **image_draw_line**: Draw lines with custom colors and widths
- **image_draw_circle**: Draw circles and filled circles with custom colors

### Advanced Edge Detection
- **image_edge_detection**: Apply Sobel, Prewitt, Roberts, and Laplacian edge detection filters

### Comprehensive Analysis
- **image_advanced_stats**: Calculate detailed image statistics including histograms, field analysis, and enhanced metadata

## 🔬 Advanced Scientific Operations (Step 2) - New!

### Frequency Domain Processing
- **image_fft**: Apply Fast Fourier Transform for frequency domain analysis and filtering
- **image_custom_convolution**: Apply custom convolution kernels for advanced filtering effects

### Color Space Operations
- **image_colorspace_convert**: Convert between sRGB, LAB, HSV, CMYK, XYZ, and other color spaces

### Noise and Texture Operations
- **image_add_noise**: Add Gaussian, uniform, or salt-and-pepper noise for testing and effects
- **image_texture_analysis**: Analyze image texture using statistical measures and window-based analysis

### Geometric Transformations
- **image_perspective_transform**: Apply perspective transformations with custom corner points
- **image_flood_fill**: Fill connected regions with specified colors and tolerance

### Multi-Resolution Analysis
- **image_create_pyramid**: Create image pyramids for multi-resolution processing and analysis

## Installation

### Installing via Smithery

To install Libvips Image Processing Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@moeloubani/libvips-mcp):

```bash
npx -y @smithery/cli install @moeloubani/libvips-mcp --client claude
```

### From npm (Recommended)

```bash
npm install @moeloubani/libvips-mcp-server
```

Or install globally:

```bash
npm install -g @moeloubani/libvips-mcp-server
```

### From Source

```bash
git clone <repository-url>
cd libvips-mcp-server
npm install
npm run build
```

## Usage

### As MCP Server

The server can be used with any MCP-compatible application. Add it to your MCP client configuration:

#### If installed globally:
```json
{
  "servers": {
    "libvips": {
      "command": "libvips-mcp-server"
    }
  }
}
```

#### If installed locally:
```json
{
  "servers": {
    "libvips": {
      "command": "npx",
      "args": ["@moeloubani/libvips-mcp-server"]
    }
  }
}
```

#### If running from source:
```json
{
  "servers": {
    "libvips": {
      "command": "node",
      "args": ["path/to/libvips-mcp-server/dist/index.js"]
    }
  }
}
```

### Example Operations

#### Get Image Information
```json
{
  "name": "image_info",
  "arguments": {
    "image_path": "/path/to/image.jpg"
  }
}
```

#### Resize Image
```json
{
  "name": "image_resize",
  "arguments": {
    "input_path": "/path/to/input.jpg",
    "output_path": "/path/to/output.jpg",
    "width": 800,
    "height": 600,
    "fit": "cover"
  }
}
```

#### Convert Format
```json
{
  "name": "image_convert",
  "arguments": {
    "input_path": "/path/to/input.jpg",
    "output_path": "/path/to/output.webp",
    "format": "webp",
    "quality": 85
  }
}
```

#### Composite Images
```json
{
  "name": "image_composite",
  "arguments": {
    "base_image_path": "/path/to/base.jpg",
    "overlay_image_path": "/path/to/overlay.png",
    "output_path": "/path/to/composite.jpg",
    "x": 100,
    "y": 100,
    "blend": "multiply"
  }
}
```

#### Fast Fourier Transform (Advanced)
```json
{
  "name": "image_fft",
  "arguments": {
    "input_path": "/path/to/input.jpg",
    "output_path": "/path/to/fft.jpg",
    "inverse": false
  }
}
```

## Performance Characteristics

Thanks to libvips' architecture:
- **Memory Efficient**: Processes images larger than RAM
- **Thread Safe**: Automatic parallelization across CPU cores
- **Streaming**: Demand-driven processing minimizes memory usage
- **Caching**: Operation results are cached for repeated operations

## Supported Formats

### Input Formats
- JPEG, PNG, TIFF, WebP, AVIF, HEIF
- GIF (static and animated)
- SVG (rasterized)
- PDF (first page)
- Many scientific formats via libvips

### Output Formats
- JPEG (with quality control)
- PNG (with compression levels)
- WebP (with quality control)
- TIFF (with compression)
- AVIF (with quality control)
- HEIF (with quality control)

## Error Handling

The server provides detailed error messages for:
- Missing input files
- Invalid parameters
- Unsupported operations
- Format conversion issues
- Memory or processing errors

## Dependencies

- **Sharp**: High-performance Node.js image processing (built on libvips)
- **@modelcontextprotocol/sdk**: MCP SDK for server implementation

## Package Information

- **Package**: `@moeloubani/libvips-mcp-server`
- **npm**: https://www.npmjs.com/package/@moeloubani/libvips-mcp-server
- **Author**: Moe Loubani
- **Version**: 1.0.1

## License

MIT License - Feel free to use in your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## About Libvips

Libvips is a demand-driven, horizontally threaded image processing library that has been in development since 1989. It's used by many high-traffic websites and applications for efficient image processing. This MCP server makes its powerful capabilities available through a simple, standardized interface.

For more information about libvips: https://libvips.github.io/libvips/ 