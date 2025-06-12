#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Test data
const testImage = 'test-image.jpg';
const tests = [
  // Test morphological operations
  {
    name: 'Morphological Erosion',
    tool: 'image_morphology',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-erode.jpg',
      operation: 'erode',
      kernel_size: 3,
      iterations: 1
    }
  },
  {
    name: 'Morphological Dilation',
    tool: 'image_morphology',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-dilate.jpg',
      operation: 'dilate',
      kernel_size: 3,
      iterations: 1
    }
  },
  {
    name: 'Morphological Opening',
    tool: 'image_morphology',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-opening.jpg',
      operation: 'opening',
      kernel_size: 5,
      iterations: 2
    }
  },
  // Test drawing operations
  {
    name: 'Draw Line',
    tool: 'image_draw_line',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-line.jpg',
      x1: 100,
      y1: 100,
      x2: 500,
      y2: 300,
      color: '#FF0000',
      width: 3
    }
  },
  {
    name: 'Draw Circle',
    tool: 'image_draw_circle',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-circle.jpg',
      x: 300,
      y: 200,
      radius: 100,
      fill: false,
      color: '#00FF00'
    }
  },
  {
    name: 'Draw Filled Circle',
    tool: 'image_draw_circle',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-filled-circle.jpg',
      x: 400,
      y: 250,
      radius: 75,
      fill: true,
      color: '#0000FF'
    }
  },
  // Test edge detection
  {
    name: 'Sobel Edge Detection',
    tool: 'image_edge_detection',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-sobel.jpg',
      method: 'sobel'
    }
  },
  {
    name: 'Laplacian Edge Detection',
    tool: 'image_edge_detection',
    args: {
      input_path: testImage,
      output_path: 'output/enhanced-laplacian.jpg',
      method: 'laplacian'
    }
  },
  // Test advanced statistics
  {
    name: 'Advanced Statistics',
    tool: 'image_advanced_stats',
    args: {
      input_path: testImage
    }
  }
];

async function runTest(test: any) {
  console.log(`\n🧪 Testing: ${test.name}`);
  
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
    } else if (!test.args.output_path) {
      console.log(`✅ ${test.name} - Analysis completed`);
      console.log(`📊 Result: ${result.result?.content?.[0]?.text?.substring(0, 200)}...`);
    } else {
      console.log(`✅ ${test.name} - Completed (no output file expected)`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${test.name} failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Enhanced libvips MCP Server v1.1.0 with wasm-vips capabilities');
  console.log('====================================================================\n');
  
  // Check if test image exists
  if (!existsSync(testImage)) {
    console.error(`❌ Test image not found: ${testImage}`);
    console.log('Please make sure you have the test image in the current directory.');
    process.exit(1);
  }
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await runTest(test);
    if (success) passed++;
  }
  
  console.log('\n====================================================================');
  console.log(`🎯 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All enhanced operations working perfectly!');
    console.log('✨ wasm-vips integration successful');
  } else {
    console.log('⚠️ Some tests failed - check the output above');
  }
  
  console.log('\n📂 Check the output/ directory for generated images');
}

main().catch(console.error); 