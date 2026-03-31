import { dialog } from 'electron'
import { readFile, writeFile, readdir, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'

const projectsDir = join(app.getPath('userData'), 'projects')

async function ensureProjectsDir(): Promise<void> {
     if (!existsSync(projectsDir)) {
          await mkdir(projectsDir, { recursive: true })
     }
}

export async function saveFileDialog(content: string, defaultPath?: string): Promise<string | null> {
     const result = await dialog.showSaveDialog({
          defaultPath: defaultPath || 'architecture.md',
          filters: [{ name: 'Markdown', extensions: ['md'] }]
     })
     if (result.canceled || !result.filePath) return null
     await writeFile(result.filePath, content, 'utf-8')
     return result.filePath
}

export async function openFileDialog(): Promise<{ content: string; path: string } | null> {
     const result = await dialog.showOpenDialog({
          filters: [{ name: 'Markdown', extensions: ['md'] }],
          properties: ['openFile']
     })
     if (result.canceled || result.filePaths.length === 0) return null
     const filePath = result.filePaths[0]
     const content = await readFile(filePath, 'utf-8')
     return { content, path: filePath }
}

export async function exportMDDialog(content: string): Promise<string | null> {
     const result = await dialog.showSaveDialog({
          defaultPath: 'architecture-export.md',
          filters: [{ name: 'Markdown', extensions: ['md'] }]
     })
     if (result.canceled || !result.filePath) return null
     await writeFile(result.filePath, content, 'utf-8')
     return result.filePath
}

export async function saveProject(id: string, data: unknown): Promise<void> {
     await ensureProjectsDir()
     const filePath = join(projectsDir, `${id}.json`)
     await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function loadProject(id: string): Promise<unknown> {
     const filePath = join(projectsDir, `${id}.json`)
     const content = await readFile(filePath, 'utf-8')
     return JSON.parse(content)
}

export async function listProjects(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
     await ensureProjectsDir()
     const files = await readdir(projectsDir)
     const projects: Array<{ id: string; name: string; updatedAt: number }> = []

     for (const file of files) {
          if (!file.endsWith('.json')) continue
          try {
               const content = await readFile(join(projectsDir, file), 'utf-8')
               const data = JSON.parse(content) as { title?: string; updatedAt?: number }
               projects.push({
                    id: file.replace('.json', ''),
                    name: data.title || 'Untitled',
                    updatedAt: data.updatedAt || 0
               })
          } catch {
               // skip corrupted files
          }
     }
     return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteProject(id: string): Promise<void> {
     const filePath = join(projectsDir, `${id}.json`)
     await rm(filePath, { force: true })
}
