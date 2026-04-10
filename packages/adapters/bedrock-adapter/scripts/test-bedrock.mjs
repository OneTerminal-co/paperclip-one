#!/usr/bin/env node

/**
 * Test script para verificar que Bedrock funciona correctamente
 * Uso: node packages/adapters/bedrock-adapter/scripts/test-bedrock.mjs
 */

import { getAdapter } from '../dist/index.js';

async function main() {
  console.log('🔍 Iniciando test de Bedrock...\n');
  const selectedModel = process.env.BEDROCK_MODEL || 'claude-sonnet';

  // Verificar variables de entorno
  console.log('📋 Verificando credenciales AWS:');
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  console.log(`  ✓ AWS_ACCESS_KEY_ID: ${hasAccessKey ? '✅ Configurada' : '❌ Falta'}`);
  console.log(`  ✓ AWS_SECRET_ACCESS_KEY: ${hasSecretKey ? '✅ Configurada' : '❌ Falta'}`);
  console.log(`  ✓ AWS_REGION: ${region}`);

  if (!hasAccessKey || !hasSecretKey) {
    console.error(
      '\n❌ Credenciales AWS no configuradas.\n' +
      'Actualiza .env.local con:\n' +
      '  AWS_ACCESS_KEY_ID=AKIA...\n' +
      '  AWS_SECRET_ACCESS_KEY=...\n' +
      '  AWS_REGION=us-east-1'
    );
    process.exit(1);
  }

  try {
    console.log('\n📡 Conectando a Bedrock...');
    const adapter = getAdapter();

    console.log('\n📚 Modelos disponibles:');
    const models = adapter.listModels();
    Object.entries(models).forEach(([alias, modelId]) => {
      console.log(`  • ${alias}: ${modelId}`);
    });

    console.log(`\n🎯 Enviando mensaje de prueba al modelo: ${selectedModel}`);
    const response = await adapter.invokeModel(
      selectedModel,
      [
        {
          role: 'user',
          content: 'Responde brevemente: ¿Qué eres?',
        },
      ],
      {
        temperature: 0.5,
        maxTokens: 100,
      }
    );

    console.log('\n✅ Respuesta exitosa:');
    response.content.forEach((block) => {
      if (block.type === 'text' && block.text) {
        console.log(`  "${block.text}"`);
      }
    });

    console.log('\n📊 Uso de tokens:');
    if (response.usage) {
      console.log(`  • Input tokens: ${response.usage.inputTokens}`);
      console.log(`  • Output tokens: ${response.usage.outputTokens}`);
    }

    console.log('\n🌊 Probando streaming...');
    let streamedText = '';
    const stream = adapter.invokeModelStream(selectedModel, [
      {
        role: 'user',
        content: 'Cuéntame un dato curioso sobre la IA (máximo 50 palabras)',
      },
    ]);

    process.stdout.write('  ');
    for await (const chunk of stream) {
      if (chunk.contentBlockDelta?.delta?.text) {
        const text = chunk.contentBlockDelta.delta.text;
        streamedText += text;
        process.stdout.write(text);
      }
    }
    console.log('\n');

    console.log('✨ ¡Bedrock está funcionando correctamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('  1. Integra estos adaptadores en tu servidor Paperclip');
    console.log('  2. Registra el adaptador en packages/adapters/index.ts');
    console.log('  3. Crea un agente que use Bedrock vía la UI');
    console.log('  4. Cuando sea necesario, actualiza .env.local con nuevas credenciales');
  } catch (error) {
    console.error('\n❌ Error al conectar con Bedrock:');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message.includes('InvalidSignatureException')) {
      console.error('\n💡 Posible solución:');
      console.error('  • Verifica que AWS_ACCESS_KEY_ID sea correcta');
      console.error('  • Verifica que AWS_SECRET_ACCESS_KEY sea correcta');
      console.error('  • Ejecuta: aws sts get-caller-identity');
    }

    if (error instanceof Error && error.message.includes('AccessDenied')) {
      console.error('\n💡 Posible solución:');
      console.error('  • La IAM policy no está correctamente adjunta al user');
      console.error('  • Verifica en AWS IAM que paperclip-bedrock-user tiene la BedrockPolicy');
    }

    process.exit(1);
  }
}

main();
