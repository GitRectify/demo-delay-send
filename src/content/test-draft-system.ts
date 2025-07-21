// Test file for Gmail Draft ID System
// Run this in the browser console on Gmail to test the draft ID functionality

import { DraftUtils } from './utils/draftManager';

console.log("[Draft System Test] Loading test functions...");

// Test 1: Basic draft ID functionality
export async function testBasicDraftId() {
  console.log("=== Test 1: Basic Draft ID ===");
  
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (!composeWindow) {
    console.log("❌ No compose window found. Please open a compose window first.");
    return;
  }
  
  try {
    // Register compose window
    const composeId = DraftUtils.registerCompose(composeWindow);
    console.log("✅ Compose window registered:", composeId);
    
    // Wait for draft save
    console.log("⏳ Waiting for draft to be saved...");
    const draftInfo = await DraftUtils.waitForDraftSave(composeId);
    console.log("✅ Draft saved:", {
      id: draftInfo.draftId,
      order: draftInfo.order,
      timestamp: new Date(draftInfo.timestamp).toLocaleString()
    });
    
    return draftInfo;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return null;
  }
}

// Test 2: Multiple compose windows
export async function testMultipleComposeWindows() {
  console.log("=== Test 2: Multiple Compose Windows ===");
  
  const composeWindows = document.querySelectorAll('[role="dialog"][aria-label*="Compose"]');
  console.log(`Found ${composeWindows.length} compose windows`);
  
  if (composeWindows.length === 0) {
    console.log("❌ No compose windows found. Please open compose windows first.");
    return;
  }
  
  const results = [];
  
  for (let i = 0; i < composeWindows.length; i++) {
    const composeWindow = composeWindows[i] as HTMLElement;
    console.log(`Processing compose window ${i + 1}...`);
    
    try {
      const composeId = DraftUtils.registerCompose(composeWindow);
      const draftInfo = await DraftUtils.waitForDraftSave(composeId);
      
      results.push({
        windowIndex: i + 1,
        composeId,
        draftInfo
      });
      
      console.log(`✅ Window ${i + 1} processed:`, draftInfo.draftId);
    } catch (error) {
      console.error(`❌ Window ${i + 1} failed:`, error);
    }
  }
  
  console.log("📊 Results:", results);
  return results;
}

// Test 3: Draft order tracking
export async function testDraftOrderTracking() {
  console.log("=== Test 3: Draft Order Tracking ===");
  
  try {
    const draftInfo = await DraftUtils.getLatestDraftIdWithOrder();
    console.log("✅ Latest draft:", {
      id: draftInfo.draftId,
      order: draftInfo.order,
      timestamp: new Date(draftInfo.timestamp).toLocaleString()
    });
    
    console.log(`📝 This is draft #${draftInfo.order} in the current session`);
    return draftInfo;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return null;
  }
}

// Test 4: Error handling and fallbacks
export async function testErrorHandling() {
  console.log("=== Test 4: Error Handling ===");
  
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (!composeWindow) {
    console.log("❌ No compose window found. Please open a compose window first.");
    return;
  }
  
  try {
    const composeId = DraftUtils.registerCompose(composeWindow);
    const draftInfo = await DraftUtils.waitForDraftSave(composeId);
    
    console.log("✅ Draft info obtained:", draftInfo.draftId);
    
    // Test API send (this might fail if no real draft exists)
    try {
      await DraftUtils.sendDraft(draftInfo.draftId);
      console.log("✅ Draft sent via API");
    } catch (apiError) {
      console.warn("⚠️ API send failed (expected for test):", apiError.message);
      console.log("✅ Fallback mechanism would trigger here");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Test 5: Cleanup
export async function testCleanup() {
  console.log("=== Test 5: Cleanup ===");
  
  try {
    await DraftUtils.cleanupOldDrafts();
    console.log("✅ Old drafts cleaned up");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

// Run all tests
export async function runAllTests() {
  console.log("🚀 Running all draft system tests...");
  
  await testBasicDraftId();
  await testMultipleComposeWindows();
  await testDraftOrderTracking();
  await testErrorHandling();
  await testCleanup();
  
  console.log("🎉 All tests completed!");
}

// Make functions available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).DraftTests = {
    testBasicDraftId,
    testMultipleComposeWindows,
    testDraftOrderTracking,
    testErrorHandling,
    testCleanup,
    runAllTests
  };
  
  console.log("[Draft System Test] Test functions loaded!");
  console.log("Available functions:");
  console.log("- DraftTests.testBasicDraftId()");
  console.log("- DraftTests.testMultipleComposeWindows()");
  console.log("- DraftTests.testDraftOrderTracking()");
  console.log("- DraftTests.testErrorHandling()");
  console.log("- DraftTests.testCleanup()");
  console.log("- DraftTests.runAllTests()");
} 