export function resolveSiteLanguage(configuredLocale, routeLocale, defaultLocale) {
  if (routeLocale && routeLocale !== defaultLocale) return routeLocale
  return configuredLocale || routeLocale || defaultLocale || 'zh-CN'
}
