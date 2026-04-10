#!/usr/bin/env node

/**
 * Test rápido: Claude Sonnet
 * Verifica que Claude Sonnet funciona en Bedrock
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

async function testClaudeSonnet() {
  console.log('🧪 Test: Claude Sonnet en Bedrock\n');

  const region = process.env.AWS_REGION || 'us-east-1';
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0';

  const payload = {
    anthropic_version: 'bedrock-2023-06-01',
    max_tokens: 100,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: 'Quien eres? Responde en 1 linea',
      },
    ],
  };

  const tmpFile = join(tmpdir(), `claude-sonnet-test-${Date.now()}.json`);
  const outFile = join(tmpdir(), `claude-sonnet-out-${Date.now()}.json`);

  writeFileSync(tmpFile, JSON.stringify(payload));

  try {
    console.log(`📡 Invocando: ${modelId}`);
    console.log(`🌍 Región: ${region}\n`);

    const cmd = `aws bedrock-runtime invoke-model --model-id ${modelId} --region ${region} --body fileb://${tmpFile} --content-type application/json ${outFile}`;

    await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

    const responseData = readFileSync(outFile, 'utf-8');
    const response = JSON.parse(responseData);

    const body = response.body
      ? typeof response.body === 'string'
        ? JSON.parse(response.body)
        : response.body
      : {};

    const message = body.content?.[0]?.text || 'Sin respuesta';

    console.log('✅ Claude Sonnet respondió exitosamente!\n');
    console.log(`📝 Respuesta: "${message.substring(0, 120)}..."\n`);

    if (response.usage) {
      console.log('📊 Uso de tokens:');
      console.log(`   Input:  ${response.usage.input_tokens} tokens`);
      console.log(`   Output: ${response.usage.output_tokens} tokens\n`);
    }

    console.log('✨ Claude Sonnet está funcionando correctamente en Bedrock');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {}
    try {
      unlinkSync(outFile);
    } catch {}
  }
}

testClaudeSonnet().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
