const staticSiteRoots = ['/2026', '/legacy', '/join'];

export function isStaticSiteRoute(pathname: string): boolean {
  const normalizedPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return staticSiteRoots.some((root) => normalizedPath === root || normalizedPath.startsWith(`${root}/`));
}
