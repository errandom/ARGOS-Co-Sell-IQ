import { createServer } from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = Number(process.env.PORT || 8080)
const distDir = path.join(__dirname, 'dist')

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
}

function safePathname(urlPath) {
  const normalized = path.posix.normalize(urlPath)
  if (normalized.includes('..')) return '/'
  return normalized
}

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const pathname = safePathname(decodeURIComponent(reqUrl.pathname))

    let candidate = path.join(distDir, pathname)

    if (pathname.endsWith('/')) {
      candidate = path.join(candidate, 'index.html')
    }

    let servePath = candidate

    if (!(await fileExists(servePath))) {
      servePath = path.join(distDir, 'index.html')
    }

    const ext = path.extname(servePath).toLowerCase()
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    const body = await fs.readFile(servePath)

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    res.end(body)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Application startup/runtime error')
    console.error('Web app server error:', error)
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Web app server listening on port ${port}`)
})
