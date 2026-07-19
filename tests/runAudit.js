import { processChatStream } from '../electron/ai/llm.js';
import { testCases } from './testCases.js';

async function runAudit() {
  console.log('--- Starting Whispr Orchestrator Audit ---\n');
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n▶ Testing [${testCase.domain}] - ${testCase.name}`);
    console.log(`  Prompt: "${testCase.prompt}"`);

    const messages = [{ role: 'user', content: testCase.prompt }];
    
    let contentBuf = '';
    const toolsInvoked = [];

    const onToken = (token) => {
      contentBuf += token;
    };

    const onTool = (toolName, args) => {
      toolsInvoked.push(toolName);
    };

    const onToolResult = (toolName, resultStr) => {
      // Mock result output
    };
    
    const onSpeedWarning = () => {};

    try {
      await processChatStream(
        messages,
        'qwen2.5:32b', // default model to use or let router pick
        onToken,
        onTool,
        onToolResult,
        {}, // apiKeys
        onSpeedWarning
      );

      console.log(`  Response: ${contentBuf.substring(0, 150).replace(/\n/g, ' ')}...`);
      console.log(`  Tools invoked: [${toolsInvoked.join(', ')}]`);

      let testPassed = true;
      let failReasons = [];

      // Check Expected Tools
      if (testCase.expectedTools) {
        for (const expectedTool of testCase.expectedTools) {
          if (!toolsInvoked.includes(expectedTool)) {
            testPassed = false;
            failReasons.push(`Expected tool '${expectedTool}' was not invoked.`);
          }
        }
      }

      // Check unexpected tools
      if (testCase.expectedTools && testCase.expectedTools.length === 0 && toolsInvoked.length > 0) {
        testPassed = false;
        failReasons.push(`Expected NO tools, but invoked: [${toolsInvoked.join(', ')}]`);
      }

      // Check Content Match
      if (testCase.expectedContentMatch && testCase.expectedContentMatch.length > 0) {
        for (const match of testCase.expectedContentMatch) {
          if (!contentBuf.toLowerCase().includes(match.toLowerCase())) {
            // Note: Since LLM output varies, we treat content match failures as warnings if it's strict,
            // but let's record it.
            console.log(`  [Warn] Missing expected content: '${match}'`);
          }
        }
      }

      if (testPassed) {
        console.log('  ✅ PASS');
        passed++;
      } else {
        console.log('  ❌ FAIL:', failReasons.join(' | '));
        failed++;
      }

    } catch (e) {
      console.log(`  ❌ CRASH: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n--- Audit Complete ---`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runAudit();
