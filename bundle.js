(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
console.time('start')
const bel = require('bel')

const solcjs = require('./')
const selectVersion = require('./src/node_modules/version2url')

selectVersion((error, select) => {
  if (error) return console.error(error)
  const useVersion = (error, url) => {
    if (error) return console.error(error)
    console.log('url:', url)
    solcjs(url, start)
  }
  const { releases, nightly, all} = select
  select(releases[0], useVersion)
  document.body.appendChild(selector(releases, v => select(v, useVersion)))
})

function selector (list, action) {
  const onchange = event => action(event.target.value)
  return bel`
    <select onchange=${onchange}>
      ${list.map(x => bel`<option value="${x}">${x}</option>`)}
    </select>`
}

function start (error, solc) {
  if (error) return console.error(error)
  console.time('compile stuff')
  let source = `
contract Mortal {
    address public owner;
    constructor() public { owner = msg.sender; }
}

contract Greeter is Mortal {
    string public greeting;
    constructor(string memory _greeting) public {
        greeting = _greeting;
    }
}
  `;
  let output = solc.compile(source)
  console.timeEnd('compile stuff')
  if (output.success) {
    // document.body.appendChild(bel`<h1>success</h1>`)  
    // console.dir(output);
    console.log('***   success   ***');
  } else {
    console.log('***   fail   ***');
  }
  // console.timeEnd('start')
  // testCompiler(solc)
}


function testCompiler (solc) {
  var input1 = 'contract x { function g() {} }'
  var input2 = 'contract y { function f() {} }'
  // Setting 1 as second paramateractivates the optimiser
  function compile (input) {
    console.time('compile')
    var output = solc.compile(input, 1)
    console.timeEnd('compile')
    console.log('output', output)
  }
  var id = setInterval(() => {
    compile(input1)
  }, 500)
  setTimeout(() => {
    console.log('====================')
    clearInterval(id)
    id = setInterval(() => {
      compile(input2)
    }, 500)
    setTimeout(() => {
      clearInterval(id)
    }, 5000)
  }, 5000)
}

},{"./":14,"./src/node_modules/version2url":13,"bel":3}],2:[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],3:[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":2,"hyperx":5}],4:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],5:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":4}],6:[function(require,module,exports){
const indexedDB = window.indexedDB
const console = window.console

module.exports = kvidb

const dbname = 'kvidb'
// const dbopts = { keyPath: 'key' }
const version = 1

function kvidb (opts) {
  const name = opts ? opts.name || ('' + opts) : 'store'
  const scope = `${dbname}-${name}`
  var IDB
  const makeDB = done => {
    var idb = indexedDB.open(dbname, version)
    idb.onerror = e => console.error(`[${dbname}]`, idb.error)
    idb.onupgradeneeded = () => idb.result.createObjectStore(scope/*, dbopts*/)
    idb.onsuccess = () => done(IDB = idb.result)
  }
  const use = (mode, done) => {
    const next = (IDB, tx) => (tx = IDB.transaction([scope], mode),
      done(tx.objectStore(scope), tx))
    IDB ? next(IDB) : makeDB(next)
  }
  const api = {
    get: (key, done) => use('readonly', (store, tx) => {
      const req = store.get('' + key)
      tx.oncomplete = e => next(req.error, req.result)
      const next = (e, x) => {
        e ? done(e) : x === undefined ? done(`key "${key}" is undefined`)
        : done(null, x)
      }
    }),
    put: (key, val, done) => val === undefined ? done('`value` is undefined')
      : use('readwrite', (store, tx) => {
        const req = store.put(val, '' + key)
        tx.oncomplete = e => done(req.error, !req.error)
    }),
    del: (key, done) => api.get('' + key, (e, x) => {
      e ? done(e) : use('readwrite', (store, tx) => {
        const req = store.delete('' + key)
        tx.oncomplete = e => done(req.error, !req.error)
      })
    }),
    clear: done => use('readwrite',  (store, tx) => {
      const req = store.clear()
      tx.oncomplete = e => done(req.error, !req.error)
    }),
    length: done => use('readwrite',  (store, tx) => {
      const req = store.count()
      tx.oncomplete = e => done(req.error, req.result)
    }),
    close: done => (IDB ? IDB.close() : makeDB(IDB => IDB.close()), done(null, true)),
    batch: (ops, done) => done('@TODO: implement `.batch(...)`'),
    keys: done => use('readonly', (store, tx, keys = []) => {
      const openCursor = (store.openKeyCursor || store.openCursor)
      const req = openCursor.call(store)
      tx.oncomplete = e => done(req.error, req.error ? undefined : keys)
      req.onsuccess = () => {
        const x = req.result
        if (x) (keys.push(x.key), x.continue())
      }
    })
    // key: (n, done) => (n < 0) ? done(null) : use('readonly', store => {
    //   var advanced = false
    //   var req = store.openCursor()
    //   req.onsuccess = () => {
    //     var cursor = req.result
    //     if (!cursor) return
    //     if (n === 0 || advanced) return // Either 1) maybe return first key, or 2) we've got the nth key
    //     advanced = true // Otherwise, ask the cursor to skip ahead n records
    //     cursor.advance(n)
    //   }
    //   req.onerror = () => (console.error('Error in asyncStorage.key(): '), req.error.name)
    //   req.onsuccess = () => done((req.result || {}).key || null)
    // }),
    // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
    // And openKeyCursor isn't supported by Safari.
    // tx.oncomplete = () => done(null, keys)
  }
  return api
}

},{}],7:[function(require,module,exports){
const kvidb = require('kv-idb')
const cache = kvidb('store-solcjs')

module.exports = ajaxcache

ajaxcache.clear = () => cache.clear()

function ajaxcache (opts, done) {
  if (opts) var url = typeof opts === 'string' ? opts : opts.url
  if (!url) done(new Error('`url` or `{ url }` must be a string'))
  const transform = opts.transform
  const caching = opts.cache
  if (localStorage[url]) {
    fetch(url, { method: 'HEAD' }).then(response => {
      if (!response.ok) done(response)
      const timestamp = response.headers.get('last-modified')
      cacheFetch({ cache, url, caching, transform, timestamp }, done)
    }).catch(e => {
      console.error('[error]', e)
      timestamp = undefined
      cacheFetch({ cache, url, caching: true, transform, timestamp }, done)
    })
  } else cacheFetch({ cache, url, caching, transform, timestamp: null }, done)
}

function cacheFetch ({ cache, url, caching, transform, timestamp }, done) {
  const isLatest = caching && localStorage[url] === timestamp
  if (isLatest) return cache.get(url, done)
  fetch(url).then(response => response.text())
  .then(json => {
    const data = transform ? transform(json) : json
    cache.put(url, data, error => {
      if (error) return done(error)
      if (caching) localStorage[url] = timestamp
      done(null, data)
    })
  }).catch(e => console.error('[error]', e))
}

},{"kv-idb":6}],8:[function(require,module,exports){
module.exports = format;

function getContractName(output) {
  let { contracts } = output;
  if (contracts) {
    var name = Object.keys(contracts)[0];
    if (name) {
      let metadata;
      if (name.indexOf(':') != -1) {
        return name;
      } else {
        return Object.keys(contracts[name])[0];
      }
    }
  }
  return;
}

function getMetadata(output) {
  let { contracts } = output;
  if (contracts) {
    var name = Object.keys(contracts)[0];
    if (name) {
      let metadata;
      if (name.indexOf(':') != -1) {
        metadata = contracts[name].metadata;
      } else {
        let name2 = Object.keys(contracts[name])[0];
        metadata = (contracts[name])[name2].metadata;
      }
      metadata = JSON.parse(metadata);
      // console.log('=== metadata ===');
      // console.log(metadata);
      return metadata;
    }
  }
}

function format(_output) {
  // console.log('output:');
  // console.log(_output);

  let output = {};
  output.contractName = getContractName(_output);
  output.success = output.contractName ? true : false;

  if (output.success) {
    output.metadata = getMetadata(_output);
    output.abi = output.metadata.output.abi;
    output.version = output.metadata.compiler.version;
  }
  
  output.errors = _output.errors;
  console.log('new output:');
  console.log(output);
  return output;
}
},{}],9:[function(require,module,exports){
// //////////////////////////////////////////////////////////////////
// var Compiler = require('./src/compiler/compiler')
// var CompilerInput = require('./src/compiler/compiler-input')
// module.exports = { Compiler, CompilerInput }
// => Provides:
//
//     {
//         InternalCallTree: InternalCallTree,
//         SolidityProxy: SolidityProxy,
//         localDecoder: localDecoder,
//         stateDecoder: stateDecoder,
//         CodeAnalysis: CodeAnalysis
//     }
// //////////////////////////////////////////////////////////////////
const wrapper = require('./wrapper.js')
const format = require('./format.js')
// const solcABI = require('./abi.js')
// const CompilerImport = require('./handle-imports.js')

/******************************************************************************
  MODULE
******************************************************************************/
/*
  triggers
  - compilationFinished
  - compilerLoaded
  - compilationStarted
  - compilationDuration
*/
module.exports = compiler

function compiler (solc) {
  const _compiler = wrapper(solc)
  const api = {}

  Object.keys(_compiler).forEach(key => {
    if (key === 'compile') {
      api.compile = function (sourcecode) {
        // console.error(`[on:compile:start] solc.compile(sourcecode)`)
        var output = _compiler.compile(sourcecode, 1);
        var contracts = output.contracts
        return format(output);
        // return {
        //   "compiler": { "version": settings.compiler.version },
        //   "language": "Solidity",
        //   "output": {
        //     "abi": JSON.parse(abi)
        //   },
        //   "settings": ,
        //   "sources": {},
        //   "version": 1,
        // }
      }
    }
    else if (typeof _compiler[key] === 'function') api[key] = function (...args) {
      console.error(`compiler.${key}(...args)`, args)
      return _compiler[key].apply(_compiler, args)
    }
    else Object.defineProperty(api, key, {
      get () {
        var currentValue = _compiler[key]
        console.error(`compiler.${key} === `, currentValue)
        return currentValue
      },
      set (newValue) {
        console.error(`compiler.${key} = `, newValue)
        return _compiler[key] = newValue
      },
      enumerable: true,
      configurable: true
    })
  })
  return api
}

},{"./format.js":8,"./wrapper.js":12}],10:[function(require,module,exports){

module.exports = { linkBytecode, findLinkReferences }

function linkBytecode (bytecode, libraries) {
  // NOTE: for backwards compatibility support old compiler which didn't use file names
  var librariesComplete = {}
  for (var libraryName in libraries) {
    if (typeof libraries[libraryName] === 'object') {
      for (var lib in libraries[libraryName]) { // API compatible with the standard JSON i/o
        librariesComplete[lib] = libraries[libraryName][lib]
        librariesComplete[libraryName + ':' + lib] = libraries[libraryName][lib]
      }
    } else {
      // backwards compatible API for early solc-js verisons
      var parsed = libraryName.match(/^([^:]*):?(.*)$/)
      if (parsed) librariesComplete[parsed[2]] = libraries[libraryName]
      librariesComplete[libraryName] = libraries[libraryName]
    }
  }
  for (libraryName in librariesComplete) {
    var internalName = libraryName.slice(0, 36) // truncate to 37 characters
    // prefix and suffix with __
    var libLabel = '__' + internalName + Array(37 - internalName.length).join('_') + '__'
    var hexAddress = librariesComplete[libraryName]
    if (hexAddress.slice(0, 2) !== '0x' || hexAddress.length > 42) {
      throw new Error('Invalid address specified for ' + libraryName)
    }
    hexAddress = hexAddress.slice(2) // remove 0x prefix
    hexAddress = Array(40 - hexAddress.length + 1).join('0') + hexAddress
    while (bytecode.indexOf(libLabel) >= 0) {
      bytecode = bytecode.replace(libLabel, hexAddress)
    }
  }
  return bytecode
}

function findLinkReferences (bytecode) {
  // find 40 bytes in the pattern of __...<36 digits>...__
  // e.g. __Lib.sol:L_____________________________
  var linkReferences = {}, offset = 0
  while (true) {
    var found = bytecode.match(/__(.{36})__/)
    if (!found) break
    var start = found.index
    // trim trailing underscores
    // NOTE: this has no way of knowing if the trailing underscore was part of the name
    var libraryName = found[1].replace(/_+$/gm, '')
    if (!linkReferences[libraryName]) linkReferences[libraryName] = []
    linkReferences[libraryName].push({
      // offsets are in bytes in binary representation (and not hex)
      start: (offset + start) / 2,
      length: 20,
    })
    offset += start + 20
    bytecode = bytecode.slice(start + 20)
  }
  return linkReferences
}

},{}],11:[function(require,module,exports){
var linker = require('./linker.js');

/// Translate old style version numbers to semver.
/// Old style: 0.3.6-3fc68da5/Release-Emscripten/clang
///            0.3.5-371690f0/Release-Emscripten/clang/Interpreter
///            0.2.0-e7098958/.-Emscripten/clang/int linked to libethereum-1.1.1-bbb80ab0/.-Emscripten/clang/int
///            0.1.3-0/.-/clang/int linked to libethereum-0.9.92-0/.-/clang/int
///            0.1.2-5c3bfd4b*/.-/clang/int
///            0.1.1-6ff4cd6b/RelWithDebInfo-Emscripten/clang/int
/// New style: 0.4.5+commit.b318366e.Emscripten.clang
function versionToSemver (version) {
  // FIXME: parse more detail, but this is a good start
  var parsed = version.match(/^([0-9]+\.[0-9]+\.[0-9]+)-([0-9a-f]{8})[/*].*$/);
  if (parsed) {
    return parsed[1] + '+commit.' + parsed[2];
  }
  if (version.indexOf('0.1.3-0') !== -1) {
    return '0.1.3';
  }
  // assume it is already semver compatible
  return version;
}

function translateErrors (ret, errors) {
  for (var error in errors) {
    var type = 'error';
    var extractType = /^(.*):(\d+):(\d+):(.*):/;
    extractType = extractType.exec(errors[error]);
    if (extractType) {
      type = extractType[4].trim();
    } else if (errors[error].indexOf(': Warning:')) {
      type = 'Warning';
    } else if (errors[error].indexOf(': Error:')) {
      type = 'Error';
    }
    ret.push({
      type: type,
      component: 'general',
      severity: (type === 'Warning') ? 'warning' : 'error',
      message: errors[error],
      formattedMessage: errors[error]
    });
  }
}

function translateGasEstimates (gasEstimates) {
  if (gasEstimates === null) {
    return 'infinite';
  }

  if (typeof gasEstimates === 'number') {
    return gasEstimates.toString();
  }

  var gasEstimatesTranslated = {};
  for (var func in gasEstimates) {
    gasEstimatesTranslated[func] = translateGasEstimates(gasEstimates[func]);
  }
  return gasEstimatesTranslated;
}

function translateJsonCompilerOutput (output, libraries) {
  var ret = {};

  ret['errors'] = [];
  var errors;
  if (output['error']) {
    errors = [ output['error'] ];
  } else {
    errors = output['errors'];
  }
  translateErrors(ret['errors'], errors);

  ret['contracts'] = {};
  for (var contract in output['contracts']) {
    // Split name first, can be `contract`, `:contract` or `filename:contract`
    var tmp = contract.match(/^(([^:]*):)?([^:]+)$/);
    if (tmp.length !== 4) {
      // Force abort
      return null;
    }
    var fileName = tmp[2];
    if (fileName === undefined) {
      // this is the case of `contract`
      fileName = '';
    }
    var contractName = tmp[3];

    var contractInput = output['contracts'][contract];

    var gasEstimates = contractInput['gasEstimates'];
    var translatedGasEstimates = {};

    if (gasEstimates['creation']) {
      translatedGasEstimates['creation'] = {
        'codeDepositCost': translateGasEstimates(gasEstimates['creation'][1]),
        'executionCost': translateGasEstimates(gasEstimates['creation'][0])
      };
    }
    if (gasEstimates['internal']) {
      translatedGasEstimates['internal'] = translateGasEstimates(gasEstimates['internal']);
    }
    if (gasEstimates['external']) {
      translatedGasEstimates['external'] = translateGasEstimates(gasEstimates['external']);
    }

    var contractOutput = {
      'abi': JSON.parse(contractInput['interface']),
      'metadata': contractInput['metadata'],
      'evm': {
        'legacyAssembly': contractInput['assembly'],
        'bytecode': {
          'object': linker.linkBytecode(contractInput['bytecode'], libraries),
          'opcodes': contractInput['opcodes'],
          'sourceMap': contractInput['srcmap'],
          'linkReferences': linker.findLinkReferences(contractInput['bytecode'])
        },
        'deployedBytecode': {
          'object': linker.linkBytecode(contractInput['runtimeBytecode'], libraries),
          'sourceMap': contractInput['srcmapRuntime'],
          'linkReferences': linker.findLinkReferences(contractInput['runtimeBytecode'])
        },
        'methodIdentifiers': contractInput['functionHashes'],
        'gasEstimates': translatedGasEstimates
      }
    };

    if (!ret['contracts'][fileName]) {
      ret['contracts'][fileName] = {};
    }

    ret['contracts'][fileName][contractName] = contractOutput;
  }

  var sourceMap = {};
  for (var sourceId in output['sourceList']) {
    sourceMap[output['sourceList'][sourceId]] = sourceId;
  }

  ret['sources'] = {};
  for (var source in output['sources']) {
    ret['sources'][source] = {
      id: sourceMap[source],
      legacyAST: output['sources'][source].AST
    };
  }

  return ret;
}

function escapeString (text) {
  return text
    .replace('\n', '\\n', 'g')
    .replace('\r', '\\r', 'g')
    .replace('\t', '\\t', 'g');
}

function formatAssemblyText (asm, prefix, source) {
  if (typeof asm === typeof '' || asm === null || asm === undefined) {
    return prefix + (asm || '') + '\n';
  }
  var text = prefix + '.code\n';
  asm['.code'].forEach(function (item, i) {
    var v = item.value === undefined ? '' : item.value;
    var src = '';
    if (source !== undefined && item.begin !== undefined && item.end !== undefined) {
      src = escapeString(source.slice(item.begin, item.end));
    }
    if (src.length > 30) {
      src = src.slice(0, 30) + '...';
    }
    if (item.name !== 'tag') {
      text += '  ';
    }
    text += prefix + item.name + ' ' + v + '\t\t\t' + src + '\n';
  });
  text += prefix + '.data\n';
  var asmData = asm['.data'] || [];
  for (var i in asmData) {
    var item = asmData[i];
    text += '  ' + prefix + '' + i + ':\n';
    text += formatAssemblyText(item, prefix + '    ', source);
  }
  return text;
}

function prettyPrintLegacyAssemblyJSON (assembly, source) {
  return formatAssemblyText(assembly, '', source);
}

module.exports = {
  versionToSemver: versionToSemver,
  translateJsonCompilerOutput: translateJsonCompilerOutput,
  prettyPrintLegacyAssemblyJSON: prettyPrintLegacyAssemblyJSON
};

},{"./linker.js":10}],12:[function(require,module,exports){
var translate = require('./translate.js')
var linker = require('./linker.js')

let soljson;

const assert = (bool, msg) => { if (!bool) throw new Error(msg) }


function wrapCallback(callback) {
  assert(typeof callback === 'function', 'Invalid callback specified.')
  return function (path, contents, error) {
    var result = callback(soljson.Pointer_stringify(path))
    if (typeof result.contents === 'string') copyString(result.contents, contents)
    if (typeof result.error === 'string') copyString(result.error, error)
  }
}

function copyString(str, ptr) {
  var length = soljson.lengthBytesUTF8(str)
  var buffer = soljson._malloc(length + 1)
  soljson.stringToUTF8(str, buffer, length + 1)
  soljson.setValue(ptr, buffer, '*')
}

function runWithReadCallback(readCallback, compile, args) {
  if (readCallback === undefined) {
    readCallback = function (path) {
      return {
        error: 'File import callback not supported'
      };
    };
  }

  // This is to support multiple versions of Emscripten.
  var addFunction = soljson.addFunction || soljson.Runtime.addFunction;
  var removeFunction = soljson.removeFunction || soljson.Runtime.removeFunction;

  var cb = addFunction(wrapCallback(readCallback));
  var output;
  try {
    args.push(cb);
    output = compile.apply(undefined, args);
  } catch (e) {
    removeFunction(cb);
    throw e;
  }
  removeFunction(cb);
  return output;
}

function getCompileJSON() {
  if ('_compileJSON' in soljson) {
    return soljson.cwrap('compileJSON', 'string', ['string', 'number']);
  }
}

function getCompileJSONMulti() {
  if ('_compileJSONMulti' in soljson) {
    return compileJSONMulti = soljson.cwrap('compileJSONMulti', 'string', ['string', 'number']);
  }
}

function getCompileJSONCallback() {
  if ('_compileJSONCallback' in soljson) {
    var compileInternal = soljson.cwrap('compileJSONCallback', 'string', ['string', 'number', 'number']);
    var compileJSONCallback = function (input, optimize, readCallback) {
      return runWithReadCallback(readCallback, compileInternal, [input, optimize]);
    };
    return compileJSONCallback;
  }
}

function getCompileStandard() {
  var compileStandard;
  if ('_compileStandard' in soljson) {
    var compileStandardInternal = soljson.cwrap('compileStandard', 'string', ['string', 'number']);
    compileStandard = function (input, readCallback) {
      return runWithReadCallback(readCallback, compileStandardInternal, [input]);
    };
  }
  if ('_solidity_compile' in soljson) {
    var solidityCompile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);
    compileStandard = function (input, readCallback) {
      return runWithReadCallback(readCallback, solidityCompile, [input]);
    };
  }
  return compileStandard;
}

function getVersion() {
  let version;
  if ('_solidity_version' in soljson) {
    version = soljson.cwrap('solidity_version', 'string', []);
  } else {
    version = soljson.cwrap('version', 'string', []);
  }
  return version;
}

function getLicense() {
  let license;
  if ('_solidity_license' in soljson) {
    license = soljson.cwrap('solidity_license', 'string', []);
  } else if ('_license' in soljson) {
    license = soljson.cwrap('license', 'string', []);
  } else {
    // pre 0.4.14
    license = function () {
      // return undefined
    };
  }
  return license;
}

function getWrapperFormat(sourcecode) {
  let input = {
    language: 'Solidity',
    settings: {
      optimizer: {
        enabled: true
      },
      metadata: {
        useLiteralContent: true
      },
      outputSelection: {
        "*": {
          "*": ["abi", "metadata", "evm.bytecode"]
        }
      }
    },
    sources: {
      'MyContract': {
        content: sourcecode
      }
    }
  };
  return input;
}


module.exports = wrapper

function wrapper(_soljson) {
  soljson = _soljson;
  // console.log('soljson:', soljson);
  var compileJSON = getCompileJSON();
  var compileJSONMulti = getCompileJSONMulti();
  var compileJSONCallback = getCompileJSONCallback();
  var compileStandard = getCompileStandard();
  let version = getVersion();

  function compile(input, optimise, readCallback) {
    var v = version();
    var result = ''
    if (parseFloat(v.substring(0, 5)) >= 0.5) {
      result = compileStandardWrapper(JSON.stringify(getWrapperFormat(input)), readCallback);
    } else if (readCallback !== undefined && compileJSONCallback !== null) {
      result = compileJSONCallback(JSON.stringify(input), optimise, readCallback)
    } else if (typeof input !== 'string' && compileJSONMulti !== null) {
      result = compileJSONMulti(JSON.stringify(input), optimise)
    } else if (compileJSON != null) {
      result = compileJSON(input, optimise)
    } else {
      result = compileStandard(input, readCallback);
    }
    return JSON.parse(result)
  }

  function compileStandardWrapper (input, readCallback) {
    // Expects a Standard JSON I/O but supports old compilers
    if (compileStandard !== null) return compileStandard(input, readCallback)
    function formatFatalError (message) {
      return JSON.stringify({
        errors: [{
          'type': 'SOLCError',
          'component': 'solcjs',
          'severity': 'error',
          'message': message,
          'formattedMessage': 'Error: ' + message,
        }]
      })
    }
    if (readCallback !== undefined && typeof readCallback !== 'function') {
      return formatFatalError('Invalid import callback supplied')
    }
    input = JSON.parse(input)
    if (input['language'] !== 'Solidity') {
      return formatFatalError('Only Solidity sources are supported')
    }
    if (input['sources'] == null) return formatFatalError('No input specified')
    if ((input['sources'].length > 1) && (compileJSONMulti === null)) { // Bail out early
      return formatFatalError('Multiple sources provided, but compiler only supports single input')
    }
    function isOptimizerEnabled (input) {
      return input['settings'] && input['settings']['optimizer'] && input['settings']['optimizer']['enabled']
    }
    function translateSources (input) {
      var sources = {}
      for (var source in input['sources']) {
        if (input['sources'][source]['content'] !== null) {
          sources[source] = input['sources'][source]['content']
        } else return null // force failure
      }
      return sources
    }
    function librariesSupplied (input) {
      if (input['settings'] !== null) return input['settings']['libraries']
    }
    function translateOutput (output) {
      output = translate.translateJsonCompilerOutput(JSON.parse(output))
      if (output == null) return formatFatalError('Failed to process output')
      return JSON.stringify(output)
    }
    var sources = translateSources(input)
    if (sources === null || Object.keys(sources).length === 0) {
      return formatFatalError('Failed to process sources')
    }
    var libraries = librariesSupplied(input) // Try linking if libraries were supplied
    if (compileJSONCallback !== null) { // Try to wrap around old versions
      var sources = JSON.stringify({ sources })
      return translateOutput(compileJSONCallback(sources, isOptimizerEnabled(input), readCallback), libraries)
    }
    if (compileJSONMulti !== null) {
      var sources = JSON.stringify({ sources })
      return translateOutput(compileJSONMulti(sources, isOptimizerEnabled(input)), libraries)
    } // Try our luck with an ancient compiler
    return translateOutput(compileJSON(sources[Object.keys(sources)[0]], isOptimizerEnabled(input)), libraries)
  }


  // let version = getVersion();
  function versionToSemver () { return translate.versionToSemver(version()) }
  let license = getLicense();

  return {
    version: version,
    semver: versionToSemver,
    license: license,
    compile: compile,
    compileStandard: compileStandard,
    compileStandardWrapper: compileStandardWrapper,
    linkBytecode: linker.linkBytecode,
    supportsMulti: compileJSONMulti !== null,
    supportsImportCallback: compileJSONCallback !== null,
    supportsStandard: compileStandard !== null,
  }
}

},{"./linker.js":10,"./translate.js":11}],13:[function(require,module,exports){
const ajax = require('ajax-cache')
const baseURL = 'https://solc-bin.ethereum.org/bin'
// const baseURL = 'https://ethereum.github.io/solc-bin/bin'
// Current and historical (emscripten) binaries for Solidity
// https://github.com/ethereum/solc-bin
// used in or by:
// const solc = require('solc')
// https://solidity.readthedocs.io/en/develop/using-the-compiler.html#compiler-input-and-output-json-description

module.exports = selectVersion

function selectVersion (done) {
  if (typeof done !== 'function') return
  const request = {
    url: `${baseURL}/list.json`,
    cache: true,
    transform: processList
  }
  ajax(request, (error, data) => {
    if (error) return done(error)
    const { releases, nightly, all } = data
    const select = (version, done) => {
      if (version === 'latest') version = select.releases[0]
      if (version === 'nightly') version = select.all[0]
      var path = all[version]
      if (!path) return done(new Error(`unknown version: ${version}`))
      done(null, `${baseURL}/${path}`)
    }
    select.nightly = Object.keys(nightly).reverse()
    select.all = Object.keys(all).reverse()
    select.releases = Object.keys(releases).reverse()
    done(null, select)
  })
}

function processList (json) {
  const data = JSON.parse(json)
  const lists = Object.values(data.builds).reduce(({ agg, d }, x, i, arr) => {
    const { path, prerelease, version } = x
    if (prerelease) {
      d = prerelease.split('nightly.')[1]
      var [year0, month0, day0] = d.split('.').map(Number)
      if ((month0 + '').length < 2) month0 = '0' + month0
      if ((day0 + '').length < 2) day0 = '0' + day0
      d = [year0, month0, day0].join('.')
      const entry = [`v${version}-nightly-${d}`, path]
      agg.nightly.push(entry)
      agg.all.push(entry)
    } else {
      for (var j = i + 1, ahead; j < arr.length && !(ahead = arr[j].prerelease); j++) {}
      if (ahead) ahead = ahead.split('nightly.')[1]
      else ahead = d
      if (!d) d = ahead
      if (ahead !== d) {
        var [year1, month1, day1] = d.split('.').map(Number)
        var [year2, month2, day2] = ahead.split('.').map(Number)
        var d1 = new Date(year1, month1 - 1, day1)
        var d2 = new Date(year2, month2 - 1, day2)
        var diffDays = parseInt((d2 - d1) / (1000 * 60 * 60 * 24))
        var d3 = new Date(d1)
        d3.setDate(d3.getDate() + diffDays / 2)
        var month = d3.getUTCMonth() + 1
        var day = d3.getDate()
        var year = d3.getUTCFullYear()
        var current = [year, month, day].join('.')
      } else {
        var current = ahead
      }
      var [year0, month0, day0] = current.split('.').map(Number)
      if ((month0 + '').length < 2) month0 = '0' + month0
      if ((day0 + '').length < 2) day0 = '0' + day0
      current = [year0, month0, day0].join('.')
      const entry = [`v${version}-stable-${current}`, path]
      agg.releases.push(entry)
      agg.all.push(entry)
    }
    return { agg, d }
  }, { agg: { releases: [], nightly: [], all: [] }, d: null }).agg
  const { releases, nightly, all } = lists
  lists.releases = releases.reduce((o, x) => ((o[x[0]] = x[1]), o), {})
  lists.nightly = nightly.reduce((o, x) => ((o[x[0]] = x[1]), o), {})
  lists.all = all.reduce((o, x) => ((o[x[0]] = x[1]), o), {})
  return lists
}

},{"ajax-cache":7}],14:[function(require,module,exports){
const ajax = require('ajax-cache')
const solcwrapper = require('solc-wrapper')
const version2url = require('version2url')

module.exports = solcjs

solcjs.version2url = version2url

function solcjs (compilerURL, done) {
  if (typeof done !== 'function') return
  if (typeof compilerURL !== 'string') return done(new Error('`compilerURL` must be a url string'))
  const request = { url: compilerURL, cache: true }
  console.time('fetch compiler')
  ajax(request, (error, compilersource) => {
    if (error) return done(error)
    console.timeEnd('fetch compiler')
    const solc = load(compilersource)
    // ----------------------------------------------------
    // console.debug('compiler length:', compilersource.length)
    // console.log(Object.keys(compiler).length)
    console.time('load compiler')
    const solcjs = solcwrapper(solc)
    try {
      // @NOTE: compiling a simple contract dummy seems to
      // warm up the compiler, so that it compiles faster later on
      // @TODO: also it somehow throws the first time ?!?
      var content = 'contract x { function g() public {} }'
      solcjs.compile(content)
    } catch (e) {
      // console.error('wtf - first compile?!?', e)
    }
    console.timeEnd('load compiler')
    // console.log(Object.keys(solc).length)
    // ----------------------------------------------------
    done(null, solcjs)
  })
}
/******************************************************************************
  HELPER
******************************************************************************/
function load (sourcecode) {
  var script = document.createElement('script')
  if ('Module' in window) {
    var oldModule = window.Module
    var exists = true
  } else window.Module = {}
  script.text = `window.Module=((Module)=>{${sourcecode};return Module})()`
  document.head.appendChild(script)
  document.head.removeChild(script)
  const compiler = window.Module
  if (exists) window.Module = oldModule
  else delete window.Module
  return compiler
}

},{"ajax-cache":7,"solc-wrapper":9,"version2url":13}]},{},[1]);
