#!/usr/bin/env node

/**
 * Script de prueba SEGURO para Bedrock
 * Uso: pnpm test:bedrock
 * 
 * Este script:
 * 1. Lee credenciales SOLO de variables de entorno locales
 * 2. Valida que existan sin mostrarlas
 * 3. Ejecuta tests contra Bedrock
 * 4. Reporta éxito/fallo sin exponer datos sensibles
 * 5. Genera un archivo de reporte (no incluye credenciales)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SafeBedrockTest {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0 },
    };
  }

  validateCredentials() {
    console.log('🔍 Validando credenciales...\n');

    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    console.log(`  AWS_ACCESS_KEY_ID: ${hasAccessKey ? '✅ Configurada' : '❌ Falta'}`);
    console.log(`  AWS_SECRET_ACCESS_KEY: ${hasSecretKey ? '✅ Configurada' : '❌ Falta'}`);
    console.log(`  AWS_REGION: ${region}`);

    if (!hasAccessKey || !hasSecretKey) {
      console.error('\n❌ Credenciales AWS no configuradas');
      console.error('Configura variables de entorno:');
      console.error('  export AWS_ACCESS_KEY_ID=AKIA...');
      console.error('  export AWS_SECRET_ACCESS_KEY=...');
      console.error('  export AWS_REGION=us-east-1');
      return false;
    }

    console.log('\n✅ Credenciales encontradas\n');
    return true;
  }

  async testAwsConnection() {
    console.log('📡 Verificando conexión a AWS...');

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('aws sts get-caller-identity 2>&1');
      const result = JSON.parse(stdout);

      this.report.tests.push({
        name: 'AWS Connection',
        status: 'passed',
        message: `User: ${result.Arn}`,
      });

      console.log(`  ✅ Conectado a AWS`);
      console.log(`  ARN: ${result.Arn}\n`);
      this.report.summary.passed++;
      return true;
    } catch (error) {
      this.report.tests.push({
        name: 'AWS Connection',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`  ❌ Error de conexión`);
      console.error(`  ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      this.report.summary.failed++;
      return false;
    }
  }

  async testBedrockAccess() {
    console.log('🤖 Verificando acceso a Bedrock...');

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const region = process.env.AWS_REGION || 'us-east-1';
      const { stdout } = await execAsync(
        `aws bedrock list-foundation-models --region ${region} 2>&1`
      );
      const result = JSON.parse(stdout);

      const modelCount = result.modelSummaries?.length || 0;

      this.report.tests.push({
        name: 'Bedrock Access',
        status: 'passed',
        message: `${modelCount} modelos disponibles`,
      });

      console.log(`  ✅ Acceso a Bedrock confirma do`);
      console.log(`  Modelos disponibles: ${modelCount}\n`);
      this.report.summary.passed++;
      return true;
    } catch (error) {
      this.report.tests.push({
        name: 'Bedrock Access',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`  ❌ Error de acceso a Bedrock`);
      console.error(`  ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      this.report.summary.failed++;
      return false;
    }
  }

  async testBedrockInvoke() {
    console.log('💬 Probando invocación de modelo...');

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const { writeFileSync, readFileSync, unlinkSync } = await import('fs');
      const { tmpdir } = await import('os');
      const { join } = await import('path');
      
      const execAsync = promisify(exec);

      const region = process.env.AWS_REGION || 'us-east-1';
      const modelId = 'meta.llama3-8b-instruct-v1:0';

      const payload = {
        prompt: 'Who are you?',
        max_gen_len: 100,
      };

      // Archivos temporales
      const tmpFile = join(tmpdir(), `bedrock-test-${Date.now()}.json`);
      const outFile = join(tmpdir(), `bedrock-out-${Date.now()}.json`);
      
      writeFileSync(tmpFile, JSON.stringify(payload));

      try {
        // Invoca modelo usando AWS CLI con archivo de salida
        const cmd = `aws bedrock-runtime invoke-model ` +
          `--model-id ${modelId} ` +
          `--region ${region} ` +
          `--body fileb://${tmpFile} ` +
          `--content-type application/json ` +
          `${outFile}`;

        await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

        // Lee la respuesta
        const responseData = readFileSync(outFile, 'utf-8');
        const response = JSON.parse(responseData);
        
        // Parsea el body que es un string JSON (formato Llama)
        const message = response.body
          ? (typeof response.body === 'string'
              ? JSON.parse(response.body)
              : response.body
            ).outputs?.[0]?.text || 'Sin respuesta'
          : 'Sin respuesta';

        this.report.tests.push({
          name: 'Model Invocation',
          status: 'passed',
          message: 'Modelo respondió correctamente',
        });

        console.log(`  ✅ Modelo respondió`);
        console.log(`  Respuesta: "${message.substring(0, 80)}..."\n`);
        this.report.summary.passed++;
        return true;
      } finally {
        // Limpia archivos temporales
        try {
          unlinkSync(tmpFile);
        } catch {}
        try {
          unlinkSync(outFile);
        } catch {}
      }
    } catch (error) {
      this.report.tests.push({
        name: 'Model Invocation',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`  ❌ Error en invocación`);
      console.error(`  ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      this.report.summary.failed++;
      return false;
    }
  }

  saveReport() {
    const reportPath = path.join(__dirname, 'bedrock-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`📋 Reporte guardado: ${reportPath}`);
    return reportPath;
  }

  printSummary() {
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('═══════════════════════════════════════\n');

    this.report.tests.forEach((test) => {
      const icon = test.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.message}`);
    });

    console.log('\n───────────────────────────────────────');
    console.log(`✅ Pasadas: ${this.report.summary.passed}`);
    console.log(`❌ Fallidas: ${this.report.summary.failed}`);
    console.log('───────────────────────────────────────\n');

    if (this.report.summary.failed === 0) {
      console.log('🎉 ¡Bedrock está funcionando correctamente!');
      console.log('\n📝 Próximos pasos:');
      console.log('  1. Integrarse en packages/adapters/index.ts');
      console.log('  2. Crear agente en UI de Paperclip');
      console.log('  3. Pasar credenciales solo via env vars');
    } else {
      console.log('⚠️ Hay problemas con la configuración');
      console.log('Revisa los errores arriba para detalles');
    }

    console.log('');
  }

  async run() {
    console.log('🔐 BEDROCK TEST SEGURO');
    console.log('════════════════════════════════════════\n');

    if (!this.validateCredentials()) {
      process.exit(1);
    }

    await this.testAwsConnection();
    await this.testBedrockAccess();
    await this.testBedrockInvoke();

    this.printSummary();
    this.saveReport();

    process.exit(this.report.summary.failed > 0 ? 1 : 0);
  }
}

const tester = new SafeBedrockTest();
tester.run().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
