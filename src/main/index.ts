import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { join, basename } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { watch, FSWatcher } from 'fs'

let mainWindow: BrowserWindow | null = null
let currentFilePath: string | null = null
let fileWatcher: FSWatcher | null = null
let isInternalSave = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    stopWatching()
  })

  updateTitle()
}

function updateTitle(): void {
  if (!mainWindow) return
  const fileName = currentFilePath ? basename(currentFilePath) : 'Untitled'
  mainWindow.setTitle(`${fileName} — ColaMD`)
}

function stopWatching(): void {
  if (fileWatcher) {
    fileWatcher.close()
    fileWatcher = null
  }
}

function watchCurrentFile(): void {
  if (!currentFilePath) return
  stopWatching()
  const filePath = currentFilePath
  fileWatcher = watch(filePath, (eventType) => {
    if (eventType !== 'change' || isInternalSave) return
    // Debounce: agents may write multiple chunks rapidly
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      readFile(filePath, 'utf-8')
        .then((data) => mainWindow?.webContents.send('file-changed', data))
        .catch(() => {})
    }, 100)
  })
}

function openFileFromPath(filePath: string): void {
  readFile(filePath, 'utf-8')
    .then((data) => {
      currentFilePath = filePath
      watchCurrentFile()
      updateTitle()
      mainWindow?.webContents.send('file-opened', { path: filePath, content: data })
    })
    .catch(() => {})
}

async function saveToPath(filePath: string, content: string): Promise<boolean> {
  try {
    isInternalSave = true
    await writeFile(filePath, content, 'utf-8')
    currentFilePath = filePath
    watchCurrentFile()
    updateTitle()
    return true
  } catch {
    return false
  } finally {
    setTimeout(() => { isInternalSave = false }, 100)
  }
}

// IPC Handlers

ipcMain.handle('open-file', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null

  try {
    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    currentFilePath = filePath
    watchCurrentFile()
    updateTitle()
    return { path: filePath, content }
  } catch {
    return null
  }
})

ipcMain.handle('open-file-path', async (_event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8')
    currentFilePath = filePath
    watchCurrentFile()
    updateTitle()
    return { path: filePath, content }
  } catch {
    return null
  }
})

ipcMain.handle('save-file', async (_event, content: string) => {
  if (!mainWindow) return false
  if (!currentFilePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || !result.filePath) return false
    currentFilePath = result.filePath
  }
  return saveToPath(currentFilePath, content)
})

ipcMain.handle('save-file-as', async (_event, content: string) => {
  if (!mainWindow) return false
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled || !result.filePath) return false
  return saveToPath(result.filePath, content)
})

ipcMain.handle('export-html', async (_event, html: string) => {
  if (!mainWindow) return false
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'HTML', extensions: ['html'] }]
  })
  if (result.canceled || !result.filePath) return false

  const title = currentFilePath ? basename(currentFilePath).replace(/\.md$/, '') : 'Document'
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
img { max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f5f5f5; }
</style>
</head>
<body>
${html}
</body>
</html>`

  try {
    await writeFile(result.filePath, fullHtml, 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('export-pdf', async () => {
  if (!mainWindow) return false
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (result.canceled || !result.filePath) return false

  try {
    const pdfData = await mainWindow.webContents.printToPDF({
      marginType: 0,
      printBackground: true,
      pageSize: 'A4'
    })
    await writeFile(result.filePath, pdfData)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('load-custom-theme', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'CSS', extensions: ['css'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null

  try {
    return await readFile(result.filePaths[0], 'utf-8')
  } catch {
    return null
  }
})

// Menu

function buildMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: 'ColaMD',
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            currentFilePath = null
            stopWatching()
            updateTitle()
            mainWindow?.webContents.send('new-file')
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: 'Export as PDF',
          click: () => mainWindow?.webContents.send('menu-export-pdf')
        },
        {
          label: 'Export as HTML',
          click: () => mainWindow?.webContents.send('menu-export-html')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Light',
          click: () => mainWindow?.webContents.send('set-theme', 'light')
        },
        {
          label: 'Dark',
          click: () => mainWindow?.webContents.send('set-theme', 'dark')
        },
        {
          label: 'Elegant',
          click: () => mainWindow?.webContents.send('set-theme', 'elegant')
        },
        {
          label: 'Newsprint',
          click: () => mainWindow?.webContents.send('set-theme', 'newsprint')
        },
        { type: 'separator' },
        {
          label: 'Import Theme...',
          click: () => mainWindow?.webContents.send('menu-import-theme')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ColaMD',
          click: () => shell.openExternal('https://github.com/marswaveai/colamd')
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// App lifecycle

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) {
    openFileFromPath(filePath)
  }
})
