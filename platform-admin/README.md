# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Routing

Declarative React Router (`<BrowserRouter>` + `<Routes>`), configured in
[`src/routes/index.tsx`](src/routes/index.tsx).

Two constraints follow from declarative mode and are easy to get wrong:

- **`<Route lazy>` does nothing here.** It is resolved only by a data router
  (`createBrowserRouter` + `RouterProvider`). Code splitting uses
  `React.lazy` + `<Suspense>` instead. Import functions live in
  [`src/routes/route-modules.ts`](src/routes/route-modules.ts) so that
  `lazy()` and hover prefetching share one module reference.
- **`<ScrollRestoration />` throws here.** It requires a data router context.
  `useScrollToTop()` is the minimal replacement.

`<BrowserRouter useTransitions={false}>` is deliberate: by default the router
wraps location updates in `React.startTransition`, and React does not show
Suspense fallbacks during a transition — the loading spinner would never
appear on client-side navigation.

## Testing

```bash
npm test        # vitest run
npm run test:watch
```

The routing smoke test ([`src/routes/routes.test.tsx`](src/routes/routes.test.tsx))
pins the route table: `/` and `/auth` redirect to `/auth/login`, the login and
404 pages each render exactly once, and the app exposes a single `<main>`
landmark.

## Deployment

This is an SPA on `BrowserRouter`, so **the host must rewrite unknown paths to
`/index.html`**. Without that rule a hard load of `/auth/login` — every bookmark,
every redirect target, every page refresh — returns 404. `vite dev` and
`vite preview` do this rewrite for you, so the problem is invisible locally.

Pick the one matching the target host:

**nginx**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

**Vercel** — `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Netlify / Cloudflare Pages** — `public/_redirects`
```
/*    /index.html   200
```

If the app is served from a sub-path, set Vite's `base`; `BrowserRouter`
already reads it via `basename={import.meta.env.BASE_URL}`.
