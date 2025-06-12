#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Vips from 'wasm-vips';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { mkdir } from 'fs/promises';

// Initialize wasm-vips
let vips: any = null;

async function initVips() {
  if (!vips) {
    vips = await Vips();
    console.log('🎨 wasm-vips initialized successfully');
  }
  return vips;
}

// Server setup
const server = new Server(
  {
    name: '@moeloubani/libvips-mcp-server-enhanced',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Helper function to get enhanced image info using wasm-vips
async function getImageInfo(imagePath: string) {
  const vipsInstance = await initVips();
  
  try {
    const image = vipsInstance.Image.newFromFile(imagePath);
    const stats = existsSync(imagePath) ? statSync(imagePath) : null;
    
    return {
      format: image.format || 'unknown',
      width: image.width,
      height: image.height,
      bands: image.bands,
      interpretation: image.interpretation,
      xres: image.xres,
      yres: image.yres,
      xoffset: image.xoffset,
      yoffset: image.yoffset,
      coding: image.coding,
      size: stats?.size || 0,
      hasProfile: image.getFields().includes('icc-profile-data'),
      fields: image.getFields(), // All metadata fields
    };
  } catch (error) {
    throw new Error(`Failed to get image info: ${error}`);
  }
}

// Enhanced tools with wasm-vips capabilities
const tools: Tool[] = [
  // BASIC OPERATIONS (Enhanced versions)
  {
    name: 'image_info',
    description: 'Get comprehensive image information using wasm-vips',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to the image file'
        }
      },
      required: ['image_path']
    }
  },

  {
    name: 'image_resize',
    description: 'Resize image with advanced options',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        kernel: { 
          type: 'string',
          enum: ['nearest', 'linear', 'cubic', 'mitchell', 'lanczos2', 'lanczos3'],
          default: 'lanczos3'
        }
      },
      required: ['input_path', 'output_path']
    }
  },

  {
    name: 'image_convert',
    description: 'Convert between image formats with advanced options',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        format: { 
          type: 'string',
          enum: ['jpeg', 'png', 'webp', 'tiff', 'avif', 'heif', 'gif', 'bmp']
        },
        quality: { type: 'number', minimum: 1, maximum: 100 },
        compression: { type: 'string', enum: ['none', 'lzw', 'zip', 'packbits'] }
      },
      required: ['input_path', 'output_path', 'format']
    }
  },

  // MORPHOLOGICAL OPERATIONS (New!)
  {
    name: 'image_morphology',
    description: 'Apply morphological operations (erosion, dilation, opening, closing)',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        operation: { 
          type: 'string',
          enum: ['erode', 'dilate', 'opening', 'closing']
        },
        kernel: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
          description: '2D kernel matrix'
        },
        iterations: { type: 'number', default: 1, minimum: 1 }
      },
      required: ['input_path', 'output_path', 'operation']
    }
  },

  // FREQUENCY DOMAIN OPERATIONS (New!)
  {
    name: 'image_fft',
    description: 'Apply Fast Fourier Transform',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        inverse: { type: 'boolean', default: false }
      },
      required: ['input_path', 'output_path']
    }
  },

  // DRAWING OPERATIONS (New!)
  {
    name: 'image_draw_line',
    description: 'Draw a line on the image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        x1: { type: 'number' },
        y1: { type: 'number' },
        x2: { type: 'number' },
        y2: { type: 'number' },
        color: { type: 'array', items: { type: 'number' }, default: [0, 0, 0] }
      },
      required: ['input_path', 'output_path', 'x1', 'y1', 'x2', 'y2']
    }
  },

  {
    name: 'image_draw_circle',
    description: 'Draw a circle on the image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
        radius: { type: 'number' },
        fill: { type: 'boolean', default: false },
        color: { type: 'array', items: { type: 'number' }, default: [0, 0, 0] }
      },
      required: ['input_path', 'output_path', 'x', 'y', 'radius']
    }
  },

  {
    name: 'image_draw_rect',
    description: 'Draw a rectangle on the image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        left: { type: 'number' },
        top: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        fill: { type: 'boolean', default: false },
        color: { type: 'array', items: { type: 'number' }, default: [0, 0, 0] }
      },
      required: ['input_path', 'output_path', 'left', 'top', 'width', 'height']
    }
  },

  // CONVOLUTION OPERATIONS (New!)
  {
    name: 'image_convolution',
    description: 'Apply custom convolution kernel',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        kernel: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
          description: '2D convolution kernel'
        },
        scale: { type: 'number', default: 1 },
        offset: { type: 'number', default: 0 }
      },
      required: ['input_path', 'output_path', 'kernel']
    }
  },

  {
    name: 'image_edge_detection',
    description: 'Apply edge detection filters',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        method: { 
          type: 'string',
          enum: ['sobel', 'prewitt', 'roberts', 'laplacian']
        }
      },
      required: ['input_path', 'output_path', 'method']
    }
  },

  // ADVANCED COLOR OPERATIONS (New!)
  {
    name: 'image_colorspace',
    description: 'Convert between color spaces',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        space: { 
          type: 'string',
          enum: ['srgb', 'rgb', 'cmyk', 'lab', 'xyz', 'scrgb', 'hsv', 'lch']
        }
      },
      required: ['input_path', 'output_path', 'space']
    }
  },

  // ANALYSIS OPERATIONS (New!)
  {
    name: 'image_stats',
    description: 'Calculate comprehensive image statistics',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' }
      },
      required: ['input_path']
    }
  },

  {
    name: 'image_histogram',
    description: 'Generate detailed histogram information',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        bins: { type: 'number', default: 256 }
      },
      required: ['input_path']
    }
  },

  // LEGACY OPERATIONS (keeping compatibility)
  {
    name: 'image_crop',
    description: 'Crop image to specified region',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' }
      },
      required: ['input_path', 'output_path', 'x', 'y', 'width', 'height']
    }
  },

  {
    name: 'image_rotate',
    description: 'Rotate image by specified angle',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        angle: { type: 'number' },
        background: { type: 'array', items: { type: 'number' }, default: [255, 255, 255] }
      },
      required: ['input_path', 'output_path', 'angle']
    }
  },

  {
    name: 'image_flip',
    description: 'Flip image horizontally or vertically',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: { type: 'string' },
        output_path: { type: 'string' },
        direction: { type: 'string', enum: ['horizontal', 'vertical'] }
      },
      required: ['input_path', 'output_path', 'direction']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Enhanced tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const vipsInstance = await initVips();

    switch (name) {
      case 'image_info': {
        const { image_path } = args as { image_path: string };
        
        if (!existsSync(image_path)) {
          throw new Error(`Image file not found: ${image_path}`);
        }
        
        const info = await getImageInfo(image_path);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2)
            }
          ]
        };
      }

      case 'image_resize': {
        const { input_path, output_path, width, height, kernel = 'lanczos3' } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const resized = image.resize(width / image.width, {
          vscale: height ? height / image.height : width / image.width,
          kernel: kernel
        });
        resized.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image resized successfully using ${kernel} kernel: ${output_path}`
            }
          ]
        };
      }

      case 'image_convert': {
        const { input_path, output_path, format, quality = 80, compression } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const options: any = {};
        
        if (format === 'jpeg' && quality) options.Q = quality;
        if (format === 'png' && quality) options.compression = quality / 10;
        if (format === 'webp' && quality) options.Q = quality;
        if (format === 'tiff' && compression) options.compression = compression;
        
        image.writeToFile(output_path, options);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image converted to ${format} format: ${output_path}`
            }
          ]
        };
      }

      case 'image_morphology': {
        const { input_path, output_path, operation, kernel = [[1, 1, 1], [1, 1, 1], [1, 1, 1]], iterations = 1 } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const kernelMatrix = vipsInstance.Image.newFromArray(kernel);
        
        let result = image;
        for (let i = 0; i < iterations; i++) {
          switch (operation) {
            case 'erode':
              result = result.morph(kernelMatrix, vipsInstance.OperationMorphology.erode);
              break;
            case 'dilate':
              result = result.morph(kernelMatrix, vipsInstance.OperationMorphology.dilate);
              break;
            case 'opening':
              result = result.morph(kernelMatrix, vipsInstance.OperationMorphology.erode)
                           .morph(kernelMatrix, vipsInstance.OperationMorphology.dilate);
              break;
            case 'closing':
              result = result.morph(kernelMatrix, vipsInstance.OperationMorphology.dilate)
                           .morph(kernelMatrix, vipsInstance.OperationMorphology.erode);
              break;
          }
        }
        
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Morphological ${operation} applied (${iterations} iterations): ${output_path}`
            }
          ]
        };
      }

      case 'image_fft': {
        const { input_path, output_path, inverse = false } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = inverse ? image.invfft() : image.fwfft();
        
        // For display purposes, we might need to convert complex to real
        const displayResult = result.real ? result.real() : result;
        displayResult.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `${inverse ? 'Inverse ' : ''}FFT applied: ${output_path}`
            }
          ]
        };
      }

      case 'image_draw_line': {
        const { input_path, output_path, x1, y1, x2, y2, color = [0, 0, 0] } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = image.drawLine(color, x1, y1, x2, y2);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Line drawn from (${x1},${y1}) to (${x2},${y2}): ${output_path}`
            }
          ]
        };
      }

      case 'image_draw_circle': {
        const { input_path, output_path, x, y, radius, fill = false, color = [0, 0, 0] } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = fill 
          ? image.drawCircle(color, x, y, radius, { fill: true })
          : image.drawCircle(color, x, y, radius);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `${fill ? 'Filled ' : ''}Circle drawn at (${x},${y}) radius ${radius}: ${output_path}`
            }
          ]
        };
      }

      case 'image_convolution': {
        const { input_path, output_path, kernel, scale = 1, offset = 0 } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const kernelMatrix = vipsInstance.Image.newFromArray(kernel, scale, offset);
        const result = image.conv(kernelMatrix);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Custom convolution applied: ${output_path}`
            }
          ]
        };
      }

      case 'image_edge_detection': {
        const { input_path, output_path, method } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        
        let kernel: number[][];
        switch (method) {
          case 'sobel':
            kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
            break;
          case 'prewitt':
            kernel = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
            break;
          case 'roberts':
            kernel = [[1, 0], [0, -1]];
            break;
          case 'laplacian':
            kernel = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]];
            break;
          default:
            throw new Error(`Unknown edge detection method: ${method}`);
        }
        
        const kernelMatrix = vipsInstance.Image.newFromArray(kernel);
        const result = image.conv(kernelMatrix);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `${method} edge detection applied: ${output_path}`
            }
          ]
        };
      }

      case 'image_colorspace': {
        const { input_path, output_path, space } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = image.colourspace(space);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image converted to ${space} color space: ${output_path}`
            }
          ]
        };
      }

      case 'image_stats': {
        const { input_path } = args as { input_path: string };
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const stats = {
          min: image.min(),
          max: image.max(),
          avg: image.avg(),
          deviate: image.deviate(),
          width: image.width,
          height: image.height,
          bands: image.bands,
          format: image.format
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }

      // Keep legacy operations for compatibility
      case 'image_crop': {
        const { input_path, output_path, x, y, width, height } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = image.crop(x, y, width, height);
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image cropped successfully: ${output_path}`
            }
          ]
        };
      }

      case 'image_rotate': {
        const { input_path, output_path, angle, background = [255, 255, 255] } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = image.rotate(angle, { background });
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image rotated by ${angle} degrees: ${output_path}`
            }
          ]
        };
      }

      case 'image_flip': {
        const { input_path, output_path, direction } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        const image = vipsInstance.Image.newFromFile(input_path);
        const result = direction === 'horizontal' ? image.fliphor() : image.flipver();
        result.writeToFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image flipped ${direction}ly: ${output_path}`
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Enhanced server error:', error);
  process.exit(1);
}); 