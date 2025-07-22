/**
 * @typedef {(Generator<
 *  (
 *    | string | number | boolean
 *    | Promise<string | number | boolean | HTMLGenerator>
 *  ),
 *  void,
 *  unknown
 * >)} HTMLGenerator
 */

/**
 * @typedef {(
 *  | (string | number | boolean | HTMLGenerator)
 *  | (string | number | boolean | HTMLGenerator)[]
 *  | Promise<(string | number | boolean | HTMLGenerator)>
 *  | Promise<(string | number | boolean | HTMLGenerator)>[]
 * )} SupportedValue
 */
