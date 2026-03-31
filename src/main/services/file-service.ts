import { dialog } from 'electron'
import { readFile, writeFile, readdir, mkdir, rm } from 'fs/promises'
import { join, resolve } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'

const projectsDir = join(app.getPath('userData'), 'projects')

// --- Security: Validate project ID to prevent path traversal ---
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/

function validateProjectId(id: string): void {
     if (!SAFE_ID_REGEX.test(id)) {
          throw new Error('Invalid project ID: only alphanumeric characters, hyphens, and underscores are allowed')
     }
     // Double-check: resolved path must stay within projectsDir
     const resolved = resolve(projectsDir, `${id}.json`)
     if (!resolved.startsWith(projectsDir)) {
          throw new Error('Path traversal detected')
     }
}

async function ensureProjectsDir(): Promise<void> {
     if (!existsSync(projectsDir)) {
          await mkdir(projectsDir, { recursive: true })
     }
}

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', '.next', 'coverage', '.pytest_cache', 'vendor', '.serverless'])
const KEY_FILES = ['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 'README.md', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'tsconfig.json', '.env.example', 'nginx.conf']
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.py', '.go', '.rs', '.java', '.kt', '.swift', '.cpp', '.c', '.jsx', '.js']

interface ProjectScan {
     folderPath: string
     folderName: string
     tree: string
     keyFiles: Array<{ name: string; content: string }>
     fileCount: number
     dirCount: number
}

async function scanProjectFolder(): Promise<ProjectScan> {
     const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Project Folder'
     })

     if (result.canceled || !result.filePaths.length) {
          throw new Error('No folder selected')
     }

     const folderPath = result.filePaths[0]
     const folderName = folderPath.split(/[\\/]/).pop() || 'project'

     const tree: string[] = []
     const keyFilesContent: Array<{ name: string; content: string }> = []
     let fileCount = 0
     let dirCount = 0

     async function walk(dir: string, prefix = '', depth = 0): Promise<void> {
          if (depth > 6) return
          const entries = await readdir(dir, { withFileTypes: true })

          const sorted = entries.sort((a, b) => {
               if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
               return a.name.localeCompare(b.name)
          })

          for (const entry of sorted) {
               if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue

               const isLast = entry === sorted[sorted.length - 1]
               const connector = isLast ? '└── ' : '├── '
               tree.push(`${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}`)

               if (entry.isDirectory()) {
                    dirCount++
                    const nextPrefix = prefix + (isLast ? '    ' : '│   ')
                    await walk(join(dir, entry.name), nextPrefix, depth + 1)
               } else {
                    fileCount++
               }
          }
     }

     await walk(folderPath)

     for (const keyFile of KEY_FILES) {
          const keyFilePath = join(folderPath, keyFile)
          if (existsSync(keyFilePath)) {
               try {
                    const content = await readFile(keyFilePath, 'utf-8')
                    keyFilesContent.push({
                         name: keyFile,
                         content: content.slice(0, 2000)
                    })
               } catch (e) {
                    // Skip if can't read
               }
          }
     }

     async function findSourceFiles(dir: string, count = 0): Promise<void> {
          if (count >= 10) return
          const entries = await readdir(dir, { withFileTypes: true })

          for (const entry of entries) {
               if (count >= 10) break
               if (IGNORE_DIRS.has(entry.name)) continue

               if (entry.isDirectory()) {
                    await findSourceFiles(join(dir, entry.name), count)
               } else if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
                    try {
                         const content = await readFile(join(dir, entry.name), 'utf-8')
                         const lines = content.split('\n').slice(0, 40).join('\n')
                         keyFilesContent.push({
                              name: `${entry.name}`,
                              content: lines
                         })
                         count++
                    } catch (e) {
                         // Skip unreadable files
                    }
               }
          }
     }

     await findSourceFiles(folderPath)

     return {
          folderPath,
          folderName,
          tree: tree.join('\n'),
          keyFiles: keyFilesContent,
          fileCount,
          dirCount
     }
}

export { scanProjectFolder }
export type { ProjectScan }

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
     validateProjectId(id)
     await ensureProjectsDir()
     const filePath = join(projectsDir, `${id}.json`)
     await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function loadProject(id: string): Promise<unknown> {
     validateProjectId(id)
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
     validateProjectId(id)
     const filePath = join(projectsDir, `${id}.json`)
     await rm(filePath, { force: true })
}
