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
    'identity',
    'activeTab',
    'storage',
  ],
  host_permissions: [
    "https://mail.google.com/*",
    "https://gmail.googleapis.com/*"
  ],
  oauth2: {
    client_id: '469110029056-9d2gl5j3qv3j42718c3ij0psjo7k44u4.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'email',
      'profile',
      'openid',
    ],
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/gmail.tsx'],
    matches: ['https://mail.google.com/*'],
    run_at: 'document_end'
  }],
})