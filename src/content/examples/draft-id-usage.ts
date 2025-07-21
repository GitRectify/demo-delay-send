// Example: How to use Gmail Draft ID with Update Order
// This file demonstrates the complete workflow for getting and using draft IDs

import { DraftUtils, DraftInfo } from '../utils/draftManager';

// Example 1: Basic Draft ID Usage
export async function basicDraftIdExample() {
  console.log("[Example] Basic Draft ID Usage");
  
  // Find a compose window
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    // 1. Register the compose window
    const composeId = DraftUtils.registerCompose(composeWindow);
    console.log("Compose window registered with ID:", composeId);
    
    // 2. Wait for draft to be saved and get its ID
    try {
      const draftInfo = await DraftUtils.waitForDraftSave(composeId);
      console.log("Draft saved with ID:", draftInfo.draftId, "Order:", draftInfo.order);
      
      // 3. Use the draft ID for operations
      await DraftUtils.sendDraft(draftInfo.draftId);
      console.log("Draft sent successfully!");
      
    } catch (error) {
      console.error("Failed to get draft ID:", error);
    }
  }
}

// Example 2: Multiple Compose Windows
export async function multipleComposeWindowsExample() {
  console.log("[Example] Multiple Compose Windows");
  
  const composeWindows = document.querySelectorAll('[role="dialog"][aria-label*="Compose"]');
  const draftPromises: Promise<DraftInfo>[] = [];
  
  composeWindows.forEach((composeWindow, index) => {
    const element = composeWindow as HTMLElement;
    
    // Register each compose window
    const composeId = DraftUtils.registerCompose(element);
    console.log(`Compose window ${index + 1} registered with ID:`, composeId);
    
    // Wait for draft save for each window
    const draftPromise = DraftUtils.waitForDraftSave(composeId);
    draftPromises.push(draftPromise);
  });
  
  // Wait for all drafts to be saved
  try {
    const draftInfos = await Promise.all(draftPromises);
    console.log("All drafts saved:", draftInfos);
    
    // Send all drafts in order
    for (const draftInfo of draftInfos) {
      await DraftUtils.sendDraft(draftInfo.draftId);
      console.log(`Draft ${draftInfo.order} sent successfully`);
    }
    
  } catch (error) {
    console.error("Failed to process drafts:", error);
  }
}

// Example 3: Scheduled Sending
export async function scheduledSendingExample() {
  console.log("[Example] Scheduled Sending");
  
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    const composeId = DraftUtils.registerCompose(composeWindow);
    
    try {
      const draftInfo = await DraftUtils.waitForDraftSave(composeId);
      console.log("Draft saved:", draftInfo);
      
      // Schedule to send in 1 hour
      const scheduledTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await DraftUtils.scheduleDraft(draftInfo.draftId, scheduledTime);
      
      console.log(`Draft scheduled for: ${new Date(scheduledTime * 1000).toLocaleString()}`);
      
    } catch (error) {
      console.error("Failed to schedule draft:", error);
    }
  }
}

// Example 4: Draft Order Tracking
export async function draftOrderTrackingExample() {
  console.log("[Example] Draft Order Tracking");
  
  // Get the latest draft with order information
  try {
    const draftInfo = await DraftUtils.getLatestDraftIdWithOrder();
    console.log("Latest draft:", {
      id: draftInfo.draftId,
      order: draftInfo.order,
      timestamp: new Date(draftInfo.timestamp).toLocaleString()
    });
    
    // You can use the order to ensure you're working with the most recent draft
    if (draftInfo.order > 0) {
      console.log(`This is draft #${draftInfo.order} in the current session`);
    }
    
  } catch (error) {
    console.error("Failed to get latest draft:", error);
  }
}

// Example 5: Integration with Delay Send Feature
export async function delaySendWithDraftIdExample() {
  console.log("[Example] Delay Send with Draft ID");
  
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    const composeId = DraftUtils.registerCompose(composeWindow);
    
    try {
      // 1. Save draft and get ID
      const draftInfo = await DraftUtils.waitForDraftSave(composeId);
      console.log("Draft saved for delay send:", draftInfo);
      
      // 2. Show delay UI (30 seconds)
      const delaySeconds = 30;
      console.log(`Email will be sent in ${delaySeconds} seconds...`);
      
      // 3. Wait for delay
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      
      // 4. Send the draft
      await DraftUtils.sendDraft(draftInfo.draftId);
      console.log("Delayed email sent successfully!");
      
    } catch (error) {
      console.error("Failed to send delayed email:", error);
    }
  }
}

// Example 6: Error Handling and Fallbacks
export async function errorHandlingExample() {
  console.log("[Example] Error Handling and Fallbacks");
  
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    const composeId = DraftUtils.registerCompose(composeWindow);
    
    try {
      // Try to get draft ID
      const draftInfo = await DraftUtils.waitForDraftSave(composeId);
      console.log("Draft ID obtained:", draftInfo.draftId);
      
      // Try to send via API
      try {
        await DraftUtils.sendDraft(draftInfo.draftId);
        console.log("Email sent via API");
      } catch (apiError) {
        console.warn("API send failed, falling back to UI:", apiError);
        
        // Fallback: Use UI click
        const sendButton = composeWindow.querySelector('[aria-label="Send"]') as HTMLElement;
        if (sendButton) {
          sendButton.click();
          console.log("Email sent via UI fallback");
        }
      }
      
    } catch (draftError) {
      console.error("Failed to get draft ID:", draftError);
      
      // Fallback: Use UI click without draft ID
      const sendButton = composeWindow.querySelector('[aria-label="Send"]') as HTMLElement;
      if (sendButton) {
        sendButton.click();
        console.log("Email sent via UI fallback (no draft ID)");
      }
    }
  }
}

// Example 7: Cleanup and Management
export async function cleanupExample() {
  console.log("[Example] Cleanup and Management");
  
  // Clean up old drafts (older than 1 hour)
  await DraftUtils.cleanupOldDrafts();
  console.log("Old drafts cleaned up");
  
  // You can also manually remove specific compose windows
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  if (composeWindow) {
    const composeId = composeWindow.dataset.emailMagicComposeId;
    if (composeId) {
      // This would be done when the compose window is closed
      console.log("Compose window would be removed:", composeId);
    }
  }
}

// Export all examples for easy testing
export const DraftExamples = {
  basicDraftIdExample,
  multipleComposeWindowsExample,
  scheduledSendingExample,
  draftOrderTrackingExample,
  delaySendWithDraftIdExample,
  errorHandlingExample,
  cleanupExample
};

// Make examples available globally for testing
if (typeof window !== 'undefined') {
  (window as any).DraftExamples = DraftExamples;
  console.log("[Draft Examples] Examples loaded. Use DraftExamples.basicDraftIdExample() to test.");
} 