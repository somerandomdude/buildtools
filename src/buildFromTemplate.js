/**
 * Replaces placeholders in a template string with provided values.
 *
 * @param {string} template - The template string containing placeholders.
 * @param {Object[]} replacements - An array of replacement objects.
 * @param {string} replacements[].key - The placeholder pattern to search for (used as regex).
 * @param {string} replacements[].value - The value to replace the placeholder with.
 * @returns {string} The template string with all placeholders replaced.
 * @throws {Error} If template is not a string.
 * @throws {Error} If replacements is not an array.
 * @throws {Error} If any replacement object is missing 'key' or 'value' properties.
 *
 * @example
 * const template = '<h1>{{TITLE}}</h1><p>{{CONTENT}}</p>';
 * const result = buildFromTemplate(template, [
 *   { key: '{{TITLE}}', value: 'Hello' },
 *   { key: '{{CONTENT}}', value: 'World' }
 * ]);
 * // Returns: '<h1>Hello</h1><p>World</p>'
 */
export function buildFromTemplate(template, replacements) {
  // Validate template parameter
  if (typeof template !== "string") {
    throw new Error(
      "buildFromTemplate: 'template' must be a string. Received: " +
        typeof template,
    );
  }

  // Validate replacements parameter
  if (!Array.isArray(replacements)) {
    throw new Error(
      "buildFromTemplate: 'replacements' must be an array. Received: " +
        typeof replacements,
    );
  }

  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];

    // Validate replacement object structure
    if (replacement === null || typeof replacement !== "object") {
      throw new Error(
        `buildFromTemplate: replacements[${i}] must be an object. Received: ` +
          (replacement === null ? "null" : typeof replacement),
      );
    }

    if (!("key" in replacement)) {
      throw new Error(
        `buildFromTemplate: replacements[${i}] is missing required property 'key'.`,
      );
    }

    if (!("value" in replacement)) {
      throw new Error(
        `buildFromTemplate: replacements[${i}] is missing required property 'value'.`,
      );
    }

    if (typeof replacement.key !== "string") {
      throw new Error(
        `buildFromTemplate: replacements[${i}].key must be a string. Received: ` +
          typeof replacement.key,
      );
    }

    template = template.replaceAll(
      new RegExp(replacement.key, "g"),
      String(replacement.value),
    );
  }

  return template;
}
