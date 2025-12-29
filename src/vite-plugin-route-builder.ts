import { relative, resolve } from 'pathe'
import type { Logger, Plugin } from 'vite'

import { generateRoutes } from './plugin/route-generator'

export interface RouteBuilderPluginOptions {
  /** Page files glob pattern */
  pagePattern?: string
  /** Output path for generated routes */
  outputPath?: string
  /** Whether to enable in dev mode */
  enableInDev?: boolean
  /** Custom file to route path transformation logic */
  transformPath?: (path: string) => string
  /** Whether to disable logging */
  debug?: boolean
  /** Custom order for segment groups in route tree. Array of group names (with or without parentheses). Default: filesystem order */
  segmentGroupOrder?: string[]
}

export function routeBuilderPlugin(
  options: RouteBuilderPluginOptions = {},
): Plugin {
  const {
    pagePattern = './pages/**/*.{tsx,sync.tsx}',
    outputPath = './src/generated-routes.ts',
    enableInDev = true,
    transformPath,
    debug = false,
    segmentGroupOrder = [],
  } = options

  let isProduction = false
  let root = ''
  let logger: Logger

  const runGenerateRoutes = () => {
    generateRoutes({
      root,
      pagePattern,
      outputPath,
      transformPath,
      debug,
      segmentGroupOrder,
      logger,
    })
  }

  return {
    name: 'vite-plugin-route-builder-v2',
    configResolved(config) {
      isProduction = config.command === 'build'
      root = config.root
      logger = config.logger
    },

    buildStart() {
      if (isProduction || enableInDev) {
        runGenerateRoutes()
      }
    },

    configureServer(server) {
      if (!enableInDev) return

      const watchPattern = resolve(root, pagePattern.replace('./', ''))
      server.watcher.add(watchPattern)

      server.watcher.on('add', handleFileChange)
      server.watcher.on('unlink', handleFileChange)

      function handleFileChange(path: string) {
        const relativePath = relative(root, path)
        if (
          relativePath.includes('/pages/') &&
          (relativePath.endsWith('.tsx') || relativePath.endsWith('.sync.tsx'))
        ) {
          logger.info(`[route-builder-v2] Page file changed: ${relativePath}`)
          runGenerateRoutes()

          // Send custom HMR event
          server.ws.send({
            type: 'custom',
            event: 'routes-updated',
            data: { timestamp: Date.now() },
          })
        }
      }
    },
  }
}

export default routeBuilderPlugin
