// IPC Channel names — single source of truth
export const IPC = {
     // LLM
     LLM_STREAM_START: 'llm:stream-start',
     LLM_STREAM_CHUNK: 'llm:stream-chunk',
     LLM_STREAM_END: 'llm:stream-end',
     LLM_STREAM_ERROR: 'llm:stream-error',
     LLM_ABORT: 'llm:abort',

     // Settings
     SETTINGS_GET: 'settings:get',
     SETTINGS_SET: 'settings:set',
     SETTINGS_GET_ALL: 'settings:get-all',
     SETTINGS_SET_API_KEY: 'settings:set-api-key',
     SETTINGS_HAS_API_KEY: 'settings:has-api-key',

     // Files
     FILE_SAVE: 'file:save',
     FILE_OPEN: 'file:open',
     FILE_EXPORT: 'file:export',
     FOLDER_SCAN: 'folder:scan',

     // Projects
     PROJECT_SAVE: 'project:save',
     PROJECT_LOAD: 'project:load',
     PROJECT_LIST: 'project:list',
     PROJECT_DELETE: 'project:delete'
} as const
