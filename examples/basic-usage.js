#!/usr/bin/env node

/**
 * Basic usage example for the Libvips MCP Server
 * 
 * This script demonstrates how to interact with the MCP server
 * using JSON-RPC over stdin/stdout.
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple test image (100x100 white square PNG)
const createTestImage = () => {
  const testDir = join(__dirname, 'temp');
  if (!existsSync(testDir)) {
    import('fs').then(fs => fs.mkdirSync(testDir, { recursive: true }));
  }
  
  // Minimal PNG data for a 1x1 white pixel
  const whitePNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0xDB, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = join(testDir, 'test-image.png');
  writeFileSync(testImagePath, whitePNG);
  return testImagePath;
};

// Function to send a request to the MCP server
const sendRequest = (request) => {
  return new Promise((resolve, reject) => {
    // Start the MCP server
    const serverPath = join(__dirname, '..', 'dist', 'index.js');
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      response += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the last JSON response
          const lines = response.trim().split('\n');
          const jsonResponse = JSON.parse(lines[lines.length - 1]);
          resolve(jsonResponse);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nRaw: ${response}`));
        }
      } else {
        reject(new Error(`Server exited with code ${code}\nError: ${errorOutput}`));
      }
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
};

// Example usage
async function runExamples() {
  console.log('🎨 Libvips MCP Server - Basic Usage Examples');
  console.log('============================================\n');

  const testImagePath = createTestImage();
  console.log(`📁 Created test image: ${testImagePath}\n`);

  try {
    // Example 1: List available tools
    console.log('1️⃣ Listing available tools...');
    const toolsResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });
    console.log(`   Found ${toolsResponse.result.tools.length} tools available`);
    console.log(`   Tools: ${toolsResponse.result.tools.map(t => t.name).slice(0, 5).join(', ')}...\n`);

    // Example 2: Get image information
    console.log('2️⃣ Getting image information...');
    const infoResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'image_info',
        arguments: {
          image_path: testImagePath
        }
      }
    });
    
    if (infoResponse.result && infoResponse.result.content) {
      const imageInfo = JSON.parse(infoResponse.result.content[0].text);
      console.log(`   Format: ${imageInfo.format}`);
      console.log(`   Dimensions: ${imageInfo.width}x${imageInfo.height}`);
      console.log(`   Channels: ${imageInfo.channels}`);
      console.log(`   File size: ${imageInfo.size} bytes\n`);
    }

    // Example 3: Create a colored square
    console.log('3️⃣ Creating a colored square...');
    const outputPath = join(__dirname, 'temp', 'blue-square.png');
    const createResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_solid_color',
        arguments: {
          output_path: outputPath,
          width: 200,
          height: 200,
          color: '#0066CC'
        }
      }
    });
    
    if (createResponse.result && createResponse.result.content) {
      console.log(`   ✅ ${createResponse.result.content[0].text}\n`);
    }

    // Example 4: Convert image format
    console.log('4️⃣ Converting image format...');
    const convertedPath = join(__dirname, 'temp', 'converted.webp');
    const convertResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'image_convert',
        arguments: {
          input_path: outputPath,
          output_path: convertedPath,
          format: 'webp',
          quality: 85
        }
      }
    });
    
    if (convertResponse.result && convertResponse.result.content) {
      console.log(`   ✅ ${convertResponse.result.content[0].text}\n`);
    }

    console.log('🎉 All examples completed successfully!');
    console.log('\nGenerated files:');
    console.log(`   - ${testImagePath}`);
    console.log(`   - ${outputPath}`);
    console.log(`   - ${convertedPath}`);

  } catch (error) {
    console.error('❌ Error running examples:', error.message);
  }
}

// Run the examples
runExamples().catch(console.error); 