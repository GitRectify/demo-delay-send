// Test file to demonstrate getting draft ID when opening a reply
// This shows how the draft ID tracking works

console.log("[Email Magic] Testing draft ID detection...");

// Example usage of the draft ID functionality:

// 1. When a compose window opens, the system automatically detects it
// 2. If it's a reply (subject contains "Re:"), it gets the draft ID
// 3. The draft ID is stored and can be used for scheduling/sending

// Example: How to get the draft ID for a specific compose window
function getDraftIdExample() {
  // Find any compose window
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    // Check if this compose window has a draft ID
    const draftId = composeWindow.dataset.emailMagicDraftId;
    
    if (draftId) {
      console.log("Draft ID found:", draftId);
      
      // You can now use this draft ID to:
      // 1. Import draft content
      chrome.runtime.sendMessage({ type: 'IMPORT_DRAFT_CONTENT' }, (response) => {
        if (response && response.success) {
          console.log("Draft content imported:", response);
        }
      });
      
      // 2. Send the draft via API
      chrome.runtime.sendMessage({ 
        type: 'SEND_DRAFT', 
        draftId: draftId 
      }, (response) => {
        if (response && response.success) {
          console.log("Draft sent via API");
        }
      });
      
      // 3. Schedule the draft
      const scheduledTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      chrome.runtime.sendMessage({ 
        type: 'SCHEDULE_DRAFT', 
        draftId: draftId,
        scheduledTime: scheduledTime
      }, (response) => {
        if (response && response.success) {
          console.log("Draft scheduled for:", new Date(scheduledTime * 1000));
        }
      });
      
    } else {
      console.log("No draft ID found for this compose window");
    }
  }
}

// Example: How to manually trigger draft ID detection
function manuallyDetectDraftId() {
  // Find compose windows
  const composeWindows = document.querySelectorAll('[role="dialog"][aria-label*="Compose"]');
  
  composeWindows.forEach((composeWindow, index) => {
    const composeElement = composeWindow as HTMLElement;
    
    // Check if it's a reply
    const subjectElement = composeElement.querySelector('input[aria-label*="Subject"], input[name="subjectbox"]');
    const subject = (subjectElement as HTMLInputElement)?.value || '';
    
    if (subject.includes('Re:') || subject.includes('Fwd:')) {
      console.log(`Compose window ${index + 1} is a reply/forward`);
      
      // Wait for Gmail to save the draft, then get the ID
      setTimeout(async () => {
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_LATEST_DRAFT_ID' });
          if (response && response.success) {
            console.log(`Draft ID for compose window ${index + 1}:`, response.draftId);
            
            // Store it in the compose window's dataset
            composeElement.dataset.emailMagicDraftId = response.draftId;
          }
        } catch (error) {
          console.error("Failed to get draft ID:", error);
        }
      }, 2000); // Wait 2 seconds for Gmail to save the draft
    }
  });
}

// Example: How to use the draft ID in your delay functionality
function useDraftIdInDelay() {
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]') as HTMLElement;
  
  if (composeWindow) {
    const draftId = composeWindow.dataset.emailMagicDraftId;
    
    if (draftId) {
      // When user clicks send, instead of immediately sending:
      // 1. Get the draft content
      chrome.runtime.sendMessage({ type: 'IMPORT_DRAFT_CONTENT' }, (response) => {
        if (response && response.success) {
          console.log("Email content:", {
            to: response.to,
            subject: response.subject,
            body: response.bodyText.substring(0, 100) + "..."
          });
          
          // 2. Show delay UI
          console.log("Showing delay UI for 30 seconds...");
          
          // 3. After delay, send via API
          setTimeout(() => {
            chrome.runtime.sendMessage({ 
              type: 'SEND_DRAFT', 
              draftId: draftId 
            }, (sendResponse) => {
              if (sendResponse && sendResponse.success) {
                console.log("Email sent after delay!");
              }
            });
          }, 30000); // 30 seconds
        }
      });
    }
  }
}

// Export functions for testing
(window as any).emailMagicTest = {
  getDraftIdExample,
  manuallyDetectDraftId,
  useDraftIdInDelay
};

console.log("[Email Magic] Draft ID test functions loaded. Use emailMagicTest.getDraftIdExample() to test."); 