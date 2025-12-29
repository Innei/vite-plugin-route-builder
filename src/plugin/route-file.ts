import { inspect } from 'node:util'

import type { Logger } from 'vite'

import {
  type ExtendedRouteObject,
  ROUTE_BUILDER_HANDLE,
} from '../utils/route-builder'

type RouteWithInternalHandle = ExtendedRouteObject & {
  [ROUTE_BUILDER_HANDLE]?: ExtendedRouteObject[typeof ROUTE_BUILDER_HANDLE]
}

type SerializableRouteObject = Omit<
  RouteWithInternalHandle,
  typeof ROUTE_BUILDER_HANDLE | 'children' | 'lazy'
> & {
  lazy?: string | (() => Promise<unknown>)
  Component?: string
  loader?: string
  children?: SerializableRouteObject[]
  [key: string]: unknown
}

interface RouteFileOptions {
  debug: boolean
  logger: Logger
}

const resolveMatchedKey = (
  fsPath: string,
  isSync: boolean | undefined,
  fileToImportMap: Record<string, string>,
): string | undefined => {
  if (isSync && fileToImportMap[`${fsPath}.sync.tsx`]) {
    return `${fsPath}.sync.tsx`
  }
  if (fileToImportMap[`${fsPath}.tsx`]) {
    return `${fsPath}.tsx`
  }
  if (isSync && fileToImportMap[`${fsPath}/layout.sync.tsx`]) {
    return `${fsPath}/layout.sync.tsx`
  }
  if (fileToImportMap[`${fsPath}/layout.tsx`]) {
    return `${fsPath}/layout.tsx`
  }
  if (isSync && fileToImportMap[`${fsPath}/index.sync.tsx`]) {
    return `${fsPath}/index.sync.tsx`
  }
  if (fileToImportMap[`${fsPath}/index.tsx`]) {
    return `${fsPath}/index.tsx`
  }

  if (fsPath.endsWith('/')) {
    const correctedPath = fsPath.slice(0, -1)
    if (isSync && fileToImportMap[`${correctedPath}/index.sync.tsx`]) {
      return `${correctedPath}/index.sync.tsx`
    }
    if (fileToImportMap[`${correctedPath}/index.tsx`]) {
      return `${correctedPath}/index.tsx`
    }
    if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
      return `${correctedPath}.sync.tsx`
    }
    if (fileToImportMap[`${correctedPath}.tsx`]) {
      return `${correctedPath}.tsx`
    }
  } else if (fsPath.includes('/:')) {
    const correctedPath = fsPath.replace(/\/:[^/]+(?:\/.*)?$/, '')
    if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
      return `${correctedPath}.sync.tsx`
    }
    if (fileToImportMap[`${correctedPath}.tsx`]) {
      return `${correctedPath}.tsx`
    }
  } else {
    const pathParts = fsPath.split('/')
    if (pathParts.length >= 2) {
      const lastPart = pathParts.at(-1)
      const secondLastPart = pathParts.at(-2)
      if (lastPart === secondLastPart) {
        const correctedPath = pathParts.slice(0, -1).join('/')
        if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
          return `${correctedPath}.sync.tsx`
        }
        if (fileToImportMap[`${correctedPath}.tsx`]) {
          return `${correctedPath}.tsx`
        }
      }
    }
  }

  return undefined
}

