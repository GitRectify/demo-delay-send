# Gmail Draft ID Management with Update Order

This guide explains how to use the enhanced Gmail draft ID management system that properly tracks draft IDs with update order to ensure you're always working with the correct draft.

## Overview

The new system solves several key problems:

1. **Race Conditions**: Waits for Gmail to actually save the draft before trying to get its ID
2. **Update Order**: Tracks the order of drafts to ensure you're working with the most recent one
3. **Compose Window Mapping**: Maps compose windows to their corresponding draft IDs
4. **Error Handling**: Provides fallbacks when API operations fail

## Key Components

### 1. DraftManager (`src/content/utils/draftManager.ts`)

The core class that manages draft IDs and compose window relationships.

```typescript
import { DraftUtils, DraftInfo } from '../utils/draftManager';

// Register a compose window
const composeId = DraftUtils.registerCompose(composeWindow);

// Wait for draft to be saved and get its ID
const draftInfo = await DraftUtils.waitForDraftSave(composeId);
console.log("Draft ID:", draftInfo.draftId, "Order:", draftInfo.order);
```

### 2. Background Service (`src/background/index.ts`)

Handles Gmail API calls and draft ID retrieval with proper error handling.

## How It Works

### Step 1: Register Compose Window

When a compose window is detected, it's registered with a unique ID:

```typescript
const composeId = DraftUtils.registerCompose(composeWindow);
// composeId = "compose_1703123456789_abc123def"
```

### Step 2: Wait for Draft Save

Instead of immediately trying to get the draft ID, the system waits for Gmail to save the draft:

```typescript
const draftInfo = await DraftUtils.waitForDraftSave(composeId);
// Returns: { draftId: "r1234567890", order: 5, timestamp: 1703123456789, composeWindowId: "compose_..." }
```

### Step 3: Use Draft ID

Once you have the draft ID, you can perform operations:

```typescript
// Send the draft
await DraftUtils.sendDraft(draftInfo.draftId);

// Schedule the draft
const scheduledTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
await DraftUtils.scheduleDraft(draftInfo.draftId, scheduledTime);
```

## Update Order Tracking

The system maintains an order counter to ensure you're working with the most recent draft:

```typescript
// Each draft gets an incremental order number
const draftInfo = await DraftUtils.getLatestDraftIdWithOrder();
console.log(`This is draft #${draftInfo.order} in the current session`);
```

## Integration with Delay Send

The system is integrated into the delay send feature:

```typescript
// In GmailIntegration.tsx
const attachDelayHandler = (sendButton: HTMLElement, composeWindowId: string) => {
  const handler = async (e: Event) => {
    // ... prevent default behavior
    
    // Save draft and get ID
    const draftInfo = await DraftUtils.waitForDraftSave(composeWindowId);
    
    // Store for later use
    composeWindow.dataset.emailMagicDraftId = draftInfo.draftId;
    composeWindow.dataset.emailMagicDraftOrder = draftInfo.order.toString();
  };
};
```

## Error Handling and Fallbacks

The system provides multiple fallback mechanisms:

```typescript
try {
  // Try to send via API
  await DraftUtils.sendDraft(draftInfo.draftId);
  console.log("Email sent via API");
} catch (apiError) {
  console.warn("API send failed, falling back to UI");
  
  // Fallback: Use UI click
  const sendButton = composeWindow.querySelector('[aria-label="Send"]');
  if (sendButton) {
    sendButton.click();
  }
}
```

## API Reference

### DraftUtils

| Method | Description | Returns |
|--------|-------------|---------|
| `registerCompose(element)` | Register a compose window | `string` (compose ID) |
| `waitForDraftSave(composeId)` | Wait for draft save and get ID | `Promise<DraftInfo>` |
| `getLatestDraftIdWithOrder()` | Get latest draft with order | `Promise<DraftInfo>` |
| `sendDraft(draftId)` | Send draft via API | `Promise<any>` |
| `scheduleDraft(draftId, time)` | Schedule draft | `Promise<any>` |
| `getDraftInfo(composeId)` | Get stored draft info | `Promise<DraftInfo \| null>` |
| `cleanupOldDrafts()` | Clean up old drafts | `Promise<void>` |

### DraftInfo Interface

```typescript
interface DraftInfo {
  draftId: string;        // Gmail draft ID
  order: number;          // Order in current session
  timestamp: number;      // When the draft was created
  composeWindowId: string; // Associated compose window ID
}
```

## Usage Examples

### Basic Usage

```typescript
// 1. Find compose window
const composeWindow = document.querySelector('[role="dialog"][aria-label*="Compose"]');

// 2. Register and get draft ID
const composeId = DraftUtils.registerCompose(composeWindow);
const draftInfo = await DraftUtils.waitForDraftSave(composeId);

// 3. Use the draft ID
await DraftUtils.sendDraft(draftInfo.draftId);
```

### Multiple Compose Windows

```typescript
const composeWindows = document.querySelectorAll('[role="dialog"][aria-label*="Compose"]');
const draftPromises = [];

composeWindows.forEach(composeWindow => {
  const composeId = DraftUtils.registerCompose(composeWindow);
  const draftPromise = DraftUtils.waitForDraftSave(composeId);
  draftPromises.push(draftPromise);
});

const draftInfos = await Promise.all(draftPromises);
// Send all drafts in order
for (const draftInfo of draftInfos) {
  await DraftUtils.sendDraft(draftInfo.draftId);
}
```

### Scheduled Sending

```typescript
const composeId = DraftUtils.registerCompose(composeWindow);
const draftInfo = await DraftUtils.waitForDraftSave(composeId);

// Schedule for 1 hour from now
const scheduledTime = Math.floor(Date.now() / 1000) + 3600;
await DraftUtils.scheduleDraft(draftInfo.draftId, scheduledTime);
```

## Testing

You can test the system using the provided examples:

```typescript
// In browser console
DraftExamples.basicDraftIdExample();
DraftExamples.multipleComposeWindowsExample();
DraftExamples.scheduledSendingExample();
```

## Troubleshooting

### Common Issues

1. **"No drafts found"**: Gmail hasn't saved the draft yet. The system will retry automatically.

2. **"Failed to get draft ID"**: Check Gmail API permissions and OAuth token.

3. **"API send failed"**: The system will automatically fall back to UI click.

### Debug Information

Enable debug logging to see what's happening:

```typescript
// Check compose window registration
console.log("Compose ID:", composeWindow.dataset.emailMagicComposeId);

// Check draft info
console.log("Draft ID:", composeWindow.dataset.emailMagicDraftId);
console.log("Draft Order:", composeWindow.dataset.emailMagicDraftOrder);
```

## Best Practices

1. **Always wait for draft save**: Use `waitForDraftSave()` instead of immediately trying to get the draft ID.

2. **Handle errors gracefully**: Always provide fallbacks for API failures.

3. **Clean up old data**: Use `cleanupOldDrafts()` periodically to prevent storage bloat.

4. **Use order tracking**: Check the order number to ensure you're working with the correct draft.

5. **Store draft info**: Keep draft information in the compose window's dataset for persistence.

## Migration from Old System

If you're migrating from the old system:

1. Replace direct API calls with `DraftUtils` methods
2. Use `waitForDraftSave()` instead of immediate draft ID retrieval
3. Add error handling and fallbacks
4. Update your UI to show draft order information

The new system is backward compatible and will gracefully fall back to UI operations if API calls fail. 