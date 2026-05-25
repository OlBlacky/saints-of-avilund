// Prefix an internal path with the configured base (e.g. "/saints-of-avilund/").
// Use for every internal link so the site works under the GitHub Pages subpath.
export function url(path: string): string {
  const base = import.meta.env.BASE_URL; // includes trailing slash
  return (base + path.replace(/^\/+/, '')).replace(/([^:])\/{2,}/g, '$1/');
}
