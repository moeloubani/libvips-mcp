#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = join(process.cwd(), 'test_images');
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
}

// Create a simple test image (1x1 white pixel PNG)
const whitePNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0xDB, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

const testImagePath = join(testDir, 'test.png');
writeFileSync(testImagePath, whitePNG);

console.log('🧪 Testing Libvips MCP Server');
console.log('============================');

// Test cases
const testCases = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    }
  },
  {
    name: 'Get Image Info',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'image_info',
        arguments: {
          image_path: testImagePath
        }
      }
    }
  },
  {
    name: 'Create Solid Color Image',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_solid_color',
        arguments: {
          output_path: join(testDir, 'red_square.png'),
          width: 100,
          height: 100,
          color: '#FF0000'
        }
      }
    }
  },
  {
    name: 'Resize Image',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'image_resize',
        arguments: {
          input_path: testImagePath,
          output_path: join(testDir, 'resized.png'),
          width: 200,
          height: 200
        }
      }
    }
  },
  {
    name: 'Convert Format',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'image_convert',
        arguments: {
          input_path: testImagePath,
          output_path: join(testDir, 'converted.webp'),
          format: 'webp',
          quality: 80
        }
      }
    }
  }
];

async function runTest(testCase: any): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    // Spawn the MCP server
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    
    server.stdout.on('data', (data: Buffer) => {
      response += data.toString();
    });

    server.stderr.on('data', (data: Buffer) => {
      console.error(`Error: ${data.toString()}`);
    });

    server.on('close', (code: number | null) => {
      if (code === 0) {
        try {
          // Parse the JSON-RPC response
          const lines = response.trim().split('\n');
          const jsonResponse = JSON.parse(lines[lines.length - 1]);
          
          console.log(`✅ ${testCase.name}: SUCCESS`);
          if (jsonResponse.result) {
            console.log(`   Response: ${JSON.stringify(jsonResponse.result, null, 2).substring(0, 200)}...`);
          }
        } catch (error) {
          console.log(`❌ ${testCase.name}: PARSE ERROR`);
          console.log(`   Raw response: ${response.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ ${testCase.name}: FAILED (exit code ${code})`);
      }
      resolve();
    });

    server.on('error', (error: Error) => {
      console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
      reject(error);
    });

    // Send the test request
    server.stdin.write(JSON.stringify(testCase.request) + '\n');
    server.stdin.end();
  });
}

async function runAllTests() {
  console.log(`📁 Test directory: ${testDir}`);
  console.log(`🖼️  Test image created: ${testImagePath}`);

  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    } catch (error) {
      console.error(`Test failed: ${error}`);
    }
  }

  console.log('\n🏁 All tests completed!');
  console.log('\nGenerated test files:');
  console.log(`   - ${testImagePath}`);
  console.log(`   - ${join(testDir, 'red_square.png')}`);
  console.log(`   - ${join(testDir, 'resized.png')}`);
  console.log(`   - ${join(testDir, 'converted.webp')}`);
}

runAllTests().catch(console.error); 