/**
 * @typedef {import('../index.js').Plugin} Plugin
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import jsx from 'acorn-jsx'
// @ts-expect-error: untyped.
import stage3 from 'acorn-stage3'
import {fromJs} from '../index.js'

test('fromJs', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'fromJs'
    ])
  })

  await t.test('should work', async function () {
    assert.deepEqual(fromJs('1 + "2"'), {
      type: 'Program',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            left: {
              type: 'Literal',
              value: 1,
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 2, offset: 1}
              }
            },
            operator: '+',
            right: {
              type: 'Literal',
              value: '2',
              position: {
                start: {line: 1, column: 5, offset: 4},
                end: {line: 1, column: 8, offset: 7}
              }
            },
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {line: 1, column: 8, offset: 7}
            }
          },
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 8, offset: 7}
          }
        }
      ],
      sourceType: 'script',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 8, offset: 7}
      }
    })
  })

  await t.test(
    'should fail on an import w/o `module: true`',
    async function () {
      assert.throws(function () {
        fromJs('import "a"')
      }, /Could not parse JavaScript with Acorn/)
    }
  )

  await t.test('should support an import w/ `module: true`', async function () {
    assert.deepEqual(fromJs('import "a"', {module: true}), {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [],
          source: {
            type: 'Literal',
            value: 'a',
            position: {
              start: {line: 1, column: 8, offset: 7},
              end: {line: 1, column: 11, offset: 10}
            }
          },
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 11, offset: 10}
          }
        }
      ],
      sourceType: 'module',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 11, offset: 10}
      }
    })
  })

  await t.test('should support a plugin', async function () {
    assert.deepEqual(fromJs('<x />', {plugins: [jsx()]}), {
      type: 'Program',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'JSXElement',
            openingElement: {
              type: 'JSXOpeningElement',
              attributes: [],
              name: {
                type: 'JSXIdentifier',
                name: 'x',
                position: {
                  start: {line: 1, column: 2, offset: 1},
                  end: {line: 1, column: 3, offset: 2}
                }
              },
              selfClosing: true,
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 6, offset: 5}
              }
            },
            closingElement: null,
            children: [],
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {line: 1, column: 6, offset: 5}
            }
          },
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 6, offset: 5}
          }
        }
      ],
      sourceType: 'script',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 6, offset: 5}
      }
    })
  })

  await t.test('should support `options.allowHashBang`', async function () {
    assert.deepEqual(fromJs('#!/bin/sh\n1', {allowHashBang: true}), {
      type: 'Program',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 1,
            position: {
              start: {line: 2, column: 1, offset: 10},
              end: {line: 2, column: 2, offset: 11}
            }
          },
          position: {
            start: {line: 2, column: 1, offset: 10},
            end: {line: 2, column: 2, offset: 11}
          }
        }
      ],
      sourceType: 'script',
      comments: [
        {
          type: 'Line',
          value: '/bin/sh',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 10, offset: 9}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 2, column: 2, offset: 11}
      }
    })
  })

  assert.deepEqual(
    fromJs(new Uint8Array()),
    {
      type: 'Program',
      body: [],
      sourceType: 'script',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 1, offset: 0}
      }
    },
    'should support empty typed arrays'
  )

  assert.deepEqual(
    fromJs(new TextEncoder().encode('let a = 1')),
    {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'a',
                position: {
                  start: {line: 1, column: 5, offset: 4},
                  end: {line: 1, column: 6, offset: 5}
                }
              },
              init: {
                type: 'Literal',
                value: 1,
                position: {
                  start: {line: 1, column: 9, offset: 8},
                  end: {line: 1, column: 10, offset: 9}
                }
              },
              position: {
                start: {line: 1, column: 5, offset: 4},
                end: {line: 1, column: 10, offset: 9}
              }
            }
          ],
          kind: 'let',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 10, offset: 9}
          }
        }
      ],
      sourceType: 'script',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 10, offset: 9}
      }
    },
    'should support typed arrays'
  )

  assert.deepEqual(
    fromJs(new Uint8Array()),
    {
      type: 'Program',
      body: [],
      sourceType: 'script',
      comments: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 1, offset: 0}
      }
    },
    'should support empty typed arrays'
  )
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)
  const filenames = await fs.readdir(base)
  const tests = filenames.filter(function (d) {
    return d.charAt(0) !== '.'
  })

  let index = -1
  while (++index < tests.length) {
    const filename = tests[index]

    await t.test(filename, async function () {
      const valueUrl = new URL(filename + '/index.js', base)
      const treeUrl = new URL(filename + '/index.json', base)
      const value = String(await fs.readFile(valueUrl))
      const parts = filename.split('-')
      const module = parts.includes('module')
      /** @type {Array<Plugin>} */
      const plugins = []

      if (parts.includes('jsx')) {
        plugins.push(jsx())
      }

      if (parts.includes('stage3')) {
        plugins.push(stage3)
      }

      const actual = fromJs(value, {module, plugins})
      /** @type {string} */
      let expected

      try {
        expected = JSON.parse(String(await fs.readFile(treeUrl)))
      } catch {
        // New fixture.
        expected = JSON.stringify(actual, null, 2) + '\n'
        await fs.writeFile(treeUrl, expected)
      }

      assert.deepEqual(actual, expected)
    })
  }
})
