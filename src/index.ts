#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname, basename } from 'path';
import { mkdir } from 'fs/promises';

// Server setup
const server = new Server(
  {
    name: 'libvips-mcp-server',
    version: '1.0.0',
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

// Helper function to get image info
async function getImageInfo(imagePath: string) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const stats = await image.stats();
  
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    density: metadata.density,
    hasProfile: metadata.hasProfile,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    colorspace: metadata.space,
    size: statSync(imagePath).size,
    stats: stats
  };
}

// Define tools
const tools: Tool[] = [
  {
    name: 'image_info',
    description: 'Get detailed information about an image file',
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
    description: 'Resize an image while preserving aspect ratio or with specific dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        width: {
          type: 'number',
          description: 'Target width in pixels'
        },
        height: {
          type: 'number',
          description: 'Target height in pixels'
        },
        maintain_aspect_ratio: {
          type: 'boolean',
          description: 'Whether to maintain aspect ratio (default: true)',
          default: true
        },
        fit: {
          type: 'string',
          enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
          description: 'How the image should be resized to fit the target dimensions',
          default: 'cover'
        }
      },
      required: ['input_path', 'output_path']
    }
  },
  {
    name: 'image_convert',
    description: 'Convert image between different formats',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        format: {
          type: 'string',
          enum: ['jpeg', 'png', 'webp', 'tiff', 'avif', 'heif'],
          description: 'Target format'
        },
        quality: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          description: 'Quality for lossy formats (1-100)'
        }
      },
      required: ['input_path', 'output_path', 'format']
    }
  },
  {
    name: 'image_crop',
    description: 'Crop an image to specified dimensions and position',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        x: {
          type: 'number',
          description: 'X coordinate of crop area (left)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of crop area (top)'
        },
        width: {
          type: 'number',
          description: 'Width of crop area'
        },
        height: {
          type: 'number',
          description: 'Height of crop area'
        }
      },
      required: ['input_path', 'output_path', 'x', 'y', 'width', 'height']
    }
  },
  {
    name: 'image_rotate',
    description: 'Rotate an image by specified angle',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        angle: {
          type: 'number',
          description: 'Rotation angle in degrees (positive = clockwise)'
        },
        background: {
          type: 'string',
          description: 'Background color for empty areas (hex color)',
          default: '#000000'
        }
      },
      required: ['input_path', 'output_path', 'angle']
    }
  },
  {
    name: 'image_flip',
    description: 'Flip an image horizontally or vertically',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        direction: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Direction to flip the image'
        }
      },
      required: ['input_path', 'output_path', 'direction']
    }
  },
  {
    name: 'image_blur',
    description: 'Apply Gaussian blur to an image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        sigma: {
          type: 'number',
          description: 'Blur strength (sigma value)',
          minimum: 0.3,
          maximum: 1000,
          default: 1.0
        }
      },
      required: ['input_path', 'output_path']
    }
  },
  {
    name: 'image_sharpen',
    description: 'Apply unsharp mask to sharpen an image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        sigma: {
          type: 'number',
          description: 'Blur sigma for the mask',
          default: 1.0
        },
        flat: {
          type: 'number',
          description: 'Flat area threshold',
          default: 1.0
        },
        jagged: {
          type: 'number',
          description: 'Jagged area threshold',
          default: 2.0
        }
      },
      required: ['input_path', 'output_path']
    }
  },
  {
    name: 'image_adjust_brightness',
    description: 'Adjust image brightness',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        brightness: {
          type: 'number',
          description: 'Brightness adjustment (-100 to 100)',
          minimum: -100,
          maximum: 100
        }
      },
      required: ['input_path', 'output_path', 'brightness']
    }
  },
  {
    name: 'image_adjust_contrast',
    description: 'Adjust image contrast',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        contrast: {
          type: 'number',
          description: 'Contrast multiplier (0.1 to 3.0, 1.0 = no change)',
          minimum: 0.1,
          maximum: 3.0
        }
      },
      required: ['input_path', 'output_path', 'contrast']
    }
  },
  {
    name: 'image_adjust_saturation',
    description: 'Adjust image saturation',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        saturation: {
          type: 'number',
          description: 'Saturation multiplier (0.0 to 2.0, 1.0 = no change)',
          minimum: 0.0,
          maximum: 2.0
        }
      },
      required: ['input_path', 'output_path', 'saturation']
    }
  },
  {
    name: 'image_grayscale',
    description: 'Convert image to grayscale',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        }
      },
      required: ['input_path', 'output_path']
    }
  },
  {
    name: 'image_composite',
    description: 'Composite two images together with various blend modes',
    inputSchema: {
      type: 'object',
      properties: {
        base_image_path: {
          type: 'string',
          description: 'Path to base image'
        },
        overlay_image_path: {
          type: 'string',
          description: 'Path to overlay image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        x: {
          type: 'number',
          description: 'X position of overlay on base image',
          default: 0
        },
        y: {
          type: 'number',
          description: 'Y position of overlay on base image',
          default: 0
        },
        blend: {
          type: 'string',
          enum: ['over', 'in', 'out', 'atop', 'dest', 'dest-over', 'dest-in', 'dest-out', 'dest-atop', 'xor', 'add', 'saturate', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'colour-dodge', 'colour-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'],
          description: 'Blend mode for compositing',
          default: 'over'
        }
      },
      required: ['base_image_path', 'overlay_image_path', 'output_path']
    }
  },
  {
    name: 'image_thumbnail',
    description: 'Create a thumbnail maintaining aspect ratio',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        size: {
          type: 'number',
          description: 'Maximum dimension for thumbnail'
        },
        crop: {
          type: 'boolean',
          description: 'Whether to crop to exact square',
          default: false
        }
      },
      required: ['input_path', 'output_path', 'size']
    }
  },
  {
    name: 'image_extract_channel',
    description: 'Extract a specific channel from an image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        channel: {
          type: 'number',
          description: 'Channel index to extract (0=Red, 1=Green, 2=Blue, 3=Alpha)',
          minimum: 0,
          maximum: 3
        }
      },
      required: ['input_path', 'output_path', 'channel']
    }
  },
  {
    name: 'image_histogram',
    description: 'Generate histogram data for an image',
    inputSchema: {
      type: 'object',
      properties: {
        input_path: {
          type: 'string',
          description: 'Path to input image'
        },
        bins: {
          type: 'number',
          description: 'Number of histogram bins',
          default: 256
        }
      },
      required: ['input_path']
    }
  },
  {
    name: 'create_solid_color',
    description: 'Create a solid color image',
    inputSchema: {
      type: 'object',
      properties: {
        output_path: {
          type: 'string',
          description: 'Path for output image'
        },
        width: {
          type: 'number',
          description: 'Image width in pixels'
        },
        height: {
          type: 'number',
          description: 'Image height in pixels'
        },
        color: {
          type: 'string',
          description: 'Color in hex format (e.g., #FF0000)',
          default: '#FFFFFF'
        }
      },
      required: ['output_path', 'width', 'height']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
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
        const { input_path, output_path, width, height, maintain_aspect_ratio = true, fit = 'cover' } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        let image = sharp(input_path);
        
        const resizeOptions: any = { fit };
        if (width) resizeOptions.width = width;
        if (height) resizeOptions.height = height;
        if (!maintain_aspect_ratio) resizeOptions.fit = 'fill';
        
        await image.resize(resizeOptions).toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image resized successfully: ${output_path}`
            }
          ]
        };
      }

      case 'image_convert': {
        const { input_path, output_path, format, quality } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        let image = sharp(input_path);
        
        switch (format) {
          case 'jpeg':
            image = image.jpeg({ quality: quality || 80 });
            break;
          case 'png':
            image = image.png({ quality: quality || 80 });
            break;
          case 'webp':
            image = image.webp({ quality: quality || 80 });
            break;
          case 'tiff':
            image = image.tiff({ quality: quality || 80 });
            break;
          case 'avif':
            image = image.avif({ quality: quality || 80 });
            break;
          case 'heif':
            image = image.heif({ quality: quality || 80 });
            break;
        }
        
        await image.toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image converted to ${format}: ${output_path}`
            }
          ]
        };
      }

      case 'image_crop': {
        const { input_path, output_path, x, y, width, height } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .extract({ left: x, top: y, width, height })
          .toFile(output_path);
        
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
        const { input_path, output_path, angle, background = '#000000' } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .rotate(angle, { background })
          .toFile(output_path);
        
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
        
        let image = sharp(input_path);
        
        if (direction === 'horizontal') {
          image = image.flop();
        } else {
          image = image.flip();
        }
        
        await image.toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image flipped ${direction}ly: ${output_path}`
            }
          ]
        };
      }

      case 'image_blur': {
        const { input_path, output_path, sigma = 1.0 } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .blur(sigma)
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image blurred with sigma ${sigma}: ${output_path}`
            }
          ]
        };
      }

      case 'image_sharpen': {
        const { input_path, output_path, sigma = 1.0, flat = 1.0, jagged = 2.0 } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .sharpen(sigma, flat, jagged)
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image sharpened: ${output_path}`
            }
          ]
        };
      }

      case 'image_adjust_brightness': {
        const { input_path, output_path, brightness } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .modulate({ brightness: 1 + (brightness / 100) })
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image brightness adjusted by ${brightness}: ${output_path}`
            }
          ]
        };
      }

      case 'image_adjust_contrast': {
        const { input_path, output_path, contrast } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .linear(contrast, -(128 * contrast) + 128)
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image contrast adjusted by ${contrast}: ${output_path}`
            }
          ]
        };
      }

      case 'image_adjust_saturation': {
        const { input_path, output_path, saturation } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .modulate({ saturation })
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image saturation adjusted by ${saturation}: ${output_path}`
            }
          ]
        };
      }

      case 'image_grayscale': {
        const { input_path, output_path } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .grayscale()
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image converted to grayscale: ${output_path}`
            }
          ]
        };
      }

      case 'image_composite': {
        const { base_image_path, overlay_image_path, output_path, x = 0, y = 0, blend = 'over' } = args as any;
        
        if (!existsSync(base_image_path)) {
          throw new Error(`Base image not found: ${base_image_path}`);
        }
        if (!existsSync(overlay_image_path)) {
          throw new Error(`Overlay image not found: ${overlay_image_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(base_image_path)
          .composite([{ 
            input: overlay_image_path, 
            left: x, 
            top: y, 
            blend: blend as any 
          }])
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Images composited with ${blend} blend mode: ${output_path}`
            }
          ]
        };
      }

      case 'image_thumbnail': {
        const { input_path, output_path, size, crop = false } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        let image = sharp(input_path);
        
        if (crop) {
          image = image.resize(size, size, { fit: 'cover' });
        } else {
          image = image.resize(size, size, { fit: 'inside', withoutEnlargement: true });
        }
        
        await image.toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Thumbnail created (${size}px): ${output_path}`
            }
          ]
        };
      }

      case 'image_extract_channel': {
        const { input_path, output_path, channel } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        await ensureDirectoryExists(output_path);
        
        await sharp(input_path)
          .extractChannel(channel)
          .toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Channel ${channel} extracted: ${output_path}`
            }
          ]
        };
      }

      case 'image_histogram': {
        const { input_path, bins = 256 } = args as any;
        
        if (!existsSync(input_path)) {
          throw new Error(`Input image not found: ${input_path}`);
        }
        
        const stats = await sharp(input_path).stats();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                channels: stats.channels.map((channel, index) => ({
                  channel: index,
                  min: channel.min,
                  max: channel.max,
                  mean: channel.mean,
                  stdev: channel.stdev
                })),
                isOpaque: stats.isOpaque,
                entropy: stats.entropy,
                dominantColor: stats.dominant
              }, null, 2)
            }
          ]
        };
      }

      case 'create_solid_color': {
        const { output_path, width, height, color = '#FFFFFF' } = args as any;
        
        await ensureDirectoryExists(output_path);
        
        // Convert hex color to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r, g, b }
          }
        }).png().toFile(output_path);
        
        return {
          content: [
            {
              type: 'text',
              text: `Solid color image created (${width}x${height}, ${color}): ${output_path}`
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
  console.error('Server error:', error);
  process.exit(1);
}); 