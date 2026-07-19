import fs from 'fs';
import path from 'path';
import os from 'os';
import { performance } from 'perf_hooks';
import { testCases } from './testCases.js';
import { processChatStream } from '../electron/ai/llm.js';
import { OLLAMA_HOST, getAvailableModels } from '../electron/ai/ollamaManager.js';

// Define the model matrices
const LOW_END_MODELS = ['phi', 'qwen2.5:0.5b', 'llama3.2'];
const HIGH_END_MODELS = ['llama3.1:70b', 'qwen2.5:32b', 'mixtral:8x7b'];

// Configuration
const REPORT_PATH = path.join(process.cwd(), 'tests', 'test_report.md');
// Simulated User Keys for Testing live API wrappers
const MOCK_API_KEYS = {
  weather: 'mock_weather_key',
  spotify: 'mock_spotify_playlist'
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  return {
    freeMem: os.freemem(),
    totalMem: os.totalmem(),
    processHeapUsed: memUsage.heapUsed,
    processRss: memUsage.rss
  };
}

async function runTest() {
  console.log("=========================================");
  console.log(" Whispr AI Orchestrator Test Suite       ");
  console.log("=========================================\n");

  const installedModels = await getAvailableModels();
  if (installedModels.length === 0) {
    console.error("ERROR: No Ollama models found installed. Please install models to run tests.");
    process.exit(1);
  }
  console.log(`Installed Models: ${installedModels.join(', ')}\n`);

  let report = `# Whispr AI Orchestrator Background Test Report\n\n`;
  report += `*Date: ${new Date().toLocaleString()}*\n`;
  report += `*System: ${os.type()} ${os.arch()} | ${os.cpus()[0].model} | ${bytesToMB(os.totalmem())} RAM*\n\n`;

  const runMatrix = async (modelsArray, matrixName) => {
    console.log(`\n--- Starting ${matrixName} Matrix ---`);
    report += `## ${matrixName} Matrix\n\n`;

    for (const testModel of modelsArray) {
      if (!installedModels.some(m => m.includes(testModel))) {
        console.log(`[SKIP] Model '${testModel}' not installed locally.`);
        report += `### Model: \`${testModel}\` - ⚠️ Not Installed\n\n`;
        continue;
      }

      console.log(`\n>>> Testing Model: ${testModel}`);
      report += `### Model: \`${testModel}\`\n\n`;

      // Assign the test model to all preferences to force its usage
      const prefs = {
        fast: testModel,
        heavy: testModel,
        code: testModel,
        math: testModel,
        history: testModel,
        science: testModel,
        business: testModel,
        engineering: testModel,
        gaming: testModel
      };
      
      const apiKeys = { ...MOCK_API_KEYS, modelPrefs: prefs };

      report += `| Test Case | Domain | TTFT (ms) | Total Time (ms) | Tools Invoked | Passed? | Ram Usage |\n`;
      report += `|---|---|---|---|---|---|---|\n`;

      for (const testCase of testCases) {
        process.stdout.write(`  -> Running: ${testCase.name}... `);

        let firstTokenTime = null;
        let responseContent = "";
        let toolsInvoked = [];
        
        const startTime = performance.now();
        const startMem = getSystemMetrics();

        const messages = [{ role: 'user', content: testCase.prompt }];

        await processChatStream(
          messages,
          testModel,
          (token) => {
            if (token === "__CLEAR_LAST__") {
              responseContent = "";
            } else {
              if (firstTokenTime === null) {
                firstTokenTime = performance.now();
              }
              responseContent += token;
            }
          },
          (toolName, args) => {
            toolsInvoked.push(toolName);
          },
          (toolName, result) => {
            // No op for tool result logging in report for brevity
          },
          apiKeys
        );

        const endTime = performance.now();
        const endMem = getSystemMetrics();
        const memDelta = endMem.processRss - startMem.processRss;

        const ttft = firstTokenTime ? (firstTokenTime - startTime).toFixed(2) : 'N/A';
        const totalTime = (endTime - startTime).toFixed(2);

        // Validation
        let passed = true;
        if (testCase.expectedTools && testCase.expectedTools.length > 0) {
          const toolMatches = testCase.expectedTools.every(t => toolsInvoked.includes(t));
          if (!toolMatches) passed = false;
        }
        if (testCase.expectedContentMatch && testCase.expectedContentMatch.length > 0) {
          const contentMatches = testCase.expectedContentMatch.some(m => responseContent.includes(m));
          if (!contentMatches) passed = false;
        }

        console.log(passed ? "✅ PASS" : "❌ FAIL");
        
        const passedStr = passed ? '✅ Pass' : '❌ Fail';
        const toolStr = toolsInvoked.length > 0 ? toolsInvoked.join(', ') : 'None';
        const memStr = (memDelta > 0 ? '+' : '') + bytesToMB(memDelta);

        report += `| ${testCase.name} | \`${testCase.domain}\` | ${ttft} | ${totalTime} | \`${toolStr}\` | ${passedStr} | ${memStr} |\n`;

        // If it failed, log the output to report for debugging
        if (!passed) {
          report += `\n**Failure Details for ${testCase.name}:**\n`;
          report += `- **Expected Tools:** ${testCase.expectedTools.join(', ') || 'None'}\n`;
          report += `- **Actual Tools:** ${toolsInvoked.join(', ') || 'None'}\n`;
          report += `- **Response Excerpt:** \n\`\`\`text\n${responseContent.substring(0, 300)}...\n\`\`\`\n\n`;
        }

        // Cool down to prevent system lockup
        await delay(1000);
      }
      
      report += `\n---\n`;
    }
  };

  await runMatrix(LOW_END_MODELS, "Low-End Devices");
  await runMatrix(HIGH_END_MODELS, "High-End Devices");

  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\n✅ Test suite complete. Report saved to ${REPORT_PATH}`);
  process.exit(0);
}

runTest().catch(err => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
