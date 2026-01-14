import { defineManifest } from '@crxjs/vite-plugin'
import { EXTENSION_NAME } from './shared/constants'


export default defineManifest({
  manifest_version: 3,
  name: EXTENSION_NAME,
  version: '0.0.1',
  description:
    'Extract Contacts, Opportunities, and Tasks from Close CRM and view them in a popup dashboard.',
  action: {
    default_title: EXTENSION_NAME,
    default_popup: 'index.html',
  },
  permissions: ['storage', 'tabs'],
  host_permissions: ['https://app.close.com/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://app.close.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: true,
    },
  ],
})

