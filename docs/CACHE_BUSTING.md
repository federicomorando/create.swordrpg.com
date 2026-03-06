# Cache Busting for GitHub Pages

GitHub Pages (and browsers) can serve cached static assets for several minutes after deploy.

## Approach used in this project

We append the release version as a query string to static assets:

- `index.html`
  - `./styles/app.css?v=1.5.0`
  - `./src/main.js?v=1.5.0`
- `about.html`
  - `./styles/app.css?v=1.5.0`

## When to update it

At every release (or any urgent frontend fix), bump the `?v=` value to the new version in:

1. `index.html`
2. `about.html`

This forces clients/CDNs to fetch fresh CSS/JS immediately after deploy.
