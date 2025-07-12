import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'activeTab',
    'storage'
  ],
  host_permissions: [
    "https://mail.google.com/*"
  ],
  content_scripts: [{
    js: ['src/content/gmail.tsx'],
    matches: ['https://mail.google.com/*'],
    run_at: 'document_end'
  }],
})
