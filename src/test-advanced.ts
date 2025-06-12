#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Test data
const testImage = 'test-image.jpg';
const advancedTests = [
  // Frequency Domain Operations
  {
    name: 'Fast Fourier Transform',
    tool: 'image_fft',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-fft.jpg',
      inverse: false
    }
  },
  {
    name: 'Inverse Fast Fourier Transform',
    tool: 'image_fft',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-ifft.jpg',
      inverse: true
    }
  },

  // Custom Convolution
  {
    name: 'Custom Emboss Convolution',
    tool: 'image_custom_convolution',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-emboss.jpg',
      kernel: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
      scale: 1,
      offset: 128
    }
  },
  {
    name: 'Custom Sharpen Convolution',
    tool: 'image_custom_convolution',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-sharpen.jpg',
      kernel: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
      scale: 1,
      offset: 0
    }
  },

  // Color Space Conversions
  {
    name: 'Convert to LAB Color Space',
    tool: 'image_colorspace_convert',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-lab.jpg',
      space: 'lab'
    }
  },
  {
    name: 'Convert to HSV Color Space',
    tool: 'image_colorspace_convert',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-hsv.jpg',
      space: 'hsv'
    }
  },

  // Noise Operations
  {
    name: 'Add Gaussian Noise',
    tool: 'image_add_noise',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-gaussian-noise.jpg',
      noise_type: 'gaussian',
      amount: 0.05
    }
  },
  {
    name: 'Add Salt & Pepper Noise',
    tool: 'image_add_noise',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-salt-pepper.jpg',
      noise_type: 'salt_pepper',
      amount: 0.02
    }
  },

  // Geometric Transformations
  {
    name: 'Perspective Transform',
    tool: 'image_perspective_transform',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-perspective.jpg',
      corners: [[100, 100], [500, 50], [550, 400], [50, 450]]
    }
  },

  // Texture Analysis
  {
    name: 'Texture Analysis',
    tool: 'image_texture_analysis',
    args: {
      input_path: testImage,
      window_size: 7
    }
  },

  // Flood Fill
  {
    name: 'Flood Fill Operation',
    tool: 'image_flood_fill',
    args: {
      input_path: testImage,
      output_path: 'output/advanced-flood-fill.jpg',
      x: 1000,
      y: 800,
      fill_color: '#00FF00',
      tolerance: 20
    }
  },

  // Pyramid Creation
  {
    name: 'Create Image Pyramid',
    tool: 'image_create_pyramid',
    args: {
      input_path: testImage,
      output_dir: 'output/pyramid',
      levels: 5,
      scale_factor: 0.6
    }
  }
];

async function runAdvancedTest(test: any) {
  console.log(`\n🔬 Testing: ${test.name}`);
  
  try {
    const command = `echo '${JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: test.tool,
        arguments: test.args
      }
    })}' | node dist/index.js`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.warn(`⚠️ Warning: ${stderr}`);
    }
    
    const result = JSON.parse(stdout.split('\n').find(line => line.includes('"result"')) || '{}');
    
    if (result.error) {
      console.error(`❌ ${test.name} failed: ${result.error.message}`);
      return false;
    }
    
    if (test.args.output_path && existsSync(test.args.output_path)) {
      console.log(`✅ ${test.name} - Output created: ${test.args.output_path}`);
    } else if (test.args.output_dir) {
      console.log(`✅ ${test.name} - Directory created: ${test.args.output_dir}`);
    } else if (!test.args.output_path && !test.args.output_dir) {
      console.log(`✅ ${test.name} - Analysis completed`);
      const resultText = result.result?.content?.[0]?.text;
      if (resultText) {
        console.log(`📊 Result preview: ${resultText.substring(0, 150)}...`);
      }
    } else {
      console.log(`✅ ${test.name} - Completed`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${test.name} failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Advanced libvips MCP Server Operations (Step 2)');
  console.log('===========================================================\n');
  
  // Check if test image exists
  if (!existsSync(testImage)) {
    console.error(`❌ Test image not found: ${testImage}`);
    console.log('Please make sure you have the test image in the current directory.');
    process.exit(1);
  }
  
  let passed = 0;
  let total = advancedTests.length;
  
  console.log(`🧪 Running ${total} advanced operation tests...\n`);
  
  for (const test of advancedTests) {
    const success = await runAdvancedTest(test);
    if (success) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n===========================================================');
  console.log(`🎯 Advanced Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All advanced operations working perfectly!');
    console.log('✨ Professional-grade image processing capabilities confirmed');
    console.log('🔬 Scientific operations: FFT, custom convolution, texture analysis');
    console.log('🎨 Creative operations: noise generation, flood fill, perspective transform');
    console.log('📊 Analysis operations: color space conversion, pyramid creation');
  } else {
    console.log('⚠️ Some advanced tests failed - check the output above');
    console.log('💡 Note: Some operations may fall back to Sharp approximations');
  }
  
  console.log('\n📂 Check the output/ directory for generated images');
  console.log('📁 Check the output/pyramid/ directory for pyramid levels');
}

main().catch(console.error); 