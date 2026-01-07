import { isPlainObject } from 'lodash-es';

/**
 * Deeply replaces variable placeholders in an object with provided values.
 * Placeholders are in the format `${variableName}`.
 * 
 * @param target The object or string to process.
 * @param variables A map of variable names to their values.
 * @returns A new object with variables replaced, or the original string with replacements.
 */
export function injectVariables<T>(target: T, variables: Record<string, any>): T {
  if (typeof target === 'string') {
    return target.replace(/\$\{(.*?)\}/g, (_, key) => {
      const value = variables[key.trim()];
      return value !== undefined ? String(value) : ''; // Replace with empty string if undefined? Or keep original?
    }) as unknown as T;
  }

  if (Array.isArray(target)) {
    return target.map(item => injectVariables(item, variables)) as unknown as T;
  }

  if (isPlainObject(target)) {
    const result: any = {};
    for (const key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        result[key] = injectVariables((target as any)[key], variables);
      }
    }
    return result as T;
  }

  return target;
}
