import { createEditor, getMarkdown, getHTML, setMarkdown } from './editor/editor'
import { sanitizeHTMLFragment } from './editor/sanitize'
import { applyTheme, loadSavedTheme } from './themes/theme-manager'
import './themes/base.css'

function ensureErrorToast(): HTMLElement {
  let toast = document.getElementById('error-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'error-toast'
    document.body.appendChild(toast)
  }
  return toast
}

let errorToastTimer: ReturnType<typeof setTimeout> | null = null

function showError(message: string): void {
  const toast = ensureErrorToast()
  toast.textContent = message
  toast.classList.add('visible')
  if (errorToastTimer) clearTimeout(errorToastTimer)
  errorToastTimer = setTimeout(() => {
    toast.classList.remove('visible')
    errorToastTimer = null
  }, 4200)
}

async function init(): Promise<void> {
  const api = window.electronAPI
  let currentMarkdown = ''
  let editorReady = false
  let pendingOpenedContent: string | null = null
  const pendingErrors: string[] = []
  const savedTheme = loadSavedTheme()
  applyTheme(savedTheme)

  api.onAppError(({ message }) => {
    if (!editorReady) {
      pendingErrors.push(message)
      return
    }
    showError(message)
  })

  api.onFileOpened((data) => {
    currentMarkdown = data.content
    if (!editorReady) {
      pendingOpenedContent = data.content
      return
    }
    setMarkdown(data.content)
  })

  // Restore custom theme CSS from disk
  if (savedTheme.startsWith('custom:')) {
    const fileName = savedTheme.slice(7)
    const css = await api.loadThemeCSS(fileName)
    if (css) applyTheme(savedTheme, css)
  }

  await createEditor('editor', (markdown) => {
    currentMarkdown = markdown
  })
  editorReady = true
  currentMarkdown = getMarkdown()

  if (pendingOpenedContent !== null) {
    setMarkdown(pendingOpenedContent)
  }
  for (const message of pendingErrors) {
    showError(message)
  }

  api.onMenuOpen(async () => {
    const result = await api.openFile()
    if (result) {
      currentMarkdown = result.content
      setMarkdown(result.content)
    }
  })

  api.onMenuSave(() => api.saveFile(currentMarkdown))
  api.onMenuSaveAs(() => api.saveFileAs(currentMarkdown))
  api.onMenuExportPDF(() => api.exportPDF())

  api.onMenuExportHTML(() => {
    const s = getComputedStyle(document.body)
    const v = (name: string) => s.getPropertyValue(name).trim()
    const bgColor = v('--bg-color')
    const textColor = v('--text-color')
    const textMuted = v('--text-muted')
    const borderColor = v('--border-color')
    const linkColor = v('--link-color')
    const codeBg = v('--code-bg')
    const codeBlockBg = v('--code-block-bg')
    const codeBlockText = v('--code-block-text') || textColor
    const blockquoteBorder = v('--blockquote-border')
    const blockquoteBg = v('--blockquote-bg') || 'transparent'
    const tableHeaderBg = v('--table-header-bg')
    const selectionBg = v('--selection-bg')

    const editor = document.querySelector('#editor .ProseMirror')
    const fontFamily = editor ? getComputedStyle(editor).fontFamily : '-apple-system,BlinkMacSystemFont,sans-serif'

    const getElColor = (selector: string, fallback: string): string => {
      const el = document.querySelector(`#editor .ProseMirror ${selector}`)
      return el ? getComputedStyle(el).color : fallback
    }
    const strongColor = getElColor('strong', textColor)
    const codeColor = getElColor('code', textColor)

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ColaMD Export</title>
<style>
body{max-width:780px;margin:40px auto;padding:20px;font-family:${fontFamily};line-height:1.75;background:${bgColor};color:${textColor}}
h1{font-size:2em;font-weight:700;border-bottom:1px solid ${borderColor};padding-bottom:.3em}
h2{font-size:1.5em;font-weight:600;border-bottom:1px solid ${borderColor};padding-bottom:.25em}
h3{font-size:1.25em;font-weight:600}
strong{color:${strongColor}}
a{color:${linkColor};text-decoration:none}
code{background:${codeBg};color:${codeColor};padding:2px 6px;border-radius:3px;font-size:.875em;font-family:'SF Mono','Fira Code',Menlo,monospace}
pre{background:${codeBlockBg};color:${codeBlockText};padding:16px;border-radius:6px;overflow-x:auto;margin:1em 0}
pre code{background:none;padding:0;color:inherit}
blockquote{border-left:4px solid ${blockquoteBorder};background:${blockquoteBg};padding-left:16px;margin:1em 0;color:${textMuted}}
table{border-collapse:collapse;width:100%;margin:1em 0}
th,td{border:1px solid ${borderColor};padding:8px 12px}
th{background:${tableHeaderBg};font-weight:600}
hr{border:none;border-top:2px solid ${borderColor};margin:2em 0}
img{max-width:100%}
::selection{background:${selectionBg}}
</style>
</head><body>${sanitizeHTMLFragment(getHTML())}</body></html>`
    api.exportHTML(html)
  })

  api.onNewFile(() => {
    currentMarkdown = ''
    pendingOpenedContent = null
    setMarkdown('')
  })

  // file-changed: show diff highlight for agent changes
  api.onFileChanged((content) => {
    if (content === currentMarkdown) return

    const editorEl = document.getElementById('editor')
    const scrollTop = editorEl?.scrollTop ?? 0
    currentMarkdown = content
    setMarkdown(content, true)
    requestAnimationFrame(() => {
      if (editorEl) editorEl.scrollTop = scrollTop
    })
  })

  api.onSetTheme((theme) => applyTheme(theme))
  api.onSetCustomCSS((css) => {
    const theme = loadSavedTheme()
    applyTheme(theme, css)
  })

  api.onMenuImportTheme(async () => {
    const result = await api.loadCustomTheme()
    if (result) applyTheme(`custom:${result.name}`, result.css)
  })

  const agentDot = document.getElementById('agent-dot')
  api.onAgentActivity((state) => {
    if (agentDot) agentDot.className = state === 'idle' ? '' : state
  })

  // Handle drag-and-drop of text files
  document.addEventListener('dragover', (e) => e.preventDefault())
  document.addEventListener('drop', async (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files[0]
    if (!file) return
    const filePath = api.getPathForFile(file)
    if (!filePath) return
    const result = await api.openFilePath(filePath)
    if (result) {
      currentMarkdown = result.content
      setMarkdown(result.content)
    }
  })
}

init().catch((e) => console.error('ColaMD init failed:', e))
