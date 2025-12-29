import { writeFileSync } from 'node:fs'

import glob from 'fast-glob'
import { dirname, relative, resolve } from 'pathe'
import type { Logger } from 'vite'

import { buildGlobRoutes } from '../utils/route-builder'
import { generateRouteFileContent } from './route-file'

interface RouteGenerationOptions {
  root: string
  pagePattern: string
  outputPath: string
  transformPath?: (path: string) => string
  debug: boolean
  segmentGroupOrder: string[]
  logger: Logger
}

export function generateRoutes(options: RouteGenerationOptions) {
  const {
    root,
    pagePattern,
    outputPath,
    transformPath,
    debug,
    segmentGroupOrder,
    logger,
  } = options

  try {
    const pageFiles = glob.sync(pagePattern, {
      cwd: root,
      absolute: true,
    })

    logger.info(`[route-builder-v2] Found ${pageFiles.length} page files`)

    const globObject: Record<string, () => Promise<unknown>> = {}
    const fileToImportMap: Record<string, string> = {}

    const noopLazy = () => Promise.resolve({ default: () => null })

    pageFiles.forEach((absolutePath) => {
      const relativePath = relative(root, absolutePath)

      let routeKey: string
      if (relativePath.includes('/pages/')) {
        routeKey = `./pages/${relativePath.split('/pages/')[1]}`
      } else if (relativePath.includes('\\pages\\')) {
        routeKey = `./pages/${relativePath
          .split('\\pages\\')[1]
          ?.replaceAll('\\', '/')}`
      } else {
        routeKey = `./${relativePath.replaceAll('\\', '/')}`
      }

      if (transformPath) {
        routeKey = transformPath(routeKey)
      }

      const outputDir = dirname(resolve(root, outputPath))
      let importPath = relative(outputDir, absolutePath)

      importPath = importPath.replaceAll('\\', '/')

      if (!importPath.startsWith('.')) {
        importPath = `./${importPath}`
      }

      const finalImportPath = importPath.replace(/\.tsx$/, '')

      globObject[routeKey] = noopLazy
      fileToImportMap[routeKey] = finalImportPath

      if (debug) {
        logger.info(
          `[route-builder-v2] Mapped: ${routeKey} -> ${finalImportPath}`,
        )
      }
    })

    const routes = buildGlobRoutes(globObject, { segmentGroupOrder })
    const routeFileContent = generateRouteFileContent(routes, fileToImportMap, {
      debug,
      logger,
    })

    const outputFilePath = resolve(root, outputPath)
    writeFileSync(outputFilePath, routeFileContent, 'utf-8')

    logger.info(`[route-builder-v2] Generated routes: ${outputFilePath}`)
  } catch (error: any) {
    logger.error(`[route-builder-v2] Error generating routes:${error.message}`)
    console.error(error)
    throw error
  }
}
