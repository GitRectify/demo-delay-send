# Email Magic: Delay Send

A Chrome Extension that provides smart email delay protection for Gmail, preventing rushed decisions and communication mistakes.

## Features

### Core Functionality
- **Smart Delay Send**: Intercepts Gmail's send button and delays emails for a configurable time period
- **Visual Feedback**: Shows a premium shield/clock indicator with countdown timer
- **Edit & Cancel**: Allows users to edit or cancel delayed emails before sending
- **Usage Analytics**: Tracks email interactions and prevented mistakes
- **Customizable Settings**: Configurable delay times (15s, 30s, 1min, 2min, 5min)

### Security & Privacy
- **No Email Content Storage**: Never stores or transmits email content
- **Local Processing**: All delay logic runs locally in the browser
- **Enterprise Ready**: Designed to pass IT/security reviews
- **Privacy First**: Only stores anonymized interaction statistics

## Technical Implementation

### Gmail Integration
The extension uses a sophisticated content script injection system to integrate with Gmail:

1. **Content Script Injection**: Automatically injects into `mail.google.com`
2. **DOM Observation**: Uses MutationObserver to detect new send buttons
3. **Event Interception**: Prevents default send behavior and implements custom delay logic
4. **Email Data Extraction**: Safely extracts recipient, subject, and content for display

### Key Components

#### Content Script (`src/content/gmail.tsx`)
- Main Gmail integration component
- Handles send button detection and interception
- Manages delay countdown and visual indicators
- Implements edit/cancel functionality

#### Gmail Selectors (`src/content/utils/gmailSelectors.ts`)
- Comprehensive selector library for Gmail UI elements
- Handles multiple Gmail interface variations
- Robust element detection and data extraction

#### Settings & Analytics (`src/pages/Index.tsx`)
- Beautiful, premium settings interface
- Real-time usage analytics
- Dark/light theme support

## Installation & Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd demo-delay-send

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
# Build the extension
npm run build

# The built extension will be in the dist/ directory
```

### Loading in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` directory from the built extension

## Usage

### Basic Usage
1. Install the extension
2. Go to Gmail (`mail.google.com`)
3. Compose a new email
4. Click "Send" - the email will be delayed according to your settings
5. Use the visual indicator to edit or cancel the email

### Configuration
- **Delay Time**: Set default delay from 15 seconds to 5 minutes
- **Enable/Disable**: Toggle the delay feature on/off
- **Analytics**: View usage statistics and prevented mistakes

### Visual Indicators
When an email is delayed, you'll see:
- **Shield Icon**: Premium visual indicator
- **Countdown Timer**: Shows remaining delay time
- **Action Buttons**: Edit or cancel the delayed email
- **Email Preview**: Shows recipient and subject

## Technical Details

### Gmail Selector Strategy
The extension uses multiple selector strategies to ensure compatibility:

```typescript
// Send button selectors
sendButton: [
  '[aria-label="Send"]',
  '[data-tooltip="Send"]',
  'div[role="button"][aria-label*="Send"]',
  'button[aria-label*="Send"]',
  // Gmail-specific classes
  '.T-I.T-I-KE.L3',
  '.T-I.T-I-KE'
]
```

### Event Interception
```typescript
// Intercept send button clicks
const interceptSendButton = (button: HTMLElement) => {
  button.onclick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const emailData = extractEmailData()
    if (emailData) {
      delayEmail(emailData, button)
    }
    
    return false
  }
}
```

### Data Extraction
```typescript
// Safely extract email data
const extractEmailData = () => {
  const recipient = GmailUtils.getRecipient()
  const subject = GmailUtils.getSubject()
  const content = GmailUtils.getEmailContent()
  
  return { recipient, subject, content }
}
```

## Security Considerations

### Data Privacy
- **No Content Storage**: Email content is never stored or transmitted
- **Local Processing**: All delay logic runs in the browser
- **Minimal Data**: Only stores interaction statistics (counts, not content)

### Enterprise Compatibility
- **Chrome Extension Guidelines**: Follows all Chrome extension best practices
- **No External Dependencies**: Minimal third-party dependencies
- **Security Review Ready**: Architecture designed for IT security reviews

## Future Enhancements

### Planned Features
- **Gmail API Integration**: Use Gmail's scheduling API for more reliable delays
- **Advanced Analytics**: Detailed usage patterns and insights
- **Team Features**: Shared settings and analytics for teams
- **Custom Rules**: Conditional delays based on recipient or content

### Technical Improvements
- **Performance Optimization**: Reduce DOM observation overhead
- **Better Selectors**: More robust Gmail UI detection
- **Error Handling**: Improved error recovery and user feedback

## Troubleshooting

### Common Issues

**Extension not working in Gmail**
- Ensure the extension is enabled in Chrome
- Check that you're on `mail.google.com`
- Try refreshing the Gmail page

**Send button not detected**
- Gmail may have updated their UI
- Check the browser console for error messages
- The extension uses multiple selector strategies for compatibility

**Delay not working**
- Check the extension settings in the popup
- Ensure the delay feature is enabled
- Verify the delay time is set correctly

### Debug Mode
Enable debug logging by opening the browser console and looking for:
```
[Email Magic: Delay Send] Gmail integration loaded
[Email Magic: Delay Send] Initializing Gmail integration
```

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use React functional components with hooks
- Maintain consistent code style
- Add comprehensive error handling

### Testing
- Test on different Gmail interface variations
- Verify functionality with different delay times
- Test edit/cancel functionality
- Validate analytics tracking

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or feature requests, please contact the development team.
