import { describe, expect, test } from 'vitest'

import { buildGlobRoutes, ROUTE_BUILDER_HANDLE } from '../utils/route-builder'

const fakePromise = () => Promise.resolve({ default: () => {} })

function findRouteByFs(routes: any[], fs: string): any | undefined {
  for (const route of routes) {
    const metadata = route?.[ROUTE_BUILDER_HANDLE]
    if (metadata?.fs === fs) return route
    if (route?.children) {
      const found = findRouteByFs(route.children, fs)
      if (found) return found
    }
  }
  return undefined
}

describe('test route builder', () => {
  test('match snapshot with default filesystem order', () => {
    expect(
      buildGlobRoutes({
        './pages/(external)/layout.tsx': fakePromise,
        './pages/(external)/(with-layout)/index.tsx': fakePromise,
        './pages/(external)/(with-layout)/layout.tsx': fakePromise,
        './pages/(external)/(with-layout)/feed/[id]/index.tsx': fakePromise,
        './pages/(external)/(with-layout)/feed/[id]/layout.tsx': fakePromise,

        './pages/(main)/layout.tsx': fakePromise,
        './pages/(main)/(context)/layout.tsx': fakePromise,
        './pages/(main)/(context)/discover/layout.tsx': fakePromise,
        './pages/(main)/(context)/discover/index.tsx': fakePromise,

        './pages/preview.tsx': fakePromise,
        './pages/add/layout.tsx': fakePromise,
        './pages/add/index.tsx': fakePromise,
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "lazy": [Function],
                  "path": "",
                  Symbol(): {
                    "fs": "./pages/add/index/",
                    "fullPath": "/add/",
                    "isSync": false,
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/add/layout",
                "fullPath": "/add",
                "isSync": false,
              },
            },
          ],
          "path": "add",
          Symbol(): {
            "fs": "./pages/add/add",
            "fullPath": "/add",
          },
        },
        {
          "lazy": [Function],
          "path": "preview",
          Symbol(): {
            "fs": "./pages/preview/preview",
            "fullPath": "/preview",
            "isSync": false,
          },
        },
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "children": [
                            {
                              "lazy": [Function],
                              "path": "",
                              Symbol(): {
                                "fs": "./pages/(external)/(with-layout)/feed/[id]/index/",
                                "fullPath": "/feed/:id/",
                                "isSync": false,
                              },
                            },
                          ],
                          "lazy": [Function],
                          "path": "",
                          Symbol(): {
                            "fs": "./pages/(external)/(with-layout)/feed/[id]/layout",
                            "fullPath": "/feed/:id",
                            "isSync": false,
                          },
                        },
                      ],
                      "path": ":id",
                      Symbol(): {
                        "fs": "./pages/(external)/(with-layout)/feed/[id]/:id",
                        "fullPath": "/feed/:id",
                      },
                    },
                  ],
                  "path": "feed",
                  Symbol(): {
                    "fs": "./pages/(external)/(with-layout)/feed/feed",
                    "fullPath": "/feed",
                  },
                },
                {
                  "lazy": [Function],
                  "path": "",
                  Symbol(): {
                    "fs": "./pages/(external)/(with-layout)/index/",
                    "fullPath": "/",
                    "isSync": false,
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/(external)/(with-layout)",
                "fullPath": "",
                "isSync": false,
              },
            },
          ],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "lazy": [Function],
                          "path": "",
                          Symbol(): {
                            "fs": "./pages/(main)/(context)/discover/index/",
                            "fullPath": "/discover/",
                            "isSync": false,
                          },
                        },
                      ],
                      "lazy": [Function],
                      "path": "",
                      Symbol(): {
                        "fs": "./pages/(main)/(context)/discover/layout",
                        "fullPath": "/discover",
                        "isSync": false,
                      },
                    },
                  ],
                  "path": "discover",
                  Symbol(): {
                    "fs": "./pages/(main)/(context)/discover/discover",
                    "fullPath": "/discover",
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/(main)/(context)",
                "fullPath": "",
                "isSync": false,
              },
            },
          ],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
        },
      ]
    `)
  })

  test('should propagate sync to parent layout when subtree has sync routes', () => {
    const routes = buildGlobRoutes({
      './pages/settings/layout.tsx': fakePromise,
      './pages/settings/profile.sync.tsx': fakePromise,

      './pages/(main)/layout.tsx': fakePromise,
      './pages/(main)/profile.sync.tsx': fakePromise,
    })

    const settingsLayout = findRouteByFs(routes, './pages/settings/layout')
    expect(settingsLayout).toBeTruthy()
    expect(settingsLayout[ROUTE_BUILDER_HANDLE]?.isSync).toBe(true)

    const mainGroupLayout = findRouteByFs(routes, './pages/(main)')
    expect(mainGroupLayout).toBeTruthy()
    expect(mainGroupLayout[ROUTE_BUILDER_HANDLE]?.isSync).toBe(true)
  })

  test('match snapshot with custom segment group order', () => {
    expect(
      buildGlobRoutes(
        {
          './pages/(external)/layout.tsx': fakePromise,
          './pages/(external)/(with-layout)/index.tsx': fakePromise,
          './pages/(external)/(with-layout)/layout.tsx': fakePromise,
          './pages/(external)/(with-layout)/feed/[id]/index.tsx': fakePromise,
          './pages/(external)/(with-layout)/feed/[id]/layout.tsx': fakePromise,

          './pages/(main)/layout.tsx': fakePromise,
          './pages/(main)/(context)/layout.tsx': fakePromise,
          './pages/(main)/(context)/discover/layout.tsx': fakePromise,
          './pages/(main)/(context)/discover/index.tsx': fakePromise,

          './pages/preview.tsx': fakePromise,
          './pages/add/layout.tsx': fakePromise,
          './pages/add/index.tsx': fakePromise,
        },
        { segmentGroupOrder: ['main', 'external'] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "lazy": [Function],
                  "path": "",
                  Symbol(): {
                    "fs": "./pages/add/index/",
                    "fullPath": "/add/",
                    "isSync": false,
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/add/layout",
                "fullPath": "/add",
                "isSync": false,
              },
            },
          ],
          "path": "add",
          Symbol(): {
            "fs": "./pages/add/add",
            "fullPath": "/add",
          },
        },
        {
          "lazy": [Function],
          "path": "preview",
          Symbol(): {
            "fs": "./pages/preview/preview",
            "fullPath": "/preview",
            "isSync": false,
          },
        },
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "lazy": [Function],
                          "path": "",
                          Symbol(): {
                            "fs": "./pages/(main)/(context)/discover/index/",
                            "fullPath": "/discover/",
                            "isSync": false,
                          },
                        },
                      ],
                      "lazy": [Function],
                      "path": "",
                      Symbol(): {
                        "fs": "./pages/(main)/(context)/discover/layout",
                        "fullPath": "/discover",
                        "isSync": false,
                      },
                    },
                  ],
                  "path": "discover",
                  Symbol(): {
                    "fs": "./pages/(main)/(context)/discover/discover",
                    "fullPath": "/discover",
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/(main)/(context)",
                "fullPath": "",
                "isSync": false,
              },
            },
          ],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "children": [
                            {
                              "lazy": [Function],
                              "path": "",
                              Symbol(): {
                                "fs": "./pages/(external)/(with-layout)/feed/[id]/index/",
                                "fullPath": "/feed/:id/",
                                "isSync": false,
                              },
                            },
                          ],
                          "lazy": [Function],
                          "path": "",
                          Symbol(): {
                            "fs": "./pages/(external)/(with-layout)/feed/[id]/layout",
                            "fullPath": "/feed/:id",
                            "isSync": false,
                          },
                        },
                      ],
                      "path": ":id",
                      Symbol(): {
                        "fs": "./pages/(external)/(with-layout)/feed/[id]/:id",
                        "fullPath": "/feed/:id",
                      },
                    },
                  ],
                  "path": "feed",
                  Symbol(): {
                    "fs": "./pages/(external)/(with-layout)/feed/feed",
                    "fullPath": "/feed",
                  },
                },
                {
                  "lazy": [Function],
                  "path": "",
                  Symbol(): {
                    "fs": "./pages/(external)/(with-layout)/index/",
                    "fullPath": "/",
                    "isSync": false,
                  },
                },
              ],
              "lazy": [Function],
              "path": "",
              Symbol(): {
                "fs": "./pages/(external)/(with-layout)",
                "fullPath": "",
                "isSync": false,
              },
            },
          ],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
        },
      ]
    `)
  })

  test('match snapshot with partial custom segment group order', () => {
    expect(
      buildGlobRoutes(
        {
          './pages/(admin)/layout.tsx': fakePromise,
          './pages/(external)/layout.tsx': fakePromise,
          './pages/(main)/layout.tsx': fakePromise,
          './pages/(settings)/layout.tsx': fakePromise,
        },
        { segmentGroupOrder: ['main'] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(admin)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(settings)",
            "fullPath": "",
            "isSync": false,
          },
        },
      ]
    `)
  })

  test('match snapshot with custom segment group order using parentheses format', () => {
    expect(
      buildGlobRoutes(
        {
          './pages/(external)/layout.tsx': fakePromise,
          './pages/(main)/layout.tsx': fakePromise,
          './pages/(login)/layout.tsx': fakePromise,
        },
        { segmentGroupOrder: ['(main)', '(login)'] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(login)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
        },
      ]
    `)
  })

  test('match snapshot with mixed format segment group order', () => {
    expect(
      buildGlobRoutes(
        {
          './pages/(external)/layout.tsx': fakePromise,
          './pages/(main)/layout.tsx': fakePromise,
          './pages/(login)/layout.tsx': fakePromise,
          './pages/(settings)/layout.tsx': fakePromise,
        },
        { segmentGroupOrder: ['(main)', 'login', 'external'] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(login)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
        },
        {
          "children": [],
          "lazy": [Function],
          "path": "",
          Symbol(): {
            "fs": "./pages/(settings)",
            "fullPath": "",
            "isSync": false,
          },
        },
      ]
    `)
  })
})
