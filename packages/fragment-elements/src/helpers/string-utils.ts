/**
 * Convert any string format to kebab-case
 *
 * Handles: camelCase, PascalCase, snake_case, spaces, dots, etc.
 *
 * @example
 * kebabCase('userName') // 'user-name'
 * kebabCase('UserName') // 'user-name'
 * kebabCase('user_name') // 'user-name'
 * kebabCase('user.name') // 'user-name'
 * kebabCase('user name') // 'user-name'
 * kebabCase('user-name') // 'user-name'
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab-case
    .replace(/[\s_.]+/g, '-') // spaces, underscores, dots → hyphens
    .replace(/-{2,}/g, '-') // multiple hyphens → single hyphen
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

/**
 * Convert any string format to camelCase
 *
 * Handles: kebab-case, snake_case, PascalCase, spaces, dots, etc.
 *
 * @example
 * camelCase('user-name') // 'userName'
 * camelCase('user_name') // 'userName'
 * camelCase('user.name') // 'userName'
 * camelCase('user name') // 'userName'
 * camelCase('UserName') // 'userName'
 * camelCase('userName') // 'userName'
 */
export function camelCase(str: string): string {
  // First convert to kebab-case to normalize
  const normalized = str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab-case
    .replace(/[\s_.]+/g, '-') // spaces, underscores, dots → hyphens
    .toLowerCase();

  // Then convert to camelCase
  return normalized
    .replace(/-+(.)/g, (_, char) => char.toUpperCase()) // hyphens → uppercase next char
    .replace(/^[A-Z]/, (char) => char.toLowerCase()) // ensure first char is lowercase
    .replace(/[^a-zA-Z0-9]/g, ''); // remove any remaining special chars
}
