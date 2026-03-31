"use strict";
const electron = require("electron");
const IPC = {
  // LLM
  LLM_STREAM_START: "llm:stream-start",
  LLM_STREAM_CHUNK: "llm:stream-chunk",
  LLM_STREAM_END: "llm:stream-end",
  LLM_STREAM_ERROR: "llm:stream-error",
  LLM_ABORT: "llm:abort",
  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_GET_ALL: "settings:get-all",
  // Files
  FILE_SAVE: "file:save",
  FILE_OPEN: "file:open",
  FILE_EXPORT: "file:export",
  // Projects
  PROJECT_SAVE: "project:save",
  PROJECT_LOAD: "project:load",
  PROJECT_LIST: "project:list",
  PROJECT_DELETE: "project:delete"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  llm: {
    startStream: (messages, config) => {
      electron.ipcRenderer.send(IPC.LLM_STREAM_START, messages, config);
    },
    onChunk: (callback) => {
      const handler = (_event, chunk) => callback(chunk);
      electron.ipcRenderer.on(IPC.LLM_STREAM_CHUNK, handler);
      return () => electron.ipcRenderer.removeListener(IPC.LLM_STREAM_CHUNK, handler);
    },
    onEnd: (callback) => {
      const handler = () => callback();
      electron.ipcRenderer.on(IPC.LLM_STREAM_END, handler);
      return () => electron.ipcRenderer.removeListener(IPC.LLM_STREAM_END, handler);
    },
    onError: (callback) => {
      const handler = (_event, error) => callback(error);
      electron.ipcRenderer.on(IPC.LLM_STREAM_ERROR, handler);
      return () => electron.ipcRenderer.removeListener(IPC.LLM_STREAM_ERROR, handler);
    },
    abort: () => {
      electron.ipcRenderer.send(IPC.LLM_ABORT);
    }
  },
  settings: {
    get: (key) => electron.ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key, value) => electron.ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
    getAll: () => electron.ipcRenderer.invoke(IPC.SETTINGS_GET_ALL)
  },
  files: {
    save: (content, defaultPath) => electron.ipcRenderer.invoke(IPC.FILE_SAVE, content, defaultPath),
    open: () => electron.ipcRenderer.invoke(IPC.FILE_OPEN),
    exportMD: (content) => electron.ipcRenderer.invoke(IPC.FILE_EXPORT, content)
  },
  projects: {
    save: (id, data) => electron.ipcRenderer.invoke(IPC.PROJECT_SAVE, id, data),
    load: (id) => electron.ipcRenderer.invoke(IPC.PROJECT_LOAD, id),
    list: () => electron.ipcRenderer.invoke(IPC.PROJECT_LIST),
    delete: (id) => electron.ipcRenderer.invoke(IPC.PROJECT_DELETE, id)
  }
});