export function generateRouteFileContent(
  routes: ExtendedRouteObject[],
  fileToImportMap: Record<string, string>,
  options: RouteFileOptions,
): string {
  const { debug, logger } = options

  const usedLazyFunctions = new Set<string>()
  const usedSyncImports = new Set<string>()
  const lazyFunctionMap = new Map<string, string>()
  const syncImportMap = new Map<string, string>()
  let lazyCounter = 0
  let syncCounter = 0

  function collectUsedFunctions(routes: ExtendedRouteObject[]) {
    routes.forEach((route) => {
      const metadata = route[ROUTE_BUILDER_HANDLE]

      if (route.lazy && metadata?.fs) {
        const matchedKey = resolveMatchedKey(
          metadata.fs,
          metadata.isSync,
          fileToImportMap,
        )

        if (matchedKey && fileToImportMap[matchedKey]) {
          if (metadata.isSync) {
            const syncImportName = `SyncComponent${syncCounter++}`
            usedSyncImports.add(matchedKey)
            syncImportMap.set(matchedKey, syncImportName)
            if (debug) {
              logger.info(
                `[route-builder-v2] Mapped sync import: ${metadata.fs} -> ${matchedKey} -> ${syncImportName}`,
              )
            }
          } else {
            const lazyFuncName = `lazy${lazyCounter++}`
            usedLazyFunctions.add(matchedKey)
            lazyFunctionMap.set(matchedKey, lazyFuncName)
            if (debug) {
              logger.info(
                `[route-builder-v2] Mapped lazy function: ${metadata.fs} -> ${matchedKey} -> ${lazyFuncName}`,
              )
            }
          }
        } else {
          logger.warn(
            `[route-builder-v2] Could not find file for fs path: ${metadata.fs}`,
          )
          logger.warn(
            `[route-builder-v2] Available file keys: ${inspect(
              Object.keys(fileToImportMap),
              {
                depth: null,
              },
            )}`,
          )
        }
      }

      if (route.children) {
        collectUsedFunctions(route.children)
      }
    })
  }

  collectUsedFunctions(routes)

  const imports: string[] = []

  usedSyncImports.forEach((key) => {
    const importPath = fileToImportMap[key]
    const syncImportName = syncImportMap.get(key)
    if (importPath && syncImportName) {
      imports.push(`import * as ${syncImportName} from "${importPath}"`)
    }
  })

  usedLazyFunctions.forEach((key) => {
    const importPath = fileToImportMap[key]
    const lazyFuncName = lazyFunctionMap.get(key)
    if (importPath && lazyFuncName) {
      imports.push(`const ${lazyFuncName} = () => import("${importPath}")`)
    }
  })

  function processRoutes(
    routes: ExtendedRouteObject[],
  ): SerializableRouteObject[] {
    return routes.map((route) => {
      const newRoute = { ...route } as SerializableRouteObject &
        RouteWithInternalHandle
      const metadata = route[ROUTE_BUILDER_HANDLE]

      if (route.lazy && metadata?.fs) {
        const matchedKey = resolveMatchedKey(
          metadata.fs,
          metadata.isSync,
          fileToImportMap,
        )

        if (matchedKey) {
          if (metadata.isSync && syncImportMap.has(matchedKey)) {
            const syncComponentName = syncImportMap.get(matchedKey)
            newRoute.Component = `__SYNC_${syncComponentName}.Component__`
            newRoute.loader = `__SYNC_${syncComponentName}.loader__`
            newRoute.handle = `__SYNC_${syncComponentName}.handle__`
            delete newRoute.lazy
          } else if (lazyFunctionMap.has(matchedKey)) {
            newRoute.lazy = `__LAZY_${lazyFunctionMap.get(matchedKey)}__`
          } else {
            delete newRoute.lazy
            logger.warn(
              `[route-builder-v2] No function for route: ${metadata.fs}`,
            )
          }
        } else {
          delete newRoute.lazy
          logger.warn(
            `[route-builder-v2] No matching file for route: ${metadata.fs}`,
          )
        }
      }

      if (metadata) {
        delete newRoute[ROUTE_BUILDER_HANDLE]
      }

      if (route.children) {
        newRoute.children = processRoutes(route.children)
      }

      return newRoute
    })
  }

  const processedRoutes = processRoutes(routes)

  const routesString = JSON.stringify(processedRoutes, null, 2)
    .replaceAll(/"__LAZY_(\w+)__"/g, '$1')
    .replaceAll(
      /"__SYNC_([^.]+)\.Component__"/g,
      '$1.Component ?? $1.default',
    )
    .replaceAll(/"__SYNC_([^.]+)\.loader__"/g, '$1.loader')
    .replaceAll(/"__SYNC_([^.]+)\.handle__"/g, '$1.handle')
    .replaceAll(/,?\s*"loader":\s*undefined/g, '')

  return `// This file is auto-generated by vite-plugin-route-builder
// Do not edit manually
/* eslint-disable */
// @ts-nocheck

import type { RouteObject } from "react-router"

// Imports for page components
${imports.join('\n')}

// Generated route configuration
export const routes: RouteObject[] = ${routesString}

export default routes
`
}
