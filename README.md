# Vite Plugin Route Builder

A powerful Vite plugin that automatically generates React Router routes from your file system structure. It supports both lazy-loaded and synchronously-loaded components, making it perfect for performance optimization and SEO-critical pages.

## Features

- ✨ **File-based routing** - Automatically generate routes from your page files  
- 🚀 **Mixed loading strategies** - Support both lazy (.tsx) and sync (.sync.tsx) loading  
- 🎯 **Route groups** - Organize routes with parentheses syntax `(group)`  
- 🔄 **Hot reload** - Automatic route regeneration during development  
- 📁 **Layout support** - Nested layouts with `layout.tsx` files  
- 🎨 **Custom path transformation** - Transform file paths to custom route paths  
- 🔧 **TypeScript support** - Full TypeScript integration with type-safe routes  
- ⚡ **Zero config** - Works out of the box with sensible defaults

## Installation

```bash
npm install vite-plugin-route-builder
# or
pnpm add vite-plugin-route-builder
# or
yarn add vite-plugin-route-builder
```

## Quick Start

### 1. Add the plugin to your Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { routeBuilderPlugin } from 'vite-plugin-route-builder'

export default defineConfig({
  plugins: [
    routeBuilderPlugin({
      pagePattern: './src/pages/**/*.{tsx,sync.tsx}',
      outputPath: './src/generated-routes.ts',
    }),
  ],
})
```

### 2. Create your page structure

```
src/pages/
├── index.tsx              # / (lazy loaded)
├── about.tsx              # /about (lazy loaded)
├── critical.sync.tsx      # /critical (sync loaded)
├── settings/
│   ├── layout.tsx         # Layout for /settings/*
│   ├── index.tsx          # /settings
│   └── profile.sync.tsx   # /settings/profile (sync loaded)
└── blog/
    └── [id].tsx           # /blog/:id (dynamic route)
```

### 3. Use the generated routes

```tsx
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './generated-routes'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
```

## Loading Strategies

### Lazy Loading (Default)

Files with `.tsx` extension are lazy-loaded by default, perfect for code splitting:

```tsx
// src/pages/about.tsx
export function Component() {
  return <div>About page</div>
}

export function loader() {
  // Optional: preload data
  return { data: 'about page data' }
}
```

You can also use `export default function Component()` in page files.

### Sync Loading

Files with `.sync.tsx` extension are loaded synchronously, ideal for critical pages:

```tsx
// src/pages/critical.sync.tsx
export function Component() {
  return <div>Critical page loaded immediately</div>
}

export function loader() {
  // Optional: preload data
  return { data: 'important data' }
}
```

## Route Patterns

### Basic Routes

```
pages/index.tsx       → /
pages/about.tsx       → /about
pages/contact.tsx     → /contact
```

### Nested Routes

```
pages/settings/
├── layout.tsx        → Layout wrapper
├── index.tsx         → /settings
├── profile.tsx       → /settings/profile
└── billing.tsx       → /settings/billing
```

### Dynamic Routes

```
pages/blog/[id].tsx           → /blog/:id
pages/users/[userId].tsx      → /users/:userId
pages/posts/[...slug].tsx     → /posts/*slug
```

### Route Groups

Organize routes without affecting the URL structure:

```
pages/
├── (main)/
│   ├── layout.tsx    → Main layout
│   ├── home.tsx      → /home
│   └── dashboard.tsx → /dashboard
├── (admin)/
│   ├── layout.tsx    → Admin layout
│   ├── users.tsx     → /users
│   └── settings.tsx  → /settings
└── (public)/
    ├── layout.tsx    → Public layout
    ├── login.tsx     → /login
    └── register.tsx  → /register
```

## Configuration Options

```ts
interface RouteBuilderPluginOptions {
  /** Page files glob pattern */
  pagePattern?: string
  /** Output path for generated routes */
  outputPath?: string
  /** Whether to enable in dev mode */
  enableInDev?: boolean
  /** Custom file to route path transformation logic */
  transformPath?: (path: string) => string
  /** Whether to enable debug logging */
  debug?: boolean
  /** Custom order for segment groups in route tree */
  segmentGroupOrder?: string[]
}
```

### Example Configuration

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    routeBuilderPlugin({
      // Glob pattern for page files
      pagePattern: './src/pages/**/*.{tsx,sync.tsx}',

      // Output path for generated routes
      outputPath: './src/generated-routes.ts',

      // Enable in dev mode for hot reload
      enableInDev: true,

      // Debug logging
      debug: true,

      // Custom segment group ordering
      segmentGroupOrder: ['(main)', '(admin)', '(public)'],

      // Custom path transformation
      transformPath: (path: string) => {
        return path.replace('/admin/', '/dashboard/')
      },
    }),
  ],
})
```

