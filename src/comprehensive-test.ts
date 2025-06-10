#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const testDir = join(process.cwd(), 'test_images');
const inputImage = join(testDir, 'test-image.jpg');

// Ensure test directory exists
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
}

// Function to send a request to the MCP server
async function sendRequest(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    let errorOutput = '';

    server.stdout.on('data', (data: Buffer) => {
      response += data.toString();
    });

    server.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    server.on('close', (code: number | null) => {
      if (code === 0) {
        try {
          const lines = response.trim().split('\n');
          const jsonResponse = JSON.parse(lines[lines.length - 1]);
          resolve(jsonResponse);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}\nRaw: ${response.substring(0, 500)}...`));
        }
      } else {
        reject(new Error(`Server exited with code ${code}\nError: ${errorOutput}`));
      }
    });

    server.on('error', (error: Error) => {
      reject(error);
    });

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Test operations
const testOperations = [
  {
    name: 'Get Image Information',
    operation: 'image_info',
    params: {
      image_path: inputImage
    },
    outputFile: null
  },
  {
    name: 'Resize - Small Thumbnail (200x200)',
    operation: 'image_resize',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'resized_200x200.jpg'),
      width: 200,
      height: 200,
      fit: 'cover'
    },
    outputFile: 'resized_200x200.jpg'
  },
  {
    name: 'Resize - Large (1024x768)',
    operation: 'image_resize',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'resized_1024x768.jpg'),
      width: 1024,
      height: 768,
      fit: 'inside'
    },
    outputFile: 'resized_1024x768.jpg'
  },
  {
    name: 'Convert to PNG',
    operation: 'image_convert',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'converted_to_png.png'),
      format: 'png'
    },
    outputFile: 'converted_to_png.png'
  },
  {
    name: 'Convert to WebP (High Quality)',
    operation: 'image_convert',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'converted_to_webp_high.webp'),
      format: 'webp',
      quality: 90
    },
    outputFile: 'converted_to_webp_high.webp'
  },
  {
    name: 'Convert to WebP (Low Quality)',
    operation: 'image_convert',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'converted_to_webp_low.webp'),
      format: 'webp',
      quality: 30
    },
    outputFile: 'converted_to_webp_low.webp'
  },
  {
    name: 'Crop - Center Square (300x300)',
    operation: 'image_crop',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'cropped_center_300x300.jpg'),
      x: 100, // Will adjust based on actual image size
      y: 100,
      width: 300,
      height: 300
    },
    outputFile: 'cropped_center_300x300.jpg'
  },
  {
    name: 'Crop - Top Left Corner (200x200)',
    operation: 'image_crop',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'cropped_topleft_200x200.jpg'),
      x: 0,
      y: 0,
      width: 200,
      height: 200
    },
    outputFile: 'cropped_topleft_200x200.jpg'
  },
  {
    name: 'Rotate 45 degrees',
    operation: 'image_rotate',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'rotated_45deg.jpg'),
      angle: 45,
      background: '#FFFFFF'
    },
    outputFile: 'rotated_45deg.jpg'
  },
  {
    name: 'Rotate 90 degrees',
    operation: 'image_rotate',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'rotated_90deg.jpg'),
      angle: 90
    },
    outputFile: 'rotated_90deg.jpg'
  },
  {
    name: 'Flip Horizontal',
    operation: 'image_flip',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'flipped_horizontal.jpg'),
      direction: 'horizontal'
    },
    outputFile: 'flipped_horizontal.jpg'
  },
  {
    name: 'Flip Vertical',
    operation: 'image_flip',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'flipped_vertical.jpg'),
      direction: 'vertical'
    },
    outputFile: 'flipped_vertical.jpg'
  },
  {
    name: 'Blur - Light',
    operation: 'image_blur',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'blurred_light.jpg'),
      sigma: 2.0
    },
    outputFile: 'blurred_light.jpg'
  },
  {
    name: 'Blur - Heavy',
    operation: 'image_blur',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'blurred_heavy.jpg'),
      sigma: 10.0
    },
    outputFile: 'blurred_heavy.jpg'
  },
  {
    name: 'Sharpen',
    operation: 'image_sharpen',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'sharpened.jpg'),
      sigma: 1.0,
      flat: 1.0,
      jagged: 2.0
    },
    outputFile: 'sharpened.jpg'
  },
  {
    name: 'Brighten (+30)',
    operation: 'image_adjust_brightness',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'brightened_30.jpg'),
      brightness: 30
    },
    outputFile: 'brightened_30.jpg'
  },
  {
    name: 'Darken (-30)',
    operation: 'image_adjust_brightness',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'darkened_30.jpg'),
      brightness: -30
    },
    outputFile: 'darkened_30.jpg'
  },
  {
    name: 'Increase Contrast (1.5x)',
    operation: 'image_adjust_contrast',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'contrast_increased.jpg'),
      contrast: 1.5
    },
    outputFile: 'contrast_increased.jpg'
  },
  {
    name: 'Decrease Contrast (0.7x)',
    operation: 'image_adjust_contrast',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'contrast_decreased.jpg'),
      contrast: 0.7
    },
    outputFile: 'contrast_decreased.jpg'
  },
  {
    name: 'Increase Saturation (1.5x)',
    operation: 'image_adjust_saturation',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'saturation_increased.jpg'),
      saturation: 1.5
    },
    outputFile: 'saturation_increased.jpg'
  },
  {
    name: 'Decrease Saturation (0.5x)',
    operation: 'image_adjust_saturation',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'saturation_decreased.jpg'),
      saturation: 0.5
    },
    outputFile: 'saturation_decreased.jpg'
  },
  {
    name: 'Convert to Grayscale',
    operation: 'image_grayscale',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'grayscale.jpg')
    },
    outputFile: 'grayscale.jpg'
  },
  {
    name: 'Thumbnail - Square Crop (150x150)',
    operation: 'image_thumbnail',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'thumbnail_square_150.jpg'),
      size: 150,
      crop: true
    },
    outputFile: 'thumbnail_square_150.jpg'
  },
  {
    name: 'Thumbnail - Fit Inside (300px)',
    operation: 'image_thumbnail',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'thumbnail_fit_300.jpg'),
      size: 300,
      crop: false
    },
    outputFile: 'thumbnail_fit_300.jpg'
  },
  {
    name: 'Extract Red Channel',
    operation: 'image_extract_channel',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'channel_red.jpg'),
      channel: 0
    },
    outputFile: 'channel_red.jpg'
  },
  {
    name: 'Extract Green Channel',
    operation: 'image_extract_channel',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'channel_green.jpg'),
      channel: 1
    },
    outputFile: 'channel_green.jpg'
  },
  {
    name: 'Extract Blue Channel',
    operation: 'image_extract_channel',
    params: {
      input_path: inputImage,
      output_path: join(testDir, 'channel_blue.jpg'),
      channel: 2
    },
    outputFile: 'channel_blue.jpg'
  },
  {
    name: 'Get Histogram Statistics',
    operation: 'image_histogram',
    params: {
      input_path: inputImage,
      bins: 256
    },
    outputFile: null
  }
];

async function runComprehensiveTests() {
  console.log('🎨 Comprehensive Libvips MCP Server Tests');
  console.log('==========================================');
  console.log(`📁 Input image: ${inputImage}`);
  console.log(`📁 Output directory: ${testDir}\n`);

  if (!existsSync(inputImage)) {
    console.error(`❌ Input image not found: ${inputImage}`);
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  const generatedFiles: string[] = [];

  for (let i = 0; i < testOperations.length; i++) {
    const test = testOperations[i];
    console.log(`${i + 1}/${testOperations.length} 🔄 ${test.name}...`);

    try {
      const response = await sendRequest({
        jsonrpc: '2.0',
        id: i + 1,
        method: 'tools/call',
        params: {
          name: test.operation,
          arguments: test.params
        }
      });

      if (response.result && !response.result.isError) {
        console.log(`     ✅ SUCCESS`);
        
        if (test.outputFile) {
          generatedFiles.push(test.outputFile);
          console.log(`     📄 Generated: ${test.outputFile}`);
        }
        
        // Log some info for info/histogram operations
        if (test.operation === 'image_info' || test.operation === 'image_histogram') {
          const content = response.result.content[0].text;
          const data = JSON.parse(content);
          
          if (test.operation === 'image_info') {
            console.log(`     📊 ${data.width}x${data.height}, ${data.format}, ${data.channels} channels, ${Math.round(data.size/1024)}KB`);
          } else {
            console.log(`     📈 Channels: ${data.channels.length}, Entropy: ${data.entropy?.toFixed(2) || 'N/A'}`);
          }
        }
        
        successCount++;
      } else {
        console.log(`     ❌ FAILED: ${response.result?.content?.[0]?.text || 'Unknown error'}`);
        failureCount++;
      }
    } catch (error) {
      console.log(`     ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      failureCount++;
    }

    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🏁 Test Summary');
  console.log('================');
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations: ${failureCount}`);
  console.log(`📁 Total files generated: ${generatedFiles.length}`);
  
  if (generatedFiles.length > 0) {
    console.log('\n📂 Generated Files:');
    generatedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }

  console.log(`\n🎯 All output files saved to: ${testDir}`);
}

// Create some solid color images for compositing tests
async function createComposingImages() {
  console.log('\n🎨 Creating additional images for compositing tests...');
  
  const solidColorTests = [
    {
      name: 'Red Overlay (100x100)',
      params: {
        output_path: join(testDir, 'overlay_red_100x100.png'),
        width: 100,
        height: 100,
        color: '#FF0000'
      }
    },
    {
      name: 'Blue Circle-like Overlay (150x150)',
      params: {
        output_path: join(testDir, 'overlay_blue_150x150.png'),
        width: 150,
        height: 150,
        color: '#0066CC'
      }
    },
    {
      name: 'Semi-transparent Green (200x200)',
      params: {
        output_path: join(testDir, 'overlay_green_200x200.png'),
        width: 200,
        height: 200,
        color: '#00FF00'
      }
    }
  ];

  for (const test of solidColorTests) {
    try {
      const response = await sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'create_solid_color',
          arguments: test.params
        }
      });

      if (response.result && !response.result.isError) {
        console.log(`   ✅ ${test.name} created`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to create ${test.name}`);
    }
  }

  // Now run compositing tests
  const compositingTests = [
    {
      name: 'Composite - Red Overlay (Over)',
      params: {
        base_image_path: inputImage,
        overlay_image_path: join(testDir, 'overlay_red_100x100.png'),
        output_path: join(testDir, 'composite_red_over.jpg'),
        x: 50,
        y: 50,
        blend: 'over'
      }
    },
    {
      name: 'Composite - Blue Overlay (Multiply)',
      params: {
        base_image_path: inputImage,
        overlay_image_path: join(testDir, 'overlay_blue_150x150.png'),
        output_path: join(testDir, 'composite_blue_multiply.jpg'),
        x: 100,
        y: 100,
        blend: 'multiply'
      }
    },
    {
      name: 'Composite - Green Overlay (Screen)',
      params: {
        base_image_path: inputImage,
        overlay_image_path: join(testDir, 'overlay_green_200x200.png'),
        output_path: join(testDir, 'composite_green_screen.jpg'),
        x: 20,
        y: 20,
        blend: 'screen'
      }
    }
  ];

  console.log('\n🎭 Running compositing tests...');
  for (const test of compositingTests) {
    try {
      const response = await sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'image_composite',
          arguments: test.params
        }
      });

      if (response.result && !response.result.isError) {
        console.log(`   ✅ ${test.name} completed`);
      } else {
        console.log(`   ❌ ${test.name} failed`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  await runComprehensiveTests();
  await createComposingImages();
}

runAllTests().catch(console.error); 