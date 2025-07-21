// Draft Manager for Gmail Integration
// Handles draft ID tracking with update order

export interface DraftInfo {
  draftId: string;
  order: number;
  timestamp: number;
  composeWindowId: string;
}

export interface ComposeWindowInfo {
  id: string;
  element: HTMLElement;
  draftInfo?: DraftInfo;
  isReply?: boolean;
  isForward?: boolean;
}

class DraftManager {
  private composeWindows = new Map<string, ComposeWindowInfo>();
  private draftOrderCounter = 0;

  // Generate unique ID for compose window
  generateComposeWindowId(): string {
    return `compose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Register a new compose window
  registerComposeWindow(element: HTMLElement): string {
    const id = this.generateComposeWindowId();
    const composeInfo: ComposeWindowInfo = {
      id,
      element,
      isReply: this.isReplyCompose(element),
      isForward: this.isForwardCompose(element)
    };

    this.composeWindows.set(id, composeInfo);
    element.dataset.emailMagicComposeId = id;
    
    console.log(`[DraftManager] Registered compose window: ${id}`);
    return id;
  }

  // Check if compose window is a reply
  private isReplyCompose(element: HTMLElement): boolean {
    const ariaLabel = element.getAttribute('aria-label') || '';
    const subject = this.getSubjectFromCompose(element);
    return ariaLabel.includes('Reply') || subject.includes('Re:');
  }

  // Check if compose window is a forward
  private isForwardCompose(element: HTMLElement): boolean {
    const ariaLabel = element.getAttribute('aria-label') || '';
    const subject = this.getSubjectFromCompose(element);
    return ariaLabel.includes('Forward') || subject.includes('Fwd:');
  }

  // Get subject from compose window
  private getSubjectFromCompose(element: HTMLElement): string {
    const subjectInput = element.querySelector('input[aria-label*="Subject"], input[name="subjectbox"]') as HTMLInputElement;
    return subjectInput?.value || '';
  }

  // Get compose window by ID
  getComposeWindow(id: string): ComposeWindowInfo | undefined {
    return this.composeWindows.get(id);
  }

  // Get compose window by element
  getComposeWindowByElement(element: HTMLElement): ComposeWindowInfo | undefined {
    const id = element.dataset.emailMagicComposeId;
    return id ? this.composeWindows.get(id) : undefined;
  }

  // Update draft info for compose window
  updateDraftInfo(composeWindowId: string, draftInfo: DraftInfo): void {
    const composeInfo = this.composeWindows.get(composeWindowId);
    if (composeInfo) {
      composeInfo.draftInfo = draftInfo;
      this.composeWindows.set(composeWindowId, composeInfo);
      
      // Store in chrome storage for persistence
      chrome.storage.local.set({
        [`compose_${composeWindowId}_draft`]: draftInfo
      });
      
      console.log(`[DraftManager] Updated draft info for ${composeWindowId}:`, draftInfo);
    }
  }

  // Get draft info for compose window
  async getDraftInfo(composeWindowId: string): Promise<DraftInfo | null> {
    // First check memory
    const composeInfo = this.composeWindows.get(composeWindowId);
    if (composeInfo?.draftInfo) {
      return composeInfo.draftInfo;
    }

    // Then check storage
    try {
      const result = await chrome.storage.local.get([`compose_${composeWindowId}_draft`]);
      const storedDraft = result[`compose_${composeWindowId}_draft`];
      if (storedDraft) {
        // Update memory cache
        if (composeInfo) {
          composeInfo.draftInfo = storedDraft;
          this.composeWindows.set(composeWindowId, composeInfo);
        }
        return storedDraft;
      }
    } catch (error) {
      console.error('[DraftManager] Error getting draft info from storage:', error);
    }

    return null;
  }

  // Wait for draft to be saved and get its ID
  async waitForDraftSave(composeWindowId: string): Promise<DraftInfo> {
    console.log(`[DraftManager] Waiting for draft save for compose window: ${composeWindowId}`);
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'WAIT_FOR_DRAFT_SAVE',
        composeWindowId
      }, (response) => {
        if (response && response.success) {
          const draftInfo: DraftInfo = {
            draftId: response.draftId,
            order: response.order,
            timestamp: Date.now(),
            composeWindowId
          };
          
          this.updateDraftInfo(composeWindowId, draftInfo);
          resolve(draftInfo);
        } else {
          reject(new Error(response?.error || 'Failed to get draft ID'));
        }
      });
    });
  }

  // Get latest draft ID with order
  async getLatestDraftIdWithOrder(): Promise<DraftInfo> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'GET_DRAFT_ID_WITH_ORDER'
      }, (response) => {
        if (response && response.success) {
          const draftInfo: DraftInfo = {
            draftId: response.draftId,
            order: response.order,
            timestamp: Date.now(),
            composeWindowId: 'latest'
          };
          resolve(draftInfo);
        } else {
          reject(new Error(response?.error || 'Failed to get draft ID'));
        }
      });
    });
  }

  // Send draft by ID
  async sendDraft(draftId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'SEND_DRAFT',
        draftId
      }, (response) => {
        if (response && response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response?.error || 'Failed to send draft'));
        }
      });
    });
  }

  // Schedule draft by ID
  async scheduleDraft(draftId: string, scheduledTime: number): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'SCHEDULE_DRAFT',
        draftId,
        scheduledTime
      }, (response) => {
        if (response && response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response?.error || 'Failed to schedule draft'));
        }
      });
    });
  }

  // Remove compose window
  removeComposeWindow(id: string): void {
    this.composeWindows.delete(id);
    chrome.storage.local.remove([`compose_${id}_draft`]);
    console.log(`[DraftManager] Removed compose window: ${id}`);
  }

  // Get all compose windows
  getAllComposeWindows(): ComposeWindowInfo[] {
    return Array.from(this.composeWindows.values());
  }

  // Clean up old drafts (older than 1 hour)
  async cleanupOldDrafts(): Promise<void> {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const keysToRemove: string[] = [];

    try {
      const result = await chrome.storage.local.get(null);
      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('compose_') && key.endsWith('_draft')) {
          const draftInfo = value as DraftInfo;
          if (draftInfo.timestamp < oneHourAgo) {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`[DraftManager] Cleaned up ${keysToRemove.length} old drafts`);
      }
    } catch (error) {
      console.error('[DraftManager] Error cleaning up old drafts:', error);
    }
  }
}

// Export singleton instance
export const draftManager = new DraftManager();

// Helper functions for easy access
export const DraftUtils = {
  // Register a compose window and return its ID
  registerCompose: (element: HTMLElement) => draftManager.registerComposeWindow(element),
  
  // Get draft info for a compose window
  getDraftInfo: (composeId: string) => draftManager.getDraftInfo(composeId),
  
  // Wait for draft save
  waitForDraftSave: (composeId: string) => draftManager.waitForDraftSave(composeId),
  
  // Get latest draft ID with order
  getLatestDraftIdWithOrder: () => draftManager.getLatestDraftIdWithOrder(),
  
  // Send draft
  sendDraft: (draftId: string) => draftManager.sendDraft(draftId),
  
  // Schedule draft
  scheduleDraft: (draftId: string, scheduledTime: number) => draftManager.scheduleDraft(draftId, scheduledTime),
  
  // Get compose window by element
  getComposeByElement: (element: HTMLElement) => draftManager.getComposeWindowByElement(element),
  
  // Clean up old drafts
  cleanupOldDrafts: () => draftManager.cleanupOldDrafts()
}; 