## Advanced Examples

### Mixed Loading Strategy

```
pages/
├── index.tsx                    # Lazy loaded
├── critical-page.sync.tsx       # Sync loaded
├── settings/
│   ├── layout.sync.tsx          # Sync layout
│   ├── index.tsx                # Lazy loaded
│   └── profile.sync.tsx         # Sync loaded
└── blog/
    ├── layout.tsx               # Lazy layout
    └── [slug].tsx               # Lazy loaded
```

### Route Groups with Custom Order

```ts
// Control the order of route groups
segmentGroupOrder: ['(main)', '(admin)', '(external)']
```

```
pages/
├── (main)/
│   ├── layout.tsx       # Rendered first
│   └── dashboard.tsx
├── (admin)/
│   ├── layout.tsx       # Rendered second
│   └── users.tsx
└── (external)/
    ├── layout.tsx       # Rendered third
    └── api-docs.tsx
```

### Custom Path Transformation

```ts
transformPath: (path: string) => {
  // Rename admin routes to dashboard
  if (path.includes('/admin/')) {
    return path.replace('/admin/', '/dashboard/')
  }
  // Add version prefix
  if (path.includes('/api/')) {
    return path.replace('/api/', '/v1/api/')
  }
  return path
}
```

## Generated Output

The plugin generates a TypeScript file with your routes:

```ts
// generated-routes.ts
import type { RouteObject } from 'react-router'

// Sync imports
import * as SyncComponent0 from './pages/critical.sync'
import * as SyncComponent1 from './pages/settings/profile.sync'

// Lazy imports
const lazy0 = () => import('./pages/index')
const lazy1 = () => import('./pages/about')
const lazy2 = () => import('./pages/settings/layout')

export const routes: RouteObject[] = [
  {
    path: '',
    lazy: lazy0,
  },
  {
    path: 'critical',
    Component: SyncComponent0.Component ?? SyncComponent0.default,
    loader: SyncComponent0.loader,
  },
  {
    path: 'settings',
    lazy: lazy2,
    children: [
      {
        path: '',
        lazy: lazy1,
      },
      {
        path: 'profile',
        Component: SyncComponent1.Component ?? SyncComponent1.default,
        loader: SyncComponent1.loader,
      },
    ],
  },
]

export default routes
```

## Development Workflow

### Hot Reload

The plugin automatically watches for file changes in development:

- ✅ Adding new page files
- ✅ Removing page files
- ✅ Renaming page files
- ✅ Moving page files

### Debug Mode

Enable debug logging to see how files are mapped to routes:

```ts
routeBuilderPlugin({
  debug: true,
})
```

This will log:

- File discovery process
- Route mapping details
- Import path generation
- Any warnings or errors

## Best Practices

### 1. Use Sync Loading Sparingly

Only use `.sync.tsx` for critical pages that need immediate rendering:

- Landing pages
- Critical user flows
- SEO-important pages

### 2. Organize with Route Groups

Use route groups to organize your codebase:

```
pages/
├── (app)/          # Main application
├── (auth)/         # Authentication pages
├── (admin)/        # Admin panel
└── (marketing)/    # Marketing pages
```

### 3. Leverage Layouts

Use `layout.tsx` files for shared UI:

```tsx
// pages/dashboard/layout.tsx
import { Outlet } from 'react-router-dom'

export function Component() {
  return (
    <div className="dashboard">
      <nav>{/* Dashboard navigation */}</nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

### 4. Type-Safe Route Parameters

For dynamic routes, export types for better TypeScript support:

```tsx
// pages/blog/[id].tsx
import { useParams } from 'react-router-dom'

type BlogParams = {
  id: string
}

export function Component() {
  const { id } = useParams<BlogParams>()
  return <div>Blog post: {id}</div>
}

export function loader({ params }: { params: BlogParams }) {
  // Optional: preload blog post data
  return { blogId: params.id }
}
```

## Troubleshooting

### Routes Not Generating

1. Check your `pagePattern` glob matches your file structure
2. Ensure files have the correct extensions (`.tsx` or `.sync.tsx`)
3. Enable debug mode to see detailed logging

### Sync Components Not Working

1. Export `Component` (named or default) from `.sync.tsx` files
2. Optional: Export `loader` function for data loading
3. Check the generated imports in the output file

### Hot Reload Not Working

1. Ensure `enableInDev: true` in your config
2. Check that files are within the `pagePattern` glob
3. Restart the dev server if issues persist

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
