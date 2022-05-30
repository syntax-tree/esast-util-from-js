/**
 * @typedef {typeof import('acorn').Parser} ParserClass
 * @typedef {import('acorn').Position} Position
 * @typedef {import('estree-jsx').Comment} Comment
 * @typedef {import('estree-jsx').Program} Program
 * @typedef {import('buffer').Buffer} Buffer
 * @typedef {any extends Buffer ? never : Buffer} MaybeBuffer
 *   This is the same as `Buffer` if node types are included, `never` otherwise.
 * @typedef {string|MaybeBuffer} Value
 *
 *
 * @typedef AcornErrorFields
 * @property {number} pos
 * @property {Position} loc
 *
 * @typedef {Error & AcornErrorFields} AcornError
 *
 * @callback Plugin
 *   Acorn plugin.
 * @param {ParserClass} Parser
 *   Base parser class.
 * @returns {ParserClass}
 *   Resulting parser class.
 *
 * @typedef {2015|2016|2017|2018|2019|2020|2021|2022|'latest'} Version
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {Version} [version='latest']
 *   JavaScript version (year between 2015 and 2022 or `'latest'`).
 * @property {boolean} [module=false]
 *   Whether this is a module (ESM) or a script.
 * @property {boolean} [allowReturnOutsideFunction=false]
 *   Whether a return statement is allowed in the top scope.
 * @property {boolean} [allowImportExportEverywhere=false]
 *   Whether import/export statements are allowed in the every scope.
 * @property {boolean} [allowAwaitOutsideFunction]
 *   Whether `await` is allowed in the top scope.
 *   Defaults to `version >= 2022`.
 * @property {boolean} [allowSuperOutsideMethod=false]
 *   Whether `super` is allowed outside methods.
 * @property {boolean} [allowHashBang=false]
 *   Whether a shell hasbang is allowed.
 * @property {Array<Plugin>} [plugins=[]]
 *   List of acorn plugins.
 */

import {Parser} from 'acorn'
import {fromEstree} from 'esast-util-from-estree'
import {VFileMessage} from 'vfile-message'

/**
 * @param {Value} value
 * @param {Options} [options={}]
 */
export function fromJs(value, options = {}) {
  /** @type {ParserClass} */
  let parser = Parser
  /** @type {Array<Comment>} */
  const comments = []
  /** @type {Program} */
  let tree

  if (options.plugins) {
    parser = parser.extend(...options.plugins)
  }

  try {
    // @ts-expect-error: Acorn looks enough like estree.
    tree = parser.parse(value, {
      ecmaVersion: options.version || 'latest',
      sourceType: options.module ? 'module' : 'script',
      allowReturnOutsideFunction: options.allowReturnOutsideFunction,
      allowImportExportEverywhere: options.allowImportExportEverywhere,
      allowAwaitOutsideFunction: options.allowAwaitOutsideFunction,
      allowHashBang: options.allowHashBang,
      allowSuperOutsideMethod: options.allowSuperOutsideMethod,
      locations: true,
      onComment: comments
    })
  } catch (error) {
    const exception = /** @type {AcornError} */ (error)
    exception.message = exception.message.replace(/ \((\d+):(\d+)\)$/, '')

    throw new VFileMessage(
      exception,
      {
        line: exception.loc.line,
        column: exception.loc.column + 1,
        offset: exception.pos
      },
      'esast-util-from-js:acorn'
    )
  }

  tree.comments = comments

  return fromEstree(tree)
}
