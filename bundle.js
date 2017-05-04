(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A cached reference to the hasOwnProperty function.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * A cached reference to the create function.
 */
var create = Object.create;

/**
 * Used to prevent property collisions between our "map" and its prototype.
 * @param {!Object<string, *>} map The map to check.
 * @param {string} property The property to check.
 * @return {boolean} Whether map has property.
 */
var has = function (map, property) {
  return hasOwnProperty.call(map, property);
};

/**
 * Creates an map object without a prototype.
 * @return {!Object}
 */
var createMap = function () {
  return create(null);
};

/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!string} nodeName
 * @param {?string=} key
 * @constructor
 */
function NodeData(nodeName, key) {
  /**
   * The attributes and their values.
   * @const {!Object<string, *>}
   */
  this.attrs = createMap();

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = createMap();

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {?Object<string, !Element>}
   */
  this.keyMap = null;

  /**
   * Whether or not the keyMap is currently valid.
   * {boolean}
   */
  this.keyMapValid = true;

  /**
   * The node name for this node.
   * @const {string}
   */
  this.nodeName = nodeName;

  /**
   * @type {?string}
   */
  this.text = null;
}

/**
 * Initializes a NodeData object for a Node.
 *
 * @param {Node} node The node to initialize data for.
 * @param {string} nodeName The node name of node.
 * @param {?string=} key The key that identifies the node.
 * @return {!NodeData} The newly initialized data object
 */
var initData = function (node, nodeName, key) {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};

/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {Node} node The node to retrieve the data for.
 * @return {!NodeData} The NodeData for this Node.
 */
var getData = function (node) {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var symbols = {
  default: '__default',

  placeholder: '__placeholder'
};

/**
 * @param {string} name
 * @return {string|undefined} The namespace to use for the attribute.
 */
var getNamespace = function (name) {
  if (name.lastIndexOf('xml:', 0) === 0) {
    return 'http://www.w3.org/XML/1998/namespace';
  }

  if (name.lastIndexOf('xlink:', 0) === 0) {
    return 'http://www.w3.org/1999/xlink';
  }
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
var applyAttr = function (el, name, value) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    var attrNS = getNamespace(name);
    if (attrNS) {
      el.setAttributeNS(attrNS, name, value);
    } else {
      el.setAttribute(name, value);
    }
  }
};

/**
 * Applies a property to a given Element.
 * @param {!Element} el
 * @param {string} name The property's name.
 * @param {*} value The property's value.
 */
var applyProp = function (el, name, value) {
  el[name] = value;
};

/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} style The style to set. Either a string of css or an object
 *     containing property-value pairs.
 */
var applyStyle = function (el, name, style) {
  if (typeof style === 'string') {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';
    var elStyle = el.style;
    var obj = /** @type {!Object<string,string>} */style;

    for (var prop in obj) {
      if (has(obj, prop)) {
        elStyle[prop] = obj[prop];
      }
    }
  }
};

/**
 * Updates a single attribute on an Element.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is an object or
 *     function it is set on the Element, otherwise, it is set as an HTML
 *     attribute.
 */
var applyAttributeTyped = function (el, name, value) {
  var type = typeof value;

  if (type === 'object' || type === 'function') {
    applyProp(el, name, value);
  } else {
    applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
  }
};

/**
 * Calls the appropriate attribute mutator for this attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value.
 */
var updateAttribute = function (el, name, value) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var mutator = attributes[name] || attributes[symbols.default];
  mutator(el, name, value);

  attrs[name] = value;
};

/**
 * A publicly mutable object to provide custom mutators for attributes.
 * @const {!Object<string, function(!Element, string, *)>}
 */
var attributes = createMap();

// Special generic mutator that's called for any attribute that does not
// have a specific mutator.
attributes[symbols.default] = applyAttributeTyped;

attributes[symbols.placeholder] = function () {};

attributes['style'] = applyStyle;

/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?Node} parent
 * @return {?string} The namespace to create the tag in.
 */
var getNamespaceForTag = function (tag, parent) {
  if (tag === 'svg') {
    return 'http://www.w3.org/2000/svg';
  }

  if (getData(parent).nodeName === 'foreignObject') {
    return null;
  }

  return parent.namespaceURI;
};

/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?Node} parent
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element.
 * @return {!Element}
 */
var createElement = function (doc, parent, tag, key, statics) {
  var namespace = getNamespaceForTag(tag, parent);
  var el = undefined;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
    }
  }

  return el;
};

/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!Text}
 */
var createText = function (doc) {
  var node = doc.createTextNode('');
  initData(node, '#text', null);
  return node;
};

/**
 * Creates a mapping that can be used to look up children using a key.
 * @param {?Node} el
 * @return {!Object<string, !Element>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function (el) {
  var map = createMap();
  var child = el.firstElementChild;

  while (child) {
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }

    child = child.nextElementSibling;
  }

  return map;
};

/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 * @param {?Node} el
 * @return {!Object<string, !Node>} A mapping of keys to child Elements
 */
var getKeyMap = function (el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};

/**
 * Retrieves a child from the parent with the given key.
 * @param {?Node} parent
 * @param {?string=} key
 * @return {?Node} The child corresponding to the key.
 */
var getChild = function (parent, key) {
  return key ? getKeyMap(parent)[key] : null;
};

/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 * @param {?Node} parent The parent of child.
 * @param {string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function (parent, key, child) {
  getKeyMap(parent)[key] = child;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var notifications = {
  /**
   * Called after patch has compleated with any Nodes that have been created
   * and added to the DOM.
   * @type {?function(Array<!Node>)}
   */
  nodesCreated: null,

  /**
   * Called after patch has compleated with any Nodes that have been removed
   * from the DOM.
   * Note it's an applications responsibility to handle any childNodes.
   * @type {?function(Array<!Node>)}
   */
  nodesDeleted: null
};

/**
 * Keeps track of the state of a patch.
 * @constructor
 */
function Context() {
  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.created = notifications.nodesCreated && [];

  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.deleted = notifications.nodesDeleted && [];
}

/**
 * @param {!Node} node
 */
Context.prototype.markCreated = function (node) {
  if (this.created) {
    this.created.push(node);
  }
};

/**
 * @param {!Node} node
 */
Context.prototype.markDeleted = function (node) {
  if (this.deleted) {
    this.deleted.push(node);
  }
};

/**
 * Notifies about nodes that were created during the patch opearation.
 */
Context.prototype.notifyChanges = function () {
  if (this.created && this.created.length > 0) {
    notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    notifications.nodesDeleted(this.deleted);
  }
};

/**
* Makes sure that keyed Element matches the tag name provided.
* @param {!string} nodeName The nodeName of the node that is being matched.
* @param {string=} tag The tag name of the Element.
* @param {?string=} key The key of the Element.
*/
var assertKeyedTagMatches = function (nodeName, tag, key) {
  if (nodeName !== tag) {
    throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
  }
};

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode = null;

/** @type {?Node} */
var currentParent = null;

/** @type {?Element|?DocumentFragment} */
var root = null;

/** @type {?Document} */
var doc = null;

/**
 * Returns a patcher function that sets up and restores a patch context,
 * running the run function with the provided data.
 * @param {function((!Element|!DocumentFragment),!function(T),T=)} run
 * @return {function((!Element|!DocumentFragment),!function(T),T=)}
 * @template T
 */
var patchFactory = function (run) {
  /**
   * TODO(moz): These annotations won't be necessary once we switch to Closure
   * Compiler's new type inference. Remove these once the switch is done.
   *
   * @param {(!Element|!DocumentFragment)} node
   * @param {!function(T)} fn
   * @param {T=} data
   * @template T
   */
  var f = function (node, fn, data) {
    var prevContext = context;
    var prevRoot = root;
    var prevDoc = doc;
    var prevCurrentNode = currentNode;
    var prevCurrentParent = currentParent;
    var previousInAttributes = false;
    var previousInSkip = false;

    context = new Context();
    root = node;
    doc = node.ownerDocument;
    currentParent = node.parentNode;

    if ('production' !== 'production') {}

    run(node, fn, data);

    if ('production' !== 'production') {}

    context.notifyChanges();

    context = prevContext;
    root = prevRoot;
    doc = prevDoc;
    currentNode = prevCurrentNode;
    currentParent = prevCurrentParent;
  };
  return f;
};

/**
 * Patches the document starting at node with the provided function. This
 * function may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
var patchInner = patchFactory(function (node, fn, data) {
  currentNode = node;

  enterNode();
  fn(data);
  exitNode();

  if ('production' !== 'production') {}
});

/**
 * Patches an Element with the the provided function. Exactly one top level
 * element call should be made corresponding to `node`.
 * @param {!Element} node The Element where the patch should start.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM. This should have at most one top level
 *     element call.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
var patchOuter = patchFactory(function (node, fn, data) {
  currentNode = /** @type {!Element} */{ nextSibling: node };

  fn(data);

  if ('production' !== 'production') {}
});

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function (nodeName, key) {
  var data = getData(currentNode);

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return nodeName === data.nodeName && key == data.key;
};

/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 * @param {?Array<*>=} statics For an Element, this should be an array of
 *     name-value pairs.
 */
var alignWithDOM = function (nodeName, key, statics) {
  if (currentNode && matches(nodeName, key)) {
    return;
  }

  var node = undefined;

  // Check to see if the node has moved within the parent.
  if (key) {
    node = getChild(currentParent, key);
    if (node && 'production' !== 'production') {
      assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
    }
  }

  // Create the node if it doesn't exist.
  if (!node) {
    if (nodeName === '#text') {
      node = createText(doc);
    } else {
      node = createElement(doc, currentParent, nodeName, key, statics);
    }

    if (key) {
      registerChild(currentParent, key, node);
    }

    context.markCreated(node);
  }

  // If the node has a key, remove it from the DOM to prevent a large number
  // of re-orders in the case that it moved far or was completely removed.
  // Since we hold on to a reference through the keyMap, we can always add it
  // back.
  if (currentNode && getData(currentNode).key) {
    currentParent.replaceChild(node, currentNode);
    getData(currentParent).keyMapValid = false;
  } else {
    currentParent.insertBefore(node, currentNode);
  }

  currentNode = node;
};

/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function () {
  var node = currentParent;
  var data = getData(node);
  var keyMap = data.keyMap;
  var keyMapValid = data.keyMapValid;
  var child = node.lastChild;
  var key = undefined;

  if (child === currentNode && keyMapValid) {
    return;
  }

  if (data.attrs[symbols.placeholder] && node !== root) {
    if ('production' !== 'production') {}
    return;
  }

  while (child !== currentNode) {
    node.removeChild(child);
    context.markDeleted( /** @type {!Node}*/child);

    key = getData(child).key;
    if (key) {
      delete keyMap[key];
    }
    child = node.lastChild;
  }

  // Clean the keyMap, removing any unusued keys.
  if (!keyMapValid) {
    for (key in keyMap) {
      child = keyMap[key];
      if (child.parentNode !== node) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  }
};

/**
 * Changes to the first child of the current node.
 */
var enterNode = function () {
  currentParent = currentNode;
  currentNode = null;
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  if (currentNode) {
    currentNode = currentNode.nextSibling;
  } else {
    currentNode = currentParent.firstChild;
  }
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function () {
  clearUnvisitedDOM();

  currentNode = currentParent;
  currentParent = currentParent.parentNode;
};

/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @return {!Element} The corresponding Element.
 */
var coreElementOpen = function (tag, key, statics) {
  nextNode();
  alignWithDOM(tag, key, statics);
  enterNode();
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
var coreElementClose = function () {
  if ('production' !== 'production') {}

  exitNode();
  return (/** @type {!Element} */currentNode
  );
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var coreText = function () {
  nextNode();
  alignWithDOM('#text', null, null);
  return (/** @type {!Text} */currentNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
var currentElement = function () {
  if ('production' !== 'production') {}
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
var skip = function () {
  if ('production' !== 'production') {}
  currentNode = currentParent.lastChild;
};

/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;

/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @const {Array<*>}
 */
var argsBuilder = [];

/**
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  var node = coreElementOpen(tag, key, statics);
  var data = getData(node);

  /*
   * Checks to see if one or more attributes have changed for a given Element.
   * When no attributes have changed, this is much faster than checking each
   * individual argument. When attributes have changed, the overhead of this is
   * minimal.
   */
  var attrsArr = data.attrsArr;
  var newAttrs = data.newAttrs;
  var attrsChanged = false;
  var i = ATTRIBUTES_OFFSET;
  var j = 0;

  for (; i < arguments.length; i += 1, j += 1) {
    if (attrsArr[j] !== arguments[i]) {
      attrsChanged = true;
      break;
    }
  }

  for (; i < arguments.length; i += 1, j += 1) {
    attrsArr[j] = arguments[i];
  }

  if (j < attrsArr.length) {
    attrsChanged = true;
    attrsArr.length = j;
  }

  /*
   * Actually perform the attribute update.
   */
  if (attrsChanged) {
    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
      newAttrs[arguments[i]] = arguments[i + 1];
    }

    for (var _attr in newAttrs) {
      updateAttribute(node, _attr, newAttrs[_attr]);
      newAttrs[_attr] = undefined;
    }
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
var elementOpenStart = function (tag, key, statics) {
  if ('production' !== 'production') {}

  argsBuilder[0] = tag;
  argsBuilder[1] = key;
  argsBuilder[2] = statics;
};

/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
var attr = function (name, value) {
  if ('production' !== 'production') {}

  argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
var elementOpenEnd = function () {
  if ('production' !== 'production') {}

  var node = elementOpen.apply(null, argsBuilder);
  argsBuilder.length = 0;
  return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
var elementClose = function (tag) {
  if ('production' !== 'production') {}

  var node = coreElementClose();

  if ('production' !== 'production') {}

  return node;
};

/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementVoid = function (tag, key, statics, const_args) {
  elementOpen.apply(null, arguments);
  return elementClose(tag);
};

/**
 * Declares a virtual Element at the current location in the document that is a
 * placeholder element. Children of this Element can be manually managed and
 * will not be cleared by the library.
 *
 * A key must be specified to make sure that this node is correctly preserved
 * across all conditionals.
 *
 * @param {string} tag The element's tag.
 * @param {string} key The key used to identify this element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementPlaceholder = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  elementOpen.apply(null, arguments);
  skip();
  return elementClose(tag);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} const_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
var text = function (value, const_args) {
  if ('production' !== 'production') {}

  var node = coreText();
  var data = getData(node);

  if (data.text !== value) {
    data.text = /** @type {string} */value;

    var formatted = value;
    for (var i = 1; i < arguments.length; i += 1) {
      /*
       * Call the formatter function directly to prevent leaking arguments.
       * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
       */
      var fn = arguments[i];
      formatted = fn(formatted);
    }

    node.data = formatted;
  }

  return node;
};

exports.patch = patchInner;
exports.patchInner = patchInner;
exports.patchOuter = patchOuter;
exports.currentElement = currentElement;
exports.skip = skip;
exports.elementVoid = elementVoid;
exports.elementOpenStart = elementOpenStart;
exports.elementOpenEnd = elementOpenEnd;
exports.elementOpen = elementOpen;
exports.elementClose = elementClose;
exports.elementPlaceholder = elementPlaceholder;
exports.text = text;
exports.attr = attr;
exports.symbols = symbols;
exports.attributes = attributes;
exports.applyAttr = applyAttr;
exports.applyProp = applyProp;
exports.notifications = notifications;


},{}],2:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v3.2.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2017-03-20T18:59Z
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};



	function DOMEval( code, doc ) {
		doc = doc || document;

		var script = doc.createElement( "script" );

		script.text = code;
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.2.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isFunction: function( obj ) {
		return jQuery.type( obj ) === "function";
	},

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {

		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
		var type = jQuery.type( obj );
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		DOMEval( code );
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE <=9 - 11, Edge 12 - 13
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

};
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Simple selector that can be filtered directly, removing non-Elements
	if ( risSimple.test( qualifier ) ) {
		return jQuery.filter( qualifier, elements, not );
	}

	// Complex selector, compare the two sets, removing non-Elements
	qualifier = jQuery.filter( qualifier, elements );
	return jQuery.grep( elements, function( elem ) {
		return ( indexOf.call( qualifier, elem ) > -1 ) !== not && elem.nodeType === 1;
	} );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
        if ( nodeName( elem, "iframe" ) ) {
            return elem.contentDocument;
        }

        // Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
        // Treat the template element as a regular one in browsers that
        // don't support it.
        if ( nodeName( elem, "template" ) ) {
            elem = elem.content || elem;
        }

        return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( jQuery.isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && jQuery.isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && jQuery.isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = jQuery.isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( jQuery.isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				jQuery.isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ jQuery.camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ jQuery.camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ jQuery.camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( jQuery.camelCase );
			} else {
				key = jQuery.camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			jQuery.contains( elem.ownerDocument, elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted,
		scale = 1,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		do {

			// If previous iteration zeroed out, double until we get *something*.
			// Use string for doubling so we don't accidentally see scale as unchanged below
			scale = scale || ".5";

			// Adjust and apply
			initialInUnit = initialInUnit / scale;
			jQuery.style( elem, prop, initialInUnit + unit );

		// Update scale, tolerating zero or NaN from tween.cur()
		// Break the loop if scale is unchanged or perfect, or if we've just had enough.
		} while (
			scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
		);
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

var rscriptType = ( /^$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, contains, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( jQuery.type( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();
var documentElement = document.documentElement;



var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 only
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: jQuery.isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( ">tbody", elem )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		isFunction = jQuery.isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( isFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( isFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), doc );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rmargin = ( /^margin/ );

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		div.style.cssText =
			"box-sizing:border-box;" +
			"position:relative;display:block;" +
			"margin:auto;border:1px;padding:1px;" +
			"top:1%;width:50%";
		div.innerHTML = "";
		documentElement.appendChild( container );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = divStyle.marginLeft === "2px";
		boxSizingReliableVal = divStyle.width === "4px";

		// Support: Android 4.0 - 4.3 only
		// Some styles come back with percentage values, even though they shouldn't
		div.style.marginRight = "50%";
		pixelMarginRightVal = divStyle.marginRight === "4px";

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
		"padding:0;margin-top:1px;position:absolute";
	container.appendChild( div );

	jQuery.extend( support, {
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelMarginRight: function() {
			computeStyleTests();
			return pixelMarginRightVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a property mapped along what jQuery.cssProps suggests or to
// a vendor prefixed property.
function finalPropName( name ) {
	var ret = jQuery.cssProps[ name ];
	if ( !ret ) {
		ret = jQuery.cssProps[ name ] = vendorPropName( name ) || name;
	}
	return ret;
}

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i,
		val = 0;

	// If we already have the right measurement, avoid augmentation
	if ( extra === ( isBorderBox ? "border" : "content" ) ) {
		i = 4;

	// Otherwise initialize for horizontal or vertical properties
	} else {
		i = name === "width" ? 1 : 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {

			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// At this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {

			// At this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// At this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with computed style
	var valueIsBorderBox,
		styles = getStyles( elem ),
		val = curCSS( elem, name, styles ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// Computed unit is not pixels. Stop here and return.
	if ( rnumnonpx.test( val ) ) {
		return val;
	}

	// Check for style in case a browser which returns unreliable values
	// for getComputedStyle silently falls back to the reliable elem.style
	valueIsBorderBox = isBorderBox &&
		( support.boxSizingReliable() || val === elem.style[ name ] );

	// Fall back to offsetWidth/Height when value is "auto"
	// This happens for inline elements with no explicit setting (gh-3571)
	if ( val === "auto" ) {
		val = elem[ "offset" + name[ 0 ].toUpperCase() + name.slice( 1 ) ];
	}

	// Normalize "", auto, and prepare for extra
	val = parseFloat( val ) || 0;

	// Use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, name, extra );
						} ) :
						getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = extra && getStyles( elem ),
				subtract = extra && augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				);

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ name ] = value;
				value = jQuery.css( elem, name );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 13
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( jQuery.isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					jQuery.proxy( result.stop, result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://html.spec.whatwg.org/multipage/infrastructure.html#strip-and-collapse-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnothtmlwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnothtmlwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( type === "string" ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = value.match( rnothtmlwhite ) || [];

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




support.focusin = "onfocusin" in window;


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = jQuery.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = jQuery.isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( jQuery.isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 13
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( jQuery.isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" ).prop( {
					charset: s.scriptCharset,
					src: s.url
				} ).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var doc, docElem, rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		rect = elem.getBoundingClientRect();

		doc = elem.ownerDocument;
		docElem = doc.documentElement;
		win = doc.defaultView;

		return {
			top: rect.top + win.pageYOffset - docElem.clientTop,
			left: rect.left + win.pageXOffset - docElem.clientLeft
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
		// because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume getBoundingClientRect is there when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {

			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset = {
				top: parentOffset.top + jQuery.css( offsetParent[ 0 ], "borderTopWidth", true ),
				left: parentOffset.left + jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true )
			};
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( jQuery.isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );

},{}],3:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["skatejsWebComponents"] = factory();
	else
		root["skatejsWebComponents"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// NOTE!!!
	//
	// We have to load polyfills directly from source as non-minified files are not
	// published by the polyfills. An issue was raised to discuss this problem and
	// to see if it can be resolved.
	//
	// See https://github.com/webcomponents/custom-elements/issues/45
	
	// ES2015 polyfills required for the polyfills to work in older browsers.
	__webpack_require__(1).shim();
	__webpack_require__(26).shim();
	__webpack_require__(31).polyfill();
	
	// We have to include this first so that it can patch native. This must be done
	// before any polyfills are loaded.
	__webpack_require__(34);
	
	// Template polyfill is necessary to use shadycss in IE11
	// this comes before custom elements because of
	// https://github.com/webcomponents/template/blob/master/template.js#L39
	__webpack_require__(35);
	
	// This comes after the native shim because it requries it to be patched first.
	__webpack_require__(36);
	
	// Force the polyfill in Safari 10.0.0 and 10.0.1.
	var _window = window,
	    navigator = _window.navigator;
	var userAgent = navigator.userAgent;
	
	var safari = userAgent.indexOf('Safari/60') !== -1;
	var safariVersion = safari && userAgent.match(/Version\/([^\s]+)/)[1];
	var safariVersions = [0, 1].map(function (v) {
	  return '10.0.' + v;
	}).concat(['10.0']);
	
	if (safari && safariVersions.indexOf(safariVersion) > -1) {
	  window.ShadyDOM = { force: true };
	}
	
	// ShadyDOM comes first. Both because it may need to be forced and the
	// ShadyCSS polyfill requires it to function.
	__webpack_require__(51);
	__webpack_require__(67);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var define = __webpack_require__(2);
	
	var implementation = __webpack_require__(6);
	var getPolyfill = __webpack_require__(24);
	var shim = __webpack_require__(25);
	
	// eslint-disable-next-line no-unused-vars
	var boundFromShim = function from(array) {
		// eslint-disable-next-line no-invalid-this
		return implementation.apply(this || Array, arguments);
	};
	
	define(boundFromShim, {
		'getPolyfill': getPolyfill,
		'implementation': implementation,
		'shim': shim
	});
	
	module.exports = boundFromShim;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var keys = __webpack_require__(3);
	var foreach = __webpack_require__(5);
	var hasSymbols = typeof Symbol === 'function' && _typeof(Symbol()) === 'symbol';
	
	var toStr = Object.prototype.toString;
	
	var isFunction = function isFunction(fn) {
		return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
	};
	
	var arePropertyDescriptorsSupported = function arePropertyDescriptorsSupported() {
		var obj = {};
		try {
			Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
			/* eslint-disable no-unused-vars, no-restricted-syntax */
			for (var _ in obj) {
				return false;
			}
			/* eslint-enable no-unused-vars, no-restricted-syntax */
			return obj.x === obj;
		} catch (e) {
			/* this is IE 8. */
			return false;
		}
	};
	var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();
	
	var defineProperty = function defineProperty(object, name, value, predicate) {
		if (name in object && (!isFunction(predicate) || !predicate())) {
			return;
		}
		if (supportsDescriptors) {
			Object.defineProperty(object, name, {
				configurable: true,
				enumerable: false,
				value: value,
				writable: true
			});
		} else {
			object[name] = value;
		}
	};
	
	var defineProperties = function defineProperties(object, map) {
		var predicates = arguments.length > 2 ? arguments[2] : {};
		var props = keys(map);
		if (hasSymbols) {
			props = props.concat(Object.getOwnPropertySymbols(map));
		}
		foreach(props, function (name) {
			defineProperty(object, name, map[name], predicates[name]);
		});
	};
	
	defineProperties.supportsDescriptors = !!supportsDescriptors;
	
	module.exports = defineProperties;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// modified from https://github.com/es-shims/es5-shim
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var slice = Array.prototype.slice;
	var isArgs = __webpack_require__(4);
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];
	var equalsConstructorPrototype = function equalsConstructorPrototype(o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = function () {
		/* global window */
		if (typeof window === 'undefined') {
			return false;
		}
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && _typeof(window[k]) === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}();
	var equalsConstructorPrototypeIfNotBuggy = function equalsConstructorPrototypeIfNotBuggy(o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};
	
	var keysShim = function keys(object) {
		var isObject = object !== null && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];
	
		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}
	
		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}
	
		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}
	
		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
	
			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
	
	keysShim.shim = function shimObjectKeys() {
		if (Object.keys) {
			var keysWorksWithArguments = function () {
				// Safari 5.0 bug
				return (Object.keys(arguments) || '').length === 2;
			}(1, 2);
			if (!keysWorksWithArguments) {
				var originalKeys = Object.keys;
				Object.keys = function keys(object) {
					if (isArgs(object)) {
						return originalKeys(slice.call(object));
					} else {
						return originalKeys(object);
					}
				};
			}
		} else {
			Object.keys = keysShim;
		}
		return Object.keys || keysShim;
	};
	
	module.exports = keysShim;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var toStr = Object.prototype.toString;
	
	module.exports = function isArguments(value) {
		var str = toStr.call(value);
		var isArgs = str === '[object Arguments]';
		if (!isArgs) {
			isArgs = str !== '[object Array]' && value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && typeof value.length === 'number' && value.length >= 0 && toStr.call(value.callee) === '[object Function]';
		}
		return isArgs;
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	
	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;
	
	module.exports = function forEach(obj, fn, ctx) {
	    if (toString.call(fn) !== '[object Function]') {
	        throw new TypeError('iterator must be a function');
	    }
	    var l = obj.length;
	    if (l === +l) {
	        for (var i = 0; i < l; i++) {
	            fn.call(ctx, obj[i], i, obj);
	        }
	    } else {
	        for (var k in obj) {
	            if (hasOwn.call(obj, k)) {
	                fn.call(ctx, obj[k], k, obj);
	            }
	        }
	    }
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var ES = __webpack_require__(7);
	var supportsDescriptors = __webpack_require__(2).supportsDescriptors;
	
	/*! https://mths.be/array-from v0.2.0 by @mathias */
	module.exports = function from(arrayLike) {
		var defineProperty = supportsDescriptors ? Object.defineProperty : function put(object, key, descriptor) {
			object[key] = descriptor.value;
		};
		var C = this;
		if (arrayLike === null || typeof arrayLike === 'undefined') {
			throw new TypeError('`Array.from` requires an array-like object, not `null` or `undefined`');
		}
		var items = ES.ToObject(arrayLike);
	
		var mapFn, T;
		if (typeof arguments[1] !== 'undefined') {
			mapFn = arguments[1];
			if (!ES.IsCallable(mapFn)) {
				throw new TypeError('When provided, the second argument to `Array.from` must be a function');
			}
			if (arguments.length > 2) {
				T = arguments[2];
			}
		}
	
		var len = ES.ToLength(items.length);
		var A = ES.IsCallable(C) ? ES.ToObject(new C(len)) : new Array(len);
		var k = 0;
		var kValue, mappedValue;
		while (k < len) {
			kValue = items[k];
			if (mapFn) {
				mappedValue = typeof T === 'undefined' ? mapFn(kValue, k) : ES.Call(mapFn, T, [kValue, k]);
			} else {
				mappedValue = kValue;
			}
			defineProperty(A, k, {
				'configurable': true,
				'enumerable': true,
				'value': mappedValue,
				'writable': true
			});
			k += 1;
		}
		A.length = len;
		return A;
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var toStr = Object.prototype.toString;
	var hasSymbols = typeof Symbol === 'function' && _typeof(Symbol.iterator) === 'symbol';
	var symbolToStr = hasSymbols ? Symbol.prototype.toString : toStr;
	
	var $isNaN = __webpack_require__(8);
	var $isFinite = __webpack_require__(9);
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
	
	var assign = __webpack_require__(10);
	var sign = __webpack_require__(11);
	var mod = __webpack_require__(12);
	var isPrimitive = __webpack_require__(13);
	var toPrimitive = __webpack_require__(14);
	var parseInteger = parseInt;
	var bind = __webpack_require__(19);
	var strSlice = bind.call(Function.call, String.prototype.slice);
	var isBinary = bind.call(Function.call, RegExp.prototype.test, /^0b[01]+$/i);
	var isOctal = bind.call(Function.call, RegExp.prototype.test, /^0o[0-7]+$/i);
	var nonWS = ['\x85', '\u200B', '\uFFFE'].join('');
	var nonWSregex = new RegExp('[' + nonWS + ']', 'g');
	var hasNonWS = bind.call(Function.call, RegExp.prototype.test, nonWSregex);
	var invalidHexLiteral = /^[\-\+]0x[0-9a-f]+$/i;
	var isInvalidHexLiteral = bind.call(Function.call, RegExp.prototype.test, invalidHexLiteral);
	
	// whitespace from: http://es5.github.io/#x15.5.4.20
	// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
	var ws = ['\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003', '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028', '\u2029\uFEFF'].join('');
	var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
	var replace = bind.call(Function.call, String.prototype.replace);
	var trim = function trim(value) {
		return replace(value, trimRegex, '');
	};
	
	var ES5 = __webpack_require__(21);
	
	var hasRegExpMatcher = __webpack_require__(23);
	
	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-abstract-operations
	var ES6 = assign(assign({}, ES5), {
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-call-f-v-args
		Call: function Call(F, V) {
			var args = arguments.length > 2 ? arguments[2] : [];
			if (!this.IsCallable(F)) {
				throw new TypeError(F + ' is not a function');
			}
			return F.apply(V, args);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toprimitive
		ToPrimitive: toPrimitive,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toboolean
		// ToBoolean: ES5.ToBoolean,
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
		ToNumber: function ToNumber(argument) {
			var value = isPrimitive(argument) ? argument : toPrimitive(argument, 'number');
			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'symbol') {
				throw new TypeError('Cannot convert a Symbol value to a number');
			}
			if (typeof value === 'string') {
				if (isBinary(value)) {
					return this.ToNumber(parseInteger(strSlice(value, 2), 2));
				} else if (isOctal(value)) {
					return this.ToNumber(parseInteger(strSlice(value, 2), 8));
				} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
					return NaN;
				} else {
					var trimmed = trim(value);
					if (trimmed !== value) {
						return this.ToNumber(trimmed);
					}
				}
			}
			return Number(value);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tointeger
		// ToInteger: ES5.ToNumber,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint32
		// ToInt32: ES5.ToInt32,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
		// ToUint32: ES5.ToUint32,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint16
		ToInt16: function ToInt16(argument) {
			var int16bit = this.ToUint16(argument);
			return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint16
		// ToUint16: ES5.ToUint16,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint8
		ToInt8: function ToInt8(argument) {
			var int8bit = this.ToUint8(argument);
			return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8
		ToUint8: function ToUint8(argument) {
			var number = this.ToNumber(argument);
			if ($isNaN(number) || number === 0 || !$isFinite(number)) {
				return 0;
			}
			var posInt = sign(number) * Math.floor(Math.abs(number));
			return mod(posInt, 0x100);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8clamp
		ToUint8Clamp: function ToUint8Clamp(argument) {
			var number = this.ToNumber(argument);
			if ($isNaN(number) || number <= 0) {
				return 0;
			}
			if (number >= 0xFF) {
				return 0xFF;
			}
			var f = Math.floor(argument);
			if (f + 0.5 < number) {
				return f + 1;
			}
			if (number < f + 0.5) {
				return f;
			}
			if (f % 2 !== 0) {
				return f + 1;
			}
			return f;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tostring
		ToString: function ToString(argument) {
			if ((typeof argument === 'undefined' ? 'undefined' : _typeof(argument)) === 'symbol') {
				throw new TypeError('Cannot convert a Symbol value to a string');
			}
			return String(argument);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toobject
		ToObject: function ToObject(value) {
			this.RequireObjectCoercible(value);
			return Object(value);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
		ToPropertyKey: function ToPropertyKey(argument) {
			var key = this.ToPrimitive(argument, String);
			return (typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol' ? symbolToStr.call(key) : this.ToString(key);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
		ToLength: function ToLength(argument) {
			var len = this.ToInteger(argument);
			if (len <= 0) {
				return 0;
			} // includes converting -0 to +0
			if (len > MAX_SAFE_INTEGER) {
				return MAX_SAFE_INTEGER;
			}
			return len;
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring
		CanonicalNumericIndexString: function CanonicalNumericIndexString(argument) {
			if (toStr.call(argument) !== '[object String]') {
				throw new TypeError('must be a string');
			}
			if (argument === '-0') {
				return -0;
			}
			var n = this.ToNumber(argument);
			if (this.SameValue(this.ToString(n), argument)) {
				return n;
			}
			return void 0;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-requireobjectcoercible
		RequireObjectCoercible: ES5.CheckObjectCoercible,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
		IsArray: Array.isArray || function IsArray(argument) {
			return toStr.call(argument) === '[object Array]';
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
		// IsCallable: ES5.IsCallable,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
		IsConstructor: function IsConstructor(argument) {
			return typeof argument === 'function' && !!argument.prototype; // unfortunately there's no way to truly check this without try/catch `new argument`
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isextensible-o
		IsExtensible: function IsExtensible(obj) {
			if (!Object.preventExtensions) {
				return true;
			}
			if (isPrimitive(obj)) {
				return false;
			}
			return Object.isExtensible(obj);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isinteger
		IsInteger: function IsInteger(argument) {
			if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
				return false;
			}
			var abs = Math.abs(argument);
			return Math.floor(abs) === abs;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispropertykey
		IsPropertyKey: function IsPropertyKey(argument) {
			return typeof argument === 'string' || (typeof argument === 'undefined' ? 'undefined' : _typeof(argument)) === 'symbol';
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-isregexp
		IsRegExp: function IsRegExp(argument) {
			if (!argument || (typeof argument === 'undefined' ? 'undefined' : _typeof(argument)) !== 'object') {
				return false;
			}
			if (hasSymbols) {
				var isRegExp = argument[Symbol.match];
				if (typeof isRegExp !== 'undefined') {
					return ES5.ToBoolean(isRegExp);
				}
			}
			return hasRegExpMatcher(argument);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
		// SameValue: ES5.SameValue,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
		SameValueZero: function SameValueZero(x, y) {
			return x === y || $isNaN(x) && $isNaN(y);
		},
	
		Type: function Type(x) {
			if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'symbol') {
				return 'Symbol';
			}
			return ES5.Type(x);
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-speciesconstructor
		SpeciesConstructor: function SpeciesConstructor(O, defaultConstructor) {
			if (this.Type(O) !== 'Object') {
				throw new TypeError('Assertion failed: Type(O) is not Object');
			}
			var C = O.constructor;
			if (typeof C === 'undefined') {
				return defaultConstructor;
			}
			if (this.Type(C) !== 'Object') {
				throw new TypeError('O.constructor is not an Object');
			}
			var S = hasSymbols && Symbol.species ? C[Symbol.species] : undefined;
			if (S == null) {
				return defaultConstructor;
			}
			if (this.IsConstructor(S)) {
				return S;
			}
			throw new TypeError('no constructor found');
		}
	});
	
	delete ES6.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible
	
	module.exports = ES6;

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = Number.isNaN || function isNaN(a) {
		return a !== a;
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';
	
	var $isNaN = Number.isNaN || function (a) {
	  return a !== a;
	};
	
	module.exports = Number.isFinite || function (x) {
	  return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity;
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	
	var has = Object.prototype.hasOwnProperty;
	module.exports = Object.assign || function assign(target, source) {
		for (var key in source) {
			if (has.call(source, key)) {
				target[key] = source[key];
			}
		}
		return target;
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function sign(number) {
		return number >= 0 ? 1 : -1;
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function mod(number, modulo) {
		var remain = number % modulo;
		return Math.floor(remain >= 0 ? remain : remain + modulo);
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	module.exports = function isPrimitive(value) {
		return value === null || typeof value !== 'function' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object';
	};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var hasSymbols = typeof Symbol === 'function' && _typeof(Symbol.iterator) === 'symbol';
	
	var isPrimitive = __webpack_require__(15);
	var isCallable = __webpack_require__(16);
	var isDate = __webpack_require__(17);
	var isSymbol = __webpack_require__(18);
	
	var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
		if (typeof O === 'undefined' || O === null) {
			throw new TypeError('Cannot call method on ' + O);
		}
		if (typeof hint !== 'string' || hint !== 'number' && hint !== 'string') {
			throw new TypeError('hint must be "string" or "number"');
		}
		var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
		var method, result, i;
		for (i = 0; i < methodNames.length; ++i) {
			method = O[methodNames[i]];
			if (isCallable(method)) {
				result = method.call(O);
				if (isPrimitive(result)) {
					return result;
				}
			}
		}
		throw new TypeError('No default value');
	};
	
	var GetMethod = function GetMethod(O, P) {
		var func = O[P];
		if (func !== null && typeof func !== 'undefined') {
			if (!isCallable(func)) {
				throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
			}
			return func;
		}
	};
	
	// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
	module.exports = function ToPrimitive(input, PreferredType) {
		if (isPrimitive(input)) {
			return input;
		}
		var hint = 'default';
		if (arguments.length > 1) {
			if (PreferredType === String) {
				hint = 'string';
			} else if (PreferredType === Number) {
				hint = 'number';
			}
		}
	
		var exoticToPrim;
		if (hasSymbols) {
			if (Symbol.toPrimitive) {
				exoticToPrim = GetMethod(input, Symbol.toPrimitive);
			} else if (isSymbol(input)) {
				exoticToPrim = Symbol.prototype.valueOf;
			}
		}
		if (typeof exoticToPrim !== 'undefined') {
			var result = exoticToPrim.call(input, hint);
			if (isPrimitive(result)) {
				return result;
			}
			throw new TypeError('unable to convert exotic object to primitive');
		}
		if (hint === 'default' && (isDate(input) || isSymbol(input))) {
			hint = 'string';
		}
		return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
	};

/***/ },
/* 15 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	module.exports = function isPrimitive(value) {
		return value === null || typeof value !== 'function' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object';
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var fnToStr = Function.prototype.toString;
	
	var constructorRegex = /^\s*class /;
	var isES6ClassFn = function isES6ClassFn(value) {
		try {
			var fnStr = fnToStr.call(value);
			var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
			var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
			var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
			return constructorRegex.test(spaceStripped);
		} catch (e) {
			return false; // not a function
		}
	};
	
	var tryFunctionObject = function tryFunctionObject(value) {
		try {
			if (isES6ClassFn(value)) {
				return false;
			}
			fnToStr.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var fnClass = '[object Function]';
	var genClass = '[object GeneratorFunction]';
	var hasToStringTag = typeof Symbol === 'function' && _typeof(Symbol.toStringTag) === 'symbol';
	
	module.exports = function isCallable(value) {
		if (!value) {
			return false;
		}
		if (typeof value !== 'function' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') {
			return false;
		}
		if (hasToStringTag) {
			return tryFunctionObject(value);
		}
		if (isES6ClassFn(value)) {
			return false;
		}
		var strClass = toStr.call(value);
		return strClass === fnClass || strClass === genClass;
	};

/***/ },
/* 17 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var getDay = Date.prototype.getDay;
	var tryDateObject = function tryDateObject(value) {
		try {
			getDay.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	
	var toStr = Object.prototype.toString;
	var dateClass = '[object Date]';
	var hasToStringTag = typeof Symbol === 'function' && _typeof(Symbol.toStringTag) === 'symbol';
	
	module.exports = function isDateObject(value) {
		if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object' || value === null) {
			return false;
		}
		return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
	};

/***/ },
/* 18 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var toStr = Object.prototype.toString;
	var hasSymbols = typeof Symbol === 'function' && _typeof(Symbol()) === 'symbol';
	
	if (hasSymbols) {
		var symToStr = Symbol.prototype.toString;
		var symStringRegex = /^Symbol\(.*\)$/;
		var isSymbolObject = function isSymbolObject(value) {
			if (_typeof(value.valueOf()) !== 'symbol') {
				return false;
			}
			return symStringRegex.test(symToStr.call(value));
		};
		module.exports = function isSymbol(value) {
			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'symbol') {
				return true;
			}
			if (toStr.call(value) !== '[object Symbol]') {
				return false;
			}
			try {
				return isSymbolObject(value);
			} catch (e) {
				return false;
			}
		};
	} else {
		module.exports = function isSymbol(value) {
			// this environment does not support Symbols.
			return false;
		};
	}

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var implementation = __webpack_require__(20);
	
	module.exports = Function.prototype.bind || implementation;

/***/ },
/* 20 */
/***/ function(module, exports) {

	'use strict';
	
	var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
	var slice = Array.prototype.slice;
	var toStr = Object.prototype.toString;
	var funcType = '[object Function]';
	
	module.exports = function bind(that) {
	    var target = this;
	    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
	        throw new TypeError(ERROR_MESSAGE + target);
	    }
	    var args = slice.call(arguments, 1);
	
	    var bound;
	    var binder = function binder() {
	        if (this instanceof bound) {
	            var result = target.apply(this, args.concat(slice.call(arguments)));
	            if (Object(result) === result) {
	                return result;
	            }
	            return this;
	        } else {
	            return target.apply(that, args.concat(slice.call(arguments)));
	        }
	    };
	
	    var boundLength = Math.max(0, target.length - args.length);
	    var boundArgs = [];
	    for (var i = 0; i < boundLength; i++) {
	        boundArgs.push('$' + i);
	    }
	
	    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);
	
	    if (target.prototype) {
	        var Empty = function Empty() {};
	        Empty.prototype = target.prototype;
	        bound.prototype = new Empty();
	        Empty.prototype = null;
	    }
	
	    return bound;
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var $isNaN = __webpack_require__(8);
	var $isFinite = __webpack_require__(9);
	
	var sign = __webpack_require__(11);
	var mod = __webpack_require__(12);
	
	var IsCallable = __webpack_require__(16);
	var toPrimitive = __webpack_require__(22);
	
	// https://es5.github.io/#x9
	var ES5 = {
		ToPrimitive: toPrimitive,
	
		ToBoolean: function ToBoolean(value) {
			return Boolean(value);
		},
		ToNumber: function ToNumber(value) {
			return Number(value);
		},
		ToInteger: function ToInteger(value) {
			var number = this.ToNumber(value);
			if ($isNaN(number)) {
				return 0;
			}
			if (number === 0 || !$isFinite(number)) {
				return number;
			}
			return sign(number) * Math.floor(Math.abs(number));
		},
		ToInt32: function ToInt32(x) {
			return this.ToNumber(x) >> 0;
		},
		ToUint32: function ToUint32(x) {
			return this.ToNumber(x) >>> 0;
		},
		ToUint16: function ToUint16(value) {
			var number = this.ToNumber(value);
			if ($isNaN(number) || number === 0 || !$isFinite(number)) {
				return 0;
			}
			var posInt = sign(number) * Math.floor(Math.abs(number));
			return mod(posInt, 0x10000);
		},
		ToString: function ToString(value) {
			return String(value);
		},
		ToObject: function ToObject(value) {
			this.CheckObjectCoercible(value);
			return Object(value);
		},
		CheckObjectCoercible: function CheckObjectCoercible(value, optMessage) {
			/* jshint eqnull:true */
			if (value == null) {
				throw new TypeError(optMessage || 'Cannot call method on ' + value);
			}
			return value;
		},
		IsCallable: IsCallable,
		SameValue: function SameValue(x, y) {
			if (x === y) {
				// 0 === -0, but they are not identical.
				if (x === 0) {
					return 1 / x === 1 / y;
				}
				return true;
			}
			return $isNaN(x) && $isNaN(y);
		},
	
		// http://www.ecma-international.org/ecma-262/5.1/#sec-8
		Type: function Type(x) {
			if (x === null) {
				return 'Null';
			}
			if (typeof x === 'undefined') {
				return 'Undefined';
			}
			if (typeof x === 'function' || (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object') {
				return 'Object';
			}
			if (typeof x === 'number') {
				return 'Number';
			}
			if (typeof x === 'boolean') {
				return 'Boolean';
			}
			if (typeof x === 'string') {
				return 'String';
			}
		}
	};
	
	module.exports = ES5;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var toStr = Object.prototype.toString;
	
	var isPrimitive = __webpack_require__(15);
	
	var isCallable = __webpack_require__(16);
	
	// https://es5.github.io/#x8.12
	var ES5internalSlots = {
		'[[DefaultValue]]': function DefaultValue(O, hint) {
			var actualHint = hint || (toStr.call(O) === '[object Date]' ? String : Number);
	
			if (actualHint === String || actualHint === Number) {
				var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
				var value, i;
				for (i = 0; i < methods.length; ++i) {
					if (isCallable(O[methods[i]])) {
						value = O[methods[i]]();
						if (isPrimitive(value)) {
							return value;
						}
					}
				}
				throw new TypeError('No default value');
			}
			throw new TypeError('invalid [[DefaultValue]] hint supplied');
		}
	};
	
	// https://es5.github.io/#x9
	module.exports = function ToPrimitive(input, PreferredType) {
		if (isPrimitive(input)) {
			return input;
		}
		return ES5internalSlots['[[DefaultValue]]'](input, PreferredType);
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var regexExec = RegExp.prototype.exec;
	var tryRegexExec = function tryRegexExec(value) {
		try {
			regexExec.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var regexClass = '[object RegExp]';
	var hasToStringTag = typeof Symbol === 'function' && _typeof(Symbol.toStringTag) === 'symbol';
	
	module.exports = function isRegex(value) {
		if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') {
			return false;
		}
		return hasToStringTag ? tryRegexExec(value) : toStr.call(value) === regexClass;
	};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var ES = __webpack_require__(7);
	var implementation = __webpack_require__(6);
	
	var tryCall = function tryCall(fn) {
		try {
			fn();
			return true;
		} catch (e) {
			return false;
		}
	};
	
	module.exports = function getPolyfill() {
		var implemented = ES.IsCallable(Array.from) && tryCall(function () {
			Array.from({ 'length': -Infinity });
		}) && !tryCall(function () {
			Array.from([], undefined);
		});
	
		return implemented ? Array.from : implementation;
	};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var define = __webpack_require__(2);
	var getPolyfill = __webpack_require__(24);
	
	module.exports = function shimArrayFrom() {
		var polyfill = getPolyfill();
	
		define(Array, { 'from': polyfill }, {
			'from': function from() {
				return Array.from !== polyfill;
			}
		});
	
		return polyfill;
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var defineProperties = __webpack_require__(2);
	
	var implementation = __webpack_require__(27);
	var getPolyfill = __webpack_require__(29);
	var shim = __webpack_require__(30);
	
	var polyfill = getPolyfill();
	
	defineProperties(polyfill, {
		implementation: implementation,
		getPolyfill: getPolyfill,
		shim: shim
	});
	
	module.exports = polyfill;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// modified from https://github.com/es-shims/es6-shim
	
	var keys = __webpack_require__(3);
	var bind = __webpack_require__(19);
	var canBeObject = function canBeObject(obj) {
		return typeof obj !== 'undefined' && obj !== null;
	};
	var hasSymbols = __webpack_require__(28)();
	var toObject = Object;
	var push = bind.call(Function.call, Array.prototype.push);
	var propIsEnumerable = bind.call(Function.call, Object.prototype.propertyIsEnumerable);
	var originalGetSymbols = hasSymbols ? Object.getOwnPropertySymbols : null;
	
	module.exports = function assign(target, source1) {
		if (!canBeObject(target)) {
			throw new TypeError('target must be an object');
		}
		var objTarget = toObject(target);
		var s, source, i, props, syms, value, key;
		for (s = 1; s < arguments.length; ++s) {
			source = toObject(arguments[s]);
			props = keys(source);
			var getSymbols = hasSymbols && (Object.getOwnPropertySymbols || originalGetSymbols);
			if (getSymbols) {
				syms = getSymbols(source);
				for (i = 0; i < syms.length; ++i) {
					key = syms[i];
					if (propIsEnumerable(source, key)) {
						push(props, key);
					}
				}
			}
			for (i = 0; i < props.length; ++i) {
				key = props[i];
				value = source[key];
				if (propIsEnumerable(source, key)) {
					objTarget[key] = value;
				}
			}
		}
		return objTarget;
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var keys = __webpack_require__(3);
	
	module.exports = function hasSymbols() {
		if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') {
			return false;
		}
		if (_typeof(Symbol.iterator) === 'symbol') {
			return true;
		}
	
		var obj = {};
		var sym = Symbol('test');
		var symObj = Object(sym);
		if (typeof sym === 'string') {
			return false;
		}
	
		if (Object.prototype.toString.call(sym) !== '[object Symbol]') {
			return false;
		}
		if (Object.prototype.toString.call(symObj) !== '[object Symbol]') {
			return false;
		}
	
		// temp disabled per https://github.com/ljharb/object.assign/issues/17
		// if (sym instanceof Symbol) { return false; }
		// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
		// if (!(symObj instanceof Symbol)) { return false; }
	
		var symVal = 42;
		obj[sym] = symVal;
		for (sym in obj) {
			return false;
		}
		if (keys(obj).length !== 0) {
			return false;
		}
		if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) {
			return false;
		}
	
		if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) {
			return false;
		}
	
		var syms = Object.getOwnPropertySymbols(obj);
		if (syms.length !== 1 || syms[0] !== sym) {
			return false;
		}
	
		if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
			return false;
		}
	
		if (typeof Object.getOwnPropertyDescriptor === 'function') {
			var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
			if (descriptor.value !== symVal || descriptor.enumerable !== true) {
				return false;
			}
		}
	
		return true;
	};

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var implementation = __webpack_require__(27);
	
	var lacksProperEnumerationOrder = function lacksProperEnumerationOrder() {
		if (!Object.assign) {
			return false;
		}
		// v8, specifically in node 4.x, has a bug with incorrect property enumeration order
		// note: this does not detect the bug unless there's 20 characters
		var str = 'abcdefghijklmnopqrst';
		var letters = str.split('');
		var map = {};
		for (var i = 0; i < letters.length; ++i) {
			map[letters[i]] = letters[i];
		}
		var obj = Object.assign({}, map);
		var actual = '';
		for (var k in obj) {
			actual += k;
		}
		return str !== actual;
	};
	
	var assignHasPendingExceptions = function assignHasPendingExceptions() {
		if (!Object.assign || !Object.preventExtensions) {
			return false;
		}
		// Firefox 37 still has "pending exception" logic in its Object.assign implementation,
		// which is 72% slower than our shim, and Firefox 40's native implementation.
		var thrower = Object.preventExtensions({ 1: 2 });
		try {
			Object.assign(thrower, 'xy');
		} catch (e) {
			return thrower[1] === 'y';
		}
		return false;
	};
	
	module.exports = function getPolyfill() {
		if (!Object.assign) {
			return implementation;
		}
		if (lacksProperEnumerationOrder()) {
			return implementation;
		}
		if (assignHasPendingExceptions()) {
			return implementation;
		}
		return Object.assign;
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var define = __webpack_require__(2);
	var getPolyfill = __webpack_require__(29);
	
	module.exports = function shimAssign() {
		var polyfill = getPolyfill();
		define(Object, { assign: polyfill }, { assign: function assign() {
				return Object.assign !== polyfill;
			} });
		return polyfill;
	};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var require;var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process, global) {'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
	 * @version   4.0.5
	 */
	
	(function (global, factory) {
	  ( false ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() :  true ? !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : global.ES6Promise = factory();
	})(undefined, function () {
	  'use strict';
	
	  function objectOrFunction(x) {
	    return typeof x === 'function' || (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' && x !== null;
	  }
	
	  function isFunction(x) {
	    return typeof x === 'function';
	  }
	
	  var _isArray = undefined;
	  if (!Array.isArray) {
	    _isArray = function _isArray(x) {
	      return Object.prototype.toString.call(x) === '[object Array]';
	    };
	  } else {
	    _isArray = Array.isArray;
	  }
	
	  var isArray = _isArray;
	
	  var len = 0;
	  var vertxNext = undefined;
	  var customSchedulerFn = undefined;
	
	  var asap = function asap(callback, arg) {
	    queue[len] = callback;
	    queue[len + 1] = arg;
	    len += 2;
	    if (len === 2) {
	      // If len is 2, that means that we need to schedule an async flush.
	      // If additional callbacks are queued before the queue is flushed, they
	      // will be processed by this flush that we are scheduling.
	      if (customSchedulerFn) {
	        customSchedulerFn(flush);
	      } else {
	        scheduleFlush();
	      }
	    }
	  };
	
	  function setScheduler(scheduleFn) {
	    customSchedulerFn = scheduleFn;
	  }
	
	  function setAsap(asapFn) {
	    asap = asapFn;
	  }
	
	  var browserWindow = typeof window !== 'undefined' ? window : undefined;
	  var browserGlobal = browserWindow || {};
	  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
	  var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
	
	  // test for web worker but not in IE10
	  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
	
	  // node
	  function useNextTick() {
	    // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	    // see https://github.com/cujojs/when/issues/410 for details
	    return function () {
	      return process.nextTick(flush);
	    };
	  }
	
	  // vertx
	  function useVertxTimer() {
	    if (typeof vertxNext !== 'undefined') {
	      return function () {
	        vertxNext(flush);
	      };
	    }
	
	    return useSetTimeout();
	  }
	
	  function useMutationObserver() {
	    var iterations = 0;
	    var observer = new BrowserMutationObserver(flush);
	    var node = document.createTextNode('');
	    observer.observe(node, { characterData: true });
	
	    return function () {
	      node.data = iterations = ++iterations % 2;
	    };
	  }
	
	  // web worker
	  function useMessageChannel() {
	    var channel = new MessageChannel();
	    channel.port1.onmessage = flush;
	    return function () {
	      return channel.port2.postMessage(0);
	    };
	  }
	
	  function useSetTimeout() {
	    // Store setTimeout reference so es6-promise will be unaffected by
	    // other code modifying setTimeout (like sinon.useFakeTimers())
	    var globalSetTimeout = setTimeout;
	    return function () {
	      return globalSetTimeout(flush, 1);
	    };
	  }
	
	  var queue = new Array(1000);
	  function flush() {
	    for (var i = 0; i < len; i += 2) {
	      var callback = queue[i];
	      var arg = queue[i + 1];
	
	      callback(arg);
	
	      queue[i] = undefined;
	      queue[i + 1] = undefined;
	    }
	
	    len = 0;
	  }
	
	  function attemptVertx() {
	    try {
	      var r = require;
	      var vertx = __webpack_require__(33);
	      vertxNext = vertx.runOnLoop || vertx.runOnContext;
	      return useVertxTimer();
	    } catch (e) {
	      return useSetTimeout();
	    }
	  }
	
	  var scheduleFlush = undefined;
	  // Decide what async method to use to triggering processing of queued callbacks:
	  if (isNode) {
	    scheduleFlush = useNextTick();
	  } else if (BrowserMutationObserver) {
	    scheduleFlush = useMutationObserver();
	  } else if (isWorker) {
	    scheduleFlush = useMessageChannel();
	  } else if (browserWindow === undefined && "function" === 'function') {
	    scheduleFlush = attemptVertx();
	  } else {
	    scheduleFlush = useSetTimeout();
	  }
	
	  function then(onFulfillment, onRejection) {
	    var _arguments = arguments;
	
	    var parent = this;
	
	    var child = new this.constructor(noop);
	
	    if (child[PROMISE_ID] === undefined) {
	      makePromise(child);
	    }
	
	    var _state = parent._state;
	
	    if (_state) {
	      (function () {
	        var callback = _arguments[_state - 1];
	        asap(function () {
	          return invokeCallback(_state, child, callback, parent._result);
	        });
	      })();
	    } else {
	      subscribe(parent, child, onFulfillment, onRejection);
	    }
	
	    return child;
	  }
	
	  /**
	    `Promise.resolve` returns a promise that will become resolved with the
	    passed `value`. It is shorthand for the following:
	  
	    ```javascript
	    let promise = new Promise(function(resolve, reject){
	      resolve(1);
	    });
	  
	    promise.then(function(value){
	      // value === 1
	    });
	    ```
	  
	    Instead of writing the above, your code now simply becomes the following:
	  
	    ```javascript
	    let promise = Promise.resolve(1);
	  
	    promise.then(function(value){
	      // value === 1
	    });
	    ```
	  
	    @method resolve
	    @static
	    @param {Any} value value that the returned promise will be resolved with
	    Useful for tooling.
	    @return {Promise} a promise that will become fulfilled with the given
	    `value`
	  */
	  function resolve(object) {
	    /*jshint validthis:true */
	    var Constructor = this;
	
	    if (object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.constructor === Constructor) {
	      return object;
	    }
	
	    var promise = new Constructor(noop);
	    _resolve(promise, object);
	    return promise;
	  }
	
	  var PROMISE_ID = Math.random().toString(36).substring(16);
	
	  function noop() {}
	
	  var PENDING = void 0;
	  var FULFILLED = 1;
	  var REJECTED = 2;
	
	  var GET_THEN_ERROR = new ErrorObject();
	
	  function selfFulfillment() {
	    return new TypeError("You cannot resolve a promise with itself");
	  }
	
	  function cannotReturnOwn() {
	    return new TypeError('A promises callback cannot return that same promise.');
	  }
	
	  function getThen(promise) {
	    try {
	      return promise.then;
	    } catch (error) {
	      GET_THEN_ERROR.error = error;
	      return GET_THEN_ERROR;
	    }
	  }
	
	  function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	    try {
	      then.call(value, fulfillmentHandler, rejectionHandler);
	    } catch (e) {
	      return e;
	    }
	  }
	
	  function handleForeignThenable(promise, thenable, then) {
	    asap(function (promise) {
	      var sealed = false;
	      var error = tryThen(then, thenable, function (value) {
	        if (sealed) {
	          return;
	        }
	        sealed = true;
	        if (thenable !== value) {
	          _resolve(promise, value);
	        } else {
	          fulfill(promise, value);
	        }
	      }, function (reason) {
	        if (sealed) {
	          return;
	        }
	        sealed = true;
	
	        _reject(promise, reason);
	      }, 'Settle: ' + (promise._label || ' unknown promise'));
	
	      if (!sealed && error) {
	        sealed = true;
	        _reject(promise, error);
	      }
	    }, promise);
	  }
	
	  function handleOwnThenable(promise, thenable) {
	    if (thenable._state === FULFILLED) {
	      fulfill(promise, thenable._result);
	    } else if (thenable._state === REJECTED) {
	      _reject(promise, thenable._result);
	    } else {
	      subscribe(thenable, undefined, function (value) {
	        return _resolve(promise, value);
	      }, function (reason) {
	        return _reject(promise, reason);
	      });
	    }
	  }
	
	  function handleMaybeThenable(promise, maybeThenable, then$$) {
	    if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
	      handleOwnThenable(promise, maybeThenable);
	    } else {
	      if (then$$ === GET_THEN_ERROR) {
	        _reject(promise, GET_THEN_ERROR.error);
	      } else if (then$$ === undefined) {
	        fulfill(promise, maybeThenable);
	      } else if (isFunction(then$$)) {
	        handleForeignThenable(promise, maybeThenable, then$$);
	      } else {
	        fulfill(promise, maybeThenable);
	      }
	    }
	  }
	
	  function _resolve(promise, value) {
	    if (promise === value) {
	      _reject(promise, selfFulfillment());
	    } else if (objectOrFunction(value)) {
	      handleMaybeThenable(promise, value, getThen(value));
	    } else {
	      fulfill(promise, value);
	    }
	  }
	
	  function publishRejection(promise) {
	    if (promise._onerror) {
	      promise._onerror(promise._result);
	    }
	
	    publish(promise);
	  }
	
	  function fulfill(promise, value) {
	    if (promise._state !== PENDING) {
	      return;
	    }
	
	    promise._result = value;
	    promise._state = FULFILLED;
	
	    if (promise._subscribers.length !== 0) {
	      asap(publish, promise);
	    }
	  }
	
	  function _reject(promise, reason) {
	    if (promise._state !== PENDING) {
	      return;
	    }
	    promise._state = REJECTED;
	    promise._result = reason;
	
	    asap(publishRejection, promise);
	  }
	
	  function subscribe(parent, child, onFulfillment, onRejection) {
	    var _subscribers = parent._subscribers;
	    var length = _subscribers.length;
	
	    parent._onerror = null;
	
	    _subscribers[length] = child;
	    _subscribers[length + FULFILLED] = onFulfillment;
	    _subscribers[length + REJECTED] = onRejection;
	
	    if (length === 0 && parent._state) {
	      asap(publish, parent);
	    }
	  }
	
	  function publish(promise) {
	    var subscribers = promise._subscribers;
	    var settled = promise._state;
	
	    if (subscribers.length === 0) {
	      return;
	    }
	
	    var child = undefined,
	        callback = undefined,
	        detail = promise._result;
	
	    for (var i = 0; i < subscribers.length; i += 3) {
	      child = subscribers[i];
	      callback = subscribers[i + settled];
	
	      if (child) {
	        invokeCallback(settled, child, callback, detail);
	      } else {
	        callback(detail);
	      }
	    }
	
	    promise._subscribers.length = 0;
	  }
	
	  function ErrorObject() {
	    this.error = null;
	  }
	
	  var TRY_CATCH_ERROR = new ErrorObject();
	
	  function tryCatch(callback, detail) {
	    try {
	      return callback(detail);
	    } catch (e) {
	      TRY_CATCH_ERROR.error = e;
	      return TRY_CATCH_ERROR;
	    }
	  }
	
	  function invokeCallback(settled, promise, callback, detail) {
	    var hasCallback = isFunction(callback),
	        value = undefined,
	        error = undefined,
	        succeeded = undefined,
	        failed = undefined;
	
	    if (hasCallback) {
	      value = tryCatch(callback, detail);
	
	      if (value === TRY_CATCH_ERROR) {
	        failed = true;
	        error = value.error;
	        value = null;
	      } else {
	        succeeded = true;
	      }
	
	      if (promise === value) {
	        _reject(promise, cannotReturnOwn());
	        return;
	      }
	    } else {
	      value = detail;
	      succeeded = true;
	    }
	
	    if (promise._state !== PENDING) {
	      // noop
	    } else if (hasCallback && succeeded) {
	      _resolve(promise, value);
	    } else if (failed) {
	      _reject(promise, error);
	    } else if (settled === FULFILLED) {
	      fulfill(promise, value);
	    } else if (settled === REJECTED) {
	      _reject(promise, value);
	    }
	  }
	
	  function initializePromise(promise, resolver) {
	    try {
	      resolver(function resolvePromise(value) {
	        _resolve(promise, value);
	      }, function rejectPromise(reason) {
	        _reject(promise, reason);
	      });
	    } catch (e) {
	      _reject(promise, e);
	    }
	  }
	
	  var id = 0;
	  function nextId() {
	    return id++;
	  }
	
	  function makePromise(promise) {
	    promise[PROMISE_ID] = id++;
	    promise._state = undefined;
	    promise._result = undefined;
	    promise._subscribers = [];
	  }
	
	  function Enumerator(Constructor, input) {
	    this._instanceConstructor = Constructor;
	    this.promise = new Constructor(noop);
	
	    if (!this.promise[PROMISE_ID]) {
	      makePromise(this.promise);
	    }
	
	    if (isArray(input)) {
	      this._input = input;
	      this.length = input.length;
	      this._remaining = input.length;
	
	      this._result = new Array(this.length);
	
	      if (this.length === 0) {
	        fulfill(this.promise, this._result);
	      } else {
	        this.length = this.length || 0;
	        this._enumerate();
	        if (this._remaining === 0) {
	          fulfill(this.promise, this._result);
	        }
	      }
	    } else {
	      _reject(this.promise, validationError());
	    }
	  }
	
	  function validationError() {
	    return new Error('Array Methods must be provided an Array');
	  };
	
	  Enumerator.prototype._enumerate = function () {
	    var length = this.length;
	    var _input = this._input;
	
	    for (var i = 0; this._state === PENDING && i < length; i++) {
	      this._eachEntry(_input[i], i);
	    }
	  };
	
	  Enumerator.prototype._eachEntry = function (entry, i) {
	    var c = this._instanceConstructor;
	    var resolve$$ = c.resolve;
	
	    if (resolve$$ === resolve) {
	      var _then = getThen(entry);
	
	      if (_then === then && entry._state !== PENDING) {
	        this._settledAt(entry._state, i, entry._result);
	      } else if (typeof _then !== 'function') {
	        this._remaining--;
	        this._result[i] = entry;
	      } else if (c === Promise) {
	        var promise = new c(noop);
	        handleMaybeThenable(promise, entry, _then);
	        this._willSettleAt(promise, i);
	      } else {
	        this._willSettleAt(new c(function (resolve$$) {
	          return resolve$$(entry);
	        }), i);
	      }
	    } else {
	      this._willSettleAt(resolve$$(entry), i);
	    }
	  };
	
	  Enumerator.prototype._settledAt = function (state, i, value) {
	    var promise = this.promise;
	
	    if (promise._state === PENDING) {
	      this._remaining--;
	
	      if (state === REJECTED) {
	        _reject(promise, value);
	      } else {
	        this._result[i] = value;
	      }
	    }
	
	    if (this._remaining === 0) {
	      fulfill(promise, this._result);
	    }
	  };
	
	  Enumerator.prototype._willSettleAt = function (promise, i) {
	    var enumerator = this;
	
	    subscribe(promise, undefined, function (value) {
	      return enumerator._settledAt(FULFILLED, i, value);
	    }, function (reason) {
	      return enumerator._settledAt(REJECTED, i, reason);
	    });
	  };
	
	  /**
	    `Promise.all` accepts an array of promises, and returns a new promise which
	    is fulfilled with an array of fulfillment values for the passed promises, or
	    rejected with the reason of the first passed promise to be rejected. It casts all
	    elements of the passed iterable to promises as it runs this algorithm.
	  
	    Example:
	  
	    ```javascript
	    let promise1 = resolve(1);
	    let promise2 = resolve(2);
	    let promise3 = resolve(3);
	    let promises = [ promise1, promise2, promise3 ];
	  
	    Promise.all(promises).then(function(array){
	      // The array here would be [ 1, 2, 3 ];
	    });
	    ```
	  
	    If any of the `promises` given to `all` are rejected, the first promise
	    that is rejected will be given as an argument to the returned promises's
	    rejection handler. For example:
	  
	    Example:
	  
	    ```javascript
	    let promise1 = resolve(1);
	    let promise2 = reject(new Error("2"));
	    let promise3 = reject(new Error("3"));
	    let promises = [ promise1, promise2, promise3 ];
	  
	    Promise.all(promises).then(function(array){
	      // Code here never runs because there are rejected promises!
	    }, function(error) {
	      // error.message === "2"
	    });
	    ```
	  
	    @method all
	    @static
	    @param {Array} entries array of promises
	    @param {String} label optional string for labeling the promise.
	    Useful for tooling.
	    @return {Promise} promise that is fulfilled when all `promises` have been
	    fulfilled, or rejected if any of them become rejected.
	    @static
	  */
	  function all(entries) {
	    return new Enumerator(this, entries).promise;
	  }
	
	  /**
	    `Promise.race` returns a new promise which is settled in the same way as the
	    first passed promise to settle.
	  
	    Example:
	  
	    ```javascript
	    let promise1 = new Promise(function(resolve, reject){
	      setTimeout(function(){
	        resolve('promise 1');
	      }, 200);
	    });
	  
	    let promise2 = new Promise(function(resolve, reject){
	      setTimeout(function(){
	        resolve('promise 2');
	      }, 100);
	    });
	  
	    Promise.race([promise1, promise2]).then(function(result){
	      // result === 'promise 2' because it was resolved before promise1
	      // was resolved.
	    });
	    ```
	  
	    `Promise.race` is deterministic in that only the state of the first
	    settled promise matters. For example, even if other promises given to the
	    `promises` array argument are resolved, but the first settled promise has
	    become rejected before the other promises became fulfilled, the returned
	    promise will become rejected:
	  
	    ```javascript
	    let promise1 = new Promise(function(resolve, reject){
	      setTimeout(function(){
	        resolve('promise 1');
	      }, 200);
	    });
	  
	    let promise2 = new Promise(function(resolve, reject){
	      setTimeout(function(){
	        reject(new Error('promise 2'));
	      }, 100);
	    });
	  
	    Promise.race([promise1, promise2]).then(function(result){
	      // Code here never runs
	    }, function(reason){
	      // reason.message === 'promise 2' because promise 2 became rejected before
	      // promise 1 became fulfilled
	    });
	    ```
	  
	    An example real-world use case is implementing timeouts:
	  
	    ```javascript
	    Promise.race([ajax('foo.json'), timeout(5000)])
	    ```
	  
	    @method race
	    @static
	    @param {Array} promises array of promises to observe
	    Useful for tooling.
	    @return {Promise} a promise which settles in the same way as the first passed
	    promise to settle.
	  */
	  function race(entries) {
	    /*jshint validthis:true */
	    var Constructor = this;
	
	    if (!isArray(entries)) {
	      return new Constructor(function (_, reject) {
	        return reject(new TypeError('You must pass an array to race.'));
	      });
	    } else {
	      return new Constructor(function (resolve, reject) {
	        var length = entries.length;
	        for (var i = 0; i < length; i++) {
	          Constructor.resolve(entries[i]).then(resolve, reject);
	        }
	      });
	    }
	  }
	
	  /**
	    `Promise.reject` returns a promise rejected with the passed `reason`.
	    It is shorthand for the following:
	  
	    ```javascript
	    let promise = new Promise(function(resolve, reject){
	      reject(new Error('WHOOPS'));
	    });
	  
	    promise.then(function(value){
	      // Code here doesn't run because the promise is rejected!
	    }, function(reason){
	      // reason.message === 'WHOOPS'
	    });
	    ```
	  
	    Instead of writing the above, your code now simply becomes the following:
	  
	    ```javascript
	    let promise = Promise.reject(new Error('WHOOPS'));
	  
	    promise.then(function(value){
	      // Code here doesn't run because the promise is rejected!
	    }, function(reason){
	      // reason.message === 'WHOOPS'
	    });
	    ```
	  
	    @method reject
	    @static
	    @param {Any} reason value that the returned promise will be rejected with.
	    Useful for tooling.
	    @return {Promise} a promise rejected with the given `reason`.
	  */
	  function reject(reason) {
	    /*jshint validthis:true */
	    var Constructor = this;
	    var promise = new Constructor(noop);
	    _reject(promise, reason);
	    return promise;
	  }
	
	  function needsResolver() {
	    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	  }
	
	  function needsNew() {
	    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	  }
	
	  /**
	    Promise objects represent the eventual result of an asynchronous operation. The
	    primary way of interacting with a promise is through its `then` method, which
	    registers callbacks to receive either a promise's eventual value or the reason
	    why the promise cannot be fulfilled.
	  
	    Terminology
	    -----------
	  
	    - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	    - `thenable` is an object or function that defines a `then` method.
	    - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	    - `exception` is a value that is thrown using the throw statement.
	    - `reason` is a value that indicates why a promise was rejected.
	    - `settled` the final resting state of a promise, fulfilled or rejected.
	  
	    A promise can be in one of three states: pending, fulfilled, or rejected.
	  
	    Promises that are fulfilled have a fulfillment value and are in the fulfilled
	    state.  Promises that are rejected have a rejection reason and are in the
	    rejected state.  A fulfillment value is never a thenable.
	  
	    Promises can also be said to *resolve* a value.  If this value is also a
	    promise, then the original promise's settled state will match the value's
	    settled state.  So a promise that *resolves* a promise that rejects will
	    itself reject, and a promise that *resolves* a promise that fulfills will
	    itself fulfill.
	  
	  
	    Basic Usage:
	    ------------
	  
	    ```js
	    let promise = new Promise(function(resolve, reject) {
	      // on success
	      resolve(value);
	  
	      // on failure
	      reject(reason);
	    });
	  
	    promise.then(function(value) {
	      // on fulfillment
	    }, function(reason) {
	      // on rejection
	    });
	    ```
	  
	    Advanced Usage:
	    ---------------
	  
	    Promises shine when abstracting away asynchronous interactions such as
	    `XMLHttpRequest`s.
	  
	    ```js
	    function getJSON(url) {
	      return new Promise(function(resolve, reject){
	        let xhr = new XMLHttpRequest();
	  
	        xhr.open('GET', url);
	        xhr.onreadystatechange = handler;
	        xhr.responseType = 'json';
	        xhr.setRequestHeader('Accept', 'application/json');
	        xhr.send();
	  
	        function handler() {
	          if (this.readyState === this.DONE) {
	            if (this.status === 200) {
	              resolve(this.response);
	            } else {
	              reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	            }
	          }
	        };
	      });
	    }
	  
	    getJSON('/posts.json').then(function(json) {
	      // on fulfillment
	    }, function(reason) {
	      // on rejection
	    });
	    ```
	  
	    Unlike callbacks, promises are great composable primitives.
	  
	    ```js
	    Promise.all([
	      getJSON('/posts'),
	      getJSON('/comments')
	    ]).then(function(values){
	      values[0] // => postsJSON
	      values[1] // => commentsJSON
	  
	      return values;
	    });
	    ```
	  
	    @class Promise
	    @param {function} resolver
	    Useful for tooling.
	    @constructor
	  */
	  function Promise(resolver) {
	    this[PROMISE_ID] = nextId();
	    this._result = this._state = undefined;
	    this._subscribers = [];
	
	    if (noop !== resolver) {
	      typeof resolver !== 'function' && needsResolver();
	      this instanceof Promise ? initializePromise(this, resolver) : needsNew();
	    }
	  }
	
	  Promise.all = all;
	  Promise.race = race;
	  Promise.resolve = resolve;
	  Promise.reject = reject;
	  Promise._setScheduler = setScheduler;
	  Promise._setAsap = setAsap;
	  Promise._asap = asap;
	
	  Promise.prototype = {
	    constructor: Promise,
	
	    /**
	      The primary way of interacting with a promise is through its `then` method,
	      which registers callbacks to receive either a promise's eventual value or the
	      reason why the promise cannot be fulfilled.
	    
	      ```js
	      findUser().then(function(user){
	        // user is available
	      }, function(reason){
	        // user is unavailable, and you are given the reason why
	      });
	      ```
	    
	      Chaining
	      --------
	    
	      The return value of `then` is itself a promise.  This second, 'downstream'
	      promise is resolved with the return value of the first promise's fulfillment
	      or rejection handler, or rejected if the handler throws an exception.
	    
	      ```js
	      findUser().then(function (user) {
	        return user.name;
	      }, function (reason) {
	        return 'default name';
	      }).then(function (userName) {
	        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	        // will be `'default name'`
	      });
	    
	      findUser().then(function (user) {
	        throw new Error('Found user, but still unhappy');
	      }, function (reason) {
	        throw new Error('`findUser` rejected and we're unhappy');
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	      });
	      ```
	      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
	    
	      ```js
	      findUser().then(function (user) {
	        throw new PedagogicalException('Upstream error');
	      }).then(function (value) {
	        // never reached
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // The `PedgagocialException` is propagated all the way down to here
	      });
	      ```
	    
	      Assimilation
	      ------------
	    
	      Sometimes the value you want to propagate to a downstream promise can only be
	      retrieved asynchronously. This can be achieved by returning a promise in the
	      fulfillment or rejection handler. The downstream promise will then be pending
	      until the returned promise is settled. This is called *assimilation*.
	    
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // The user's comments are now available
	      });
	      ```
	    
	      If the assimliated promise rejects, then the downstream promise will also reject.
	    
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // If `findCommentsByAuthor` fulfills, we'll have the value here
	      }, function (reason) {
	        // If `findCommentsByAuthor` rejects, we'll have the reason here
	      });
	      ```
	    
	      Simple Example
	      --------------
	    
	      Synchronous Example
	    
	      ```javascript
	      let result;
	    
	      try {
	        result = findResult();
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	    
	      Errback Example
	    
	      ```js
	      findResult(function(result, err){
	        if (err) {
	          // failure
	        } else {
	          // success
	        }
	      });
	      ```
	    
	      Promise Example;
	    
	      ```javascript
	      findResult().then(function(result){
	        // success
	      }, function(reason){
	        // failure
	      });
	      ```
	    
	      Advanced Example
	      --------------
	    
	      Synchronous Example
	    
	      ```javascript
	      let author, books;
	    
	      try {
	        author = findAuthor();
	        books  = findBooksByAuthor(author);
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	    
	      Errback Example
	    
	      ```js
	    
	      function foundBooks(books) {
	    
	      }
	    
	      function failure(reason) {
	    
	      }
	    
	      findAuthor(function(author, err){
	        if (err) {
	          failure(err);
	          // failure
	        } else {
	          try {
	            findBoooksByAuthor(author, function(books, err) {
	              if (err) {
	                failure(err);
	              } else {
	                try {
	                  foundBooks(books);
	                } catch(reason) {
	                  failure(reason);
	                }
	              }
	            });
	          } catch(error) {
	            failure(err);
	          }
	          // success
	        }
	      });
	      ```
	    
	      Promise Example;
	    
	      ```javascript
	      findAuthor().
	        then(findBooksByAuthor).
	        then(function(books){
	          // found books
	      }).catch(function(reason){
	        // something went wrong
	      });
	      ```
	    
	      @method then
	      @param {Function} onFulfilled
	      @param {Function} onRejected
	      Useful for tooling.
	      @return {Promise}
	    */
	    then: then,
	
	    /**
	      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	      as the catch block of a try/catch statement.
	    
	      ```js
	      function findAuthor(){
	        throw new Error('couldn't find that author');
	      }
	    
	      // synchronous
	      try {
	        findAuthor();
	      } catch(reason) {
	        // something went wrong
	      }
	    
	      // async with promises
	      findAuthor().catch(function(reason){
	        // something went wrong
	      });
	      ```
	    
	      @method catch
	      @param {Function} onRejection
	      Useful for tooling.
	      @return {Promise}
	    */
	    'catch': function _catch(onRejection) {
	      return this.then(null, onRejection);
	    }
	  };
	
	  function polyfill() {
	    var local = undefined;
	
	    if (typeof global !== 'undefined') {
	      local = global;
	    } else if (typeof self !== 'undefined') {
	      local = self;
	    } else {
	      try {
	        local = Function('return this')();
	      } catch (e) {
	        throw new Error('polyfill failed because global object is unavailable in this environment');
	      }
	    }
	
	    var P = local.Promise;
	
	    if (P) {
	      var promiseToString = null;
	      try {
	        promiseToString = Object.prototype.toString.call(P.resolve());
	      } catch (e) {
	        // silently ignored
	      }
	
	      if (promiseToString === '[object Promise]' && !P.cast) {
	        return;
	      }
	    }
	
	    local.Promise = Promise;
	  }
	
	  // Strange compat..
	  Promise.polyfill = polyfill;
	  Promise.Promise = Promise;
	
	  return Promise;
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(32), (function() { return this; }())))

/***/ },
/* 32 */
/***/ function(module, exports) {

	'use strict';
	
	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout() {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	})();
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch (e) {
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch (e) {
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e) {
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e) {
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while (len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () {
	    return '/';
	};
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function () {
	    return 0;
	};

/***/ },
/* 33 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 34 */
/***/ function(module, exports) {

	"use strict";
	
	window.customElements && eval("/**\n * @license\n * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.\n * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt\n * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt\n * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt\n * Code distributed by Google as part of the polymer project is also\n * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt\n */\n\n/**\n * This shim allows elements written in, or compiled to, ES5 to work on native\n * implementations of Custom Elements.\n *\n * ES5-style classes don't work with native Custom Elements because the\n * HTMLElement constructor uses the value of `new.target` to look up the custom\n * element definition for the currently called constructor. `new.target` is only\n * set when `new` is called and is only propagated via super() calls. super()\n * is not emulatable in ES5. The pattern of `SuperClass.call(this)`` only works\n * when extending other ES5-style classes, and does not propagate `new.target`.\n *\n * This shim allows the native HTMLElement constructor to work by generating and\n * registering a stand-in class instead of the users custom element class. This\n * stand-in class's constructor has an actual call to super().\n * `customElements.define()` and `customElements.get()` are both overridden to\n * hide this stand-in class from users.\n *\n * In order to create instance of the user-defined class, rather than the stand\n * in, the stand-in's constructor swizzles its instances prototype and invokes\n * the user-defined constructor. When the user-defined constructor is called\n * directly it creates an instance of the stand-in class to get a real extension\n * of HTMLElement and returns that.\n *\n * There are two important constructors: A patched HTMLElement constructor, and\n * the StandInElement constructor. They both will be called to create an element\n * but which is called first depends on whether the browser creates the element\n * or the user-defined constructor is called directly. The variables\n * `browserConstruction` and `userConstruction` control the flow between the\n * two constructors.\n *\n * This shim should be better than forcing the polyfill because:\n *   1. It's smaller\n *   2. All reaction timings are the same as native (mostly synchronous)\n *   3. All reaction triggering DOM operations are automatically supported\n *\n * There are some restrictions and requirements on ES5 constructors:\n *   1. All constructors in a inheritance hierarchy must be ES5-style, so that\n *      they can be called with Function.call(). This effectively means that the\n *      whole application must be compiled to ES5.\n *   2. Constructors must return the value of the emulated super() call. Like\n *      `return SuperClass.call(this)`\n *   3. The `this` reference should not be used before the emulated super() call\n *      just like `this` is illegal to use before super() in ES6.\n *   4. Constructors should not create other custom elements before the emulated\n *      super() call. This is the same restriction as with native custom\n *      elements.\n *\n *  Compiling valid class-based custom elements to ES5 will satisfy these\n *  requirements with the latest version of popular transpilers.\n */\n(() => {\n  'use strict';\n\n  // Do nothing if `customElements` does not exist.\n  if (!window.customElements) return;\n\n  const NativeHTMLElement = window.HTMLElement;\n  const nativeDefine = window.customElements.define;\n  const nativeGet = window.customElements.get;\n\n  /**\n   * Map of user-provided constructors to tag names.\n   *\n   * @type {Map<Function, string>}\n   */\n  const tagnameByConstructor = new Map();\n\n  /**\n   * Map of tag names to user-provided constructors.\n   *\n   * @type {Map<string, Function>}\n   */\n  const constructorByTagname = new Map();\n\n\n  /**\n   * Whether the constructors are being called by a browser process, ie parsing\n   * or createElement.\n   */\n  let browserConstruction = false;\n\n  /**\n   * Whether the constructors are being called by a user-space process, ie\n   * calling an element constructor.\n   */\n  let userConstruction = false;\n\n  window.HTMLElement = function() {\n    if (!browserConstruction) {\n      const tagname = tagnameByConstructor.get(this.constructor);\n      const fakeClass = nativeGet.call(window.customElements, tagname);\n\n      // Make sure that the fake constructor doesn't call back to this constructor\n      userConstruction = true;\n      const instance = new (fakeClass)();\n      return instance;\n    }\n    // Else do nothing. This will be reached by ES5-style classes doing\n    // HTMLElement.call() during initialization\n    browserConstruction = false;\n  };\n  // By setting the patched HTMLElement's prototype property to the native\n  // HTMLElement's prototype we make sure that:\n  //     document.createElement('a') instanceof HTMLElement\n  // works because instanceof uses HTMLElement.prototype, which is on the\n  // ptototype chain of built-in elements.\n  window.HTMLElement.prototype = NativeHTMLElement.prototype;\n\n  window.customElements.define = (tagname, elementClass) => {\n    const elementProto = elementClass.prototype;\n    const StandInElement = class extends NativeHTMLElement {\n      constructor() {\n        // Call the native HTMLElement constructor, this gives us the\n        // under-construction instance as `this`:\n        super();\n\n        // The prototype will be wrong up because the browser used our fake\n        // class, so fix it:\n        Object.setPrototypeOf(this, elementProto);\n\n        if (!userConstruction) {\n          // Make sure that user-defined constructor bottom's out to a do-nothing\n          // HTMLElement() call\n          browserConstruction = true;\n          // Call the user-defined constructor on our instance:\n          elementClass.call(this);\n        }\n        userConstruction = false;\n      }\n    };\n    const standInProto = StandInElement.prototype;\n    StandInElement.observedAttributes = elementClass.observedAttributes;\n    standInProto.connectedCallback = elementProto.connectedCallback;\n    standInProto.disconnectedCallback = elementProto.disconnectedCallback;\n    standInProto.attributeChangedCallback = elementProto.attributeChangedCallback;\n    standInProto.adoptedCallback = elementProto.adoptedCallback;\n\n    tagnameByConstructor.set(elementClass, tagname);\n    constructorByTagname.set(tagname, elementClass);\n    nativeDefine.call(window.customElements, tagname, StandInElement);\n  };\n\n  window.customElements.get = (tagname) => constructorByTagname.get(tagname);\n\n})();\n");

/***/ },
/* 35 */
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * @license
	 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	 * Code distributed by Google as part of the polymer project is also
	 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	 */
	
	// minimal template polyfill
	(function () {
	
	  var needsTemplate = typeof HTMLTemplateElement === 'undefined';
	
	  // NOTE: Patch document.importNode to work around IE11 bug that
	  // casues children of a document fragment imported while
	  // there is a mutation observer to not have a parentNode (!?!)
	  // It's important that this is the first patch to `importNode` so that
	  // dom produced for later patches is correct.
	  if (/Trident/.test(navigator.userAgent)) {
	    (function () {
	      var Native_importNode = Document.prototype.importNode;
	      Document.prototype.importNode = function () {
	        var n = Native_importNode.apply(this, arguments);
	        // Copy all children to a new document fragment since
	        // this one may be broken
	        if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
	          var f = this.createDocumentFragment();
	          f.appendChild(n);
	          return f;
	        } else {
	          return n;
	        }
	      };
	    })();
	  }
	
	  // NOTE: we rely on this cloneNode not causing element upgrade.
	  // This means this polyfill must load before the CE polyfill and
	  // this would need to be re-worked if a browser supports native CE
	  // but not <template>.
	  var Native_cloneNode = Node.prototype.cloneNode;
	  var Native_createElement = Document.prototype.createElement;
	  var Native_importNode = Document.prototype.importNode;
	
	  // returns true if nested templates cannot be cloned (they cannot be on
	  // some impl's like Safari 8 and Edge)
	  // OR if cloning a document fragment does not result in a document fragment
	  var needsCloning = function () {
	    if (!needsTemplate) {
	      var t = document.createElement('template');
	      var t2 = document.createElement('template');
	      t2.content.appendChild(document.createElement('div'));
	      t.content.appendChild(t2);
	      var clone = t.cloneNode(true);
	      return clone.content.childNodes.length === 0 || clone.content.firstChild.content.childNodes.length === 0 || !(document.createDocumentFragment().cloneNode() instanceof DocumentFragment);
	    }
	  }();
	
	  var TEMPLATE_TAG = 'template';
	  var PolyfilledHTMLTemplateElement = function PolyfilledHTMLTemplateElement() {};
	
	  if (needsTemplate) {
	    var contentDoc;
	    var canDecorate;
	    var templateStyle;
	    var head;
	    var canProtoPatch;
	    var escapeDataRegExp;
	
	    (function () {
	      var defineInnerHTML = function defineInnerHTML(obj) {
	        Object.defineProperty(obj, 'innerHTML', {
	          get: function get() {
	            var o = '';
	            for (var e = this.content.firstChild; e; e = e.nextSibling) {
	              o += e.outerHTML || escapeData(e.data);
	            }
	            return o;
	          },
	          set: function set(text) {
	            contentDoc.body.innerHTML = text;
	            PolyfilledHTMLTemplateElement.bootstrap(contentDoc);
	            while (this.content.firstChild) {
	              this.content.removeChild(this.content.firstChild);
	            }
	            while (contentDoc.body.firstChild) {
	              this.content.appendChild(contentDoc.body.firstChild);
	            }
	          },
	          configurable: true
	        });
	      };
	
	      var escapeReplace = function escapeReplace(c) {
	        switch (c) {
	          case '&':
	            return '&amp;';
	          case '<':
	            return '&lt;';
	          case '>':
	            return '&gt;';
	          case '\xA0':
	            return '&nbsp;';
	        }
	      };
	
	      var escapeData = function escapeData(s) {
	        return s.replace(escapeDataRegExp, escapeReplace);
	      };
	
	      contentDoc = document.implementation.createHTMLDocument('template');
	      canDecorate = true;
	      templateStyle = document.createElement('style');
	
	      templateStyle.textContent = TEMPLATE_TAG + '{display:none;}';
	
	      head = document.head;
	
	      head.insertBefore(templateStyle, head.firstElementChild);
	
	      /**
	        Provides a minimal shim for the <template> element.
	      */
	      PolyfilledHTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
	
	      // if elements do not have `innerHTML` on instances, then
	      // templates can be patched by swizzling their prototypes.
	      canProtoPatch = !document.createElement('div').hasOwnProperty('innerHTML');
	
	      /**
	        The `decorate` method moves element children to the template's `content`.
	        NOTE: there is no support for dynamically adding elements to templates.
	      */
	
	      PolyfilledHTMLTemplateElement.decorate = function (template) {
	        // if the template is decorated, return fast
	        if (template.content) {
	          return;
	        }
	        template.content = contentDoc.createDocumentFragment();
	        var child;
	        while (child = template.firstChild) {
	          template.content.appendChild(child);
	        }
	        // NOTE: prefer prototype patching for performance and
	        // because on some browsers (IE11), re-defining `innerHTML`
	        // can result in intermittent errors.
	        if (canProtoPatch) {
	          template.__proto__ = PolyfilledHTMLTemplateElement.prototype;
	        } else {
	          template.cloneNode = function (deep) {
	            return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
	          };
	          // add innerHTML to template, if possible
	          // Note: this throws on Safari 7
	          if (canDecorate) {
	            try {
	              defineInnerHTML(template);
	            } catch (err) {
	              canDecorate = false;
	            }
	          }
	        }
	        // bootstrap recursively
	        PolyfilledHTMLTemplateElement.bootstrap(template.content);
	      };
	
	      defineInnerHTML(PolyfilledHTMLTemplateElement.prototype);
	
	      /**
	        The `bootstrap` method is called automatically and "fixes" all
	        <template> elements in the document referenced by the `doc` argument.
	      */
	      PolyfilledHTMLTemplateElement.bootstrap = function (doc) {
	        var templates = doc.querySelectorAll(TEMPLATE_TAG);
	        for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
	          PolyfilledHTMLTemplateElement.decorate(t);
	        }
	      };
	
	      // auto-bootstrapping for main document
	      document.addEventListener('DOMContentLoaded', function () {
	        PolyfilledHTMLTemplateElement.bootstrap(document);
	      });
	
	      // Patch document.createElement to ensure newly created templates have content
	      Document.prototype.createElement = function () {
	        'use strict';
	
	        var el = Native_createElement.apply(this, arguments);
	        if (el.localName === 'template') {
	          PolyfilledHTMLTemplateElement.decorate(el);
	        }
	        return el;
	      };
	
	      escapeDataRegExp = /[&\u00A0<>]/g;
	    })();
	  }
	
	  // make cloning/importing work!
	  if (needsTemplate || needsCloning) {
	
	    PolyfilledHTMLTemplateElement._cloneNode = function (template, deep) {
	      var clone = Native_cloneNode.call(template, false);
	      // NOTE: decorate doesn't auto-fix children because they are already
	      // decorated so they need special clone fixup.
	      if (this.decorate) {
	        this.decorate(clone);
	      }
	      if (deep) {
	        // NOTE: use native clone node to make sure CE's wrapped
	        // cloneNode does not cause elements to upgrade.
	        clone.content.appendChild(Native_cloneNode.call(template.content, true));
	        // now ensure nested templates are cloned correctly.
	        this.fixClonedDom(clone.content, template.content);
	      }
	      return clone;
	    };
	
	    PolyfilledHTMLTemplateElement.prototype.cloneNode = function (deep) {
	      return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
	    };
	
	    // Given a source and cloned subtree, find <template>'s in the cloned
	    // subtree and replace them with cloned <template>'s from source.
	    // We must do this because only the source templates have proper .content.
	    PolyfilledHTMLTemplateElement.fixClonedDom = function (clone, source) {
	      // do nothing if cloned node is not an element
	      if (!source.querySelectorAll) return;
	      // these two lists should be coincident
	      var s$ = source.querySelectorAll(TEMPLATE_TAG);
	      var t$ = clone.querySelectorAll(TEMPLATE_TAG);
	      for (var i = 0, l = t$.length, t, s; i < l; i++) {
	        s = s$[i];
	        t = t$[i];
	        if (this.decorate) {
	          this.decorate(s);
	        }
	        t.parentNode.replaceChild(s.cloneNode(true), t);
	      }
	    };
	
	    // override all cloning to fix the cloned subtree to contain properly
	    // cloned templates.
	    Node.prototype.cloneNode = function (deep) {
	      var dom;
	      // workaround for Edge bug cloning documentFragments
	      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8619646/
	      if (this instanceof DocumentFragment) {
	        if (!deep) {
	          return this.ownerDocument.createDocumentFragment();
	        } else {
	          dom = this.ownerDocument.importNode(this, true);
	        }
	      } else {
	        dom = Native_cloneNode.call(this, deep);
	      }
	      // template.content is cloned iff `deep`.
	      if (deep) {
	        PolyfilledHTMLTemplateElement.fixClonedDom(dom, this);
	      }
	      return dom;
	    };
	
	    // NOTE: we are cloning instead of importing <template>'s.
	    // However, the ownerDocument of the cloned template will be correct!
	    // This is because the native import node creates the right document owned
	    // subtree and `fixClonedDom` inserts cloned templates into this subtree,
	    // thus updating the owner doc.
	    Document.prototype.importNode = function (element, deep) {
	      if (element.localName === TEMPLATE_TAG) {
	        return PolyfilledHTMLTemplateElement._cloneNode(element, deep);
	      } else {
	        var dom = Native_importNode.call(this, element, deep);
	        if (deep) {
	          PolyfilledHTMLTemplateElement.fixClonedDom(dom, element);
	        }
	        return dom;
	      }
	    };
	
	    if (needsCloning) {
	      window.HTMLTemplateElement.prototype.cloneNode = function (deep) {
	        return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
	      };
	    }
	  }
	
	  if (needsTemplate) {
	    window.HTMLTemplateElement = PolyfilledHTMLTemplateElement;
	  }
	})();

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _CustomElementRegistry = __webpack_require__(40);
	
	var _CustomElementRegistry2 = _interopRequireDefault(_CustomElementRegistry);
	
	var _HTMLElement = __webpack_require__(43);
	
	var _HTMLElement2 = _interopRequireDefault(_HTMLElement);
	
	var _Document = __webpack_require__(46);
	
	var _Document2 = _interopRequireDefault(_Document);
	
	var _Node = __webpack_require__(48);
	
	var _Node2 = _interopRequireDefault(_Node);
	
	var _Element = __webpack_require__(49);
	
	var _Element2 = _interopRequireDefault(_Element);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * @license
	 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	 * Code distributed by Google as part of the polymer project is also
	 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	 */
	
	var priorCustomElements = window['customElements'];
	
	if (!priorCustomElements || priorCustomElements['forcePolyfill'] || typeof priorCustomElements['define'] != 'function' || typeof priorCustomElements['get'] != 'function') {
	  /** @type {!CustomElementInternals} */
	  var internals = new _CustomElementInternals2.default();
	
	  (0, _HTMLElement2.default)(internals);
	  (0, _Document2.default)(internals);
	  (0, _Node2.default)(internals);
	  (0, _Element2.default)(internals);
	
	  // The main document is always associated with the registry.
	  document.__CE_hasRegistry = true;
	
	  /** @type {!CustomElementRegistry} */
	  var customElements = new _CustomElementRegistry2.default(internals);
	
	  Object.defineProperty(window, 'customElements', {
	    configurable: true,
	    enumerable: true,
	    value: customElements
	  });
	}

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	var _CustomElementState = __webpack_require__(39);
	
	var _CustomElementState2 = _interopRequireDefault(_CustomElementState);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var CustomElementInternals = function () {
	  function CustomElementInternals() {
	    _classCallCheck(this, CustomElementInternals);
	
	    /** @type {!Map<string, !CustomElementDefinition>} */
	    this._localNameToDefinition = new Map();
	
	    /** @type {!Map<!Function, !CustomElementDefinition>} */
	    this._constructorToDefinition = new Map();
	
	    /** @type {!Array<!function(!Node)>} */
	    this._patches = [];
	
	    /** @type {boolean} */
	    this._hasPatches = false;
	  }
	
	  /**
	   * @param {string} localName
	   * @param {!CustomElementDefinition} definition
	   */
	
	
	  _createClass(CustomElementInternals, [{
	    key: 'setDefinition',
	    value: function setDefinition(localName, definition) {
	      this._localNameToDefinition.set(localName, definition);
	      this._constructorToDefinition.set(definition.constructor, definition);
	    }
	
	    /**
	     * @param {string} localName
	     * @return {!CustomElementDefinition|undefined}
	     */
	
	  }, {
	    key: 'localNameToDefinition',
	    value: function localNameToDefinition(localName) {
	      return this._localNameToDefinition.get(localName);
	    }
	
	    /**
	     * @param {!Function} constructor
	     * @return {!CustomElementDefinition|undefined}
	     */
	
	  }, {
	    key: 'constructorToDefinition',
	    value: function constructorToDefinition(constructor) {
	      return this._constructorToDefinition.get(constructor);
	    }
	
	    /**
	     * @param {!function(!Node)} listener
	     */
	
	  }, {
	    key: 'addPatch',
	    value: function addPatch(listener) {
	      this._hasPatches = true;
	      this._patches.push(listener);
	    }
	
	    /**
	     * @param {!Node} node
	     */
	
	  }, {
	    key: 'patchTree',
	    value: function patchTree(node) {
	      var _this = this;
	
	      if (!this._hasPatches) return;
	
	      Utilities.walkDeepDescendantElements(node, function (element) {
	        return _this.patch(element);
	      });
	    }
	
	    /**
	     * @param {!Node} node
	     */
	
	  }, {
	    key: 'patch',
	    value: function patch(node) {
	      if (!this._hasPatches) return;
	
	      if (node.__CE_patched) return;
	      node.__CE_patched = true;
	
	      for (var i = 0; i < this._patches.length; i++) {
	        this._patches[i](node);
	      }
	    }
	
	    /**
	     * @param {!Node} root
	     */
	
	  }, {
	    key: 'connectTree',
	    value: function connectTree(root) {
	      var elements = [];
	
	      Utilities.walkDeepDescendantElements(root, function (element) {
	        return elements.push(element);
	      });
	
	      for (var i = 0; i < elements.length; i++) {
	        var element = elements[i];
	        if (element.__CE_state === _CustomElementState2.default.custom) {
	          this.connectedCallback(element);
	        } else {
	          this.upgradeElement(element);
	        }
	      }
	    }
	
	    /**
	     * @param {!Node} root
	     */
	
	  }, {
	    key: 'disconnectTree',
	    value: function disconnectTree(root) {
	      var elements = [];
	
	      Utilities.walkDeepDescendantElements(root, function (element) {
	        return elements.push(element);
	      });
	
	      for (var i = 0; i < elements.length; i++) {
	        var element = elements[i];
	        if (element.__CE_state === _CustomElementState2.default.custom) {
	          this.disconnectedCallback(element);
	        }
	      }
	    }
	
	    /**
	     * Upgrades all uncustomized custom elements at and below a root node for
	     * which there is a definition. When custom element reaction callbacks are
	     * assumed to be called synchronously (which, by the current DOM / HTML spec
	     * definitions, they are *not*), callbacks for both elements customized
	     * synchronously by the parser and elements being upgraded occur in the same
	     * relative order.
	     *
	     * NOTE: This function, when used to simulate the construction of a tree that
	     * is already created but not customized (i.e. by the parser), does *not*
	     * prevent the element from reading the 'final' (true) state of the tree. For
	     * example, the element, during truly synchronous parsing / construction would
	     * see that it contains no children as they have not yet been inserted.
	     * However, this function does not modify the tree, the element will
	     * (incorrectly) have children. Additionally, self-modification restrictions
	     * for custom element constructors imposed by the DOM spec are *not* enforced.
	     *
	     *
	     * The following nested list shows the steps extending down from the HTML
	     * spec's parsing section that cause elements to be synchronously created and
	     * upgraded:
	     *
	     * The "in body" insertion mode:
	     * https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
	     * - Switch on token:
	     *   .. other cases ..
	     *   -> Any other start tag
	     *      - [Insert an HTML element](below) for the token.
	     *
	     * Insert an HTML element:
	     * https://html.spec.whatwg.org/multipage/syntax.html#insert-an-html-element
	     * - Insert a foreign element for the token in the HTML namespace:
	     *   https://html.spec.whatwg.org/multipage/syntax.html#insert-a-foreign-element
	     *   - Create an element for a token:
	     *     https://html.spec.whatwg.org/multipage/syntax.html#create-an-element-for-the-token
	     *     - Will execute script flag is true?
	     *       - (Element queue pushed to the custom element reactions stack.)
	     *     - Create an element:
	     *       https://dom.spec.whatwg.org/#concept-create-element
	     *       - Sync CE flag is true?
	     *         - Constructor called.
	     *         - Self-modification restrictions enforced.
	     *       - Sync CE flag is false?
	     *         - (Upgrade reaction enqueued.)
	     *     - Attributes appended to element.
	     *       (`attributeChangedCallback` reactions enqueued.)
	     *     - Will execute script flag is true?
	     *       - (Element queue popped from the custom element reactions stack.
	     *         Reactions in the popped stack are invoked.)
	     *   - (Element queue pushed to the custom element reactions stack.)
	     *   - Insert the element:
	     *     https://dom.spec.whatwg.org/#concept-node-insert
	     *     - Shadow-including descendants are connected. During parsing
	     *       construction, there are no shadow-*excluding* descendants.
	     *       However, the constructor may have validly attached a shadow
	     *       tree to itself and added descendants to that shadow tree.
	     *       (`connectedCallback` reactions enqueued.)
	     *   - (Element queue popped from the custom element reactions stack.
	     *     Reactions in the popped stack are invoked.)
	     *
	     * @param {!Node} root
	     * @param {!Set<Node>=} visitedImports
	     */
	
	  }, {
	    key: 'patchAndUpgradeTree',
	    value: function patchAndUpgradeTree(root) {
	      var _this2 = this;
	
	      var visitedImports = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
	
	      var elements = [];
	
	      var gatherElements = function gatherElements(element) {
	        if (element.localName === 'link' && element.getAttribute('rel') === 'import') {
	          // The HTML Imports polyfill sets a descendant element of the link to
	          // the `import` property, specifically this is *not* a Document.
	          var importNode = /** @type {?Node} */element.import;
	
	          if (importNode instanceof Node && importNode.readyState === 'complete') {
	            importNode.__CE_isImportDocument = true;
	
	            // Connected links are associated with the registry.
	            importNode.__CE_hasRegistry = true;
	          } else {
	            // If this link's import root is not available, its contents can't be
	            // walked. Wait for 'load' and walk it when it's ready.
	            element.addEventListener('load', function () {
	              var importNode = /** @type {!Node} */element.import;
	
	              if (importNode.__CE_documentLoadHandled) return;
	              importNode.__CE_documentLoadHandled = true;
	
	              importNode.__CE_isImportDocument = true;
	
	              // Connected links are associated with the registry.
	              importNode.__CE_hasRegistry = true;
	
	              // Clone the `visitedImports` set that was populated sync during
	              // the `patchAndUpgradeTree` call that caused this 'load' handler to
	              // be added. Then, remove *this* link's import node so that we can
	              // walk that import again, even if it was partially walked later
	              // during the same `patchAndUpgradeTree` call.
	              var clonedVisitedImports = new Set(visitedImports);
	              visitedImports.delete(importNode);
	
	              _this2.patchAndUpgradeTree(importNode, visitedImports);
	            });
	          }
	        } else {
	          elements.push(element);
	        }
	      };
	
	      // `walkDeepDescendantElements` populates (and internally checks against)
	      // `visitedImports` when traversing a loaded import.
	      Utilities.walkDeepDescendantElements(root, gatherElements, visitedImports);
	
	      if (this._hasPatches) {
	        for (var i = 0; i < elements.length; i++) {
	          this.patch(elements[i]);
	        }
	      }
	
	      for (var _i = 0; _i < elements.length; _i++) {
	        this.upgradeElement(elements[_i]);
	      }
	    }
	
	    /**
	     * @param {!Element} element
	     */
	
	  }, {
	    key: 'upgradeElement',
	    value: function upgradeElement(element) {
	      var currentState = element.__CE_state;
	      if (currentState !== undefined) return;
	
	      var definition = this.localNameToDefinition(element.localName);
	      if (!definition) return;
	
	      definition.constructionStack.push(element);
	
	      var constructor = definition.constructor;
	      try {
	        try {
	          var result = new constructor();
	          if (result !== element) {
	            throw new Error('The custom element constructor did not produce the element being upgraded.');
	          }
	        } finally {
	          definition.constructionStack.pop();
	        }
	      } catch (e) {
	        element.__CE_state = _CustomElementState2.default.failed;
	        throw e;
	      }
	
	      element.__CE_state = _CustomElementState2.default.custom;
	      element.__CE_definition = definition;
	
	      if (definition.attributeChangedCallback) {
	        var observedAttributes = definition.observedAttributes;
	        for (var i = 0; i < observedAttributes.length; i++) {
	          var name = observedAttributes[i];
	          var value = element.getAttribute(name);
	          if (value !== null) {
	            this.attributeChangedCallback(element, name, null, value, null);
	          }
	        }
	      }
	
	      if (Utilities.isConnected(element)) {
	        this.connectedCallback(element);
	      }
	    }
	
	    /**
	     * @param {!Element} element
	     */
	
	  }, {
	    key: 'connectedCallback',
	    value: function connectedCallback(element) {
	      var definition = element.__CE_definition;
	      if (definition.connectedCallback) {
	        definition.connectedCallback.call(element);
	      }
	    }
	
	    /**
	     * @param {!Element} element
	     */
	
	  }, {
	    key: 'disconnectedCallback',
	    value: function disconnectedCallback(element) {
	      var definition = element.__CE_definition;
	      if (definition.disconnectedCallback) {
	        definition.disconnectedCallback.call(element);
	      }
	    }
	
	    /**
	     * @param {!Element} element
	     * @param {string} name
	     * @param {?string} oldValue
	     * @param {?string} newValue
	     * @param {?string} namespace
	     */
	
	  }, {
	    key: 'attributeChangedCallback',
	    value: function attributeChangedCallback(element, name, oldValue, newValue, namespace) {
	      var definition = element.__CE_definition;
	      if (definition.attributeChangedCallback && definition.observedAttributes.indexOf(name) > -1) {
	        definition.attributeChangedCallback.call(element, name, oldValue, newValue, namespace);
	      }
	    }
	  }]);
	
	  return CustomElementInternals;
	}();
	
	exports.default = CustomElementInternals;

/***/ },
/* 38 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.isValidCustomElementName = isValidCustomElementName;
	exports.isConnected = isConnected;
	exports.walkDeepDescendantElements = walkDeepDescendantElements;
	exports.setPropertyUnchecked = setPropertyUnchecked;
	var reservedTagList = new Set(['annotation-xml', 'color-profile', 'font-face', 'font-face-src', 'font-face-uri', 'font-face-format', 'font-face-name', 'missing-glyph']);
	
	/**
	 * @param {string} localName
	 * @returns {boolean}
	 */
	function isValidCustomElementName(localName) {
	  var reserved = reservedTagList.has(localName);
	  var validForm = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(localName);
	  return !reserved && validForm;
	}
	
	/**
	 * @private
	 * @param {!Node} node
	 * @return {boolean}
	 */
	function isConnected(node) {
	  // Use `Node#isConnected`, if defined.
	  var nativeValue = node.isConnected;
	  if (nativeValue !== undefined) {
	    return nativeValue;
	  }
	
	  /** @type {?Node|undefined} */
	  var current = node;
	  while (current && !(current.__CE_isImportDocument || current instanceof Document)) {
	    current = current.parentNode || (window.ShadowRoot && current instanceof ShadowRoot ? current.host : undefined);
	  }
	  return !!(current && (current.__CE_isImportDocument || current instanceof Document));
	}
	
	/**
	 * @param {!Node} root
	 * @param {!Node} start
	 * @return {?Node}
	 */
	function nextSiblingOrAncestorSibling(root, start) {
	  var node = start;
	  while (node && node !== root && !node.nextSibling) {
	    node = node.parentNode;
	  }
	  return !node || node === root ? null : node.nextSibling;
	}
	
	/**
	 * @param {!Node} root
	 * @param {!Node} start
	 * @return {?Node}
	 */
	function nextNode(root, start) {
	  return start.firstChild ? start.firstChild : nextSiblingOrAncestorSibling(root, start);
	}
	
	/**
	 * @param {!Node} root
	 * @param {!function(!Element)} callback
	 * @param {!Set<Node>=} visitedImports
	 */
	function walkDeepDescendantElements(root, callback) {
	  var visitedImports = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();
	
	  var node = root;
	  while (node) {
	    if (node.nodeType === Node.ELEMENT_NODE) {
	      var element = /** @type {!Element} */node;
	
	      callback(element);
	
	      var localName = element.localName;
	      if (localName === 'link' && element.getAttribute('rel') === 'import') {
	        // If this import (polyfilled or not) has it's root node available,
	        // walk it.
	        var importNode = /** @type {!Node} */element.import;
	        if (importNode instanceof Node && !visitedImports.has(importNode)) {
	          // Prevent multiple walks of the same import root.
	          visitedImports.add(importNode);
	
	          for (var child = importNode.firstChild; child; child = child.nextSibling) {
	            walkDeepDescendantElements(child, callback, visitedImports);
	          }
	        }
	
	        // Ignore descendants of import links to prevent attempting to walk the
	        // elements created by the HTML Imports polyfill that we just walked
	        // above.
	        node = nextSiblingOrAncestorSibling(root, element);
	        continue;
	      } else if (localName === 'template') {
	        // Ignore descendants of templates. There shouldn't be any descendants
	        // because they will be moved into `.content` during construction in
	        // browsers that support template but, in case they exist and are still
	        // waiting to be moved by a polyfill, they will be ignored.
	        node = nextSiblingOrAncestorSibling(root, element);
	        continue;
	      }
	
	      // Walk shadow roots.
	      var shadowRoot = element.__CE_shadowRoot;
	      if (shadowRoot) {
	        for (var _child = shadowRoot.firstChild; _child; _child = _child.nextSibling) {
	          walkDeepDescendantElements(_child, callback, visitedImports);
	        }
	      }
	    }
	
	    node = nextNode(root, node);
	  }
	}
	
	/**
	 * Used to suppress Closure's "Modifying the prototype is only allowed if the
	 * constructor is in the same scope" warning without using
	 * `@suppress {newCheckTypes, duplicate}` because `newCheckTypes` is too broad.
	 *
	 * @param {!Object} destination
	 * @param {string} name
	 * @param {*} value
	 */
	function setPropertyUnchecked(destination, name, value) {
	  destination[name] = value;
	}

/***/ },
/* 39 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/**
	 * @enum {number}
	 */
	var CustomElementState = {
	  custom: 1,
	  failed: 2
	};
	
	exports.default = CustomElementState;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _DocumentConstructionObserver = __webpack_require__(41);
	
	var _DocumentConstructionObserver2 = _interopRequireDefault(_DocumentConstructionObserver);
	
	var _Deferred = __webpack_require__(42);
	
	var _Deferred2 = _interopRequireDefault(_Deferred);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * @unrestricted
	 */
	var CustomElementRegistry = function () {
	
	  /**
	   * @param {!CustomElementInternals} internals
	   */
	  function CustomElementRegistry(internals) {
	    _classCallCheck(this, CustomElementRegistry);
	
	    /**
	     * @private
	     * @type {boolean}
	     */
	    this._elementDefinitionIsRunning = false;
	
	    /**
	     * @private
	     * @type {!CustomElementInternals}
	     */
	    this._internals = internals;
	
	    /**
	     * @private
	     * @type {!Map<string, !Deferred<undefined>>}
	     */
	    this._whenDefinedDeferred = new Map();
	
	    /**
	     * The default flush callback triggers the document walk synchronously.
	     * @private
	     * @type {!Function}
	     */
	    this._flushCallback = function (fn) {
	      return fn();
	    };
	
	    /**
	     * @private
	     * @type {boolean}
	     */
	    this._flushPending = false;
	
	    /**
	     * @private
	     * @type {!Array<string>}
	     */
	    this._unflushedLocalNames = [];
	
	    /**
	     * @private
	     * @type {!DocumentConstructionObserver}
	     */
	    this._documentConstructionObserver = new _DocumentConstructionObserver2.default(internals, document);
	  }
	
	  /**
	   * @param {string} localName
	   * @param {!Function} constructor
	   */
	
	
	  _createClass(CustomElementRegistry, [{
	    key: 'define',
	    value: function define(localName, constructor) {
	      var _this = this;
	
	      if (!(constructor instanceof Function)) {
	        throw new TypeError('Custom element constructors must be functions.');
	      }
	
	      if (!Utilities.isValidCustomElementName(localName)) {
	        throw new SyntaxError('The element name \'' + localName + '\' is not valid.');
	      }
	
	      if (this._internals.localNameToDefinition(localName)) {
	        throw new Error('A custom element with name \'' + localName + '\' has already been defined.');
	      }
	
	      if (this._elementDefinitionIsRunning) {
	        throw new Error('A custom element is already being defined.');
	      }
	      this._elementDefinitionIsRunning = true;
	
	      var connectedCallback = void 0;
	      var disconnectedCallback = void 0;
	      var adoptedCallback = void 0;
	      var attributeChangedCallback = void 0;
	      var observedAttributes = void 0;
	      try {
	        (function () {
	          var getCallback = function getCallback(name) {
	            var callbackValue = prototype[name];
	            if (callbackValue !== undefined && !(callbackValue instanceof Function)) {
	              throw new Error('The \'' + name + '\' callback must be a function.');
	            }
	            return callbackValue;
	          };
	
	          /** @type {!Object} */
	          var prototype = constructor.prototype;
	          if (!(prototype instanceof Object)) {
	            throw new TypeError('The custom element constructor\'s prototype is not an object.');
	          }
	
	          connectedCallback = getCallback('connectedCallback');
	          disconnectedCallback = getCallback('disconnectedCallback');
	          adoptedCallback = getCallback('adoptedCallback');
	          attributeChangedCallback = getCallback('attributeChangedCallback');
	          observedAttributes = constructor['observedAttributes'] || [];
	        })();
	      } catch (e) {
	        return;
	      } finally {
	        this._elementDefinitionIsRunning = false;
	      }
	
	      var definition = {
	        localName: localName,
	        constructor: constructor,
	        connectedCallback: connectedCallback,
	        disconnectedCallback: disconnectedCallback,
	        adoptedCallback: adoptedCallback,
	        attributeChangedCallback: attributeChangedCallback,
	        observedAttributes: observedAttributes,
	        constructionStack: []
	      };
	
	      this._internals.setDefinition(localName, definition);
	
	      this._unflushedLocalNames.push(localName);
	
	      // If we've already called the flush callback and it hasn't called back yet,
	      // don't call it again.
	      if (!this._flushPending) {
	        this._flushPending = true;
	        this._flushCallback(function () {
	          return _this._flush();
	        });
	      }
	    }
	  }, {
	    key: '_flush',
	    value: function _flush() {
	      // If no new definitions were defined, don't attempt to flush. This could
	      // happen if a flush callback keeps the function it is given and calls it
	      // multiple times.
	      if (this._flushPending === false) return;
	
	      this._flushPending = false;
	      this._internals.patchAndUpgradeTree(document);
	
	      while (this._unflushedLocalNames.length > 0) {
	        var localName = this._unflushedLocalNames.shift();
	        var deferred = this._whenDefinedDeferred.get(localName);
	        if (deferred) {
	          deferred.resolve(undefined);
	        }
	      }
	    }
	
	    /**
	     * @param {string} localName
	     * @return {Function|undefined}
	     */
	
	  }, {
	    key: 'get',
	    value: function get(localName) {
	      var definition = this._internals.localNameToDefinition(localName);
	      if (definition) {
	        return definition.constructor;
	      }
	
	      return undefined;
	    }
	
	    /**
	     * @param {string} localName
	     * @return {!Promise<undefined>}
	     */
	
	  }, {
	    key: 'whenDefined',
	    value: function whenDefined(localName) {
	      if (!Utilities.isValidCustomElementName(localName)) {
	        return Promise.reject(new SyntaxError('\'' + localName + '\' is not a valid custom element name.'));
	      }
	
	      var prior = this._whenDefinedDeferred.get(localName);
	      if (prior) {
	        return prior.toPromise();
	      }
	
	      var deferred = new _Deferred2.default();
	      this._whenDefinedDeferred.set(localName, deferred);
	
	      var definition = this._internals.localNameToDefinition(localName);
	      // Resolve immediately only if the given local name has a definition *and*
	      // the full document walk to upgrade elements with that local name has
	      // already happened.
	      if (definition && this._unflushedLocalNames.indexOf(localName) === -1) {
	        deferred.resolve(undefined);
	      }
	
	      return deferred.toPromise();
	    }
	  }, {
	    key: 'polyfillWrapFlushCallback',
	    value: function polyfillWrapFlushCallback(outer) {
	      this._documentConstructionObserver.disconnect();
	      var inner = this._flushCallback;
	      this._flushCallback = function (flush) {
	        return outer(function () {
	          return inner(flush);
	        });
	      };
	    }
	  }]);
	
	  return CustomElementRegistry;
	}();
	
	// Closure compiler exports.
	
	
	exports.default = CustomElementRegistry;
	window['CustomElementRegistry'] = CustomElementRegistry;
	CustomElementRegistry.prototype['define'] = CustomElementRegistry.prototype.define;
	CustomElementRegistry.prototype['get'] = CustomElementRegistry.prototype.get;
	CustomElementRegistry.prototype['whenDefined'] = CustomElementRegistry.prototype.whenDefined;
	CustomElementRegistry.prototype['polyfillWrapFlushCallback'] = CustomElementRegistry.prototype.polyfillWrapFlushCallback;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var DocumentConstructionObserver = function () {
	  function DocumentConstructionObserver(internals, doc) {
	    _classCallCheck(this, DocumentConstructionObserver);
	
	    /**
	     * @type {!CustomElementInternals}
	     */
	    this._internals = internals;
	
	    /**
	     * @type {!Document}
	     */
	    this._document = doc;
	
	    /**
	     * @type {MutationObserver|undefined}
	     */
	    this._observer = undefined;
	
	    // Simulate tree construction for all currently accessible nodes in the
	    // document.
	    this._internals.patchAndUpgradeTree(this._document);
	
	    if (this._document.readyState === 'loading') {
	      this._observer = new MutationObserver(this._handleMutations.bind(this));
	
	      // Nodes created by the parser are given to the observer *before* the next
	      // task runs. Inline scripts are run in a new task. This means that the
	      // observer will be able to handle the newly parsed nodes before the inline
	      // script is run.
	      this._observer.observe(this._document, {
	        childList: true,
	        subtree: true
	      });
	    }
	  }
	
	  _createClass(DocumentConstructionObserver, [{
	    key: 'disconnect',
	    value: function disconnect() {
	      if (this._observer) {
	        this._observer.disconnect();
	      }
	    }
	
	    /**
	     * @param {!Array<!MutationRecord>} mutations
	     */
	
	  }, {
	    key: '_handleMutations',
	    value: function _handleMutations(mutations) {
	      // Once the document's `readyState` is 'interactive' or 'complete', all new
	      // nodes created within that document will be the result of script and
	      // should be handled by patching.
	      var readyState = this._document.readyState;
	      if (readyState === 'interactive' || readyState === 'complete') {
	        this.disconnect();
	      }
	
	      for (var i = 0; i < mutations.length; i++) {
	        var addedNodes = mutations[i].addedNodes;
	        for (var j = 0; j < addedNodes.length; j++) {
	          var node = addedNodes[j];
	          this._internals.patchAndUpgradeTree(node);
	        }
	      }
	    }
	  }]);
	
	  return DocumentConstructionObserver;
	}();
	
	exports.default = DocumentConstructionObserver;

/***/ },
/* 42 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * @template T
	 */
	var Deferred = function () {
	  function Deferred() {
	    var _this = this;
	
	    _classCallCheck(this, Deferred);
	
	    /**
	     * @private
	     * @type {T|undefined}
	     */
	    this._value = undefined;
	
	    /**
	     * @private
	     * @type {Function|undefined}
	     */
	    this._resolve = undefined;
	
	    /**
	     * @private
	     * @type {!Promise<T>}
	     */
	    this._promise = new Promise(function (resolve) {
	      _this._resolve = resolve;
	
	      if (_this._value) {
	        resolve(_this._value);
	      }
	    });
	  }
	
	  /**
	   * @param {T} value
	   */
	
	
	  _createClass(Deferred, [{
	    key: 'resolve',
	    value: function resolve(value) {
	      if (this._value) {
	        throw new Error('Already resolved.');
	      }
	
	      this._value = value;
	
	      if (this._resolve) {
	        this._resolve(value);
	      }
	    }
	
	    /**
	     * @return {!Promise<T>}
	     */
	
	  }, {
	    key: 'toPromise',
	    value: function toPromise() {
	      return this._promise;
	    }
	  }]);
	
	  return Deferred;
	}();
	
	exports.default = Deferred;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals) {
	  window['HTMLElement'] = function () {
	    /**
	     * @type {function(new: HTMLElement): !HTMLElement}
	     */
	    function HTMLElement() {
	      // This should really be `new.target` but `new.target` can't be emulated
	      // in ES5. Assuming the user keeps the default value of the constructor's
	      // prototype's `constructor` property, this is equivalent.
	      /** @type {!Function} */
	      var constructor = this.constructor;
	
	      var definition = internals.constructorToDefinition(constructor);
	      if (!definition) {
	        throw new Error('The custom element being constructed was not registered with `customElements`.');
	      }
	
	      var constructionStack = definition.constructionStack;
	
	      if (constructionStack.length === 0) {
	        var _element = _Native2.default.Document_createElement.call(document, definition.localName);
	        Object.setPrototypeOf(_element, constructor.prototype);
	        _element.__CE_state = _CustomElementState2.default.custom;
	        _element.__CE_definition = definition;
	        internals.patch(_element);
	        return _element;
	      }
	
	      var lastIndex = constructionStack.length - 1;
	      var element = constructionStack[lastIndex];
	      if (element === _AlreadyConstructedMarker2.default) {
	        throw new Error('The HTMLElement constructor was either called reentrantly for this constructor or called multiple times.');
	      }
	      constructionStack[lastIndex] = _AlreadyConstructedMarker2.default;
	
	      Object.setPrototypeOf(element, constructor.prototype);
	      internals.patch( /** @type {!HTMLElement} */element);
	
	      return element;
	    }
	
	    HTMLElement.prototype = _Native2.default.HTMLElement.prototype;
	
	    return HTMLElement;
	  }();
	};
	
	var _Native = __webpack_require__(44);
	
	var _Native2 = _interopRequireDefault(_Native);
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _CustomElementState = __webpack_require__(39);
	
	var _CustomElementState2 = _interopRequireDefault(_CustomElementState);
	
	var _AlreadyConstructedMarker = __webpack_require__(45);
	
	var _AlreadyConstructedMarker2 = _interopRequireDefault(_AlreadyConstructedMarker);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	;
	
	/**
	 * @param {!CustomElementInternals} internals
	 */

/***/ },
/* 44 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {
	  Document_createElement: window.Document.prototype.createElement,
	  Document_createElementNS: window.Document.prototype.createElementNS,
	  Document_importNode: window.Document.prototype.importNode,
	  Document_prepend: window.Document.prototype['prepend'],
	  Document_append: window.Document.prototype['append'],
	  Node_cloneNode: window.Node.prototype.cloneNode,
	  Node_appendChild: window.Node.prototype.appendChild,
	  Node_insertBefore: window.Node.prototype.insertBefore,
	  Node_removeChild: window.Node.prototype.removeChild,
	  Node_replaceChild: window.Node.prototype.replaceChild,
	  Node_textContent: Object.getOwnPropertyDescriptor(window.Node.prototype, 'textContent'),
	  Element_attachShadow: window.Element.prototype['attachShadow'],
	  Element_innerHTML: Object.getOwnPropertyDescriptor(window.Element.prototype, 'innerHTML'),
	  Element_getAttribute: window.Element.prototype.getAttribute,
	  Element_setAttribute: window.Element.prototype.setAttribute,
	  Element_removeAttribute: window.Element.prototype.removeAttribute,
	  Element_getAttributeNS: window.Element.prototype.getAttributeNS,
	  Element_setAttributeNS: window.Element.prototype.setAttributeNS,
	  Element_removeAttributeNS: window.Element.prototype.removeAttributeNS,
	  Element_insertAdjacentElement: window.Element.prototype['insertAdjacentElement'],
	  Element_prepend: window.Element.prototype['prepend'],
	  Element_append: window.Element.prototype['append'],
	  Element_before: window.Element.prototype['before'],
	  Element_after: window.Element.prototype['after'],
	  Element_replaceWith: window.Element.prototype['replaceWith'],
	  Element_remove: window.Element.prototype['remove'],
	  HTMLElement: window.HTMLElement,
	  HTMLElement_innerHTML: Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'innerHTML'),
	  HTMLElement_insertAdjacentElement: window.HTMLElement.prototype['insertAdjacentElement']
	};

/***/ },
/* 45 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * This class exists only to work around Closure's lack of a way to describe
	 * singletons. It represents the 'already constructed marker' used in custom
	 * element construction stacks.
	 *
	 * https://html.spec.whatwg.org/#concept-already-constructed-marker
	 */
	var AlreadyConstructedMarker = function AlreadyConstructedMarker() {
	  _classCallCheck(this, AlreadyConstructedMarker);
	};
	
	exports.default = new AlreadyConstructedMarker();

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals) {
	  Utilities.setPropertyUnchecked(Document.prototype, 'createElement',
	  /**
	   * @this {Document}
	   * @param {string} localName
	   * @return {!Element}
	   */
	  function (localName) {
	    // Only create custom elements if this document is associated with the registry.
	    if (this.__CE_hasRegistry) {
	      var definition = internals.localNameToDefinition(localName);
	      if (definition) {
	        return new definition.constructor();
	      }
	    }
	
	    var result = /** @type {!Element} */
	    _Native2.default.Document_createElement.call(this, localName);
	    internals.patch(result);
	    return result;
	  });
	
	  Utilities.setPropertyUnchecked(Document.prototype, 'importNode',
	  /**
	   * @this {Document}
	   * @param {!Node} node
	   * @param {boolean=} deep
	   * @return {!Node}
	   */
	  function (node, deep) {
	    var clone = _Native2.default.Document_importNode.call(this, node, deep);
	    // Only create custom elements if this document is associated with the registry.
	    if (!this.__CE_hasRegistry) {
	      internals.patchTree(clone);
	    } else {
	      internals.patchAndUpgradeTree(clone);
	    }
	    return clone;
	  });
	
	  var NS_HTML = "http://www.w3.org/1999/xhtml";
	
	  Utilities.setPropertyUnchecked(Document.prototype, 'createElementNS',
	  /**
	   * @this {Document}
	   * @param {?string} namespace
	   * @param {string} localName
	   * @return {!Element}
	   */
	  function (namespace, localName) {
	    // Only create custom elements if this document is associated with the registry.
	    if (this.__CE_hasRegistry && (namespace === null || namespace === NS_HTML)) {
	      var definition = internals.localNameToDefinition(localName);
	      if (definition) {
	        return new definition.constructor();
	      }
	    }
	
	    var result = /** @type {!Element} */
	    _Native2.default.Document_createElementNS.call(this, namespace, localName);
	    internals.patch(result);
	    return result;
	  });
	
	  (0, _ParentNode2.default)(internals, Document.prototype, {
	    prepend: _Native2.default.Document_prepend,
	    append: _Native2.default.Document_append
	  });
	};
	
	var _Native = __webpack_require__(44);
	
	var _Native2 = _interopRequireDefault(_Native);
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	var _ParentNode = __webpack_require__(47);
	
	var _ParentNode2 = _interopRequireDefault(_ParentNode);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	;
	
	/**
	 * @param {!CustomElementInternals} internals
	 */

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals, destination, builtIn) {
	  /**
	   * @param {...(!Node|string)} nodes
	   */
	  destination['prepend'] = function () {
	    for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
	      nodes[_key] = arguments[_key];
	    }
	
	    // TODO: Fix this for when one of `nodes` is a DocumentFragment!
	    var connectedBefore = /** @type {!Array<!Node>} */nodes.filter(function (node) {
	      // DocumentFragments are not connected and will not be added to the list.
	      return node instanceof Node && Utilities.isConnected(node);
	    });
	
	    builtIn.prepend.apply(this, nodes);
	
	    for (var i = 0; i < connectedBefore.length; i++) {
	      internals.disconnectTree(connectedBefore[i]);
	    }
	
	    if (Utilities.isConnected(this)) {
	      for (var _i = 0; _i < nodes.length; _i++) {
	        var node = nodes[_i];
	        if (node instanceof Element) {
	          internals.connectTree(node);
	        }
	      }
	    }
	  };
	
	  /**
	   * @param {...(!Node|string)} nodes
	   */
	  destination['append'] = function () {
	    for (var _len2 = arguments.length, nodes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      nodes[_key2] = arguments[_key2];
	    }
	
	    // TODO: Fix this for when one of `nodes` is a DocumentFragment!
	    var connectedBefore = /** @type {!Array<!Node>} */nodes.filter(function (node) {
	      // DocumentFragments are not connected and will not be added to the list.
	      return node instanceof Node && Utilities.isConnected(node);
	    });
	
	    builtIn.append.apply(this, nodes);
	
	    for (var i = 0; i < connectedBefore.length; i++) {
	      internals.disconnectTree(connectedBefore[i]);
	    }
	
	    if (Utilities.isConnected(this)) {
	      for (var _i2 = 0; _i2 < nodes.length; _i2++) {
	        var node = nodes[_i2];
	        if (node instanceof Element) {
	          internals.connectTree(node);
	        }
	      }
	    }
	  };
	};
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * @typedef {{
	 *   prepend: !function(...(!Node|string)),
	  *  append: !function(...(!Node|string)),
	 * }}
	 */
	var ParentNodeNativeMethods = void 0;
	
	/**
	 * @param {!CustomElementInternals} internals
	 * @param {!Object} destination
	 * @param {!ParentNodeNativeMethods} builtIn
	 */
	;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals) {
	  // `Node#nodeValue` is implemented on `Attr`.
	  // `Node#textContent` is implemented on `Attr`, `Element`.
	
	  Utilities.setPropertyUnchecked(Node.prototype, 'insertBefore',
	  /**
	   * @this {Node}
	   * @param {!Node} node
	   * @param {?Node} refNode
	   * @return {!Node}
	   */
	  function (node, refNode) {
	    if (node instanceof DocumentFragment) {
	      var insertedNodes = Array.prototype.slice.apply(node.childNodes);
	      var _nativeResult = _Native2.default.Node_insertBefore.call(this, node, refNode);
	
	      // DocumentFragments can't be connected, so `disconnectTree` will never
	      // need to be called on a DocumentFragment's children after inserting it.
	
	      if (Utilities.isConnected(this)) {
	        for (var i = 0; i < insertedNodes.length; i++) {
	          internals.connectTree(insertedNodes[i]);
	        }
	      }
	
	      return _nativeResult;
	    }
	
	    var nodeWasConnected = Utilities.isConnected(node);
	    var nativeResult = _Native2.default.Node_insertBefore.call(this, node, refNode);
	
	    if (nodeWasConnected) {
	      internals.disconnectTree(node);
	    }
	
	    if (Utilities.isConnected(this)) {
	      internals.connectTree(node);
	    }
	
	    return nativeResult;
	  });
	
	  Utilities.setPropertyUnchecked(Node.prototype, 'appendChild',
	  /**
	   * @this {Node}
	   * @param {!Node} node
	   * @return {!Node}
	   */
	  function (node) {
	    if (node instanceof DocumentFragment) {
	      var insertedNodes = Array.prototype.slice.apply(node.childNodes);
	      var _nativeResult2 = _Native2.default.Node_appendChild.call(this, node);
	
	      // DocumentFragments can't be connected, so `disconnectTree` will never
	      // need to be called on a DocumentFragment's children after inserting it.
	
	      if (Utilities.isConnected(this)) {
	        for (var i = 0; i < insertedNodes.length; i++) {
	          internals.connectTree(insertedNodes[i]);
	        }
	      }
	
	      return _nativeResult2;
	    }
	
	    var nodeWasConnected = Utilities.isConnected(node);
	    var nativeResult = _Native2.default.Node_appendChild.call(this, node);
	
	    if (nodeWasConnected) {
	      internals.disconnectTree(node);
	    }
	
	    if (Utilities.isConnected(this)) {
	      internals.connectTree(node);
	    }
	
	    return nativeResult;
	  });
	
	  Utilities.setPropertyUnchecked(Node.prototype, 'cloneNode',
	  /**
	   * @this {Node}
	   * @param {boolean=} deep
	   * @return {!Node}
	   */
	  function (deep) {
	    var clone = _Native2.default.Node_cloneNode.call(this, deep);
	    // Only create custom elements if this element's owner document is
	    // associated with the registry.
	    if (!this.ownerDocument.__CE_hasRegistry) {
	      internals.patchTree(clone);
	    } else {
	      internals.patchAndUpgradeTree(clone);
	    }
	    return clone;
	  });
	
	  Utilities.setPropertyUnchecked(Node.prototype, 'removeChild',
	  /**
	   * @this {Node}
	   * @param {!Node} node
	   * @return {!Node}
	   */
	  function (node) {
	    var nodeWasConnected = Utilities.isConnected(node);
	    var nativeResult = _Native2.default.Node_removeChild.call(this, node);
	
	    if (nodeWasConnected) {
	      internals.disconnectTree(node);
	    }
	
	    return nativeResult;
	  });
	
	  Utilities.setPropertyUnchecked(Node.prototype, 'replaceChild',
	  /**
	   * @this {Node}
	   * @param {!Node} nodeToInsert
	   * @param {!Node} nodeToRemove
	   * @return {!Node}
	   */
	  function (nodeToInsert, nodeToRemove) {
	    if (nodeToInsert instanceof DocumentFragment) {
	      var insertedNodes = Array.prototype.slice.apply(nodeToInsert.childNodes);
	      var _nativeResult3 = _Native2.default.Node_replaceChild.call(this, nodeToInsert, nodeToRemove);
	
	      // DocumentFragments can't be connected, so `disconnectTree` will never
	      // need to be called on a DocumentFragment's children after inserting it.
	
	      if (Utilities.isConnected(this)) {
	        internals.disconnectTree(nodeToRemove);
	        for (var i = 0; i < insertedNodes.length; i++) {
	          internals.connectTree(insertedNodes[i]);
	        }
	      }
	
	      return _nativeResult3;
	    }
	
	    var nodeToInsertWasConnected = Utilities.isConnected(nodeToInsert);
	    var nativeResult = _Native2.default.Node_replaceChild.call(this, nodeToInsert, nodeToRemove);
	    var thisIsConnected = Utilities.isConnected(this);
	
	    if (thisIsConnected) {
	      internals.disconnectTree(nodeToRemove);
	    }
	
	    if (nodeToInsertWasConnected) {
	      internals.disconnectTree(nodeToInsert);
	    }
	
	    if (thisIsConnected) {
	      internals.connectTree(nodeToInsert);
	    }
	
	    return nativeResult;
	  });
	
	  function patch_textContent(destination, baseDescriptor) {
	    Object.defineProperty(destination, 'textContent', {
	      enumerable: baseDescriptor.enumerable,
	      configurable: true,
	      get: baseDescriptor.get,
	      set: /** @this {Node} */function set(assignedValue) {
	        // If this is a text node then there are no nodes to disconnect.
	        if (this.nodeType === Node.TEXT_NODE) {
	          baseDescriptor.set.call(this, assignedValue);
	          return;
	        }
	
	        var removedNodes = undefined;
	        // Checking for `firstChild` is faster than reading `childNodes.length`
	        // to compare with 0.
	        if (this.firstChild) {
	          // Using `childNodes` is faster than `children`, even though we only
	          // care about elements.
	          var childNodes = this.childNodes;
	          var childNodesLength = childNodes.length;
	          if (childNodesLength > 0 && Utilities.isConnected(this)) {
	            // Copying an array by iterating is faster than using slice.
	            removedNodes = new Array(childNodesLength);
	            for (var i = 0; i < childNodesLength; i++) {
	              removedNodes[i] = childNodes[i];
	            }
	          }
	        }
	
	        baseDescriptor.set.call(this, assignedValue);
	
	        if (removedNodes) {
	          for (var _i = 0; _i < removedNodes.length; _i++) {
	            internals.disconnectTree(removedNodes[_i]);
	          }
	        }
	      }
	    });
	  }
	
	  if (_Native2.default.Node_textContent && _Native2.default.Node_textContent.get) {
	    patch_textContent(Node.prototype, _Native2.default.Node_textContent);
	  } else {
	    internals.addPatch(function (element) {
	      patch_textContent(element, {
	        enumerable: true,
	        configurable: true,
	        // NOTE: This implementation of the `textContent` getter assumes that
	        // text nodes' `textContent` getter will not be patched.
	        get: /** @this {Node} */function get() {
	          /** @type {!Array<string>} */
	          var parts = [];
	
	          for (var i = 0; i < this.childNodes.length; i++) {
	            parts.push(this.childNodes[i].textContent);
	          }
	
	          return parts.join('');
	        },
	        set: /** @this {Node} */function set(assignedValue) {
	          while (this.firstChild) {
	            _Native2.default.Node_removeChild.call(this, this.firstChild);
	          }
	          _Native2.default.Node_appendChild.call(this, document.createTextNode(assignedValue));
	        }
	      });
	    });
	  }
	};
	
	var _Native = __webpack_require__(44);
	
	var _Native2 = _interopRequireDefault(_Native);
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	;
	
	/**
	 * @param {!CustomElementInternals} internals
	 */

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals) {
	  if (_Native2.default.Element_attachShadow) {
	    Utilities.setPropertyUnchecked(Element.prototype, 'attachShadow',
	    /**
	     * @this {Element}
	     * @param {!{mode: string}} init
	     * @return {ShadowRoot}
	     */
	    function (init) {
	      var shadowRoot = _Native2.default.Element_attachShadow.call(this, init);
	      this.__CE_shadowRoot = shadowRoot;
	      return shadowRoot;
	    });
	  } else {
	    console.warn('Custom Elements: `Element#attachShadow` was not patched.');
	  }
	
	  function patch_innerHTML(destination, baseDescriptor) {
	    Object.defineProperty(destination, 'innerHTML', {
	      enumerable: baseDescriptor.enumerable,
	      configurable: true,
	      get: baseDescriptor.get,
	      set: /** @this {Element} */function set(htmlString) {
	        var _this = this;
	
	        var isConnected = Utilities.isConnected(this);
	
	        // NOTE: In IE11, when using the native `innerHTML` setter, all nodes
	        // that were previously descendants of the context element have all of
	        // their children removed as part of the set - the entire subtree is
	        // 'disassembled'. This work around walks the subtree *before* using the
	        // native setter.
	        /** @type {!Array<!Element>|undefined} */
	        var removedElements = undefined;
	        if (isConnected) {
	          removedElements = [];
	          Utilities.walkDeepDescendantElements(this, function (element) {
	            if (element !== _this) {
	              removedElements.push(element);
	            }
	          });
	        }
	
	        baseDescriptor.set.call(this, htmlString);
	
	        if (removedElements) {
	          for (var i = 0; i < removedElements.length; i++) {
	            var element = removedElements[i];
	            if (element.__CE_state === _CustomElementState2.default.custom) {
	              internals.disconnectedCallback(element);
	            }
	          }
	        }
	
	        // Only create custom elements if this element's owner document is
	        // associated with the registry.
	        if (!this.ownerDocument.__CE_hasRegistry) {
	          internals.patchTree(this);
	        } else {
	          internals.patchAndUpgradeTree(this);
	        }
	        return htmlString;
	      }
	    });
	  }
	
	  if (_Native2.default.Element_innerHTML && _Native2.default.Element_innerHTML.get) {
	    patch_innerHTML(Element.prototype, _Native2.default.Element_innerHTML);
	  } else if (_Native2.default.HTMLElement_innerHTML && _Native2.default.HTMLElement_innerHTML.get) {
	    patch_innerHTML(HTMLElement.prototype, _Native2.default.HTMLElement_innerHTML);
	  } else {
	    (function () {
	
	      /** @type {HTMLDivElement} */
	      var rawDiv = _Native2.default.Document_createElement.call(document, 'div');
	
	      internals.addPatch(function (element) {
	        patch_innerHTML(element, {
	          enumerable: true,
	          configurable: true,
	          // Implements getting `innerHTML` by performing an unpatched `cloneNode`
	          // of the element and returning the resulting element's `innerHTML`.
	          // TODO: Is this too expensive?
	          get: /** @this {Element} */function get() {
	            return _Native2.default.Node_cloneNode.call(this, true).innerHTML;
	          },
	          // Implements setting `innerHTML` by creating an unpatched element,
	          // setting `innerHTML` of that element and replacing the target
	          // element's children with those of the unpatched element.
	          set: /** @this {Element} */function set(assignedValue) {
	            // NOTE: re-route to `content` for `template` elements.
	            // We need to do this because `template.appendChild` does not
	            // route into `template.content`.
	            /** @type {!Node} */
	            var content = this.localName === 'template' ? /** @type {!HTMLTemplateElement} */this.content : this;
	            rawDiv.innerHTML = assignedValue;
	
	            while (content.childNodes.length > 0) {
	              _Native2.default.Node_removeChild.call(content, content.childNodes[0]);
	            }
	            while (rawDiv.childNodes.length > 0) {
	              _Native2.default.Node_appendChild.call(content, rawDiv.childNodes[0]);
	            }
	          }
	        });
	      });
	    })();
	  }
	
	  Utilities.setPropertyUnchecked(Element.prototype, 'setAttribute',
	  /**
	   * @this {Element}
	   * @param {string} name
	   * @param {string} newValue
	   */
	  function (name, newValue) {
	    // Fast path for non-custom elements.
	    if (this.__CE_state !== _CustomElementState2.default.custom) {
	      return _Native2.default.Element_setAttribute.call(this, name, newValue);
	    }
	
	    var oldValue = _Native2.default.Element_getAttribute.call(this, name);
	    _Native2.default.Element_setAttribute.call(this, name, newValue);
	    newValue = _Native2.default.Element_getAttribute.call(this, name);
	    if (oldValue !== newValue) {
	      internals.attributeChangedCallback(this, name, oldValue, newValue, null);
	    }
	  });
	
	  Utilities.setPropertyUnchecked(Element.prototype, 'setAttributeNS',
	  /**
	   * @this {Element}
	   * @param {?string} namespace
	   * @param {string} name
	   * @param {string} newValue
	   */
	  function (namespace, name, newValue) {
	    // Fast path for non-custom elements.
	    if (this.__CE_state !== _CustomElementState2.default.custom) {
	      return _Native2.default.Element_setAttributeNS.call(this, namespace, name, newValue);
	    }
	
	    var oldValue = _Native2.default.Element_getAttributeNS.call(this, namespace, name);
	    _Native2.default.Element_setAttributeNS.call(this, namespace, name, newValue);
	    newValue = _Native2.default.Element_getAttributeNS.call(this, namespace, name);
	    if (oldValue !== newValue) {
	      internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
	    }
	  });
	
	  Utilities.setPropertyUnchecked(Element.prototype, 'removeAttribute',
	  /**
	   * @this {Element}
	   * @param {string} name
	   */
	  function (name) {
	    // Fast path for non-custom elements.
	    if (this.__CE_state !== _CustomElementState2.default.custom) {
	      return _Native2.default.Element_removeAttribute.call(this, name);
	    }
	
	    var oldValue = _Native2.default.Element_getAttribute.call(this, name);
	    _Native2.default.Element_removeAttribute.call(this, name);
	    if (oldValue !== null) {
	      internals.attributeChangedCallback(this, name, oldValue, null, null);
	    }
	  });
	
	  Utilities.setPropertyUnchecked(Element.prototype, 'removeAttributeNS',
	  /**
	   * @this {Element}
	   * @param {?string} namespace
	   * @param {string} name
	   */
	  function (namespace, name) {
	    // Fast path for non-custom elements.
	    if (this.__CE_state !== _CustomElementState2.default.custom) {
	      return _Native2.default.Element_removeAttributeNS.call(this, namespace, name);
	    }
	
	    var oldValue = _Native2.default.Element_getAttributeNS.call(this, namespace, name);
	    _Native2.default.Element_removeAttributeNS.call(this, namespace, name);
	    // In older browsers, `Element#getAttributeNS` may return the empty string
	    // instead of null if the attribute does not exist. For details, see;
	    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNS#Notes
	    var newValue = _Native2.default.Element_getAttributeNS.call(this, namespace, name);
	    if (oldValue !== newValue) {
	      internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
	    }
	  });
	
	  function patch_insertAdjacentElement(destination, baseMethod) {
	    Utilities.setPropertyUnchecked(destination, 'insertAdjacentElement',
	    /**
	     * @this {Element}
	     * @param {string} where
	     * @param {!Element} element
	     * @return {?Element}
	     */
	    function (where, element) {
	      var wasConnected = Utilities.isConnected(element);
	      var insertedElement = /** @type {!Element} */
	      baseMethod.call(this, where, element);
	
	      if (wasConnected) {
	        internals.disconnectTree(element);
	      }
	
	      if (Utilities.isConnected(insertedElement)) {
	        internals.connectTree(element);
	      }
	      return insertedElement;
	    });
	  }
	
	  if (_Native2.default.HTMLElement_insertAdjacentElement) {
	    patch_insertAdjacentElement(HTMLElement.prototype, _Native2.default.HTMLElement_insertAdjacentElement);
	  } else if (_Native2.default.Element_insertAdjacentElement) {
	    patch_insertAdjacentElement(Element.prototype, _Native2.default.Element_insertAdjacentElement);
	  } else {
	    console.warn('Custom Elements: `Element#insertAdjacentElement` was not patched.');
	  }
	
	  (0, _ParentNode2.default)(internals, Element.prototype, {
	    prepend: _Native2.default.Element_prepend,
	    append: _Native2.default.Element_append
	  });
	
	  (0, _ChildNode2.default)(internals, Element.prototype, {
	    before: _Native2.default.Element_before,
	    after: _Native2.default.Element_after,
	    replaceWith: _Native2.default.Element_replaceWith,
	    remove: _Native2.default.Element_remove
	  });
	};
	
	var _Native = __webpack_require__(44);
	
	var _Native2 = _interopRequireDefault(_Native);
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _CustomElementState = __webpack_require__(39);
	
	var _CustomElementState2 = _interopRequireDefault(_CustomElementState);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	var _ParentNode = __webpack_require__(47);
	
	var _ParentNode2 = _interopRequireDefault(_ParentNode);
	
	var _ChildNode = __webpack_require__(50);
	
	var _ChildNode2 = _interopRequireDefault(_ChildNode);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	;
	
	/**
	 * @param {!CustomElementInternals} internals
	 */

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (internals, destination, builtIn) {
	  /**
	   * @param {...(!Node|string)} nodes
	   */
	  destination['before'] = function () {
	    for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
	      nodes[_key] = arguments[_key];
	    }
	
	    // TODO: Fix this for when one of `nodes` is a DocumentFragment!
	    var connectedBefore = /** @type {!Array<!Node>} */nodes.filter(function (node) {
	      // DocumentFragments are not connected and will not be added to the list.
	      return node instanceof Node && Utilities.isConnected(node);
	    });
	
	    builtIn.before.apply(this, nodes);
	
	    for (var i = 0; i < connectedBefore.length; i++) {
	      internals.disconnectTree(connectedBefore[i]);
	    }
	
	    if (Utilities.isConnected(this)) {
	      for (var _i = 0; _i < nodes.length; _i++) {
	        var node = nodes[_i];
	        if (node instanceof Element) {
	          internals.connectTree(node);
	        }
	      }
	    }
	  };
	
	  /**
	   * @param {...(!Node|string)} nodes
	   */
	  destination['after'] = function () {
	    for (var _len2 = arguments.length, nodes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      nodes[_key2] = arguments[_key2];
	    }
	
	    // TODO: Fix this for when one of `nodes` is a DocumentFragment!
	    var connectedBefore = /** @type {!Array<!Node>} */nodes.filter(function (node) {
	      // DocumentFragments are not connected and will not be added to the list.
	      return node instanceof Node && Utilities.isConnected(node);
	    });
	
	    builtIn.after.apply(this, nodes);
	
	    for (var i = 0; i < connectedBefore.length; i++) {
	      internals.disconnectTree(connectedBefore[i]);
	    }
	
	    if (Utilities.isConnected(this)) {
	      for (var _i2 = 0; _i2 < nodes.length; _i2++) {
	        var node = nodes[_i2];
	        if (node instanceof Element) {
	          internals.connectTree(node);
	        }
	      }
	    }
	  };
	
	  /**
	   * @param {...(!Node|string)} nodes
	   */
	  destination['replaceWith'] = function () {
	    for (var _len3 = arguments.length, nodes = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	      nodes[_key3] = arguments[_key3];
	    }
	
	    // TODO: Fix this for when one of `nodes` is a DocumentFragment!
	    var connectedBefore = /** @type {!Array<!Node>} */nodes.filter(function (node) {
	      // DocumentFragments are not connected and will not be added to the list.
	      return node instanceof Node && Utilities.isConnected(node);
	    });
	
	    var wasConnected = Utilities.isConnected(this);
	
	    builtIn.replaceWith.apply(this, nodes);
	
	    for (var i = 0; i < connectedBefore.length; i++) {
	      internals.disconnectTree(connectedBefore[i]);
	    }
	
	    if (wasConnected) {
	      internals.disconnectTree(this);
	      for (var _i3 = 0; _i3 < nodes.length; _i3++) {
	        var node = nodes[_i3];
	        if (node instanceof Element) {
	          internals.connectTree(node);
	        }
	      }
	    }
	  };
	
	  destination['remove'] = function () {
	    var wasConnected = Utilities.isConnected(this);
	
	    builtIn.remove.call(this);
	
	    if (wasConnected) {
	      internals.disconnectTree(this);
	    }
	  };
	};
	
	var _CustomElementInternals = __webpack_require__(37);
	
	var _CustomElementInternals2 = _interopRequireDefault(_CustomElementInternals);
	
	var _Utilities = __webpack_require__(38);
	
	var Utilities = _interopRequireWildcard(_Utilities);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * @typedef {{
	 *   before: !function(...(!Node|string)),
	 *   after: !function(...(!Node|string)),
	 *   replaceWith: !function(...(!Node|string)),
	 *   remove: !function(),
	 * }}
	 */
	var ChildNodeNativeMethods = void 0;
	
	/**
	 * @param {!CustomElementInternals} internals
	 * @param {!Object} destination
	 * @param {!ChildNodeNativeMethods} builtIn
	 */
	;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	/**
	 * Patches elements that interacts with ShadyDOM
	 * such that tree traversal and mutation apis act like they would under
	 * ShadowDOM.
	 *
	 * This import enables seemless interaction with ShadyDOM powered
	 * custom elements, enabling better interoperation with 3rd party code,
	 * libraries, and frameworks that use DOM tree manipulation apis.
	 */
	
	'use strict';
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _flush = __webpack_require__(53);
	
	var _observeChanges = __webpack_require__(54);
	
	var _nativeMethods = __webpack_require__(55);
	
	var nativeMethods = _interopRequireWildcard(_nativeMethods);
	
	var _nativeTree = __webpack_require__(56);
	
	var nativeTree = _interopRequireWildcard(_nativeTree);
	
	var _patchBuiltins = __webpack_require__(58);
	
	var _patchEvents = __webpack_require__(63);
	
	var _attachShadow = __webpack_require__(64);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	if (utils.settings.inUse) {
	
	  window.ShadyDOM = {
	    // TODO(sorvell): remove when Polymer does not depend on this.
	    inUse: utils.settings.inUse,
	    // TODO(sorvell): remove when Polymer does not depend on this.
	    patch: function patch(node) {
	      return node;
	    },
	    isShadyRoot: utils.isShadyRoot,
	    enqueue: _flush.enqueue,
	    flush: _flush.flush,
	    settings: utils.settings,
	    filterMutations: _observeChanges.filterMutations,
	    observeChildren: _observeChanges.observeChildren,
	    unobserveChildren: _observeChanges.unobserveChildren,
	    nativeMethods: nativeMethods,
	    nativeTree: nativeTree
	  };
	
	  // Apply patches to events...
	  (0, _patchEvents.patchEvents)();
	  // Apply patches to builtins (e.g. Element.prototype) where applicable.
	  (0, _patchBuiltins.patchBuiltins)();
	
	  window.ShadowRoot = _attachShadow.ShadyRoot;
	}

/***/ },
/* 52 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.isShadyRoot = isShadyRoot;
	exports.ownerShadyRootForNode = ownerShadyRootForNode;
	exports.matchesSelector = matchesSelector;
	exports.extend = extend;
	exports.extendAll = extendAll;
	exports.mixin = mixin;
	exports.patchPrototype = patchPrototype;
	exports.microtask = microtask;
	var settings = exports.settings = window.ShadyDOM || {};
	
	settings.hasNativeShadowDOM = Boolean(Element.prototype.attachShadow && Node.prototype.getRootNode);
	
	var desc = Object.getOwnPropertyDescriptor(Node.prototype, 'firstChild');
	
	settings.hasDescriptors = Boolean(desc && desc.configurable && desc.get);
	settings.inUse = settings.force || !settings.hasNativeShadowDOM;
	
	function isShadyRoot(obj) {
	  return Boolean(obj.__localName === 'ShadyRoot');
	}
	
	function ownerShadyRootForNode(node) {
	  var root = node.getRootNode();
	  if (isShadyRoot(root)) {
	    return root;
	  }
	}
	
	var p = Element.prototype;
	var matches = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
	
	function matchesSelector(element, selector) {
	  return matches.call(element, selector);
	}
	
	function copyOwnProperty(name, source, target) {
	  var pd = Object.getOwnPropertyDescriptor(source, name);
	  if (pd) {
	    Object.defineProperty(target, name, pd);
	  }
	}
	
	function extend(target, source) {
	  if (target && source) {
	    var n$ = Object.getOwnPropertyNames(source);
	    for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
	      copyOwnProperty(n, source, target);
	    }
	  }
	  return target || source;
	}
	
	function extendAll(target) {
	  for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    sources[_key - 1] = arguments[_key];
	  }
	
	  for (var i = 0; i < sources.length; i++) {
	    extend(target, sources[i]);
	  }
	  return target;
	}
	
	function mixin(target, source) {
	  for (var i in source) {
	    target[i] = source[i];
	  }
	  return target;
	}
	
	function patchPrototype(obj, mixin) {
	  var proto = Object.getPrototypeOf(obj);
	  if (!proto.hasOwnProperty('__patchProto')) {
	    var patchProto = Object.create(proto);
	    patchProto.__sourceProto = proto;
	    extend(patchProto, mixin);
	    proto.__patchProto = patchProto;
	  }
	  // old browsers don't have setPrototypeOf
	  obj.__proto__ = proto.__patchProto;
	}
	
	var twiddle = document.createTextNode('');
	var content = 0;
	var queue = [];
	new MutationObserver(function () {
	  while (queue.length) {
	    // catch errors in user code...
	    try {
	      queue.shift()();
	    } catch (e) {
	      // enqueue another record and throw
	      twiddle.textContent = content++;
	      throw e;
	    }
	  }
	}).observe(twiddle, { characterData: true });
	
	// use MutationObserver to get microtask async timing.
	function microtask(callback) {
	  queue.push(callback);
	  twiddle.textContent = content++;
	}

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.enqueue = enqueue;
	exports.flush = flush;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	// render enqueuer/flusher
	var flushList = [];
	var scheduled = void 0;
	function enqueue(callback) {
	  if (!scheduled) {
	    scheduled = true;
	    utils.microtask(flush);
	  }
	  flushList.push(callback);
	}
	
	function flush() {
	  scheduled = false;
	  var didFlush = Boolean(flushList.length);
	  while (flushList.length) {
	    flushList.shift()();
	  }
	  return didFlush;
	}
	
	flush.list = flushList;

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.unobserveChildren = exports.observeChildren = undefined;
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	exports.filterMutations = filterMutations;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var AsyncObserver = function () {
	  function AsyncObserver() {
	    _classCallCheck(this, AsyncObserver);
	
	    this._scheduled = false;
	    this.addedNodes = [];
	    this.removedNodes = [];
	    this.callbacks = new Set();
	  }
	
	  _createClass(AsyncObserver, [{
	    key: 'schedule',
	    value: function schedule() {
	      var _this = this;
	
	      if (!this._scheduled) {
	        this._scheduled = true;
	        utils.microtask(function () {
	          _this.flush();
	        });
	      }
	    }
	  }, {
	    key: 'flush',
	    value: function flush() {
	      var _this2 = this;
	
	      if (this._scheduled) {
	        (function () {
	          _this2._scheduled = false;
	          var mutations = _this2.takeRecords();
	          if (mutations.length) {
	            _this2.callbacks.forEach(function (cb) {
	              cb(mutations);
	            });
	          }
	        })();
	      }
	    }
	  }, {
	    key: 'takeRecords',
	    value: function takeRecords() {
	      if (this.addedNodes.length || this.removedNodes.length) {
	        var mutations = [{
	          addedNodes: this.addedNodes,
	          removedNodes: this.removedNodes
	        }];
	        this.addedNodes = [];
	        this.removedNodes = [];
	        return mutations;
	      }
	      return [];
	    }
	  }]);
	
	  return AsyncObserver;
	}();
	
	// TODO(sorvell): consider instead polyfilling MutationObserver
	// directly so that users do not have to fork their code.
	// Supporting the entire api may be challenging: e.g. filtering out
	// removed nodes in the wrong scope and seeing non-distributing
	// subtree child mutations.
	
	
	var observeChildren = exports.observeChildren = function observeChildren(node, callback) {
	  node.__shady = node.__shady || {};
	  if (!node.__shady.observer) {
	    node.__shady.observer = new AsyncObserver();
	  }
	  node.__shady.observer.callbacks.add(callback);
	  var observer = node.__shady.observer;
	  return {
	    _callback: callback,
	    _observer: observer,
	    _node: node,
	    takeRecords: function takeRecords() {
	      return observer.takeRecords();
	    }
	  };
	};
	
	var unobserveChildren = exports.unobserveChildren = function unobserveChildren(handle) {
	  var observer = handle && handle._observer;
	  if (observer) {
	    observer.callbacks.delete(handle._callback);
	    if (!observer.callbacks.size) {
	      handle._node.__shady.observer = null;
	    }
	  }
	};
	
	function filterMutations(mutations, target) {
	  var targetRootNode = target.getRootNode();
	  return mutations.map(function (mutation) {
	    var mutationInScope = targetRootNode === mutation.target.getRootNode();
	    if (mutationInScope && mutation.addedNodes) {
	      var nodes = Array.from(mutation.addedNodes).filter(function (n) {
	        return targetRootNode === n.getRootNode();
	      });
	      if (nodes.length) {
	        mutation = Object.create(mutation);
	        Object.defineProperty(mutation, 'addedNodes', {
	          value: nodes,
	          configurable: true
	        });
	        return mutation;
	      }
	    } else if (mutationInScope) {
	      return mutation;
	    }
	  }).filter(function (m) {
	    return m;
	  });
	}

/***/ },
/* 55 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var appendChild = exports.appendChild = Element.prototype.appendChild;
	var insertBefore = exports.insertBefore = Element.prototype.insertBefore;
	var removeChild = exports.removeChild = Element.prototype.removeChild;
	var setAttribute = exports.setAttribute = Element.prototype.setAttribute;
	var removeAttribute = exports.removeAttribute = Element.prototype.removeAttribute;
	var cloneNode = exports.cloneNode = Element.prototype.cloneNode;
	var importNode = exports.importNode = Document.prototype.importNode;
	var addEventListener = exports.addEventListener = Element.prototype.addEventListener;
	var removeEventListener = exports.removeEventListener = Element.prototype.removeEventListener;

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.parentNode = parentNode;
	exports.firstChild = firstChild;
	exports.lastChild = lastChild;
	exports.previousSibling = previousSibling;
	exports.nextSibling = nextSibling;
	exports.childNodes = childNodes;
	exports.parentElement = parentElement;
	exports.firstElementChild = firstElementChild;
	exports.lastElementChild = lastElementChild;
	exports.previousElementSibling = previousElementSibling;
	exports.nextElementSibling = nextElementSibling;
	exports.children = children;
	exports.innerHTML = innerHTML;
	exports.textContent = textContent;
	
	var _innerHTML = __webpack_require__(57);
	
	var nodeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
	
	var elementWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, null, false);
	
	function parentNode(node) {
	  nodeWalker.currentNode = node;
	  return nodeWalker.parentNode();
	}
	
	function firstChild(node) {
	  nodeWalker.currentNode = node;
	  return nodeWalker.firstChild();
	}
	
	function lastChild(node) {
	  nodeWalker.currentNode = node;
	  return nodeWalker.lastChild();
	}
	
	function previousSibling(node) {
	  nodeWalker.currentNode = node;
	  return nodeWalker.previousSibling();
	}
	
	function nextSibling(node) {
	  nodeWalker.currentNode = node;
	  return nodeWalker.nextSibling();
	}
	
	function childNodes(node) {
	  var nodes = [];
	  nodeWalker.currentNode = node;
	  var n = nodeWalker.firstChild();
	  while (n) {
	    nodes.push(n);
	    n = nodeWalker.nextSibling();
	  }
	  return nodes;
	}
	
	function parentElement(node) {
	  elementWalker.currentNode = node;
	  return elementWalker.parentNode();
	}
	
	function firstElementChild(node) {
	  elementWalker.currentNode = node;
	  return elementWalker.firstChild();
	}
	
	function lastElementChild(node) {
	  elementWalker.currentNode = node;
	  return elementWalker.lastChild();
	}
	
	function previousElementSibling(node) {
	  elementWalker.currentNode = node;
	  return elementWalker.previousSibling();
	}
	
	function nextElementSibling(node) {
	  elementWalker.currentNode = node;
	  return elementWalker.nextSibling();
	}
	
	function children(node) {
	  var nodes = [];
	  elementWalker.currentNode = node;
	  var n = elementWalker.firstChild();
	  while (n) {
	    nodes.push(n);
	    n = elementWalker.nextSibling();
	  }
	  return nodes;
	}
	
	function innerHTML(node) {
	  return (0, _innerHTML.getInnerHTML)(node, function (n) {
	    return childNodes(n);
	  });
	}
	
	function textContent(node) {
	  if (node.nodeType !== Node.ELEMENT_NODE) {
	    return node.nodeValue;
	  }
	  var textWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
	  var content = '',
	      n = void 0;
	  while (n = textWalker.nextNode()) {
	    // TODO(sorvell): can't use textContent since we patch it on Node.prototype!
	    // However, should probably patch it only on element.
	    content += n.nodeValue;
	  }
	  return content;
	}

/***/ },
/* 57 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	// Cribbed from ShadowDOM polyfill
	// https://github.com/webcomponents/webcomponentsjs/blob/master/src/ShadowDOM/wrappers/HTMLElement.js#L28
	/////////////////////////////////////////////////////////////////////////////
	// innerHTML and outerHTML
	
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-end.html#escapingString
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getOuterHTML = getOuterHTML;
	exports.getInnerHTML = getInnerHTML;
	var escapeAttrRegExp = /[&\u00A0"]/g;
	var escapeDataRegExp = /[&\u00A0<>]/g;
	
	function escapeReplace(c) {
	  switch (c) {
	    case '&':
	      return '&amp;';
	    case '<':
	      return '&lt;';
	    case '>':
	      return '&gt;';
	    case '"':
	      return '&quot;';
	    case '\xA0':
	      return '&nbsp;';
	  }
	}
	
	function escapeAttr(s) {
	  return s.replace(escapeAttrRegExp, escapeReplace);
	}
	
	function escapeData(s) {
	  return s.replace(escapeDataRegExp, escapeReplace);
	}
	
	function makeSet(arr) {
	  var set = {};
	  for (var i = 0; i < arr.length; i++) {
	    set[arr[i]] = true;
	  }
	  return set;
	}
	
	// http://www.whatwg.org/specs/web-apps/current-work/#void-elements
	var voidElements = makeSet(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
	
	var plaintextParents = makeSet(['style', 'script', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext', 'noscript']);
	
	function getOuterHTML(node, parentNode, composed) {
	  switch (node.nodeType) {
	    case Node.ELEMENT_NODE:
	      {
	        var tagName = node.localName;
	        var s = '<' + tagName;
	        var attrs = node.attributes;
	        for (var i = 0, attr; attr = attrs[i]; i++) {
	          s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
	        }
	        s += '>';
	        if (voidElements[tagName]) {
	          return s;
	        }
	        return s + getInnerHTML(node, composed) + '</' + tagName + '>';
	      }
	    case Node.TEXT_NODE:
	      {
	        var data = node.data;
	        if (parentNode && plaintextParents[parentNode.localName]) {
	          return data;
	        }
	        return escapeData(data);
	      }
	    case Node.COMMENT_NODE:
	      {
	        return '<!--' + node.data + '-->';
	      }
	    default:
	      {
	        window.console.error(node);
	        throw new Error('not implemented');
	      }
	  }
	}
	
	function getInnerHTML(node, composed) {
	  if (node.localName === 'template') {
	    node = node.content;
	  }
	  var s = '';
	  var c$ = composed ? composed(node) : node.childNodes;
	  for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
	    s += getOuterHTML(child, node, composed);
	  }
	  return s;
	}

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.patchBuiltins = patchBuiltins;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _logicalMutation = __webpack_require__(59);
	
	var mutation = _interopRequireWildcard(_logicalMutation);
	
	var _patchAccessors = __webpack_require__(62);
	
	var _logicalProperties = __webpack_require__(60);
	
	var _patchEvents = __webpack_require__(63);
	
	var _attachShadow2 = __webpack_require__(64);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function getAssignedSlot(node) {
	  mutation.renderRootNode(node);
	  return (0, _logicalProperties.getProperty)(node, 'assignedSlot') || null;
	}
	
	var nodeMixin = {
	
	  addEventListener: _patchEvents.addEventListener,
	
	  removeEventListener: _patchEvents.removeEventListener,
	
	  appendChild: function appendChild(node) {
	    return mutation.insertBefore(this, node);
	  },
	  insertBefore: function insertBefore(node, ref_node) {
	    return mutation.insertBefore(this, node, ref_node);
	  },
	  removeChild: function removeChild(node) {
	    return mutation.removeChild(this, node);
	  },
	  replaceChild: function replaceChild(node, ref_node) {
	    this.insertBefore(node, ref_node);
	    this.removeChild(ref_node);
	    return node;
	  },
	  cloneNode: function cloneNode(deep) {
	    return mutation.cloneNode(this, deep);
	  },
	  getRootNode: function getRootNode(options) {
	    return mutation.getRootNode(this, options);
	  },
	
	
	  get isConnected() {
	    // Fast path for distributed nodes.
	    var ownerDocument = this.ownerDocument;
	    if (ownerDocument && ownerDocument.contains && ownerDocument.contains(this)) return true;
	    var ownerDocumentElement = ownerDocument.documentElement;
	    if (ownerDocumentElement && ownerDocumentElement.contains && ownerDocumentElement.contains(this)) return true;
	
	    var node = this;
	    while (node && !(node instanceof Document)) {
	      node = node.parentNode || (node instanceof _attachShadow2.ShadyRoot ? node.host : undefined);
	    }
	    return !!(node && node instanceof Document);
	  }
	
	};
	
	// NOTE: For some reason `Text` redefines `assignedSlot`
	var textMixin = {
	  get assignedSlot() {
	    return getAssignedSlot(this);
	  }
	};
	
	var fragmentMixin = {
	
	  // TODO(sorvell): consider doing native QSA and filtering results.
	  querySelector: function querySelector(selector) {
	    // match selector and halt on first result.
	    var result = mutation.query(this, function (n) {
	      return utils.matchesSelector(n, selector);
	    }, function (n) {
	      return Boolean(n);
	    })[0];
	    return result || null;
	  },
	  querySelectorAll: function querySelectorAll(selector) {
	    return mutation.query(this, function (n) {
	      return utils.matchesSelector(n, selector);
	    });
	  }
	};
	
	var slotMixin = {
	  assignedNodes: function assignedNodes(options) {
	    if (this.localName === 'slot') {
	      mutation.renderRootNode(this);
	      return this.__shady ? (options && options.flatten ? this.__shady.distributedNodes : this.__shady.assignedNodes) || [] : [];
	    }
	  }
	};
	
	var elementMixin = utils.extendAll({
	  setAttribute: function setAttribute(name, value) {
	    mutation.setAttribute(this, name, value);
	  },
	  removeAttribute: function removeAttribute(name) {
	    mutation.removeAttribute(this, name);
	  },
	  attachShadow: function attachShadow(options) {
	    return (0, _attachShadow2.attachShadow)(this, options);
	  },
	
	
	  get slot() {
	    return this.getAttribute('slot');
	  },
	
	  set slot(value) {
	    this.setAttribute('slot', value);
	  },
	
	  get assignedSlot() {
	    return getAssignedSlot(this);
	  }
	
	}, fragmentMixin, slotMixin);
	
	Object.defineProperties(elementMixin, _patchAccessors.ShadowRootAccessor);
	
	var documentMixin = utils.extendAll({
	  importNode: function importNode(node, deep) {
	    return mutation.importNode(node, deep);
	  }
	}, fragmentMixin);
	
	Object.defineProperties(documentMixin, {
	  _activeElement: _patchAccessors.ActiveElementAccessor.activeElement
	});
	
	function patchBuiltin(proto, obj) {
	  var n$ = Object.getOwnPropertyNames(obj);
	  for (var i = 0; i < n$.length; i++) {
	    var n = n$[i];
	    var d = Object.getOwnPropertyDescriptor(obj, n);
	    // NOTE: we prefer writing directly here because some browsers
	    // have descriptors that are writable but not configurable (e.g.
	    // `appendChild` on older browsers)
	    if (d.value) {
	      proto[n] = d.value;
	    } else {
	      Object.defineProperty(proto, n, d);
	    }
	  }
	}
	
	// Apply patches to builtins (e.g. Element.prototype). Some of these patches
	// can be done unconditionally (mostly methods like
	// `Element.prototype.appendChild`) and some can only be done when the browser
	// has proper descriptors on the builtin prototype
	// (e.g. `Element.prototype.firstChild`)`. When descriptors are not available,
	// elements are individually patched when needed (see e.g.
	// `patchInside/OutsideElementAccessors` in `patch-accessors.js`).
	function patchBuiltins() {
	  // These patches can always be done, for all supported browsers.
	  patchBuiltin(window.Node.prototype, nodeMixin);
	  patchBuiltin(window.Text.prototype, textMixin);
	  patchBuiltin(window.DocumentFragment.prototype, fragmentMixin);
	  patchBuiltin(window.Element.prototype, elementMixin);
	  patchBuiltin(window.Document.prototype, documentMixin);
	  if (window.HTMLSlotElement) {
	    patchBuiltin(window.HTMLSlotElement.prototype, slotMixin);
	  }
	  // These patches can *only* be done
	  // on browsers that have proper property descriptors on builtin prototypes.
	  // This includes: IE11, Edge, Chrome >= 4?; Safari >= 10, Firefox
	  // On older browsers (Chrome <= 4?, Safari 9), a per element patching
	  // strategy is used for patching accessors.
	  if (utils.settings.hasDescriptors) {
	    (0, _patchAccessors.patchAccessors)(window.Node.prototype);
	    (0, _patchAccessors.patchAccessors)(window.Text.prototype);
	    (0, _patchAccessors.patchAccessors)(window.DocumentFragment.prototype);
	    (0, _patchAccessors.patchAccessors)(window.Element.prototype);
	    var nativeHTMLElement = window.customElements && customElements.nativeHTMLElement || HTMLElement;
	    (0, _patchAccessors.patchAccessors)(nativeHTMLElement.prototype);
	    (0, _patchAccessors.patchAccessors)(window.Document.prototype);
	    if (window.HTMLSlotElement) {
	      (0, _patchAccessors.patchAccessors)(window.HTMLSlotElement.prototype);
	    }
	  }
	}

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getRootNode = getRootNode;
	exports.query = query;
	exports.renderRootNode = renderRootNode;
	exports.setAttribute = setAttribute;
	exports.removeAttribute = removeAttribute;
	exports.insertBefore = insertBefore;
	exports.removeChild = removeChild;
	exports.cloneNode = cloneNode;
	exports.importNode = importNode;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _logicalProperties = __webpack_require__(60);
	
	var _logicalTree = __webpack_require__(61);
	
	var logicalTree = _interopRequireWildcard(_logicalTree);
	
	var _nativeMethods = __webpack_require__(55);
	
	var nativeMethods = _interopRequireWildcard(_nativeMethods);
	
	var _nativeTree = __webpack_require__(56);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	// Try to add node. Record logical info, track insertion points, perform
	// distribution iff needed. Return true if the add is handled.
	function addNode(container, node, ref_node) {
	  var ownerRoot = utils.ownerShadyRootForNode(container);
	  var ipAdded = void 0;
	  if (ownerRoot) {
	    // optimization: special insertion point tracking
	    // TODO(sorvell): verify that the renderPending check here should not be needed.
	    if (node.__noInsertionPoint && !ownerRoot._changePending) {
	      ownerRoot._skipUpdateInsertionPoints = true;
	    }
	    // note: we always need to see if an insertion point is added
	    // since this saves logical tree info; however, invalidation state
	    // needs
	    ipAdded = _maybeAddInsertionPoint(node, container, ownerRoot);
	    // invalidate insertion points IFF not already invalid!
	    if (ipAdded) {
	      ownerRoot._skipUpdateInsertionPoints = false;
	    }
	  }
	  if ((0, _logicalProperties.hasProperty)(container, 'firstChild')) {
	    logicalTree.recordInsertBefore(node, container, ref_node);
	  }
	  // if not distributing and not adding to host, do a fast path addition
	  // TODO(sorvell): revisit flow since `ipAdded` needed here if
	  // node is a fragment that has a patched QSA.
	  var handled = _maybeDistribute(node, container, ownerRoot, ipAdded) || container.shadyRoot;
	  return handled;
	}
	
	// Try to remove node: update logical info and perform distribution iff
	// needed. Return true if the removal has been handled.
	// note that it's possible for both the node's host and its parent
	// to require distribution... both cases are handled here.
	function removeNode(node) {
	  // important that we want to do this only if the node has a logical parent
	  var logicalParent = (0, _logicalProperties.hasProperty)(node, 'parentNode') && (0, _logicalProperties.getProperty)(node, 'parentNode');
	  var distributed = void 0;
	  var ownerRoot = utils.ownerShadyRootForNode(node);
	  if (logicalParent || ownerRoot) {
	    // distribute node's parent iff needed
	    distributed = maybeDistributeParent(node);
	    if (logicalParent) {
	      logicalTree.recordRemoveChild(node, logicalParent);
	    }
	    // remove node from root and distribute it iff needed
	    var removedDistributed = ownerRoot && _removeDistributedChildren(ownerRoot, node);
	    var addedInsertionPoint = logicalParent && ownerRoot && logicalParent.localName === ownerRoot.getInsertionPointTag();
	    if (removedDistributed || addedInsertionPoint) {
	      ownerRoot._skipUpdateInsertionPoints = false;
	      updateRootViaContentChange(ownerRoot);
	    }
	  }
	  _removeOwnerShadyRoot(node);
	  return distributed;
	}
	
	function _scheduleObserver(node, addedNode, removedNode) {
	  var observer = node.__shady && node.__shady.observer;
	  if (observer) {
	    if (addedNode) {
	      observer.addedNodes.push(addedNode);
	    }
	    if (removedNode) {
	      observer.removedNodes.push(removedNode);
	    }
	    observer.schedule();
	  }
	}
	
	function removeNodeFromParent(node, logicalParent) {
	  if (logicalParent) {
	    _scheduleObserver(logicalParent, null, node);
	    return removeNode(node);
	  } else {
	    // composed but not logical parent
	    if (node.parentNode) {
	      nativeMethods.removeChild.call(node.parentNode, node);
	    }
	    _removeOwnerShadyRoot(node);
	  }
	}
	
	function _hasCachedOwnerRoot(node) {
	  return Boolean(node.__ownerShadyRoot !== undefined);
	}
	
	function getRootNode(node) {
	  if (!node || !node.nodeType) {
	    return;
	  }
	  var root = node.__ownerShadyRoot;
	  if (root === undefined) {
	    if (utils.isShadyRoot(node)) {
	      root = node;
	    } else {
	      var parent = node.parentNode;
	      root = parent ? getRootNode(parent) : node;
	    }
	    // memo-ize result for performance but only memo-ize
	    // result if node is in the document. This avoids a problem where a root
	    // can be cached while an element is inside a fragment.
	    // If this happens and we cache the result, the value can become stale
	    // because for perf we avoid processing the subtree of added fragments.
	    if (document.documentElement.contains(node)) {
	      node.__ownerShadyRoot = root;
	    }
	  }
	  return root;
	}
	
	function _maybeDistribute(node, container, ownerRoot, ipAdded) {
	  // TODO(sorvell): technically we should check non-fragment nodes for
	  // <content> children but since this case is assumed to be exceedingly
	  // rare, we avoid the cost and will address with some specific api
	  // when the need arises.  For now, the user must call
	  // distributeContent(true), which updates insertion points manually
	  // and forces distribution.
	  var insertionPointTag = ownerRoot && ownerRoot.getInsertionPointTag() || '';
	  var fragContent = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noInsertionPoint && insertionPointTag && node.querySelector(insertionPointTag);
	  var wrappedContent = fragContent && fragContent.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE;
	  var hasContent = fragContent || node.localName === insertionPointTag;
	  // There are 3 possible cases where a distribution may need to occur:
	  // 1. <content> being inserted (the host of the shady root where
	  //    content is inserted needs distribution)
	  // 2. children being inserted into parent with a shady root (parent
	  //    needs distribution)
	  // 3. container is an insertionPoint
	  if (hasContent || container.localName === insertionPointTag || ipAdded) {
	    if (ownerRoot) {
	      // note, insertion point list update is handled after node
	      // mutations are complete
	      updateRootViaContentChange(ownerRoot);
	    }
	  }
	  var needsDist = _nodeNeedsDistribution(container);
	  if (needsDist) {
	    updateRootViaContentChange(container.shadyRoot);
	  }
	  // Return true when distribution will fully handle the composition
	  // Note that if a content was being inserted that was wrapped by a node,
	  // and the parent does not need distribution, return false to allow
	  // the nodes to be added directly, after which children may be
	  // distributed and composed into the wrapping node(s)
	  return needsDist || hasContent && !wrappedContent;
	}
	
	/* note: parent argument is required since node may have an out
	of date parent at this point; returns true if a <content> is being added */
	function _maybeAddInsertionPoint(node, parent, root) {
	  var added = void 0;
	  var insertionPointTag = root.getInsertionPointTag();
	  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noInsertionPoint) {
	    var c$ = node.querySelectorAll(insertionPointTag);
	    for (var i = 0, n, np, na; i < c$.length && (n = c$[i]); i++) {
	      np = n.parentNode;
	      // don't allow node's parent to be fragment itself
	      if (np === node) {
	        np = parent;
	      }
	      na = _maybeAddInsertionPoint(n, np, root);
	      added = added || na;
	    }
	  } else if (node.localName === insertionPointTag) {
	    logicalTree.recordChildNodes(parent);
	    logicalTree.recordChildNodes(node);
	    added = true;
	  }
	  return added;
	}
	
	function _nodeNeedsDistribution(node) {
	  return node && node.shadyRoot && node.shadyRoot.hasInsertionPoint();
	}
	
	function _removeDistributedChildren(root, container) {
	  var hostNeedsDist = void 0;
	  var ip$ = root._insertionPoints;
	  for (var i = 0; i < ip$.length; i++) {
	    var insertionPoint = ip$[i];
	    if (_contains(container, insertionPoint)) {
	      var dc$ = insertionPoint.assignedNodes({ flatten: true });
	      for (var j = 0; j < dc$.length; j++) {
	        hostNeedsDist = true;
	        var node = dc$[j];
	        var parent = (0, _nativeTree.parentNode)(node);
	        if (parent) {
	          nativeMethods.removeChild.call(parent, node);
	        }
	      }
	    }
	  }
	  return hostNeedsDist;
	}
	
	function _contains(container, node) {
	  while (node) {
	    if (node == container) {
	      return true;
	    }
	    node = node.parentNode;
	  }
	}
	
	function _removeOwnerShadyRoot(node) {
	  // optimization: only reset the tree if node is actually in a root
	  if (_hasCachedOwnerRoot(node)) {
	    var c$ = node.childNodes;
	    for (var i = 0, l = c$.length, n; i < l && (n = c$[i]); i++) {
	      _removeOwnerShadyRoot(n);
	    }
	  }
	  node.__ownerShadyRoot = undefined;
	}
	
	// TODO(sorvell): This will fail if distribution that affects this
	// question is pending; this is expected to be exceedingly rare, but if
	// the issue comes up, we can force a flush in this case.
	function firstComposedNode(insertionPoint) {
	  var n$ = insertionPoint.assignedNodes({ flatten: true });
	  var root = getRootNode(insertionPoint);
	  for (var i = 0, l = n$.length, n; i < l && (n = n$[i]); i++) {
	    // means that we're composed to this spot.
	    if (root.isFinalDestination(insertionPoint, n)) {
	      return n;
	    }
	  }
	}
	
	function maybeDistributeParent(node) {
	  var parent = node.parentNode;
	  if (_nodeNeedsDistribution(parent)) {
	    updateRootViaContentChange(parent.shadyRoot);
	    return true;
	  }
	}
	
	function updateRootViaContentChange(root) {
	  // mark root as mutation based on a mutation
	  root._changePending = true;
	  root.update();
	}
	
	function distributeAttributeChange(node, name) {
	  if (name === 'slot') {
	    maybeDistributeParent(node);
	  } else if (node.localName === 'slot' && name === 'name') {
	    var root = utils.ownerShadyRootForNode(node);
	    if (root) {
	      root.update();
	    }
	  }
	}
	
	// NOTE: `query` is used primarily for ShadyDOM's querySelector impl,
	// but it's also generally useful to recurse through the element tree
	// and is used by Polymer's styling system.
	function query(node, matcher, halter) {
	  var list = [];
	  _queryElements(node.childNodes, matcher, halter, list);
	  return list;
	}
	
	function _queryElements(elements, matcher, halter, list) {
	  for (var i = 0, l = elements.length, c; i < l && (c = elements[i]); i++) {
	    if (c.nodeType === Node.ELEMENT_NODE && _queryElement(c, matcher, halter, list)) {
	      return true;
	    }
	  }
	}
	
	function _queryElement(node, matcher, halter, list) {
	  var result = matcher(node);
	  if (result) {
	    list.push(node);
	  }
	  if (halter && halter(result)) {
	    return result;
	  }
	  _queryElements(node.childNodes, matcher, halter, list);
	}
	
	function renderRootNode(element) {
	  var root = element.getRootNode();
	  if (utils.isShadyRoot(root)) {
	    root.render();
	  }
	}
	
	var scopingShim = null;
	
	function setAttribute(node, attr, value) {
	  if (!scopingShim) {
	    scopingShim = window.ShadyCSS && window.ShadyCSS.ScopingShim;
	  }
	  // avoid scoping elements in non-main document to avoid template documents
	  if (scopingShim && attr === 'class' && node.ownerDocument === document) {
	    scopingShim.setElementClass(node, value);
	  } else {
	    nativeMethods.setAttribute.call(node, attr, value);
	    distributeAttributeChange(node, attr);
	  }
	}
	
	function removeAttribute(node, attr) {
	  nativeMethods.removeAttribute.call(node, attr);
	  distributeAttributeChange(node, attr);
	}
	
	// cases in which we may not be able to just do standard native call
	// 1. container has a shadyRoot (needsDistribution IFF the shadyRoot
	// has an insertion point)
	// 2. container is a shadyRoot (don't distribute, instead set
	// container to container.host.
	// 3. node is <content> (host of container needs distribution)
	function insertBefore(parent, node, ref_node) {
	  if (ref_node) {
	    var p = (0, _logicalProperties.getProperty)(ref_node, 'parentNode');
	    if (p !== undefined && p !== parent) {
	      throw Error('The ref_node to be inserted before is not a child ' + 'of this node');
	    }
	  }
	  // remove node from its current position iff it's in a tree.
	  if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
	    var _parent = (0, _logicalProperties.getProperty)(node, 'parentNode');
	    removeNodeFromParent(node, _parent);
	  }
	  if (!addNode(parent, node, ref_node)) {
	    if (ref_node) {
	      // if ref_node is an insertion point replace with first distributed node
	      var root = utils.ownerShadyRootForNode(ref_node);
	      if (root) {
	        ref_node = ref_node.localName === root.getInsertionPointTag() ? firstComposedNode(ref_node) : ref_node;
	      }
	    }
	    // if adding to a shadyRoot, add to host instead
	    var container = utils.isShadyRoot(parent) ? parent.host : parent;
	    if (ref_node) {
	      nativeMethods.insertBefore.call(container, node, ref_node);
	    } else {
	      nativeMethods.appendChild.call(container, node);
	    }
	  }
	  _scheduleObserver(parent, node);
	  return node;
	}
	
	/**
	  Removes the given `node` from the element's `lightChildren`.
	  This method also performs dom composition.
	*/
	function removeChild(parent, node) {
	  if (node.parentNode !== parent) {
	    throw Error('The node to be removed is not a child of this node: ' + node);
	  }
	  if (!removeNode(node)) {
	    // if removing from a shadyRoot, remove form host instead
	    var container = utils.isShadyRoot(parent) ? parent.host : parent;
	    // not guaranteed to physically be in container; e.g.
	    // undistributed nodes.
	    var nativeParent = (0, _nativeTree.parentNode)(node);
	    if (container === nativeParent) {
	      nativeMethods.removeChild.call(container, node);
	    }
	  }
	  _scheduleObserver(parent, null, node);
	  return node;
	}
	
	function cloneNode(node, deep) {
	  if (node.localName == 'template') {
	    return nativeMethods.cloneNode.call(node, deep);
	  } else {
	    var n = nativeMethods.cloneNode.call(node, false);
	    if (deep) {
	      var c$ = node.childNodes;
	      for (var i = 0, nc; i < c$.length; i++) {
	        nc = c$[i].cloneNode(true);
	        n.appendChild(nc);
	      }
	    }
	    return n;
	  }
	}
	
	// note: Though not technically correct, we fast path `importNode`
	// when called on a node not owned by the main document.
	// This allows, for example, elements that cannot
	// contain custom elements and are therefore not likely to contain shadowRoots
	// to cloned natively. This is a fairly significant performance win.
	function importNode(node, deep) {
	  if (node.ownerDocument !== document) {
	    return nativeMethods.importNode.call(document, node, deep);
	  }
	  var n = nativeMethods.importNode.call(document, node, false);
	  if (deep) {
	    var c$ = node.childNodes;
	    for (var i = 0, nc; i < c$.length; i++) {
	      nc = importNode(c$[i], true);
	      n.appendChild(nc);
	    }
	  }
	  return n;
	}

/***/ },
/* 60 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getProperty = getProperty;
	exports.hasProperty = hasProperty;
	function getProperty(node, prop) {
	  return node.__shady && node.__shady[prop];
	}
	
	function hasProperty(node, prop) {
	  return getProperty(node, prop) !== undefined;
	}

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.recordChildNodes = undefined;
	exports.recordInsertBefore = recordInsertBefore;
	exports.recordRemoveChild = recordRemoveChild;
	
	var _logicalProperties = __webpack_require__(60);
	
	var _patchAccessors = __webpack_require__(62);
	
	var _nativeTree = __webpack_require__(56);
	
	function recordInsertBefore(node, container, ref_node) {
	  (0, _patchAccessors.patchInsideElementAccessors)(container);
	  container.__shady = container.__shady || {};
	  if ((0, _logicalProperties.hasProperty)(container, 'firstChild')) {
	    container.__shady.childNodes = null;
	  }
	  // handle document fragments
	  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
	    var c$ = node.childNodes;
	    for (var i = 0; i < c$.length; i++) {
	      linkNode(c$[i], container, ref_node);
	    }
	    // cleanup logical dom in doc fragment.
	    node.__shady = node.__shady || {};
	    var resetTo = (0, _logicalProperties.hasProperty)(node, 'firstChild') ? null : undefined;
	    node.__shady.firstChild = node.__shady.lastChild = resetTo;
	    node.__shady.childNodes = resetTo;
	  } else {
	    linkNode(node, container, ref_node);
	  }
	}
	
	function linkNode(node, container, ref_node) {
	  (0, _patchAccessors.patchOutsideElementAccessors)(node);
	  ref_node = ref_node || null;
	  node.__shady = node.__shady || {};
	  container.__shady = container.__shady || {};
	  if (ref_node) {
	    ref_node.__shady = ref_node.__shady || {};
	  }
	  // update ref_node.previousSibling <-> node
	  node.__shady.previousSibling = ref_node ? ref_node.__shady.previousSibling : container.lastChild;
	  var ps = node.__shady.previousSibling;
	  if (ps && ps.__shady) {
	    ps.__shady.nextSibling = node;
	  }
	  // update node <-> ref_node
	  var ns = node.__shady.nextSibling = ref_node;
	  if (ns && ns.__shady) {
	    ns.__shady.previousSibling = node;
	  }
	  // update node <-> container
	  node.__shady.parentNode = container;
	  if (ref_node) {
	    if (ref_node === container.__shady.firstChild) {
	      container.__shady.firstChild = node;
	    }
	  } else {
	    container.__shady.lastChild = node;
	    if (!container.__shady.firstChild) {
	      container.__shady.firstChild = node;
	    }
	  }
	  // remove caching of childNodes
	  container.__shady.childNodes = null;
	}
	
	function recordRemoveChild(node, container) {
	  node.__shady = node.__shady || {};
	  container.__shady = container.__shady || {};
	  if (node === container.__shady.firstChild) {
	    container.__shady.firstChild = node.__shady.nextSibling;
	  }
	  if (node === container.__shady.lastChild) {
	    container.__shady.lastChild = node.__shady.previousSibling;
	  }
	  var p = node.__shady.previousSibling;
	  var n = node.__shady.nextSibling;
	  if (p) {
	    p.__shady = p.__shady || {};
	    p.__shady.nextSibling = n;
	  }
	  if (n) {
	    n.__shady = n.__shady || {};
	    n.__shady.previousSibling = p;
	  }
	  // When an element is removed, logical data is no longer tracked.
	  // Explicitly set `undefined` here to indicate this. This is disginguished
	  // from `null` which is set if info is null.
	  node.__shady.parentNode = node.__shady.previousSibling = node.__shady.nextSibling = undefined;
	  if ((0, _logicalProperties.hasProperty)(container, 'childNodes')) {
	    // remove caching of childNodes
	    container.__shady.childNodes = null;
	  }
	}
	
	var recordChildNodes = exports.recordChildNodes = function recordChildNodes(node) {
	  if (!(0, _logicalProperties.hasProperty)(node, 'firstChild')) {
	    node.__shady = node.__shady || {};
	    node.__shady.firstChild = (0, _nativeTree.firstChild)(node);
	    node.__shady.lastChild = (0, _nativeTree.lastChild)(node);
	    (0, _patchAccessors.patchInsideElementAccessors)(node);
	    var c$ = node.__shady.childNodes = (0, _nativeTree.childNodes)(node);
	    for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
	      n.__shady = n.__shady || {};
	      n.__shady.parentNode = node;
	      n.__shady.nextSibling = c$[i + 1] || null;
	      n.__shady.previousSibling = c$[i - 1] || null;
	      (0, _patchAccessors.patchOutsideElementAccessors)(n);
	    }
	  }
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.patchInsideElementAccessors = exports.patchOutsideElementAccessors = exports.ActiveElementAccessor = exports.ShadowRootAccessor = undefined;
	exports.patchAccessors = patchAccessors;
	exports.patchShadowRootAccessors = patchShadowRootAccessors;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _innerHTML = __webpack_require__(57);
	
	var _logicalProperties = __webpack_require__(60);
	
	var _nativeTree = __webpack_require__(56);
	
	var nativeTree = _interopRequireWildcard(_nativeTree);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function generateSimpleDescriptor(prop) {
	  return {
	    get: function get() {
	      var l = (0, _logicalProperties.getProperty)(this, prop);
	      return l !== undefined ? l : nativeTree[prop](this);
	    },
	
	    configurable: true
	  };
	}
	
	function clearNode(node) {
	  while (node.firstChild) {
	    node.removeChild(node.firstChild);
	  }
	}
	
	var nativeInnerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') || Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
	
	var inertDoc = document.implementation.createHTMLDocument('inert');
	var htmlContainer = inertDoc.createElement('div');
	
	var nativeActiveElementDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement');
	function getDocumentActiveElement() {
	  if (nativeActiveElementDescriptor && nativeActiveElementDescriptor.get) {
	    return nativeActiveElementDescriptor.get.call(document);
	  } else if (!utils.settings.hasDescriptors) {
	    return document.activeElement;
	  }
	}
	
	function activeElementForNode(node) {
	  var active = getDocumentActiveElement();
	  // In IE11, activeElement might be an empty object if the document is
	  // contained in an iframe.
	  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10998788/
	  if (!active || !active.nodeType) {
	    return null;
	  }
	  var isShadyRoot = !!utils.isShadyRoot(node);
	  if (node !== document) {
	    // If this node isn't a document or shady root, then it doesn't have
	    // an active element.
	    if (!isShadyRoot) {
	      return null;
	    }
	    // If this shady root's host is the active element or the active
	    // element is not a descendant of the host (in the composed tree),
	    // then it doesn't have an active element.
	    if (node.host === active || !node.host.contains(active)) {
	      return null;
	    }
	  }
	  // This node is either the document or a shady root of which the active
	  // element is a (composed) descendant of its host; iterate upwards to
	  // find the active element's most shallow host within it.
	  var activeRoot = utils.ownerShadyRootForNode(active);
	  while (activeRoot && activeRoot !== node) {
	    active = activeRoot.host;
	    activeRoot = utils.ownerShadyRootForNode(active);
	  }
	  if (node === document) {
	    // This node is the document, so activeRoot should be null.
	    return activeRoot ? null : active;
	  } else {
	    // This node is a non-document shady root, and it should be
	    // activeRoot.
	    return activeRoot === node ? active : null;
	  }
	}
	
	var OutsideAccessors = {
	  // node...
	  parentElement: generateSimpleDescriptor('parentElement'),
	
	  parentNode: generateSimpleDescriptor('parentNode'),
	
	  nextSibling: generateSimpleDescriptor('nextSibling'),
	
	  previousSibling: generateSimpleDescriptor('previousSibling'),
	
	  className: {
	    get: function get() {
	      return this.getAttribute('class');
	    },
	    set: function set(value) {
	      this.setAttribute('class', value);
	    },
	
	    configurable: true
	  },
	
	  // fragment, element, document
	  nextElementSibling: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'nextSibling')) {
	        var n = this.nextSibling;
	        while (n && n.nodeType !== Node.ELEMENT_NODE) {
	          n = n.nextSibling;
	        }
	        return n;
	      } else {
	        return nativeTree.nextElementSibling(this);
	      }
	    },
	
	    configurable: true
	  },
	
	  previousElementSibling: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'previousSibling')) {
	        var n = this.previousSibling;
	        while (n && n.nodeType !== Node.ELEMENT_NODE) {
	          n = n.previousSibling;
	        }
	        return n;
	      } else {
	        return nativeTree.previousElementSibling(this);
	      }
	    },
	
	    configurable: true
	  }
	
	};
	
	var InsideAccessors = {
	
	  childNodes: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'firstChild')) {
	        if (!this.__shady.childNodes) {
	          this.__shady.childNodes = [];
	          for (var n = this.firstChild; n; n = n.nextSibling) {
	            this.__shady.childNodes.push(n);
	          }
	        }
	        return this.__shady.childNodes;
	      } else {
	        return nativeTree.childNodes(this);
	      }
	    },
	
	    configurable: true
	  },
	
	  firstChild: generateSimpleDescriptor('firstChild'),
	
	  lastChild: generateSimpleDescriptor('lastChild'),
	
	  textContent: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'firstChild')) {
	        var tc = [];
	        for (var i = 0, cn = this.childNodes, c; c = cn[i]; i++) {
	          if (c.nodeType !== Node.COMMENT_NODE) {
	            tc.push(c.textContent);
	          }
	        }
	        return tc.join('');
	      } else {
	        return nativeTree.textContent(this);
	      }
	    },
	    set: function set(text) {
	      if (this.nodeType !== Node.ELEMENT_NODE) {
	        // TODO(sorvell): can't do this if patch nodeValue.
	        this.nodeValue = text;
	      } else {
	        clearNode(this);
	        if (text) {
	          this.appendChild(document.createTextNode(text));
	        }
	      }
	    },
	
	    configurable: true
	  },
	
	  // fragment, element, document
	  firstElementChild: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'firstChild')) {
	        var n = this.firstChild;
	        while (n && n.nodeType !== Node.ELEMENT_NODE) {
	          n = n.nextSibling;
	        }
	        return n;
	      } else {
	        return nativeTree.firstElementChild(this);
	      }
	    },
	
	    configurable: true
	  },
	
	  lastElementChild: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'lastChild')) {
	        var n = this.lastChild;
	        while (n && n.nodeType !== Node.ELEMENT_NODE) {
	          n = n.previousSibling;
	        }
	        return n;
	      } else {
	        return nativeTree.lastElementChild(this);
	      }
	    },
	
	    configurable: true
	  },
	
	  children: {
	    get: function get() {
	      if ((0, _logicalProperties.hasProperty)(this, 'firstChild')) {
	        return Array.prototype.filter.call(this.childNodes, function (n) {
	          return n.nodeType === Node.ELEMENT_NODE;
	        });
	      } else {
	        return nativeTree.children(this);
	      }
	    },
	
	    configurable: true
	  },
	
	  // element (HTMLElement on IE11)
	  innerHTML: {
	    get: function get() {
	      var content = this.localName === 'template' ? this.content : this;
	      if ((0, _logicalProperties.hasProperty)(this, 'firstChild')) {
	        return (0, _innerHTML.getInnerHTML)(content);
	      } else {
	        return nativeTree.innerHTML(content);
	      }
	    },
	    set: function set(text) {
	      var content = this.localName === 'template' ? this.content : this;
	      clearNode(content);
	      if (nativeInnerHTMLDesc && nativeInnerHTMLDesc.set) {
	        nativeInnerHTMLDesc.set.call(htmlContainer, text);
	      } else {
	        htmlContainer.innerHTML = text;
	      }
	      while (htmlContainer.firstChild) {
	        content.appendChild(htmlContainer.firstChild);
	      }
	    },
	
	    configurable: true
	  }
	
	};
	
	// Note: Can be patched on element prototype on all browsers.
	// Must be patched on instance on browsers that support native Shadow DOM
	// but do not have builtin accessors (old Chrome).
	var ShadowRootAccessor = exports.ShadowRootAccessor = {
	  shadowRoot: {
	    get: function get() {
	      return this.shadyRoot;
	    },
	    set: function set(value) {
	      this.shadyRoot = value;
	    },
	
	    configurable: true
	  }
	};
	
	// Note: Can be patched on document prototype on browsers with builtin accessors.
	// Must be patched separately on simulated ShadowRoot.
	// Must be patched as `_activeElement` on browsers without builtin accessors.
	var ActiveElementAccessor = exports.ActiveElementAccessor = {
	
	  activeElement: {
	    get: function get() {
	      return activeElementForNode(this);
	    },
	    set: function set() {},
	
	    configurable: true
	  }
	
	};
	
	// patch a group of descriptors on an object only if it exists or if the `force`
	// argument is true.
	function patchAccessorGroup(obj, descriptors, force) {
	  for (var p in descriptors) {
	    var objDesc = Object.getOwnPropertyDescriptor(obj, p);
	    if (objDesc && objDesc.configurable || !objDesc && force) {
	      Object.defineProperty(obj, p, descriptors[p]);
	    } else if (force) {
	      console.warn('Could not define', p, 'on', obj);
	    }
	  }
	}
	
	// patch dom accessors on proto where they exist
	function patchAccessors(proto) {
	  patchAccessorGroup(proto, OutsideAccessors);
	  patchAccessorGroup(proto, InsideAccessors);
	  patchAccessorGroup(proto, ActiveElementAccessor);
	}
	
	// ensure element descriptors (IE/Edge don't have em)
	function patchShadowRootAccessors(proto) {
	  patchAccessorGroup(proto, InsideAccessors, true);
	  patchAccessorGroup(proto, ActiveElementAccessor, true);
	}
	
	// ensure an element has patched "outside" accessors; no-op when not needed
	var patchOutsideElementAccessors = exports.patchOutsideElementAccessors = utils.settings.hasDescriptors ? function () {} : function (element) {
	  if (!(element.__shady && element.__shady.__outsideAccessors)) {
	    element.__shady = element.__shady || {};
	    element.__shady.__outsideAccessors = true;
	    patchAccessorGroup(element, OutsideAccessors, true);
	  }
	};
	
	// ensure an element has patched "inside" accessors; no-op when not needed
	var patchInsideElementAccessors = exports.patchInsideElementAccessors = utils.settings.hasDescriptors ? function () {} : function (element) {
	  if (!(element.__shady && element.__shady.__insideAccessors)) {
	    element.__shady = element.__shady || {};
	    element.__shady.__insideAccessors = true;
	    patchAccessorGroup(element, InsideAccessors, true);
	    patchAccessorGroup(element, ShadowRootAccessor, true);
	  }
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.addEventListener = addEventListener;
	exports.removeEventListener = removeEventListener;
	exports.patchEvents = patchEvents;
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _nativeMethods = __webpack_require__(55);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	// https://github.com/w3c/webcomponents/issues/513#issuecomment-224183937
	var alwaysComposed = {
	  blur: true,
	  focus: true,
	  focusin: true,
	  focusout: true,
	  click: true,
	  dblclick: true,
	  mousedown: true,
	  mouseenter: true,
	  mouseleave: true,
	  mousemove: true,
	  mouseout: true,
	  mouseover: true,
	  mouseup: true,
	  wheel: true,
	  beforeinput: true,
	  input: true,
	  keydown: true,
	  keyup: true,
	  compositionstart: true,
	  compositionupdate: true,
	  compositionend: true,
	  touchstart: true,
	  touchend: true,
	  touchmove: true,
	  touchcancel: true,
	  pointerover: true,
	  pointerenter: true,
	  pointerdown: true,
	  pointermove: true,
	  pointerup: true,
	  pointercancel: true,
	  pointerout: true,
	  pointerleave: true,
	  gotpointercapture: true,
	  lostpointercapture: true,
	  dragstart: true,
	  drag: true,
	  dragenter: true,
	  dragleave: true,
	  dragover: true,
	  drop: true,
	  dragend: true,
	  DOMActivate: true,
	  DOMFocusIn: true,
	  DOMFocusOut: true,
	  keypress: true
	};
	
	function pathComposer(startNode, composed) {
	  var composedPath = [];
	  var current = startNode;
	  var startRoot = startNode === window ? window : startNode.getRootNode();
	  while (current) {
	    composedPath.push(current);
	    if (current.assignedSlot) {
	      current = current.assignedSlot;
	    } else if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE && current.host && (composed || current !== startRoot)) {
	      current = current.host;
	    } else {
	      current = current.parentNode;
	    }
	  }
	  // event composedPath includes window when startNode's ownerRoot is document
	  if (composedPath[composedPath.length - 1] === document) {
	    composedPath.push(window);
	  }
	  return composedPath;
	}
	
	function retarget(refNode, path) {
	  if (!utils.isShadyRoot) {
	    return refNode;
	  }
	  // If ANCESTOR's root is not a shadow root or ANCESTOR's root is BASE's
	  // shadow-including inclusive ancestor, return ANCESTOR.
	  var refNodePath = pathComposer(refNode, true);
	  var p$ = path;
	  for (var i = 0, ancestor, lastRoot, root, rootIdx; i < p$.length; i++) {
	    ancestor = p$[i];
	    root = ancestor === window ? window : ancestor.getRootNode();
	    if (root !== lastRoot) {
	      rootIdx = refNodePath.indexOf(root);
	      lastRoot = root;
	    }
	    if (!utils.isShadyRoot(root) || rootIdx > -1) {
	      return ancestor;
	    }
	  }
	}
	
	var eventMixin = {
	
	  get composed() {
	    if (this.isTrusted && this.__composed === undefined) {
	      this.__composed = alwaysComposed[this.type];
	    }
	    return this.__composed || false;
	  },
	
	  composedPath: function composedPath() {
	    if (!this.__composedPath) {
	      this.__composedPath = pathComposer(this.__target, this.composed);
	    }
	    return this.__composedPath;
	  },
	
	
	  get target() {
	    return retarget(this.currentTarget, this.composedPath());
	  },
	
	  // http://w3c.github.io/webcomponents/spec/shadow/#event-relatedtarget-retargeting
	  get relatedTarget() {
	    if (!this.__relatedTarget) {
	      return null;
	    }
	    if (!this.__relatedTargetComposedPath) {
	      this.__relatedTargetComposedPath = pathComposer(this.__relatedTarget, true);
	    }
	    // find the deepest node in relatedTarget composed path that is in the same root with the currentTarget
	    return retarget(this.currentTarget, this.__relatedTargetComposedPath);
	  },
	  stopPropagation: function stopPropagation() {
	    Event.prototype.stopPropagation.call(this);
	    this.__propagationStopped = true;
	  },
	  stopImmediatePropagation: function stopImmediatePropagation() {
	    Event.prototype.stopImmediatePropagation.call(this);
	    this.__immediatePropagationStopped = true;
	    this.__propagationStopped = true;
	  }
	};
	
	function mixinComposedFlag(Base) {
	  // NOTE: avoiding use of `class` here so that transpiled output does not
	  // try to do `Base.call` with a dom construtor.
	  var klazz = function klazz(type, options) {
	    var event = new Base(type, options);
	    event.__composed = options && Boolean(options.composed);
	    return event;
	  };
	  // put constructor properties on subclass
	  utils.mixin(klazz, Base);
	  klazz.prototype = Base.prototype;
	  return klazz;
	}
	
	var nonBubblingEventsToRetarget = {
	  focus: true,
	  blur: true
	};
	
	function fireHandlers(event, node, phase) {
	  var hs = node.__handlers && node.__handlers[event.type] && node.__handlers[event.type][phase];
	  if (hs) {
	    for (var i = 0, fn; fn = hs[i]; i++) {
	      fn.call(node, event);
	      if (event.__immediatePropagationStopped) {
	        return;
	      }
	    }
	  }
	}
	
	function retargetNonBubblingEvent(e) {
	  var path = e.composedPath();
	  var node = void 0;
	  // override `currentTarget` to let patched `target` calculate correctly
	  Object.defineProperty(e, 'currentTarget', {
	    get: function get() {
	      return node;
	    },
	    configurable: true
	  });
	  for (var i = path.length - 1; i >= 0; i--) {
	    node = path[i];
	    // capture phase fires all capture handlers
	    fireHandlers(e, node, 'capture');
	    if (e.__propagationStopped) {
	      return;
	    }
	  }
	
	  // set the event phase to `AT_TARGET` as in spec
	  Object.defineProperty(e, 'eventPhase', { value: Event.AT_TARGET });
	
	  // the event only needs to be fired when owner roots change when iterating the event path
	  // keep track of the last seen owner root
	  var lastFiredRoot = void 0;
	  for (var _i = 0; _i < path.length; _i++) {
	    node = path[_i];
	    if (_i === 0 || node.shadowRoot && node.shadowRoot === lastFiredRoot) {
	      fireHandlers(e, node, 'bubble');
	      // don't bother with window, it doesn't have `getRootNode` and will be last in the path anyway
	      if (node !== window) {
	        lastFiredRoot = node.getRootNode();
	      }
	      if (e.__propagationStopped) {
	        return;
	      }
	    }
	  }
	}
	
	function addEventListener(type, fn, optionsOrCapture) {
	  if (!fn) {
	    return;
	  }
	
	  // The callback `fn` might be used for multiple nodes/events. Since we generate
	  // a wrapper function, we need to keep track of it when we remove the listener.
	  // It's more efficient to store the node/type/options information as Array in
	  // `fn` itself rather than the node (we assume that the same callback is used
	  // for few nodes at most, whereas a node will likely have many event listeners).
	  // NOTE(valdrin) invoking external functions is costly, inline has better perf.
	  var capture = void 0,
	      once = void 0,
	      passive = void 0;
	  if ((typeof optionsOrCapture === 'undefined' ? 'undefined' : _typeof(optionsOrCapture)) === 'object') {
	    capture = Boolean(optionsOrCapture.capture);
	    once = Boolean(optionsOrCapture.once);
	    passive = Boolean(optionsOrCapture.passive);
	  } else {
	    capture = Boolean(optionsOrCapture);
	    once = false;
	    passive = false;
	  }
	  if (fn.__eventWrappers) {
	    // Stop if the wrapper function has already been created.
	    for (var i = 0; i < fn.__eventWrappers.length; i++) {
	      if (fn.__eventWrappers[i].node === this && fn.__eventWrappers[i].type === type && fn.__eventWrappers[i].capture === capture && fn.__eventWrappers[i].once === once && fn.__eventWrappers[i].passive === passive) {
	        return;
	      }
	    }
	  } else {
	    fn.__eventWrappers = [];
	  }
	
	  var wrapperFn = function wrapperFn(e) {
	    // Support `once` option.
	    if (once) {
	      this.removeEventListener(type, fn, optionsOrCapture);
	    }
	    if (!e.__target) {
	      patchEvent(e);
	    }
	    // There are two critera that should stop events from firing on this node
	    // 1. the event is not composed and the current node is not in the same root as the target
	    // 2. when bubbling, if after retargeting, relatedTarget and target point to the same node
	    if (e.composed || e.composedPath().indexOf(this) > -1) {
	      if (e.eventPhase === Event.BUBBLING_PHASE) {
	        if (e.target === e.relatedTarget) {
	          e.stopImmediatePropagation();
	          return;
	        }
	      }
	      return fn(e);
	    }
	  };
	  // Store the wrapper information.
	  fn.__eventWrappers.push({
	    node: this,
	    type: type,
	    capture: capture,
	    once: once,
	    passive: passive,
	    wrapperFn: wrapperFn
	  });
	
	  if (nonBubblingEventsToRetarget[type]) {
	    this.__handlers = this.__handlers || {};
	    this.__handlers[type] = this.__handlers[type] || { capture: [], bubble: [] };
	    this.__handlers[type][capture ? 'capture' : 'bubble'].push(wrapperFn);
	  } else {
	    _nativeMethods.addEventListener.call(this, type, wrapperFn, optionsOrCapture);
	  }
	}
	
	function removeEventListener(type, fn, optionsOrCapture) {
	  if (!fn) {
	    return;
	  }
	
	  // NOTE(valdrin) invoking external functions is costly, inline has better perf.
	  var capture = void 0,
	      once = void 0,
	      passive = void 0;
	  if ((typeof optionsOrCapture === 'undefined' ? 'undefined' : _typeof(optionsOrCapture)) === 'object') {
	    capture = Boolean(optionsOrCapture.capture);
	    once = Boolean(optionsOrCapture.once);
	    passive = Boolean(optionsOrCapture.passive);
	  } else {
	    capture = Boolean(optionsOrCapture);
	    once = false;
	    passive = false;
	  }
	  // Search the wrapped function.
	  var wrapperFn = undefined;
	  if (fn.__eventWrappers) {
	    for (var i = 0; i < fn.__eventWrappers.length; i++) {
	      if (fn.__eventWrappers[i].node === this && fn.__eventWrappers[i].type === type && fn.__eventWrappers[i].capture === capture && fn.__eventWrappers[i].once === once && fn.__eventWrappers[i].passive === passive) {
	        wrapperFn = fn.__eventWrappers.splice(i, 1)[0].wrapperFn;
	        // Cleanup.
	        if (!fn.__eventWrappers.length) {
	          fn.__eventWrappers = undefined;
	        }
	        break;
	      }
	    }
	  }
	
	  _nativeMethods.removeEventListener.call(this, type, wrapperFn || fn, optionsOrCapture);
	  if (wrapperFn && nonBubblingEventsToRetarget[type] && this.__handlers && this.__handlers[type]) {
	    var arr = this.__handlers[type][capture ? 'capture' : 'bubble'];
	    var idx = arr.indexOf(wrapperFn);
	    if (idx > -1) {
	      arr.splice(idx, 1);
	    }
	  }
	}
	
	function activateFocusEventOverrides() {
	  for (var ev in nonBubblingEventsToRetarget) {
	    window.addEventListener(ev, function (e) {
	      if (!e.__target) {
	        patchEvent(e);
	        retargetNonBubblingEvent(e);
	        e.stopImmediatePropagation();
	      }
	    }, true);
	  }
	}
	
	function patchEvent(event) {
	  event.__target = event.target;
	  event.__relatedTarget = event.relatedTarget;
	  // patch event prototype if we can
	  if (utils.settings.hasDescriptors) {
	    utils.patchPrototype(event, eventMixin);
	    // and fallback to patching instance
	  } else {
	    utils.extend(event, eventMixin);
	  }
	}
	
	var PatchedEvent = mixinComposedFlag(window.Event);
	var PatchedCustomEvent = mixinComposedFlag(window.CustomEvent);
	var PatchedMouseEvent = mixinComposedFlag(window.MouseEvent);
	
	function patchEvents() {
	  window.Event = PatchedEvent;
	  window.CustomEvent = PatchedCustomEvent;
	  window.MouseEvent = PatchedMouseEvent;
	  activateFocusEventOverrides();
	}

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ShadyRoot = undefined;
	exports.attachShadow = attachShadow;
	
	var _arraySplice = __webpack_require__(65);
	
	var _utils = __webpack_require__(52);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _flush = __webpack_require__(53);
	
	var _logicalTree = __webpack_require__(61);
	
	var _nativeMethods = __webpack_require__(55);
	
	var _nativeTree = __webpack_require__(56);
	
	var _patchAccessors = __webpack_require__(62);
	
	var _distributor = __webpack_require__(66);
	
	var _distributor2 = _interopRequireDefault(_distributor);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	// Do not export this object. It must be passed as the first argument to the
	// ShadyRoot constructor in `attachShadow` to prevent the constructor from
	// throwing. This prevents the user from being able to manually construct a
	// ShadyRoot (i.e. `new ShadowRoot()`).
	var ShadyRootConstructionToken = {};
	
	var ShadyRoot = exports.ShadyRoot = function ShadyRoot(token, host) {
	  if (token !== ShadyRootConstructionToken) {
	    throw new TypeError('Illegal constructor');
	  }
	  // NOTE: this strange construction is necessary because
	  // DocumentFragment cannot be subclassed on older browsers.
	  var shadowRoot = document.createDocumentFragment();
	  shadowRoot.__proto__ = ShadyRoot.prototype;
	  shadowRoot._init(host);
	  return shadowRoot;
	};
	
	ShadyRoot.prototype = Object.create(DocumentFragment.prototype);
	utils.extendAll(ShadyRoot.prototype, {
	  _init: function _init(host) {
	    // NOTE: set a fake local name so this element can be
	    // distinguished from a DocumentFragment when patching.
	    // FF doesn't allow this to be `localName`
	    this.__localName = 'ShadyRoot';
	    // logical dom setup
	    (0, _logicalTree.recordChildNodes)(host);
	    (0, _logicalTree.recordChildNodes)(this);
	    // root <=> host
	    host.shadowRoot = this;
	    this.host = host;
	    // state flags
	    this._renderPending = false;
	    this._hasRendered = false;
	    this._changePending = false;
	    this._distributor = new _distributor2.default(this);
	    this.update();
	  },
	
	
	  // async render
	  update: function update() {
	    var _this = this;
	
	    if (!this._renderPending) {
	      this._renderPending = true;
	      (0, _flush.enqueue)(function () {
	        return _this.render();
	      });
	    }
	  },
	
	
	  // returns the oldest renderPending ancestor root.
	  _getRenderRoot: function _getRenderRoot() {
	    var renderRoot = this;
	    var root = this;
	    while (root) {
	      if (root._renderPending) {
	        renderRoot = root;
	      }
	      root = root._rendererForHost();
	    }
	    return renderRoot;
	  },
	
	
	  // Returns the shadyRoot `this.host` if `this.host`
	  // has children that require distribution.
	  _rendererForHost: function _rendererForHost() {
	    var root = this.host.getRootNode();
	    if (utils.isShadyRoot(root)) {
	      var c$ = this.host.childNodes;
	      for (var i = 0, c; i < c$.length; i++) {
	        c = c$[i];
	        if (this._distributor.isInsertionPoint(c)) {
	          return root;
	        }
	      }
	    }
	  },
	  render: function render() {
	    if (this._renderPending) {
	      this._getRenderRoot()._render();
	    }
	  },
	  _render: function _render() {
	    this._renderPending = false;
	    this._changePending = false;
	    if (!this._skipUpdateInsertionPoints) {
	      this.updateInsertionPoints();
	    } else if (!this._hasRendered) {
	      this._insertionPoints = [];
	    }
	    this._skipUpdateInsertionPoints = false;
	    // TODO(sorvell): can add a first render optimization here
	    // to use if there are no insertion points
	    // 1. clear host node of composed children
	    // 2. appendChild the shadowRoot itself or (more robust) its logical children
	    // NOTE: this didn't seem worth it in perf testing
	    // but not ready to delete this info.
	    // logical
	    this.distribute();
	    // physical
	    this.compose();
	    this._hasRendered = true;
	  },
	  forceRender: function forceRender() {
	    this._renderPending = true;
	    this.render();
	  },
	  distribute: function distribute() {
	    var dirtyRoots = this._distributor.distribute();
	    for (var i = 0; i < dirtyRoots.length; i++) {
	      dirtyRoots[i]._render();
	    }
	  },
	  updateInsertionPoints: function updateInsertionPoints() {
	    var i$ = this.__insertionPoints;
	    // if any insertion points have been removed, clear their distribution info
	    if (i$) {
	      for (var i = 0, c; i < i$.length; i++) {
	        c = i$[i];
	        if (c.getRootNode() !== this) {
	          this._distributor.clearAssignedSlots(c);
	        }
	      }
	    }
	    i$ = this._insertionPoints = this._distributor.getInsertionPoints();
	    // ensure insertionPoints's and their parents have logical dom info.
	    // save logical tree info
	    // a. for shadyRoot
	    // b. for insertion points (fallback)
	    // c. for parents of insertion points
	    for (var _i = 0, _c; _i < i$.length; _i++) {
	      _c = i$[_i];
	      _c.__shady = _c.__shady || {};
	      (0, _logicalTree.recordChildNodes)(_c);
	      (0, _logicalTree.recordChildNodes)(_c.parentNode);
	    }
	  },
	
	
	  get _insertionPoints() {
	    if (!this.__insertionPoints) {
	      this.updateInsertionPoints();
	    }
	    return this.__insertionPoints || (this.__insertionPoints = []);
	  },
	
	  set _insertionPoints(insertionPoints) {
	    this.__insertionPoints = insertionPoints;
	  },
	
	  hasInsertionPoint: function hasInsertionPoint() {
	    return this._distributor.hasInsertionPoint();
	  },
	  compose: function compose() {
	    // compose self
	    // note: it's important to mark this clean before distribution
	    // so that attachment that provokes additional distribution (e.g.
	    // adding something to your parentNode) works
	    this._composeTree();
	    // TODO(sorvell): See fast paths here in Polymer v1
	    // (these seem unnecessary)
	  },
	
	
	  // Reify dom such that it is at its correct rendering position
	  // based on logical distribution.
	  _composeTree: function _composeTree() {
	    this._updateChildNodes(this.host, this._composeNode(this.host));
	    var p$ = this._insertionPoints || [];
	    for (var i = 0, l = p$.length, p, parent; i < l && (p = p$[i]); i++) {
	      parent = p.parentNode;
	      if (parent !== this.host && parent !== this) {
	        this._updateChildNodes(parent, this._composeNode(parent));
	      }
	    }
	  },
	
	
	  // Returns the list of nodes which should be rendered inside `node`.
	  _composeNode: function _composeNode(node) {
	    var children = [];
	    var c$ = (node.shadyRoot || node).childNodes;
	    for (var i = 0; i < c$.length; i++) {
	      var child = c$[i];
	      if (this._distributor.isInsertionPoint(child)) {
	        var distributedNodes = child.__shady.distributedNodes || (child.__shady.distributedNodes = []);
	        for (var j = 0; j < distributedNodes.length; j++) {
	          var distributedNode = distributedNodes[j];
	          if (this.isFinalDestination(child, distributedNode)) {
	            children.push(distributedNode);
	          }
	        }
	      } else {
	        children.push(child);
	      }
	    }
	    return children;
	  },
	  isFinalDestination: function isFinalDestination(insertionPoint, node) {
	    return this._distributor.isFinalDestination(insertionPoint, node);
	  },
	
	
	  // Ensures that the rendered node list inside `container` is `children`.
	  _updateChildNodes: function _updateChildNodes(container, children) {
	    var composed = (0, _nativeTree.childNodes)(container);
	    var splices = (0, _arraySplice.calculateSplices)(children, composed);
	    // process removals
	    for (var i = 0, d = 0, s; i < splices.length && (s = splices[i]); i++) {
	      for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
	        // check if the node is still where we expect it is before trying
	        // to remove it; this can happen if we move a node and
	        // then schedule its previous host for distribution resulting in
	        // the node being removed here.
	        if ((0, _nativeTree.parentNode)(n) === container) {
	          _nativeMethods.removeChild.call(container, n);
	        }
	        composed.splice(s.index + d, 1);
	      }
	      d -= s.addedCount;
	    }
	    // process adds
	    for (var _i2 = 0, _s, next; _i2 < splices.length && (_s = splices[_i2]); _i2++) {
	      //eslint-disable-line no-redeclare
	      next = composed[_s.index];
	      for (var _j = _s.index, _n; _j < _s.index + _s.addedCount; _j++) {
	        _n = children[_j];
	        _nativeMethods.insertBefore.call(container, _n, next);
	        // TODO(sorvell): is this splice strictly needed?
	        composed.splice(_j, 0, _n);
	      }
	    }
	  },
	  getInsertionPointTag: function getInsertionPointTag() {
	    return this._distributor.insertionPointTag;
	  }
	});
	
	/**
	  Implements a pared down version of ShadowDOM's scoping, which is easy to
	  polyfill across browsers.
	*/
	function attachShadow(host, options) {
	  if (!host) {
	    throw 'Must provide a host.';
	  }
	  if (!options) {
	    throw 'Not enough arguments.';
	  }
	  return new ShadyRoot(ShadyRootConstructionToken, host);
	}
	
	(0, _patchAccessors.patchShadowRootAccessors)(ShadyRoot.prototype);

/***/ },
/* 65 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	function newSplice(index, removed, addedCount) {
	  return {
	    index: index,
	    removed: removed,
	    addedCount: addedCount
	  };
	}
	
	var EDIT_LEAVE = 0;
	var EDIT_UPDATE = 1;
	var EDIT_ADD = 2;
	var EDIT_DELETE = 3;
	
	var ArraySplice = {
	
	  // Note: This function is *based* on the computation of the Levenshtein
	  // "edit" distance. The one change is that "updates" are treated as two
	  // edits - not one. With Array splices, an update is really a delete
	  // followed by an add. By retaining this, we optimize for "keeping" the
	  // maximum array items in the original array. For example:
	  //
	  //   'xxxx123' -> '123yyyy'
	  //
	  // With 1-edit updates, the shortest path would be just to update all seven
	  // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
	  // leaves the substring '123' intact.
	  calcEditDistances: function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
	    // "Deletion" columns
	    var rowCount = oldEnd - oldStart + 1;
	    var columnCount = currentEnd - currentStart + 1;
	    var distances = new Array(rowCount);
	
	    // "Addition" rows. Initialize null column.
	    for (var i = 0; i < rowCount; i++) {
	      distances[i] = new Array(columnCount);
	      distances[i][0] = i;
	    }
	
	    // Initialize null row
	    for (var j = 0; j < columnCount; j++) {
	      distances[0][j] = j;
	    }for (var _i = 1; _i < rowCount; _i++) {
	      for (var _j = 1; _j < columnCount; _j++) {
	        if (this.equals(current[currentStart + _j - 1], old[oldStart + _i - 1])) distances[_i][_j] = distances[_i - 1][_j - 1];else {
	          var north = distances[_i - 1][_j] + 1;
	          var west = distances[_i][_j - 1] + 1;
	          distances[_i][_j] = north < west ? north : west;
	        }
	      }
	    }
	
	    return distances;
	  },
	
	
	  // This starts at the final weight, and walks "backward" by finding
	  // the minimum previous weight recursively until the origin of the weight
	  // matrix.
	  spliceOperationsFromEditDistances: function spliceOperationsFromEditDistances(distances) {
	    var i = distances.length - 1;
	    var j = distances[0].length - 1;
	    var current = distances[i][j];
	    var edits = [];
	    while (i > 0 || j > 0) {
	      if (i == 0) {
	        edits.push(EDIT_ADD);
	        j--;
	        continue;
	      }
	      if (j == 0) {
	        edits.push(EDIT_DELETE);
	        i--;
	        continue;
	      }
	      var northWest = distances[i - 1][j - 1];
	      var west = distances[i - 1][j];
	      var north = distances[i][j - 1];
	
	      var min = void 0;
	      if (west < north) min = west < northWest ? west : northWest;else min = north < northWest ? north : northWest;
	
	      if (min == northWest) {
	        if (northWest == current) {
	          edits.push(EDIT_LEAVE);
	        } else {
	          edits.push(EDIT_UPDATE);
	          current = northWest;
	        }
	        i--;
	        j--;
	      } else if (min == west) {
	        edits.push(EDIT_DELETE);
	        i--;
	        current = west;
	      } else {
	        edits.push(EDIT_ADD);
	        j--;
	        current = north;
	      }
	    }
	
	    edits.reverse();
	    return edits;
	  },
	
	
	  /**
	   * Splice Projection functions:
	   *
	   * A splice map is a representation of how a previous array of items
	   * was transformed into a new array of items. Conceptually it is a list of
	   * tuples of
	   *
	   *   <index, removed, addedCount>
	   *
	   * which are kept in ascending index order of. The tuple represents that at
	   * the |index|, |removed| sequence of items were removed, and counting forward
	   * from |index|, |addedCount| items were added.
	   */
	
	  /**
	   * Lacking individual splice mutation information, the minimal set of
	   * splices can be synthesized given the previous state and final state of an
	   * array. The basic approach is to calculate the edit distance matrix and
	   * choose the shortest path through it.
	   *
	   * Complexity: O(l * p)
	   *   l: The length of the current array
	   *   p: The length of the old array
	   */
	  calcSplices: function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
	    var prefixCount = 0;
	    var suffixCount = 0;
	    var splice = void 0;
	
	    var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
	    if (currentStart == 0 && oldStart == 0) prefixCount = this.sharedPrefix(current, old, minLength);
	
	    if (currentEnd == current.length && oldEnd == old.length) suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
	
	    currentStart += prefixCount;
	    oldStart += prefixCount;
	    currentEnd -= suffixCount;
	    oldEnd -= suffixCount;
	
	    if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0) return [];
	
	    if (currentStart == currentEnd) {
	      splice = newSplice(currentStart, [], 0);
	      while (oldStart < oldEnd) {
	        splice.removed.push(old[oldStart++]);
	      }return [splice];
	    } else if (oldStart == oldEnd) return [newSplice(currentStart, [], currentEnd - currentStart)];
	
	    var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
	
	    splice = undefined;
	    var splices = [];
	    var index = currentStart;
	    var oldIndex = oldStart;
	    for (var i = 0; i < ops.length; i++) {
	      switch (ops[i]) {
	        case EDIT_LEAVE:
	          if (splice) {
	            splices.push(splice);
	            splice = undefined;
	          }
	
	          index++;
	          oldIndex++;
	          break;
	        case EDIT_UPDATE:
	          if (!splice) splice = newSplice(index, [], 0);
	
	          splice.addedCount++;
	          index++;
	
	          splice.removed.push(old[oldIndex]);
	          oldIndex++;
	          break;
	        case EDIT_ADD:
	          if (!splice) splice = newSplice(index, [], 0);
	
	          splice.addedCount++;
	          index++;
	          break;
	        case EDIT_DELETE:
	          if (!splice) splice = newSplice(index, [], 0);
	
	          splice.removed.push(old[oldIndex]);
	          oldIndex++;
	          break;
	      }
	    }
	
	    if (splice) {
	      splices.push(splice);
	    }
	    return splices;
	  },
	  sharedPrefix: function sharedPrefix(current, old, searchLength) {
	    for (var i = 0; i < searchLength; i++) {
	      if (!this.equals(current[i], old[i])) return i;
	    }return searchLength;
	  },
	  sharedSuffix: function sharedSuffix(current, old, searchLength) {
	    var index1 = current.length;
	    var index2 = old.length;
	    var count = 0;
	    while (count < searchLength && this.equals(current[--index1], old[--index2])) {
	      count++;
	    }return count;
	  },
	  calculateSplices: function calculateSplices(current, previous) {
	    return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
	  },
	  equals: function equals(currentValue, previousValue) {
	    return currentValue === previousValue;
	  }
	};
	
	var calculateSplices = exports.calculateSplices = function calculateSplices(current, previous) {
	  return ArraySplice.calculateSplices(current, previous);
	};

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _nativeMethods = __webpack_require__(55);
	
	var _nativeTree = __webpack_require__(56);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	// NOTE: normalize event contruction where necessary (IE11)
	var NormalizedEvent = typeof Event === 'function' ? Event : function (inType, params) {
	  params = params || {};
	  var e = document.createEvent('Event');
	  e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
	  return e;
	};
	
	var _class = function () {
	  function _class(root) {
	    _classCallCheck(this, _class);
	
	    this.root = root;
	    this.insertionPointTag = 'slot';
	  }
	
	  _createClass(_class, [{
	    key: 'getInsertionPoints',
	    value: function getInsertionPoints() {
	      return this.root.querySelectorAll(this.insertionPointTag);
	    }
	  }, {
	    key: 'hasInsertionPoint',
	    value: function hasInsertionPoint() {
	      return Boolean(this.root._insertionPoints && this.root._insertionPoints.length);
	    }
	  }, {
	    key: 'isInsertionPoint',
	    value: function isInsertionPoint(node) {
	      return node.localName && node.localName == this.insertionPointTag;
	    }
	  }, {
	    key: 'distribute',
	    value: function distribute() {
	      if (this.hasInsertionPoint()) {
	        return this.distributePool(this.root, this.collectPool());
	      }
	      return [];
	    }
	
	    // Gather the pool of nodes that should be distributed. We will combine
	    // these with the "content root" to arrive at the composed tree.
	
	  }, {
	    key: 'collectPool',
	    value: function collectPool() {
	      var host = this.root.host;
	      var pool = [],
	          i = 0;
	      for (var n = host.firstChild; n; n = n.nextSibling) {
	        pool[i++] = n;
	      }
	      return pool;
	    }
	
	    // perform "logical" distribution; note, no actual dom is moved here,
	    // instead elements are distributed into storage
	    // array where applicable.
	
	  }, {
	    key: 'distributePool',
	    value: function distributePool(node, pool) {
	      var dirtyRoots = [];
	      var p$ = this.root._insertionPoints;
	      for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
	        this.distributeInsertionPoint(p, pool);
	        // provoke redistribution on insertion point parents
	        // must do this on all candidate hosts since distribution in this
	        // scope invalidates their distribution.
	        // only get logical parent.
	        var parent = p.parentNode;
	        if (parent && parent.shadyRoot && this.hasInsertionPoint(parent.shadyRoot)) {
	          dirtyRoots.push(parent.shadyRoot);
	        }
	      }
	      for (var _i = 0; _i < pool.length; _i++) {
	        var _p = pool[_i];
	        if (_p) {
	          _p.__shady = _p.__shady || {};
	          _p.__shady.assignedSlot = undefined;
	          // remove undistributed elements from physical dom.
	          var _parent = (0, _nativeTree.parentNode)(_p);
	          if (_parent) {
	            _nativeMethods.removeChild.call(_parent, _p);
	          }
	        }
	      }
	      return dirtyRoots;
	    }
	  }, {
	    key: 'distributeInsertionPoint',
	    value: function distributeInsertionPoint(insertionPoint, pool) {
	      var prevAssignedNodes = insertionPoint.__shady.assignedNodes;
	      if (prevAssignedNodes) {
	        this.clearAssignedSlots(insertionPoint, true);
	      }
	      insertionPoint.__shady.assignedNodes = [];
	      var needsSlotChange = false;
	      // distribute nodes from the pool that this selector matches
	      var anyDistributed = false;
	      for (var i = 0, l = pool.length, node; i < l; i++) {
	        node = pool[i];
	        // skip nodes that were already used
	        if (!node) {
	          continue;
	        }
	        // distribute this node if it matches
	        if (this.matchesInsertionPoint(node, insertionPoint)) {
	          if (node.__shady._prevAssignedSlot != insertionPoint) {
	            needsSlotChange = true;
	          }
	          this.distributeNodeInto(node, insertionPoint);
	          // remove this node from the pool
	          pool[i] = undefined;
	          // since at least one node matched, we won't need fallback content
	          anyDistributed = true;
	        }
	      }
	      // Fallback content if nothing was distributed here
	      if (!anyDistributed) {
	        var children = insertionPoint.childNodes;
	        for (var j = 0, _node; j < children.length; j++) {
	          _node = children[j];
	          if (_node.__shady._prevAssignedSlot != insertionPoint) {
	            needsSlotChange = true;
	          }
	          this.distributeNodeInto(_node, insertionPoint);
	        }
	      }
	      // we're already dirty if a node was newly added to the slot
	      // and we're also dirty if the assigned count decreased.
	      if (prevAssignedNodes) {
	        // TODO(sorvell): the tracking of previously assigned slots
	        // could instead by done with a Set and then we could
	        // avoid needing to iterate here to clear the info.
	        for (var _i2 = 0; _i2 < prevAssignedNodes.length; _i2++) {
	          prevAssignedNodes[_i2].__shady._prevAssignedSlot = null;
	        }
	        if (insertionPoint.__shady.assignedNodes.length < prevAssignedNodes.length) {
	          needsSlotChange = true;
	        }
	      }
	      this.setDistributedNodesOnInsertionPoint(insertionPoint);
	      if (needsSlotChange) {
	        this._fireSlotChange(insertionPoint);
	      }
	    }
	  }, {
	    key: 'clearAssignedSlots',
	    value: function clearAssignedSlots(slot, savePrevious) {
	      var n$ = slot.__shady.assignedNodes;
	      if (n$) {
	        for (var i = 0; i < n$.length; i++) {
	          var n = n$[i];
	          if (savePrevious) {
	            n.__shady._prevAssignedSlot = n.__shady.assignedSlot;
	          }
	          // only clear if it was previously set to this slot;
	          // this helps ensure that if the node has otherwise been distributed
	          // ignore it.
	          if (n.__shady.assignedSlot === slot) {
	            n.__shady.assignedSlot = null;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'matchesInsertionPoint',
	    value: function matchesInsertionPoint(node, insertionPoint) {
	      var slotName = insertionPoint.getAttribute('name');
	      slotName = slotName ? slotName.trim() : '';
	      var slot = node.getAttribute && node.getAttribute('slot');
	      slot = slot ? slot.trim() : '';
	      return slot == slotName;
	    }
	  }, {
	    key: 'distributeNodeInto',
	    value: function distributeNodeInto(child, insertionPoint) {
	      insertionPoint.__shady.assignedNodes.push(child);
	      child.__shady.assignedSlot = insertionPoint;
	    }
	  }, {
	    key: 'setDistributedNodesOnInsertionPoint',
	    value: function setDistributedNodesOnInsertionPoint(insertionPoint) {
	      var n$ = insertionPoint.__shady.assignedNodes;
	      insertionPoint.__shady.distributedNodes = [];
	      for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
	        if (this.isInsertionPoint(n)) {
	          var d$ = n.__shady.distributedNodes;
	          if (d$) {
	            for (var j = 0; j < d$.length; j++) {
	              insertionPoint.__shady.distributedNodes.push(d$[j]);
	            }
	          }
	        } else {
	          insertionPoint.__shady.distributedNodes.push(n$[i]);
	        }
	      }
	    }
	  }, {
	    key: '_fireSlotChange',
	    value: function _fireSlotChange(insertionPoint) {
	      // NOTE: cannot bubble correctly here so not setting bubbles: true
	      // Safari tech preview does not bubble but chrome does
	      // Spec says it bubbles (https://dom.spec.whatwg.org/#mutation-observers)
	      insertionPoint.dispatchEvent(new NormalizedEvent('slotchange'));
	      if (insertionPoint.__shady.assignedSlot) {
	        this._fireSlotChange(insertionPoint.__shady.assignedSlot);
	      }
	    }
	  }, {
	    key: 'isFinalDestination',
	    value: function isFinalDestination(insertionPoint) {
	      return !insertionPoint.__shady.assignedSlot;
	    }
	  }]);

	  return _class;
	}();

	exports.default = _class;

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	'use strict';
	
	/*
	Small module to load ShadyCSS and CustomStyle together
	*/
	
	__webpack_require__(68);
	
	__webpack_require__(80);

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	// TODO(dfreedm): consider spliting into separate global
	
	
	var _cssParse = __webpack_require__(69);
	
	var _styleSettings = __webpack_require__(70);
	
	var _styleTransformer = __webpack_require__(71);
	
	var _styleTransformer2 = _interopRequireDefault(_styleTransformer);
	
	var _styleUtil = __webpack_require__(72);
	
	var StyleUtil = _interopRequireWildcard(_styleUtil);
	
	var _styleProperties = __webpack_require__(73);
	
	var _styleProperties2 = _interopRequireDefault(_styleProperties);
	
	var _templateMap = __webpack_require__(75);
	
	var _templateMap2 = _interopRequireDefault(_templateMap);
	
	var _stylePlaceholder = __webpack_require__(76);
	
	var _stylePlaceholder2 = _interopRequireDefault(_stylePlaceholder);
	
	var _styleInfo = __webpack_require__(74);
	
	var _styleInfo2 = _interopRequireDefault(_styleInfo);
	
	var _styleCache = __webpack_require__(77);
	
	var _styleCache2 = _interopRequireDefault(_styleCache);
	
	var _applyShim = __webpack_require__(78);
	
	var _applyShim2 = _interopRequireDefault(_applyShim);
	
	var _documentWatcher = __webpack_require__(79);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var styleCache = new _styleCache2.default();
	
	var ShadyCSS = function () {
	  function ShadyCSS() {
	    _classCallCheck(this, ShadyCSS);
	
	    this._scopeCounter = {};
	    this._documentOwner = document.documentElement;
	    this._documentOwnerStyleInfo = _styleInfo2.default.set(document.documentElement, new _styleInfo2.default({ rules: [] }));
	    this._elementsHaveApplied = false;
	  }
	
	  _createClass(ShadyCSS, [{
	    key: 'flush',
	    value: function flush() {
	      (0, _documentWatcher.flush)();
	    }
	  }, {
	    key: '_generateScopeSelector',
	    value: function _generateScopeSelector(name) {
	      var id = this._scopeCounter[name] = (this._scopeCounter[name] || 0) + 1;
	      return name + '-' + id;
	    }
	  }, {
	    key: 'getStyleAst',
	    value: function getStyleAst(style) {
	      return StyleUtil.rulesForStyle(style);
	    }
	  }, {
	    key: 'styleAstToString',
	    value: function styleAstToString(ast) {
	      return StyleUtil.toCssText(ast);
	    }
	  }, {
	    key: '_gatherStyles',
	    value: function _gatherStyles(template) {
	      var styles = template.content.querySelectorAll('style');
	      var cssText = [];
	      for (var i = 0; i < styles.length; i++) {
	        var s = styles[i];
	        cssText.push(s.textContent);
	        s.parentNode.removeChild(s);
	      }
	      return cssText.join('').trim();
	    }
	  }, {
	    key: '_getCssBuild',
	    value: function _getCssBuild(template) {
	      var style = template.content.querySelector('style');
	      if (!style) {
	        return '';
	      }
	      return style.getAttribute('css-build') || '';
	    }
	  }, {
	    key: 'prepareTemplate',
	    value: function prepareTemplate(template, elementName, typeExtension) {
	      if (template._prepared) {
	        return;
	      }
	      template._prepared = true;
	      template.name = elementName;
	      template.extends = typeExtension;
	      _templateMap2.default[elementName] = template;
	      var cssBuild = this._getCssBuild(template);
	      var cssText = this._gatherStyles(template);
	      var info = {
	        is: elementName,
	        extends: typeExtension,
	        __cssBuild: cssBuild
	      };
	      if (!this.nativeShadow) {
	        _styleTransformer2.default.dom(template.content, elementName);
	      }
	      // check if the styling has mixin definitions or uses
	      var hasMixins = _applyShim2.default.detectMixin(cssText);
	      var ast = (0, _cssParse.parse)(cssText);
	      // only run the applyshim transforms if there is a mixin involved
	      if (hasMixins && this.nativeCss && !this.nativeCssApply) {
	        _applyShim2.default.transformRules(ast, elementName);
	      }
	      template._styleAst = ast;
	
	      var ownPropertyNames = [];
	      if (!this.nativeCss) {
	        ownPropertyNames = _styleProperties2.default.decorateStyles(template._styleAst, info);
	      }
	      if (!ownPropertyNames.length || this.nativeCss) {
	        var root = this.nativeShadow ? template.content : null;
	        var placeholder = _stylePlaceholder2.default[elementName];
	        var style = this._generateStaticStyle(info, template._styleAst, root, placeholder);
	        template._style = style;
	      }
	      template._ownPropertyNames = ownPropertyNames;
	    }
	  }, {
	    key: '_generateStaticStyle',
	    value: function _generateStaticStyle(info, rules, shadowroot, placeholder) {
	      var cssText = _styleTransformer2.default.elementStyles(info, rules);
	      if (cssText.length) {
	        return StyleUtil.applyCss(cssText, info.is, shadowroot, placeholder);
	      }
	    }
	  }, {
	    key: '_prepareHost',
	    value: function _prepareHost(host) {
	      var is = host.getAttribute('is') || host.localName;
	      var typeExtension = void 0;
	      if (is !== host.localName) {
	        typeExtension = host.localName;
	      }
	      var placeholder = _stylePlaceholder2.default[is];
	      var template = _templateMap2.default[is];
	      var ast = void 0;
	      var ownStylePropertyNames = void 0;
	      var cssBuild = void 0;
	      if (template) {
	        ast = template._styleAst;
	        ownStylePropertyNames = template._ownPropertyNames;
	        cssBuild = template._cssBuild;
	      }
	      return _styleInfo2.default.set(host, new _styleInfo2.default(ast, placeholder, ownStylePropertyNames, is, typeExtension, cssBuild));
	    }
	  }, {
	    key: 'applyStyle',
	    value: function applyStyle(host, overrideProps) {
	      var is = host.getAttribute('is') || host.localName;
	      var styleInfo = _styleInfo2.default.get(host);
	      var hasApplied = Boolean(styleInfo);
	      if (!styleInfo) {
	        styleInfo = this._prepareHost(host);
	      }
	      // Only trip the `elementsHaveApplied` flag if a node other that the root document has `applyStyle` called
	      if (!this._isRootOwner(host)) {
	        this._elementsHaveApplied = true;
	      }
	      if (window.CustomStyle) {
	        var CS = window.CustomStyle;
	        if (CS._documentDirty) {
	          CS.findStyles();
	          if (!this.nativeCss) {
	            this._updateProperties(this._documentOwner, this._documentOwnerStyleInfo);
	          } else if (!this.nativeCssApply) {
	            CS._revalidateApplyShim();
	          }
	          CS.applyStyles();
	          // if no elements have booted yet, we can just update the document and be done
	          if (!this._elementsHaveApplied) {
	            return;
	          }
	          // if no native css custom properties, we must recalculate the whole tree
	          if (!this.nativeCss) {
	            this.updateStyles();
	            /*
	            When updateStyles() runs, this element may not have a shadowroot yet.
	            If not, we need to make sure that this element runs `applyStyle` on itself at least once to generate a style
	            */
	            if (hasApplied) {
	              return;
	            }
	          }
	        }
	      }
	      if (overrideProps) {
	        styleInfo.overrideStyleProperties = styleInfo.overrideStyleProperties || {};
	        Object.assign(styleInfo.overrideStyleProperties, overrideProps);
	      }
	      if (this.nativeCss) {
	        if (styleInfo.overrideStyleProperties) {
	          this._updateNativeProperties(host, styleInfo.overrideStyleProperties);
	        }
	        var template = _templateMap2.default[is];
	        // bail early if there is no shadowroot for this element
	        if (!template && !this._isRootOwner(host)) {
	          return;
	        }
	        if (template && template._applyShimInvalid && template._style) {
	          // update template
	          if (!template._validating) {
	            _applyShim2.default.transformRules(template._styleAst, is);
	            template._style.textContent = _styleTransformer2.default.elementStyles(host, styleInfo.styleRules);
	            _styleInfo2.default.startValidating(is);
	          }
	          // update instance if native shadowdom
	          if (this.nativeShadow) {
	            var root = host.shadowRoot;
	            if (root) {
	              var style = root.querySelector('style');
	              style.textContent = _styleTransformer2.default.elementStyles(host, styleInfo.styleRules);
	            }
	          }
	          styleInfo.styleRules = template._styleAst;
	        }
	      } else {
	        this._updateProperties(host, styleInfo);
	        if (styleInfo.ownStylePropertyNames && styleInfo.ownStylePropertyNames.length) {
	          this._applyStyleProperties(host, styleInfo);
	        }
	      }
	      if (hasApplied) {
	        var _root = this._isRootOwner(host) ? host : host.shadowRoot;
	        // note: some elements may not have a root!
	        if (_root) {
	          this._applyToDescendants(_root);
	        }
	      }
	    }
	  }, {
	    key: '_applyToDescendants',
	    value: function _applyToDescendants(root) {
	      var c$ = root.children;
	      for (var i = 0, c; i < c$.length; i++) {
	        c = c$[i];
	        if (c.shadowRoot) {
	          this.applyStyle(c);
	        }
	        this._applyToDescendants(c);
	      }
	    }
	  }, {
	    key: '_styleOwnerForNode',
	    value: function _styleOwnerForNode(node) {
	      var root = node.getRootNode();
	      var host = root.host;
	      if (host) {
	        if (_styleInfo2.default.get(host)) {
	          return host;
	        } else {
	          return this._styleOwnerForNode(host);
	        }
	      }
	      return this._documentOwner;
	    }
	  }, {
	    key: '_isRootOwner',
	    value: function _isRootOwner(node) {
	      return node === this._documentOwner;
	    }
	  }, {
	    key: '_applyStyleProperties',
	    value: function _applyStyleProperties(host, styleInfo) {
	      var is = host.getAttribute('is') || host.localName;
	      var cacheEntry = styleCache.fetch(is, styleInfo.styleProperties, styleInfo.ownStylePropertyNames);
	      var cachedScopeSelector = cacheEntry && cacheEntry.scopeSelector;
	      var cachedStyle = cacheEntry ? cacheEntry.styleElement : null;
	      var oldScopeSelector = styleInfo.scopeSelector;
	      // only generate new scope if cached style is not found
	      styleInfo.scopeSelector = cachedScopeSelector || this._generateScopeSelector(is);
	      var style = _styleProperties2.default.applyElementStyle(host, styleInfo.styleProperties, styleInfo.scopeSelector, cachedStyle);
	      if (!this.nativeShadow) {
	        _styleProperties2.default.applyElementScopeSelector(host, styleInfo.scopeSelector, oldScopeSelector);
	      }
	      if (!cacheEntry) {
	        styleCache.store(is, styleInfo.styleProperties, style, styleInfo.scopeSelector);
	      }
	      return style;
	    }
	  }, {
	    key: '_updateProperties',
	    value: function _updateProperties(host, styleInfo) {
	      var owner = this._styleOwnerForNode(host);
	      var ownerStyleInfo = _styleInfo2.default.get(owner);
	      var ownerProperties = ownerStyleInfo.styleProperties;
	      var props = Object.create(ownerProperties || null);
	      var hostAndRootProps = _styleProperties2.default.hostAndRootPropertiesForScope(host, styleInfo.styleRules);
	      var propertyData = _styleProperties2.default.propertyDataFromStyles(ownerStyleInfo.styleRules, host);
	      var propertiesMatchingHost = propertyData.properties;
	      Object.assign(props, hostAndRootProps.hostProps, propertiesMatchingHost, hostAndRootProps.rootProps);
	      this._mixinOverrideStyles(props, styleInfo.overrideStyleProperties);
	      _styleProperties2.default.reify(props);
	      styleInfo.styleProperties = props;
	    }
	  }, {
	    key: '_mixinOverrideStyles',
	    value: function _mixinOverrideStyles(props, overrides) {
	      for (var p in overrides) {
	        var v = overrides[p];
	        // skip override props if they are not truthy or 0
	        // in order to fall back to inherited values
	        if (v || v === 0) {
	          props[p] = v;
	        }
	      }
	    }
	  }, {
	    key: '_updateNativeProperties',
	    value: function _updateNativeProperties(element, properties) {
	      // remove previous properties
	      for (var p in properties) {
	        // NOTE: for bc with shim, don't apply null values.
	        if (p === null) {
	          element.style.removeProperty(p);
	        } else {
	          element.style.setProperty(p, properties[p]);
	        }
	      }
	    }
	  }, {
	    key: 'updateStyles',
	    value: function updateStyles(properties) {
	      this.applyStyle(this._documentOwner, properties);
	    }
	    /* Custom Style operations */
	
	  }, {
	    key: '_transformCustomStyleForDocument',
	    value: function _transformCustomStyleForDocument(style) {
	      var _this = this;
	
	      var ast = StyleUtil.rulesForStyle(style);
	      StyleUtil.forEachRule(ast, function (rule) {
	        if (_styleSettings.nativeShadow) {
	          _styleTransformer2.default.normalizeRootSelector(rule);
	        } else {
	          _styleTransformer2.default.documentRule(rule);
	        }
	        if (_this.nativeCss && !_this.nativeCssApply) {
	          _applyShim2.default.transformRule(rule);
	        }
	      });
	      if (this.nativeCss) {
	        style.textContent = StyleUtil.toCssText(ast);
	      } else {
	        this._documentOwnerStyleInfo.styleRules.rules.push(ast);
	      }
	    }
	  }, {
	    key: '_revalidateApplyShim',
	    value: function _revalidateApplyShim(style) {
	      if (this.nativeCss && !this.nativeCssApply) {
	        var ast = StyleUtil.rulesForStyle(style);
	        _applyShim2.default.transformRules(ast);
	        style.textContent = StyleUtil.toCssText(ast);
	      }
	    }
	  }, {
	    key: '_applyCustomStyleToDocument',
	    value: function _applyCustomStyleToDocument(style) {
	      if (!this.nativeCss) {
	        _styleProperties2.default.applyCustomStyle(style, this._documentOwnerStyleInfo.styleProperties);
	      }
	    }
	  }, {
	    key: 'getComputedStyleValue',
	    value: function getComputedStyleValue(element, property) {
	      var value = void 0;
	      if (!this.nativeCss) {
	        // element is either a style host, or an ancestor of a style host
	        var styleInfo = _styleInfo2.default.get(element) || _styleInfo2.default.get(this._styleOwnerForNode(element));
	        value = styleInfo.styleProperties[property];
	      }
	      // fall back to the property value from the computed styling
	      value = value || window.getComputedStyle(element).getPropertyValue(property);
	      // trim whitespace that can come after the `:` in css
	      // example: padding: 2px -> " 2px"
	      return value.trim();
	    }
	    // given an element and a classString, replaces
	    // the element's class with the provided classString and adds
	    // any necessary ShadyCSS static and property based scoping selectors
	
	  }, {
	    key: 'setElementClass',
	    value: function setElementClass(element, classString) {
	      var root = element.getRootNode();
	      var classes = classString ? classString.split(/\s/) : [];
	      var scopeName = root.host && root.host.localName;
	      // If no scope, try to discover scope name from existing class.
	      // This can occur if, for example, a template stamped element that
	      // has been scoped is manipulated when not in a root.
	      if (!scopeName) {
	        var classAttr = element.getAttribute('class');
	        if (classAttr) {
	          var k$ = classAttr.split(/\s/);
	          for (var i = 0; i < k$.length; i++) {
	            if (k$[i] === _styleTransformer2.default.SCOPE_NAME) {
	              scopeName = k$[i + 1];
	              break;
	            }
	          }
	        }
	      }
	      if (scopeName) {
	        classes.push(_styleTransformer2.default.SCOPE_NAME, scopeName);
	      }
	      if (!this.nativeCss) {
	        var styleInfo = _styleInfo2.default.get(element);
	        if (styleInfo && styleInfo.scopeSelector) {
	          classes.push(_styleProperties2.default.XSCOPE_NAME, styleInfo.scopeSelector);
	        }
	      }
	      StyleUtil.setElementClassRaw(element, classes.join(' '));
	    }
	  }, {
	    key: '_styleInfoForNode',
	    value: function _styleInfoForNode(node) {
	      return _styleInfo2.default.get(node);
	    }
	  }, {
	    key: 'nativeShadow',
	    get: function get() {
	      return _styleSettings.nativeShadow;
	    }
	  }, {
	    key: 'nativeCss',
	    get: function get() {
	      return _styleSettings.nativeCssVariables;
	    }
	  }, {
	    key: 'nativeCssApply',
	    get: function get() {
	      return _styleSettings.nativeCssApply;
	    }
	  }]);
	
	  return ShadyCSS;
	}();
	
	window['ShadyCSS'] = new ShadyCSS();

/***/ },
/* 69 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	/*
	Extremely simple css parser. Intended to be not more than what we need
	and definitely not necessarily correct =).
	*/
	
	'use strict';
	
	// given a string of css, return a simple rule tree
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.parse = parse;
	exports.stringify = stringify;
	exports.removeCustomPropAssignment = removeCustomPropAssignment;
	function parse(text) {
	  text = clean(text);
	  return parseCss(lex(text), text);
	}
	
	// remove stuff we don't care about that may hinder parsing
	function clean(cssText) {
	  return cssText.replace(RX.comments, '').replace(RX.port, '');
	}
	
	// super simple {...} lexer that returns a node tree
	function lex(text) {
	  var root = {
	    start: 0,
	    end: text.length
	  };
	  var n = root;
	  for (var i = 0, l = text.length; i < l; i++) {
	    if (text[i] === OPEN_BRACE) {
	      if (!n.rules) {
	        n.rules = [];
	      }
	      var p = n;
	      var previous = p.rules[p.rules.length - 1];
	      n = {
	        start: i + 1,
	        parent: p,
	        previous: previous
	      };
	      p.rules.push(n);
	    } else if (text[i] === CLOSE_BRACE) {
	      n.end = i + 1;
	      n = n.parent || root;
	    }
	  }
	  return root;
	}
	
	// add selectors/cssText to node tree
	function parseCss(node, text) {
	  var t = text.substring(node.start, node.end - 1);
	  node.parsedCssText = node.cssText = t.trim();
	  if (node.parent) {
	    var ss = node.previous ? node.previous.end : node.parent.start;
	    t = text.substring(ss, node.start - 1);
	    t = _expandUnicodeEscapes(t);
	    t = t.replace(RX.multipleSpaces, ' ');
	    // TODO(sorvell): ad hoc; make selector include only after last ;
	    // helps with mixin syntax
	    t = t.substring(t.lastIndexOf(';') + 1);
	    var s = node.parsedSelector = node.selector = t.trim();
	    node.atRule = s.indexOf(AT_START) === 0;
	    // note, support a subset of rule types...
	    if (node.atRule) {
	      if (s.indexOf(MEDIA_START) === 0) {
	        node.type = types.MEDIA_RULE;
	      } else if (s.match(RX.keyframesRule)) {
	        node.type = types.KEYFRAMES_RULE;
	        node.keyframesName = node.selector.split(RX.multipleSpaces).pop();
	      }
	    } else {
	      if (s.indexOf(VAR_START) === 0) {
	        node.type = types.MIXIN_RULE;
	      } else {
	        node.type = types.STYLE_RULE;
	      }
	    }
	  }
	  var r$ = node.rules;
	  if (r$) {
	    for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
	      parseCss(r, text);
	    }
	  }
	  return node;
	}
	
	// conversion of sort unicode escapes with spaces like `\33 ` (and longer) into
	// expanded form that doesn't require trailing space `\000033`
	function _expandUnicodeEscapes(s) {
	  return s.replace(/\\([0-9a-f]{1,6})\s/gi, function () {
	    var code = arguments[1],
	        repeat = 6 - code.length;
	    while (repeat--) {
	      code = '0' + code;
	    }
	    return '\\' + code;
	  });
	}
	
	// stringify parsed css.
	function stringify(node, preserveProperties, text) {
	  text = text || '';
	  // calc rule cssText
	  var cssText = '';
	  if (node.cssText || node.rules) {
	    var r$ = node.rules;
	    if (r$ && !_hasMixinRules(r$)) {
	      for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
	        cssText = stringify(r, preserveProperties, cssText);
	      }
	    } else {
	      cssText = preserveProperties ? node.cssText : removeCustomProps(node.cssText);
	      cssText = cssText.trim();
	      if (cssText) {
	        cssText = '  ' + cssText + '\n';
	      }
	    }
	  }
	  // emit rule if there is cssText
	  if (cssText) {
	    if (node.selector) {
	      text += node.selector + ' ' + OPEN_BRACE + '\n';
	    }
	    text += cssText;
	    if (node.selector) {
	      text += CLOSE_BRACE + '\n\n';
	    }
	  }
	  return text;
	}
	
	function _hasMixinRules(rules) {
	  return rules[0].selector.indexOf(VAR_START) === 0;
	}
	
	function removeCustomProps(cssText) {
	  cssText = removeCustomPropAssignment(cssText);
	  return removeCustomPropApply(cssText);
	}
	
	function removeCustomPropAssignment(cssText) {
	  return cssText.replace(RX.customProp, '').replace(RX.mixinProp, '');
	}
	
	function removeCustomPropApply(cssText) {
	  return cssText.replace(RX.mixinApply, '').replace(RX.varApply, '');
	}
	
	var types = exports.types = {
	  STYLE_RULE: 1,
	  KEYFRAMES_RULE: 7,
	  MEDIA_RULE: 4,
	  MIXIN_RULE: 1000
	};
	
	var OPEN_BRACE = '{';
	var CLOSE_BRACE = '}';
	
	// helper regexp's
	var RX = {
	  comments: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,
	  port: /@import[^;]*;/gim,
	  customProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
	  mixinProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
	  mixinApply: /@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,
	  varApply: /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
	  keyframesRule: /^@[^\s]*keyframes/,
	  multipleSpaces: /\s+/g
	};
	
	var VAR_START = '--';
	var MEDIA_START = '@media';
	var AT_START = '@';

/***/ },
/* 70 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var nativeShadow = exports.nativeShadow = !(window.ShadyDOM && window.ShadyDOM.inUse);
	// chrome 49 has semi-working css vars, check if box-shadow works
	// safari 9.1 has a recalc bug: https://bugs.webkit.org/show_bug.cgi?id=155782
	var nativeCssVariables = exports.nativeCssVariables = !navigator.userAgent.match('AppleWebKit/601') && window.CSS && CSS.supports && CSS.supports('box-shadow', '0 0 0 var(--foo)');
	
	// experimental support for native @apply
	function detectNativeApply() {
	  var style = document.createElement('style');
	  style.textContent = '.foo { @apply --foo }';
	  document.head.appendChild(style);
	  var nativeCssApply = style.sheet.cssRules[0].cssText.indexOf('apply') >= 0;
	  document.head.removeChild(style);
	  return nativeCssApply;
	}
	
	var nativeCssApply = exports.nativeCssApply = false && detectNativeApply();
	
	function parseSettings(settings) {
	  if (settings) {
	    exports.nativeCssVariables = nativeCssVariables = nativeCssVariables && !settings.shimcssproperties;
	    exports.nativeShadow = nativeShadow = nativeShadow && !settings.shimshadow;
	  }
	}
	
	if (window.ShadyCSS) {
	  parseSettings(window.ShadyCSS);
	} else if (window.WebComponents) {
	  parseSettings(window.WebComponents.flags);
	}

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _styleUtil = __webpack_require__(72);
	
	var StyleUtil = _interopRequireWildcard(_styleUtil);
	
	var _styleSettings = __webpack_require__(70);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/* Transforms ShadowDOM styling into ShadyDOM styling
	
	* scoping:
	
	  * elements in scope get scoping selector class="x-foo-scope"
	  * selectors re-written as follows:
	
	    div button -> div.x-foo-scope button.x-foo-scope
	
	* :host -> scopeName
	
	* :host(...) -> scopeName...
	
	* ::slotted(...) -> scopeName > ...
	
	* ...:dir(ltr|rtl) -> [dir="ltr|rtl"] ..., ...[dir="ltr|rtl"]
	
	* :host(:dir[rtl]) -> scopeName:dir(rtl) -> [dir="rtl"] scopeName, scopeName[dir="rtl"]
	
	*/
	var SCOPE_NAME = 'style-scope';
	
	var StyleTransformer = function () {
	  function StyleTransformer() {
	    _classCallCheck(this, StyleTransformer);
	  }
	
	  _createClass(StyleTransformer, [{
	    key: 'dom',
	
	    // Given a node and scope name, add a scoping class to each node
	    // in the tree. This facilitates transforming css into scoped rules.
	    value: function dom(node, scope, shouldRemoveScope) {
	      // one time optimization to skip scoping...
	      if (node.__styleScoped) {
	        node.__styleScoped = null;
	      } else {
	        this._transformDom(node, scope || '', shouldRemoveScope);
	      }
	    }
	  }, {
	    key: '_transformDom',
	    value: function _transformDom(node, selector, shouldRemoveScope) {
	      if (node.nodeType === Node.ELEMENT_NODE) {
	        this.element(node, selector, shouldRemoveScope);
	      }
	      var c$ = node.localName === 'template' ? (node.content || node._content).childNodes : node.children || node.childNodes;
	      if (c$) {
	        for (var i = 0; i < c$.length; i++) {
	          this._transformDom(c$[i], selector, shouldRemoveScope);
	        }
	      }
	    }
	  }, {
	    key: 'element',
	    value: function element(_element, scope, shouldRemoveScope) {
	      // note: if using classes, we add both the general 'style-scope' class
	      // as well as the specific scope. This enables easy filtering of all
	      // `style-scope` elements
	      if (scope) {
	        // note: svg on IE does not have classList so fallback to class
	        if (_element.classList) {
	          if (shouldRemoveScope) {
	            _element.classList.remove(SCOPE_NAME);
	            _element.classList.remove(scope);
	          } else {
	            _element.classList.add(SCOPE_NAME);
	            _element.classList.add(scope);
	          }
	        } else if (_element.getAttribute) {
	          var c = _element.getAttribute(CLASS);
	          if (shouldRemoveScope) {
	            if (c) {
	              var newValue = c.replace(SCOPE_NAME, '').replace(scope, '');
	              StyleUtil.setElementClassRaw(_element, newValue);
	            }
	          } else {
	            var _newValue = (c ? c + ' ' : '') + SCOPE_NAME + ' ' + scope;
	            StyleUtil.setElementClassRaw(_element, _newValue);
	          }
	        }
	      }
	    }
	  }, {
	    key: 'elementStyles',
	    value: function elementStyles(element, styleRules, callback) {
	      var cssBuildType = element.__cssBuild;
	      // no need to shim selectors if settings.useNativeShadow, also
	      // a shady css build will already have transformed selectors
	      // NOTE: This method may be called as part of static or property shimming.
	      // When there is a targeted build it will not be called for static shimming,
	      // but when the property shim is used it is called and should opt out of
	      // static shimming work when a proper build exists.
	      var cssText = _styleSettings.nativeShadow || cssBuildType === 'shady' ? StyleUtil.toCssText(styleRules, callback) : this.css(styleRules, element.is, element.extends, callback) + '\n\n';
	      return cssText.trim();
	    }
	
	    // Given a string of cssText and a scoping string (scope), returns
	    // a string of scoped css where each selector is transformed to include
	    // a class created from the scope. ShadowDOM selectors are also transformed
	    // (e.g. :host) to use the scoping selector.
	
	  }, {
	    key: 'css',
	    value: function css(rules, scope, ext, callback) {
	      var hostScope = this._calcHostScope(scope, ext);
	      scope = this._calcElementScope(scope);
	      var self = this;
	      return StyleUtil.toCssText(rules, function (rule) {
	        if (!rule.isScoped) {
	          self.rule(rule, scope, hostScope);
	          rule.isScoped = true;
	        }
	        if (callback) {
	          callback(rule, scope, hostScope);
	        }
	      });
	    }
	  }, {
	    key: '_calcElementScope',
	    value: function _calcElementScope(scope) {
	      if (scope) {
	        return CSS_CLASS_PREFIX + scope;
	      } else {
	        return '';
	      }
	    }
	  }, {
	    key: '_calcHostScope',
	    value: function _calcHostScope(scope, ext) {
	      return ext ? '[is=' + scope + ']' : scope;
	    }
	  }, {
	    key: 'rule',
	    value: function rule(_rule, scope, hostScope) {
	      this._transformRule(_rule, this._transformComplexSelector, scope, hostScope);
	    }
	
	    // transforms a css rule to a scoped rule.
	
	  }, {
	    key: '_transformRule',
	    value: function _transformRule(rule, transformer, scope, hostScope) {
	      // NOTE: save transformedSelector for subsequent matching of elements
	      // against selectors (e.g. when calculating style properties)
	      rule.selector = rule.transformedSelector = this._transformRuleCss(rule, transformer, scope, hostScope);
	    }
	  }, {
	    key: '_transformRuleCss',
	    value: function _transformRuleCss(rule, transformer, scope, hostScope) {
	      var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
	      // we want to skip transformation of rules that appear in keyframes,
	      // because they are keyframe selectors, not element selectors.
	      if (!StyleUtil.isKeyframesSelector(rule)) {
	        for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
	          p$[i] = transformer.call(this, p, scope, hostScope);
	        }
	      }
	      return p$.join(COMPLEX_SELECTOR_SEP);
	    }
	  }, {
	    key: '_transformComplexSelector',
	    value: function _transformComplexSelector(selector, scope, hostScope) {
	      var _this = this;
	
	      var stop = false;
	      selector = selector.trim();
	      // Remove spaces inside of selectors like `:nth-of-type` because it confuses SIMPLE_SELECTOR_SEP
	      selector = selector.replace(NTH, function (m, type, inner) {
	        return ':' + type + '(' + inner.replace(/\s/g, '') + ')';
	      });
	      selector = selector.replace(SLOTTED_START, HOST + ' $1');
	      selector = selector.replace(SIMPLE_SELECTOR_SEP, function (m, c, s) {
	        if (!stop) {
	          var info = _this._transformCompoundSelector(s, c, scope, hostScope);
	          stop = stop || info.stop;
	          c = info.combinator;
	          s = info.value;
	        }
	        return c + s;
	      });
	      return selector;
	    }
	  }, {
	    key: '_transformCompoundSelector',
	    value: function _transformCompoundSelector(selector, combinator, scope, hostScope) {
	      // replace :host with host scoping class
	      var slottedIndex = selector.indexOf(SLOTTED);
	      if (selector.indexOf(HOST) >= 0) {
	        selector = this._transformHostSelector(selector, hostScope);
	        // replace other selectors with scoping class
	      } else if (slottedIndex !== 0) {
	        selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
	      }
	      // mark ::slotted() scope jump to replace with descendant selector + arg
	      // also ignore left-side combinator
	      var slotted = false;
	      if (slottedIndex >= 0) {
	        combinator = '';
	        slotted = true;
	      }
	      // process scope jumping selectors up to the scope jump and then stop
	      var stop = void 0;
	      if (slotted) {
	        stop = true;
	        if (slotted) {
	          // .zonk ::slotted(.foo) -> .zonk.scope > .foo
	          selector = selector.replace(SLOTTED_PAREN, function (m, paren) {
	            return ' > ' + paren;
	          });
	        }
	      }
	      selector = selector.replace(DIR_PAREN, function (m, before, dir) {
	        return '[dir="' + dir + '"] ' + before + ', ' + before + '[dir="' + dir + '"]';
	      });
	      return { value: selector, combinator: combinator, stop: stop };
	    }
	  }, {
	    key: '_transformSimpleSelector',
	    value: function _transformSimpleSelector(selector, scope) {
	      var p$ = selector.split(PSEUDO_PREFIX);
	      p$[0] += scope;
	      return p$.join(PSEUDO_PREFIX);
	    }
	
	    // :host(...) -> scopeName...
	
	  }, {
	    key: '_transformHostSelector',
	    value: function _transformHostSelector(selector, hostScope) {
	      var m = selector.match(HOST_PAREN);
	      var paren = m && m[2].trim() || '';
	      if (paren) {
	        if (!paren[0].match(SIMPLE_SELECTOR_PREFIX)) {
	          // paren starts with a type selector
	          var typeSelector = paren.split(SIMPLE_SELECTOR_PREFIX)[0];
	          // if the type selector is our hostScope then avoid pre-pending it
	          if (typeSelector === hostScope) {
	            return paren;
	            // otherwise, this selector should not match in this scope so
	            // output a bogus selector.
	          } else {
	            return SELECTOR_NO_MATCH;
	          }
	        } else {
	          // make sure to do a replace here to catch selectors like:
	          // `:host(.foo)::before`
	          return selector.replace(HOST_PAREN, function (m, host, paren) {
	            return hostScope + paren;
	          });
	        }
	        // if no paren, do a straight :host replacement.
	        // TODO(sorvell): this should not strictly be necessary but
	        // it's needed to maintain support for `:host[foo]` type selectors
	        // which have been improperly used under Shady DOM. This should be
	        // deprecated.
	      } else {
	        return selector.replace(HOST, hostScope);
	      }
	    }
	  }, {
	    key: 'documentRule',
	    value: function documentRule(rule) {
	      // reset selector in case this is redone.
	      rule.selector = rule.parsedSelector;
	      this.normalizeRootSelector(rule);
	      this._transformRule(rule, this._transformDocumentSelector);
	    }
	  }, {
	    key: 'normalizeRootSelector',
	    value: function normalizeRootSelector(rule) {
	      if (rule.selector === ROOT) {
	        rule.selector = 'html';
	      }
	    }
	  }, {
	    key: '_transformDocumentSelector',
	    value: function _transformDocumentSelector(selector) {
	      return selector.match(SLOTTED) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
	    }
	  }, {
	    key: 'SCOPE_NAME',
	    get: function get() {
	      return SCOPE_NAME;
	    }
	  }]);
	
	  return StyleTransformer;
	}();
	
	var NTH = /:(nth[-\w]+)\(([^)]+)\)/;
	var SCOPE_DOC_SELECTOR = ':not(.' + SCOPE_NAME + ')';
	var COMPLEX_SELECTOR_SEP = ',';
	var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=\[])+)/g;
	var SIMPLE_SELECTOR_PREFIX = /[[.:#*]/;
	var HOST = ':host';
	var ROOT = ':root';
	var SLOTTED = '::slotted';
	var SLOTTED_START = new RegExp('^(' + SLOTTED + ')');
	// NOTE: this supports 1 nested () pair for things like
	// :host(:not([selected]), more general support requires
	// parsing which seems like overkill
	var HOST_PAREN = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/;
	// similar to HOST_PAREN
	var SLOTTED_PAREN = /(?:::slotted)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/;
	var DIR_PAREN = /(.*):dir\((?:(ltr|rtl))\)/;
	var CSS_CLASS_PREFIX = '.';
	var PSEUDO_PREFIX = ':';
	var CLASS = 'class';
	var SELECTOR_NO_MATCH = 'should_not_match';
	
	exports.default = new StyleTransformer();

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.rx = undefined;
	exports.toCssText = toCssText;
	exports.rulesForStyle = rulesForStyle;
	exports.isKeyframesSelector = isKeyframesSelector;
	exports.forEachRule = forEachRule;
	exports.applyCss = applyCss;
	exports.applyStyle = applyStyle;
	exports.createScopeStyle = createScopeStyle;
	exports.applyStylePlaceHolder = applyStylePlaceHolder;
	exports.isTargetedBuild = isTargetedBuild;
	exports.getCssBuildType = getCssBuildType;
	exports.processVariableAndFallback = processVariableAndFallback;
	exports.setElementClassRaw = setElementClassRaw;
	
	var _styleSettings = __webpack_require__(70);
	
	var _cssParse = __webpack_require__(69);
	
	function toCssText(rules, callback) {
	  if (typeof rules === 'string') {
	    rules = (0, _cssParse.parse)(rules);
	  }
	  if (callback) {
	    forEachRule(rules, callback);
	  }
	  return (0, _cssParse.stringify)(rules, _styleSettings.nativeCssVariables);
	}
	
	function rulesForStyle(style) {
	  if (!style.__cssRules && style.textContent) {
	    style.__cssRules = (0, _cssParse.parse)(style.textContent);
	  }
	  return style.__cssRules;
	}
	
	// Tests if a rule is a keyframes selector, which looks almost exactly
	// like a normal selector but is not (it has nothing to do with scoping
	// for example).
	function isKeyframesSelector(rule) {
	  return rule.parent && rule.parent.type === _cssParse.types.KEYFRAMES_RULE;
	}
	
	function forEachRule(node, styleRuleCallback, keyframesRuleCallback, onlyActiveRules) {
	  if (!node) {
	    return;
	  }
	  var skipRules = false;
	  if (onlyActiveRules) {
	    if (node.type === _cssParse.types.MEDIA_RULE) {
	      var matchMedia = node.selector.match(rx.MEDIA_MATCH);
	      if (matchMedia) {
	        // if rule is a non matching @media rule, skip subrules
	        if (!window.matchMedia(matchMedia[1]).matches) {
	          skipRules = true;
	        }
	      }
	    }
	  }
	  if (node.type === _cssParse.types.STYLE_RULE) {
	    styleRuleCallback(node);
	  } else if (keyframesRuleCallback && node.type === _cssParse.types.KEYFRAMES_RULE) {
	    keyframesRuleCallback(node);
	  } else if (node.type === _cssParse.types.MIXIN_RULE) {
	    skipRules = true;
	  }
	  var r$ = node.rules;
	  if (r$ && !skipRules) {
	    for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
	      forEachRule(r, styleRuleCallback, keyframesRuleCallback, onlyActiveRules);
	    }
	  }
	}
	
	// add a string of cssText to the document.
	function applyCss(cssText, moniker, target, contextNode) {
	  var style = createScopeStyle(cssText, moniker);
	  return applyStyle(style, target, contextNode);
	}
	
	function applyStyle(style, target, contextNode) {
	  target = target || document.head;
	  var after = contextNode && contextNode.nextSibling || target.firstChild;
	  lastHeadApplyNode = style;
	  return target.insertBefore(style, after);
	}
	
	function createScopeStyle(cssText, moniker) {
	  var style = document.createElement('style');
	  if (moniker) {
	    style.setAttribute('scope', moniker);
	  }
	  style.textContent = cssText;
	  return style;
	}
	
	var lastHeadApplyNode = null;
	
	// insert a comment node as a styling position placeholder.
	function applyStylePlaceHolder(moniker) {
	  var placeHolder = document.createComment(' Shady DOM styles for ' + moniker + ' ');
	  var after = lastHeadApplyNode ? lastHeadApplyNode.nextSibling : null;
	  var scope = document.head;
	  scope.insertBefore(placeHolder, after || scope.firstChild);
	  lastHeadApplyNode = placeHolder;
	  return placeHolder;
	}
	
	function isTargetedBuild(buildType) {
	  return _styleSettings.nativeShadow ? buildType === 'shadow' : buildType === 'shady';
	}
	
	// cssBuildTypeForModule: function (module) {
	//   let dm = Polymer.DomModule.import(module);
	//   if (dm) {
	//     return getCssBuildType(dm);
	//   }
	// },
	//
	function getCssBuildType(element) {
	  return element.getAttribute('css-build');
	}
	
	// Walk from text[start] matching parens
	// returns position of the outer end paren
	function findMatchingParen(text, start) {
	  var level = 0;
	  for (var i = start, l = text.length; i < l; i++) {
	    if (text[i] === '(') {
	      level++;
	    } else if (text[i] === ')') {
	      if (--level === 0) {
	        return i;
	      }
	    }
	  }
	  return -1;
	}
	
	function processVariableAndFallback(str, callback) {
	  // find 'var('
	  var start = str.indexOf('var(');
	  if (start === -1) {
	    // no var?, everything is prefix
	    return callback(str, '', '', '');
	  }
	  //${prefix}var(${inner})${suffix}
	  var end = findMatchingParen(str, start + 3);
	  var inner = str.substring(start + 4, end);
	  var prefix = str.substring(0, start);
	  // suffix may have other variables
	  var suffix = processVariableAndFallback(str.substring(end + 1), callback);
	  var comma = inner.indexOf(',');
	  // value and fallback args should be trimmed to match in property lookup
	  if (comma === -1) {
	    // variable, no fallback
	    return callback(prefix, inner.trim(), '', suffix);
	  }
	  // var(${value},${fallback})
	  var value = inner.substring(0, comma).trim();
	  var fallback = inner.substring(comma + 1).trim();
	  return callback(prefix, value, fallback, suffix);
	}
	
	function setElementClassRaw(element, value) {
	  // use native setAttribute provided by ShadyDOM when setAttribute is patched
	  if (window.ShadyDOM) {
	    window.ShadyDOM.nativeMethods.setAttribute.call(element, 'class', value);
	  } else {
	    element.setAttribute('class', value);
	  }
	}
	
	var rx = exports.rx = {
	  VAR_ASSIGN: /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\s}])|$)/gi,
	  MIXIN_MATCH: /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi,
	  VAR_CONSUMED: /(--[\w-]+)\s*([:,;)]|$)/gi,
	  ANIMATION_MATCH: /(animation\s*:)|(animation-name\s*:)/,
	  MEDIA_MATCH: /@media[^(]*(\([^)]*\))/,
	  IS_VAR: /^--/,
	  BRACKETED: /\{[^}]*\}/g,
	  HOST_PREFIX: '(?:^|[^.#[:])',
	  HOST_SUFFIX: '($|[.:[\\s>+~])'
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _cssParse = __webpack_require__(69);
	
	var _styleSettings = __webpack_require__(70);
	
	var _styleTransformer = __webpack_require__(71);
	
	var _styleTransformer2 = _interopRequireDefault(_styleTransformer);
	
	var _styleUtil = __webpack_require__(72);
	
	var StyleUtil = _interopRequireWildcard(_styleUtil);
	
	var _styleInfo = __webpack_require__(74);
	
	var _styleInfo2 = _interopRequireDefault(_styleInfo);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	// TODO: dedupe with shady
	var p = window.Element.prototype;
	var matchesSelector = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
	
	var IS_IE = navigator.userAgent.match('Trident');
	
	var XSCOPE_NAME = 'x-scope';
	
	var StyleProperties = function () {
	  function StyleProperties() {
	    _classCallCheck(this, StyleProperties);
	  }
	
	  _createClass(StyleProperties, [{
	    key: 'decorateStyles',
	
	    // decorates styles with rule info and returns an array of used style
	    // property names
	    value: function decorateStyles(rules) {
	      var self = this,
	          props = {},
	          keyframes = [],
	          ruleIndex = 0;
	      StyleUtil.forEachRule(rules, function (rule) {
	        self.decorateRule(rule);
	        // mark in-order position of ast rule in styles block, used for cache key
	        rule.index = ruleIndex++;
	        self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
	      }, function onKeyframesRule(rule) {
	        keyframes.push(rule);
	      });
	      // Cache all found keyframes rules for later reference:
	      rules._keyframes = keyframes;
	      // return this list of property names *consumes* in these styles.
	      var names = [];
	      for (var i in props) {
	        names.push(i);
	      }
	      return names;
	    }
	
	    // decorate a single rule with property info
	
	  }, {
	    key: 'decorateRule',
	    value: function decorateRule(rule) {
	      if (rule.propertyInfo) {
	        return rule.propertyInfo;
	      }
	      var info = {},
	          properties = {};
	      var hasProperties = this.collectProperties(rule, properties);
	      if (hasProperties) {
	        info.properties = properties;
	        // TODO(sorvell): workaround parser seeing mixins as additional rules
	        rule.rules = null;
	      }
	      info.cssText = this.collectCssText(rule);
	      rule.propertyInfo = info;
	      return info;
	    }
	
	    // collects the custom properties from a rule's cssText
	
	  }, {
	    key: 'collectProperties',
	    value: function collectProperties(rule, properties) {
	      var info = rule.propertyInfo;
	      if (info) {
	        if (info.properties) {
	          Object.assign(properties, info.properties);
	          return true;
	        }
	      } else {
	        var m = void 0,
	            rx = StyleUtil.rx.VAR_ASSIGN;
	        var cssText = rule.parsedCssText;
	        var value = void 0;
	        var any = void 0;
	        while (m = rx.exec(cssText)) {
	          // note: group 2 is var, 3 is mixin
	          value = (m[2] || m[3]).trim();
	          // value of 'inherit' or 'unset' is equivalent to not setting the property here
	          if (value !== 'inherit' || value !== 'unset') {
	            properties[m[1].trim()] = value;
	          }
	          any = true;
	        }
	        return any;
	      }
	    }
	
	    // returns cssText of properties that consume variables/mixins
	
	  }, {
	    key: 'collectCssText',
	    value: function collectCssText(rule) {
	      return this.collectConsumingCssText(rule.parsedCssText);
	    }
	
	    // NOTE: we support consumption inside mixin assignment
	    // but not production, so strip out {...}
	
	  }, {
	    key: 'collectConsumingCssText',
	    value: function collectConsumingCssText(cssText) {
	      return cssText.replace(StyleUtil.rx.BRACKETED, '').replace(StyleUtil.rx.VAR_ASSIGN, '');
	    }
	  }, {
	    key: 'collectPropertiesInCssText',
	    value: function collectPropertiesInCssText(cssText, props) {
	      var m = void 0;
	      while (m = StyleUtil.rx.VAR_CONSUMED.exec(cssText)) {
	        var name = m[1];
	        // This regex catches all variable names, and following non-whitespace char
	        // If next char is not ':', then variable is a consumer
	        if (m[2] !== ':') {
	          props[name] = true;
	        }
	      }
	    }
	
	    // turns custom properties into realized values.
	
	  }, {
	    key: 'reify',
	    value: function reify(props) {
	      // big perf optimization here: reify only *own* properties
	      // since this object has __proto__ of the element's scope properties
	      var names = Object.getOwnPropertyNames(props);
	      for (var i = 0, n; i < names.length; i++) {
	        n = names[i];
	        props[n] = this.valueForProperty(props[n], props);
	      }
	    }
	
	    // given a property value, returns the reified value
	    // a property value may be:
	    // (1) a literal value like: red or 5px;
	    // (2) a variable value like: var(--a), var(--a, red), or var(--a, --b) or
	    // var(--a, var(--b));
	    // (3) a literal mixin value like { properties }. Each of these properties
	    // can have values that are: (a) literal, (b) variables, (c) @apply mixins.
	
	  }, {
	    key: 'valueForProperty',
	    value: function valueForProperty(property, props) {
	      var _this = this;
	
	      // case (1) default
	      // case (3) defines a mixin and we have to reify the internals
	      if (property) {
	        if (property.indexOf(';') >= 0) {
	          property = this.valueForProperties(property, props);
	        } else {
	          (function () {
	            // case (2) variable
	            var self = _this;
	            var fn = function fn(prefix, value, fallback, suffix) {
	              if (!value) {
	                return prefix + suffix;
	              }
	              var propertyValue = self.valueForProperty(props[value], props);
	              // if value is "initial", then the variable should be treated as unset
	              if (!propertyValue || propertyValue === 'initial') {
	                // fallback may be --a or var(--a) or literal
	                propertyValue = self.valueForProperty(props[fallback] || fallback, props) || fallback;
	              } else if (propertyValue === 'apply-shim-inherit') {
	                // CSS build will replace `inherit` with `apply-shim-inherit`
	                // for use with native css variables.
	                // Since we have full control, we can use `inherit` directly.
	                propertyValue = 'inherit';
	              }
	              return prefix + (propertyValue || '') + suffix;
	            };
	            property = StyleUtil.processVariableAndFallback(property, fn);
	          })();
	        }
	      }
	      return property && property.trim() || '';
	    }
	
	    // note: we do not yet support mixin within mixin
	
	  }, {
	    key: 'valueForProperties',
	    value: function valueForProperties(property, props) {
	      var parts = property.split(';');
	      for (var i = 0, _p, m; i < parts.length; i++) {
	        if (_p = parts[i]) {
	          StyleUtil.rx.MIXIN_MATCH.lastIndex = 0;
	          m = StyleUtil.rx.MIXIN_MATCH.exec(_p);
	          if (m) {
	            _p = this.valueForProperty(props[m[1]], props);
	          } else {
	            var colon = _p.indexOf(':');
	            if (colon !== -1) {
	              var pp = _p.substring(colon);
	              pp = pp.trim();
	              pp = this.valueForProperty(pp, props) || pp;
	              _p = _p.substring(0, colon) + pp;
	            }
	          }
	          parts[i] = _p && _p.lastIndexOf(';') === _p.length - 1 ?
	          // strip trailing ;
	          _p.slice(0, -1) : _p || '';
	        }
	      }
	      return parts.join(';');
	    }
	  }, {
	    key: 'applyProperties',
	    value: function applyProperties(rule, props) {
	      var output = '';
	      // dynamically added sheets may not be decorated so ensure they are.
	      if (!rule.propertyInfo) {
	        this.decorateRule(rule);
	      }
	      if (rule.propertyInfo.cssText) {
	        output = this.valueForProperties(rule.propertyInfo.cssText, props);
	      }
	      rule.cssText = output;
	    }
	
	    // Apply keyframe transformations to the cssText of a given rule. The
	    // keyframeTransforms object is a map of keyframe names to transformer
	    // functions which take in cssText and spit out transformed cssText.
	
	  }, {
	    key: 'applyKeyframeTransforms',
	    value: function applyKeyframeTransforms(rule, keyframeTransforms) {
	      var input = rule.cssText;
	      var output = rule.cssText;
	      if (rule.hasAnimations == null) {
	        // Cache whether or not the rule has any animations to begin with:
	        rule.hasAnimations = StyleUtil.rx.ANIMATION_MATCH.test(input);
	      }
	      // If there are no animations referenced, we can skip transforms:
	      if (rule.hasAnimations) {
	        var transform = void 0;
	        // If we haven't transformed this rule before, we iterate over all
	        // transforms:
	        if (rule.keyframeNamesToTransform == null) {
	          rule.keyframeNamesToTransform = [];
	          for (var keyframe in keyframeTransforms) {
	            transform = keyframeTransforms[keyframe];
	            output = transform(input);
	            // If the transform actually changed the CSS text, we cache the
	            // transform name for future use:
	            if (input !== output) {
	              input = output;
	              rule.keyframeNamesToTransform.push(keyframe);
	            }
	          }
	        } else {
	          // If we already have a list of keyframe names that apply to this
	          // rule, we apply only those keyframe name transforms:
	          for (var i = 0; i < rule.keyframeNamesToTransform.length; ++i) {
	            transform = keyframeTransforms[rule.keyframeNamesToTransform[i]];
	            input = transform(input);
	          }
	          output = input;
	        }
	      }
	      rule.cssText = output;
	    }
	
	    // Test if the rules in these styles matches the given `element` and if so,
	    // collect any custom properties into `props`.
	
	  }, {
	    key: 'propertyDataFromStyles',
	    value: function propertyDataFromStyles(rules, element) {
	      var props = {},
	          self = this;
	      // generates a unique key for these matches
	      var o = [];
	      // note: active rules excludes non-matching @media rules
	      StyleUtil.forEachRule(rules, function (rule) {
	        // TODO(sorvell): we could trim the set of rules at declaration
	        // time to only include ones that have properties
	        if (!rule.propertyInfo) {
	          self.decorateRule(rule);
	        }
	        // match element against transformedSelector: selector may contain
	        // unwanted uniquification and parsedSelector does not directly match
	        // for :host selectors.
	        var selectorToMatch = rule.transformedSelector || rule.parsedSelector;
	        if (element && rule.propertyInfo.properties && selectorToMatch) {
	          if (matchesSelector.call(element, selectorToMatch)) {
	            self.collectProperties(rule, props);
	            // produce numeric key for these matches for lookup
	            addToBitMask(rule.index, o);
	          }
	        }
	      }, null, true);
	      return { properties: props, key: o };
	    }
	  }, {
	    key: 'whenHostOrRootRule',
	    value: function whenHostOrRootRule(scope, rule, cssBuild, callback) {
	      if (!rule.propertyInfo) {
	        this.decorateRule(rule);
	      }
	      if (!rule.propertyInfo.properties) {
	        return;
	      }
	      var hostScope = scope.is ? _styleTransformer2.default._calcHostScope(scope.is, scope.extends) : 'html';
	      var parsedSelector = rule.parsedSelector;
	      var isRoot = parsedSelector === ':host > *' || parsedSelector === 'html';
	      var isHost = parsedSelector.indexOf(':host') === 0 && !isRoot;
	      // build info is either in scope (when scope is an element) or in the style
	      // when scope is the default scope; note: this allows default scope to have
	      // mixed mode built and unbuilt styles.
	      if (cssBuild === 'shady') {
	        // :root -> x-foo > *.x-foo for elements and html for custom-style
	        isRoot = parsedSelector === hostScope + ' > *.' + hostScope || parsedSelector.indexOf('html') !== -1;
	        // :host -> x-foo for elements, but sub-rules have .x-foo in them
	        isHost = !isRoot && parsedSelector.indexOf(hostScope) === 0;
	      }
	      if (cssBuild === 'shadow') {
	        isRoot = parsedSelector === ':host > *' || parsedSelector === 'html';
	        isHost = isHost && !isRoot;
	      }
	      if (!isRoot && !isHost) {
	        return;
	      }
	      var selectorToMatch = hostScope;
	      if (isHost) {
	        // need to transform :host under ShadowDOM because `:host` does not work with `matches`
	        if (_styleSettings.nativeShadow && !rule.transformedSelector) {
	          // transform :host into a matchable selector
	          rule.transformedSelector = _styleTransformer2.default._transformRuleCss(rule, _styleTransformer2.default._transformComplexSelector, _styleTransformer2.default._calcElementScope(scope.is), hostScope);
	        }
	        selectorToMatch = rule.transformedSelector || hostScope;
	      }
	      callback({
	        selector: selectorToMatch,
	        isHost: isHost,
	        isRoot: isRoot
	      });
	    }
	  }, {
	    key: 'hostAndRootPropertiesForScope',
	    value: function hostAndRootPropertiesForScope(scope, rules) {
	      var hostProps = {},
	          rootProps = {},
	          self = this;
	      // note: active rules excludes non-matching @media rules
	      var cssBuild = rules && rules.__cssBuild;
	      StyleUtil.forEachRule(rules, function (rule) {
	        // if scope is StyleDefaults, use _element for matchesSelector
	        self.whenHostOrRootRule(scope, rule, cssBuild, function (info) {
	          var element = scope._element || scope;
	          if (matchesSelector.call(element, info.selector)) {
	            if (info.isHost) {
	              self.collectProperties(rule, hostProps);
	            } else {
	              self.collectProperties(rule, rootProps);
	            }
	          }
	        });
	      }, null, true);
	      return { rootProps: rootProps, hostProps: hostProps };
	    }
	  }, {
	    key: 'transformStyles',
	    value: function transformStyles(element, properties, scopeSelector) {
	      var self = this;
	      var hostSelector = _styleTransformer2.default._calcHostScope(element.is, element.extends);
	      var rxHostSelector = element.extends ? '\\' + hostSelector.slice(0, -1) + '\\]' : hostSelector;
	      var hostRx = new RegExp(StyleUtil.rx.HOST_PREFIX + rxHostSelector + StyleUtil.rx.HOST_SUFFIX);
	      var rules = _styleInfo2.default.get(element).styleRules;
	      var keyframeTransforms = this._elementKeyframeTransforms(element, rules, scopeSelector);
	      return _styleTransformer2.default.elementStyles(element, rules, function (rule) {
	        self.applyProperties(rule, properties);
	        if (!_styleSettings.nativeShadow && !StyleUtil.isKeyframesSelector(rule) && rule.cssText) {
	          // NOTE: keyframe transforms only scope munge animation names, so it
	          // is not necessary to apply them in ShadowDOM.
	          self.applyKeyframeTransforms(rule, keyframeTransforms);
	          self._scopeSelector(rule, hostRx, hostSelector, scopeSelector);
	        }
	      });
	    }
	  }, {
	    key: '_elementKeyframeTransforms',
	    value: function _elementKeyframeTransforms(element, rules, scopeSelector) {
	      var keyframesRules = rules._keyframes;
	      var keyframeTransforms = {};
	      if (!_styleSettings.nativeShadow && keyframesRules) {
	        // For non-ShadowDOM, we transform all known keyframes rules in
	        // advance for the current scope. This allows us to catch keyframes
	        // rules that appear anywhere in the stylesheet:
	        for (var i = 0, keyframesRule = keyframesRules[i]; i < keyframesRules.length; keyframesRule = keyframesRules[++i]) {
	          this._scopeKeyframes(keyframesRule, scopeSelector);
	          keyframeTransforms[keyframesRule.keyframesName] = this._keyframesRuleTransformer(keyframesRule);
	        }
	      }
	      return keyframeTransforms;
	    }
	
	    // Generate a factory for transforming a chunk of CSS text to handle a
	    // particular scoped keyframes rule.
	
	  }, {
	    key: '_keyframesRuleTransformer',
	    value: function _keyframesRuleTransformer(keyframesRule) {
	      return function (cssText) {
	        return cssText.replace(keyframesRule.keyframesNameRx, keyframesRule.transformedKeyframesName);
	      };
	    }
	
	    // Transforms `@keyframes` names to be unique for the current host.
	    // Example: @keyframes foo-anim -> @keyframes foo-anim-x-foo-0
	
	  }, {
	    key: '_scopeKeyframes',
	    value: function _scopeKeyframes(rule, scopeId) {
	      rule.keyframesNameRx = new RegExp(rule.keyframesName, 'g');
	      rule.transformedKeyframesName = rule.keyframesName + '-' + scopeId;
	      rule.transformedSelector = rule.transformedSelector || rule.selector;
	      rule.selector = rule.transformedSelector.replace(rule.keyframesName, rule.transformedKeyframesName);
	    }
	
	    // Strategy: x scope shim a selector e.g. to scope `.x-foo-42` (via classes):
	    // non-host selector: .a.x-foo -> .x-foo-42 .a.x-foo
	    // host selector: x-foo.wide -> .x-foo-42.wide
	    // note: we use only the scope class (.x-foo-42) and not the hostSelector
	    // (x-foo) to scope :host rules; this helps make property host rules
	    // have low specificity. They are overrideable by class selectors but,
	    // unfortunately, not by type selectors (e.g. overriding via
	    // `.special` is ok, but not by `x-foo`).
	
	  }, {
	    key: '_scopeSelector',
	    value: function _scopeSelector(rule, hostRx, hostSelector, scopeId) {
	      rule.transformedSelector = rule.transformedSelector || rule.selector;
	      var selector = rule.transformedSelector;
	      var scope = '.' + scopeId;
	      var parts = selector.split(',');
	      for (var i = 0, l = parts.length, _p2; i < l && (_p2 = parts[i]); i++) {
	        parts[i] = _p2.match(hostRx) ? _p2.replace(hostSelector, scope) : scope + ' ' + _p2;
	      }
	      rule.selector = parts.join(',');
	    }
	  }, {
	    key: 'applyElementScopeSelector',
	    value: function applyElementScopeSelector(element, selector, old) {
	      var c = element.getAttribute('class') || '';
	      var v = c;
	      if (old) {
	        v = c.replace(new RegExp('\\s*' + XSCOPE_NAME + '\\s*' + old + '\\s*', 'g'), ' ');
	      }
	      v += (v ? ' ' : '') + XSCOPE_NAME + ' ' + selector;
	      if (c !== v) {
	        StyleUtil.setElementClassRaw(element, v);
	      }
	    }
	  }, {
	    key: 'applyElementStyle',
	    value: function applyElementStyle(element, properties, selector, style) {
	      // calculate cssText to apply
	      var cssText = style ? style.textContent || '' : this.transformStyles(element, properties, selector);
	      // if shady and we have a cached style that is not style, decrement
	      var styleInfo = _styleInfo2.default.get(element);
	      var s = styleInfo.customStyle;
	      if (s && !_styleSettings.nativeShadow && s !== style) {
	        s._useCount--;
	        if (s._useCount <= 0 && s.parentNode) {
	          s.parentNode.removeChild(s);
	        }
	      }
	      // apply styling always under native or if we generated style
	      // or the cached style is not in document(!)
	      if (_styleSettings.nativeShadow) {
	        // update existing style only under native
	        if (styleInfo.customStyle) {
	          styleInfo.customStyle.textContent = cssText;
	          style = styleInfo.customStyle;
	          // otherwise, if we have css to apply, do so
	        } else if (cssText) {
	          // apply css after the scope style of the element to help with
	          // style precedence rules.
	          style = StyleUtil.applyCss(cssText, selector, element.shadowRoot, styleInfo.placeholder);
	        }
	      } else {
	        // shady and no cache hit
	        if (!style) {
	          // apply css after the scope style of the element to help with
	          // style precedence rules.
	          if (cssText) {
	            style = StyleUtil.applyCss(cssText, selector, null, styleInfo.placeholder);
	          }
	          // shady and cache hit but not in document
	        } else if (!style.parentNode) {
	          StyleUtil.applyStyle(style, null, styleInfo.placeholder);
	        }
	      }
	      // ensure this style is our custom style and increment its use count.
	      if (style) {
	        style._useCount = style._useCount || 0;
	        // increment use count if we changed styles
	        if (styleInfo.customStyle != style) {
	          style._useCount++;
	        }
	        styleInfo.customStyle = style;
	      }
	      // @media rules may be stale in IE 10 and 11
	      if (IS_IE) {
	        style.textContent = style.textContent;
	      }
	      return style;
	    }
	  }, {
	    key: 'applyCustomStyle',
	    value: function applyCustomStyle(style, properties) {
	      var rules = StyleUtil.rulesForStyle(style);
	      var self = this;
	      style.textContent = StyleUtil.toCssText(rules, function (rule) {
	        var css = rule.cssText = rule.parsedCssText;
	        if (rule.propertyInfo && rule.propertyInfo.cssText) {
	          // remove property assignments
	          // so next function isn't confused
	          // NOTE: we have 3 categories of css:
	          // (1) normal properties,
	          // (2) custom property assignments (--foo: red;),
	          // (3) custom property usage: border: var(--foo); @apply(--foo);
	          // In elements, 1 and 3 are separated for efficiency; here they
	          // are not and this makes this case unique.
	          css = (0, _cssParse.removeCustomPropAssignment)(css);
	          // replace with reified properties, scenario is same as mixin
	          rule.cssText = self.valueForProperties(css, properties);
	        }
	      });
	    }
	  }, {
	    key: 'XSCOPE_NAME',
	    get: function get() {
	      return XSCOPE_NAME;
	    }
	  }]);
	
	  return StyleProperties;
	}();
	
	function addToBitMask(n, bits) {
	  var o = parseInt(n / 32);
	  var v = 1 << n % 32;
	  bits[o] = (bits[o] || 0) | v;
	}
	
	exports.default = new StyleProperties();

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _templateMap = __webpack_require__(75);
	
	var _templateMap2 = _interopRequireDefault(_templateMap);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var promise = Promise.resolve();
	
	var StyleInfo = function () {
	  _createClass(StyleInfo, null, [{
	    key: 'get',
	    value: function get(node) {
	      return node.__styleInfo;
	    }
	  }, {
	    key: 'set',
	    value: function set(node, styleInfo) {
	      node.__styleInfo = styleInfo;
	      return styleInfo;
	    }
	  }, {
	    key: 'invalidate',
	    value: function invalidate(elementName) {
	      if (_templateMap2.default[elementName]) {
	        _templateMap2.default[elementName]._applyShimInvalid = true;
	      }
	    }
	    /*
	    the template is marked as `validating` for one microtask so that all instances
	    found in the tree crawl of `applyStyle` will update themselves,
	    but the template will only be updated once.
	    */
	
	  }, {
	    key: 'startValidating',
	    value: function startValidating(elementName) {
	      var template = _templateMap2.default[elementName];
	      if (!template._validating) {
	        template._validating = true;
	        promise.then(function () {
	          template._applyShimInvalid = false;
	          template._validating = false;
	        });
	      }
	    }
	  }]);
	
	  function StyleInfo(ast, placeholder, ownStylePropertyNames, elementName, typeExtension, cssBuild) {
	    _classCallCheck(this, StyleInfo);
	
	    this.styleRules = ast || null;
	    this.placeholder = placeholder || null;
	    this.ownStylePropertyNames = ownStylePropertyNames || [];
	    this.overrideStyleProperties = null;
	    this.elementName = elementName || '';
	    this.cssBuild = cssBuild || '';
	    this.typeExtension = typeExtension || '';
	    this.styleProperties = null;
	    this.scopeSelector = null;
	    this.customStyle = null;
	  }
	
	  return StyleInfo;
	}();
	
	exports.default = StyleInfo;

/***/ },
/* 75 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {};

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _styleUtil = __webpack_require__(72);
	
	var _styleSettings = __webpack_require__(70);
	
	var placeholderMap = {};
	
	var ce = window.customElements;
	if (ce && !_styleSettings.nativeShadow) {
	  (function () {
	    var origDefine = ce.define;
	    ce.define = function (name, clazz, options) {
	      placeholderMap[name] = (0, _styleUtil.applyStylePlaceHolder)(name);
	      return origDefine.call(ce, name, clazz, options);
	    };
	  })();
	}
	
	exports.default = placeholderMap;

/***/ },
/* 77 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var StyleCache = function () {
	  function StyleCache() {
	    var typeMax = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
	
	    _classCallCheck(this, StyleCache);
	
	    // map element name -> [{properties, styleElement, scopeSelector}]
	    this.cache = {};
	    this.typeMax = typeMax;
	  }
	
	  _createClass(StyleCache, [{
	    key: '_validate',
	    value: function _validate(cacheEntry, properties, ownPropertyNames) {
	      for (var idx = 0; idx < ownPropertyNames.length; idx++) {
	        var pn = ownPropertyNames[idx];
	        if (cacheEntry.properties[pn] !== properties[pn]) {
	          return false;
	        }
	      }
	      return true;
	    }
	  }, {
	    key: 'store',
	    value: function store(tagname, properties, styleElement, scopeSelector) {
	      var list = this.cache[tagname] || [];
	      list.push({ properties: properties, styleElement: styleElement, scopeSelector: scopeSelector });
	      if (list.length > this.typeMax) {
	        list.shift();
	      }
	      this.cache[tagname] = list;
	    }
	  }, {
	    key: 'fetch',
	    value: function fetch(tagname, properties, ownPropertyNames) {
	      var list = this.cache[tagname];
	      if (!list) {
	        return;
	      }
	      // reverse list for most-recent lookups
	      for (var idx = list.length - 1; idx >= 0; idx--) {
	        var entry = list[idx];
	        if (this._validate(entry, properties, ownPropertyNames)) {
	          return entry;
	        }
	      }
	    }
	  }]);
	
	  return StyleCache;
	}();
	
	exports.default = StyleCache;

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	/**
	 * The apply shim simulates the behavior of `@apply` proposed at
	 * https://tabatkins.github.io/specs/css-apply-rule/.
	 * The approach is to convert a property like this:
	 *
	 *    --foo: {color: red; background: blue;}
	 *
	 * to this:
	 *
	 *    --foo_-_color: red;
	 *    --foo_-_background: blue;
	 *
	 * Then where `@apply --foo` is used, that is converted to:
	 *
	 *    color: var(--foo_-_color);
	 *    background: var(--foo_-_background);
	 *
	 * This approach generally works but there are some issues and limitations.
	 * Consider, for example, that somewhere *between* where `--foo` is set and used,
	 * another element sets it to:
	 *
	 *    --foo: { border: 2px solid red; }
	 *
	 * We must now ensure that the color and background from the previous setting
	 * do not apply. This is accomplished by changing the property set to this:
	 *
	 *    --foo_-_border: 2px solid red;
	 *    --foo_-_color: initial;
	 *    --foo_-_background: initial;
	 *
	 * This works but introduces one new issue.
	 * Consider this setup at the point where the `@apply` is used:
	 *
	 *    background: orange;
	 *    @apply --foo;
	 *
	 * In this case the background will be unset (initial) rather than the desired
	 * `orange`. We address this by altering the property set to use a fallback
	 * value like this:
	 *
	 *    color: var(--foo_-_color);
	 *    background: var(--foo_-_background, orange);
	 *    border: var(--foo_-_border);
	 *
	 * Note that the default is retained in the property set and the `background` is
	 * the desired `orange`. This leads us to a limitation.
	 *
	 * Limitation 1:
	
	 * Only properties in the rule where the `@apply`
	 * is used are considered as default values.
	 * If another rule matches the element and sets `background` with
	 * less specificity than the rule in which `@apply` appears,
	 * the `background` will not be set.
	 *
	 * Limitation 2:
	 *
	 * When using Polymer's `updateStyles` api, new properties may not be set for
	 * `@apply` properties.
	
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _styleUtil = __webpack_require__(72);
	
	var _templateMap = __webpack_require__(75);
	
	var _templateMap2 = _interopRequireDefault(_templateMap);
	
	var _styleInfo = __webpack_require__(74);
	
	var _styleInfo2 = _interopRequireDefault(_styleInfo);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var MIXIN_MATCH = _styleUtil.rx.MIXIN_MATCH;
	var VAR_ASSIGN = _styleUtil.rx.VAR_ASSIGN;
	
	var APPLY_NAME_CLEAN = /;\s*/m;
	var INITIAL_INHERIT = /^\s*(initial)|(inherit)\s*$/;
	
	// separator used between mixin-name and mixin-property-name when producing properties
	// NOTE: plain '-' may cause collisions in user styles
	var MIXIN_VAR_SEP = '_-_';
	
	// map of mixin to property names
	// --foo: {border: 2px} -> {properties: {(--foo, ['border'])}, dependants: {'element-name': proto}}
	
	var MixinMap = function () {
	  function MixinMap() {
	    _classCallCheck(this, MixinMap);
	
	    this._map = {};
	  }
	
	  _createClass(MixinMap, [{
	    key: 'set',
	    value: function set(name, props) {
	      name = name.trim();
	      this._map[name] = {
	        properties: props,
	        dependants: {}
	      };
	    }
	  }, {
	    key: 'get',
	    value: function get(name) {
	      name = name.trim();
	      return this._map[name];
	    }
	  }]);
	
	  return MixinMap;
	}();
	
	var ApplyShim = function () {
	  function ApplyShim() {
	    var _this = this;
	
	    _classCallCheck(this, ApplyShim);
	
	    this._currentTemplate = null;
	    this._measureElement = null;
	    this._map = new MixinMap();
	    this._separator = MIXIN_VAR_SEP;
	    this._boundProduceCssProperties = function (matchText, propertyName, valueProperty, valueMixin) {
	      return _this._produceCssProperties(matchText, propertyName, valueProperty, valueMixin);
	    };
	  }
	  // return true if `cssText` contains a mixin definition or consumption
	
	
	  _createClass(ApplyShim, [{
	    key: 'detectMixin',
	    value: function detectMixin(cssText) {
	      var has = MIXIN_MATCH.test(cssText) || VAR_ASSIGN.test(cssText);
	      // reset state of the regexes
	      MIXIN_MATCH.lastIndex = 0;
	      VAR_ASSIGN.lastIndex = 0;
	      return has;
	    }
	  }, {
	    key: 'transformStyle',
	    value: function transformStyle(style, elementName) {
	      var ast = (0, _styleUtil.rulesForStyle)(style);
	      this.transformRules(ast, elementName);
	      return ast;
	    }
	  }, {
	    key: 'transformRules',
	    value: function transformRules(rules, elementName) {
	      var _this2 = this;
	
	      this._currentTemplate = _templateMap2.default[elementName];
	      (0, _styleUtil.forEachRule)(rules, function (r) {
	        _this2.transformRule(r);
	      });
	      this._currentTemplate = null;
	    }
	  }, {
	    key: 'transformRule',
	    value: function transformRule(rule) {
	      rule.cssText = this.transformCssText(rule.parsedCssText);
	      // :root was only used for variable assignment in property shim,
	      // but generates invalid selectors with real properties.
	      // replace with `:host > *`, which serves the same effect
	      if (rule.selector === ':root') {
	        rule.selector = ':host > *';
	      }
	    }
	  }, {
	    key: 'transformCssText',
	    value: function transformCssText(cssText) {
	      // produce variables
	      cssText = cssText.replace(VAR_ASSIGN, this._boundProduceCssProperties);
	      // consume mixins
	      return this._consumeCssProperties(cssText);
	    }
	  }, {
	    key: '_getInitialValueForProperty',
	    value: function _getInitialValueForProperty(property) {
	      if (!this._measureElement) {
	        this._measureElement = document.createElement('meta');
	        this._measureElement.style.all = 'initial';
	        document.head.appendChild(this._measureElement);
	      }
	      return window.getComputedStyle(this._measureElement).getPropertyValue(property);
	    }
	    // replace mixin consumption with variable consumption
	
	  }, {
	    key: '_consumeCssProperties',
	    value: function _consumeCssProperties(text) {
	      var m = void 0;
	      // loop over text until all mixins with defintions have been applied
	      while (m = MIXIN_MATCH.exec(text)) {
	        var matchText = m[0];
	        var mixinName = m[1];
	        var idx = m.index;
	        // collect properties before apply to be "defaults" if mixin might override them
	        // match includes a "prefix", so find the start and end positions of @apply
	        var applyPos = idx + matchText.indexOf('@apply');
	        var afterApplyPos = idx + matchText.length;
	        // find props defined before this @apply
	        var textBeforeApply = text.slice(0, applyPos);
	        var textAfterApply = text.slice(afterApplyPos);
	        var defaults = this._cssTextToMap(textBeforeApply);
	        var replacement = this._atApplyToCssProperties(mixinName, defaults);
	        // use regex match position to replace mixin, keep linear processing time
	        text = [textBeforeApply, replacement, textAfterApply].join('');
	        // move regex search to _after_ replacement
	        MIXIN_MATCH.lastIndex = idx + replacement.length;
	      }
	      return text;
	    }
	    // produce variable consumption at the site of mixin consumption
	    // @apply --foo; -> for all props (${propname}: var(--foo_-_${propname}, ${fallback[propname]}}))
	    // Example:
	    // border: var(--foo_-_border); padding: var(--foo_-_padding, 2px)
	
	  }, {
	    key: '_atApplyToCssProperties',
	    value: function _atApplyToCssProperties(mixinName, fallbacks) {
	      mixinName = mixinName.replace(APPLY_NAME_CLEAN, '');
	      var vars = [];
	      var mixinEntry = this._map.get(mixinName);
	      // if we depend on a mixin before it is created
	      // make a sentinel entry in the map to add this element as a dependency for when it is defined.
	      if (!mixinEntry) {
	        this._map.set(mixinName, {});
	        mixinEntry = this._map.get(mixinName);
	      }
	      if (mixinEntry) {
	        if (this._currentTemplate) {
	          mixinEntry.dependants[this._currentTemplate.name] = this._currentTemplate;
	        }
	        var p = void 0,
	            parts = void 0,
	            f = void 0;
	        for (p in mixinEntry.properties) {
	          f = fallbacks && fallbacks[p];
	          parts = [p, ': var(', mixinName, MIXIN_VAR_SEP, p];
	          if (f) {
	            parts.push(',', f);
	          }
	          parts.push(')');
	          vars.push(parts.join(''));
	        }
	      }
	      return vars.join('; ');
	    }
	  }, {
	    key: '_replaceInitialOrInherit',
	    value: function _replaceInitialOrInherit(property, value) {
	      var match = INITIAL_INHERIT.exec(value);
	      if (match) {
	        if (match[1]) {
	          // initial
	          // replace `initial` with the concrete initial value for this property
	          value = ApplyShim._getInitialValueForProperty(property);
	        } else {
	          // inherit
	          // with this purposfully illegal value, the variable will be invalid at
	          // compute time (https://www.w3.org/TR/css-variables/#invalid-at-computed-value-time)
	          // and for inheriting values, will behave similarly
	          // we cannot support the same behavior for non inheriting values like 'border'
	          value = 'apply-shim-inherit';
	        }
	      }
	      return value;
	    }
	
	    // "parse" a mixin definition into a map of properties and values
	    // cssTextToMap('border: 2px solid black') -> ('border', '2px solid black')
	
	  }, {
	    key: '_cssTextToMap',
	    value: function _cssTextToMap(text) {
	      var props = text.split(';');
	      var property = void 0,
	          value = void 0;
	      var out = {};
	      for (var i = 0, p, sp; i < props.length; i++) {
	        p = props[i];
	        if (p) {
	          sp = p.split(':');
	          // ignore lines that aren't definitions like @media
	          if (sp.length > 1) {
	            property = sp[0].trim();
	            // some properties may have ':' in the value, like data urls
	            value = this._replaceInitialOrInherit(property, sp.slice(1).join(':'));
	            out[property] = value;
	          }
	        }
	      }
	      return out;
	    }
	  }, {
	    key: '_invalidateMixinEntry',
	    value: function _invalidateMixinEntry(mixinEntry) {
	      for (var elementName in mixinEntry.dependants) {
	        if (!this._currentTemplate || elementName !== this._currentTemplate.name) {
	          _styleInfo2.default.invalidate(elementName);
	        }
	      }
	    }
	  }, {
	    key: '_produceCssProperties',
	    value: function _produceCssProperties(matchText, propertyName, valueProperty, valueMixin) {
	      var _this3 = this;
	
	      // handle case where property value is a mixin
	      if (valueProperty) {
	        // form: --mixin2: var(--mixin1), where --mixin1 is in the map
	        (0, _styleUtil.processVariableAndFallback)(valueProperty, function (prefix, value) {
	          if (value && _this3._map.get(value)) {
	            valueMixin = '@apply ' + value + ';';
	          }
	        });
	      }
	      if (!valueMixin) {
	        return matchText;
	      }
	      var mixinAsProperties = this._consumeCssProperties(valueMixin);
	      var prefix = matchText.slice(0, matchText.indexOf('--'));
	      var mixinValues = this._cssTextToMap(mixinAsProperties);
	      var combinedProps = mixinValues;
	      var mixinEntry = this._map.get(propertyName);
	      var oldProps = mixinEntry && mixinEntry.properties;
	      if (oldProps) {
	        // NOTE: since we use mixin, the map of properties is updated here
	        // and this is what we want.
	        combinedProps = Object.assign(Object.create(oldProps), mixinValues);
	      } else {
	        this._map.set(propertyName, combinedProps);
	      }
	      var out = [];
	      var p = void 0,
	          v = void 0;
	      // set variables defined by current mixin
	      var needToInvalidate = false;
	      for (p in combinedProps) {
	        v = mixinValues[p];
	        // if property not defined by current mixin, set initial
	        if (v === undefined) {
	          v = 'initial';
	        }
	        if (oldProps && !(p in oldProps)) {
	          needToInvalidate = true;
	        }
	        out.push(propertyName + MIXIN_VAR_SEP + p + ': ' + v);
	      }
	      if (needToInvalidate) {
	        this._invalidateMixinEntry(mixinEntry);
	      }
	      if (mixinEntry) {
	        mixinEntry.properties = combinedProps;
	      }
	      // because the mixinMap is global, the mixin might conflict with
	      // a different scope's simple variable definition:
	      // Example:
	      // some style somewhere:
	      // --mixin1:{ ... }
	      // --mixin2: var(--mixin1);
	      // some other element:
	      // --mixin1: 10px solid red;
	      // --foo: var(--mixin1);
	      // In this case, we leave the original variable definition in place.
	      if (valueProperty) {
	        prefix = matchText + ';' + prefix;
	      }
	      return prefix + out.join('; ') + ';';
	    }
	  }]);
	
	  return ApplyShim;
	}();
	
	var applyShim = new ApplyShim();
	window['ApplyShim'] = applyShim;
	exports.default = applyShim;

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.flush = undefined;
	
	var _styleSettings = __webpack_require__(70);
	
	var _styleTransformer = __webpack_require__(71);
	
	var _styleTransformer2 = _interopRequireDefault(_styleTransformer);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var flush = exports.flush = function flush() {};
	
	if (!_styleSettings.nativeShadow) {
	  (function () {
	    var elementNeedsScoping = function elementNeedsScoping(element) {
	      return element.classList && !element.classList.contains(_styleTransformer2.default.SCOPE_NAME) ||
	      // note: necessary for IE11
	      element instanceof SVGElement && (!element.hasAttribute('class') || element.getAttribute('class').indexOf(_styleTransformer2.default.SCOPE_NAME) < 0);
	    };
	
	    var handler = function handler(mxns) {
	      for (var x = 0; x < mxns.length; x++) {
	        var mxn = mxns[x];
	        if (mxn.target === document.documentElement || mxn.target === document.head) {
	          continue;
	        }
	        for (var i = 0; i < mxn.addedNodes.length; i++) {
	          var n = mxn.addedNodes[i];
	          if (elementNeedsScoping(n)) {
	            var root = n.getRootNode();
	            if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
	              // may no longer be in a shadowroot
	              var host = root.host;
	              if (host) {
	                var scope = host.is || host.localName;
	                _styleTransformer2.default.dom(n, scope);
	              }
	            }
	          }
	        }
	        for (var _i = 0; _i < mxn.removedNodes.length; _i++) {
	          var _n = mxn.removedNodes[_i];
	          if (_n.nodeType === Node.ELEMENT_NODE) {
	            var classes = undefined;
	            if (_n.classList) {
	              classes = Array.from(_n.classList);
	            } else if (_n.hasAttribute('class')) {
	              classes = _n.getAttribute('class').split(/\s+/);
	            }
	            if (classes !== undefined) {
	              // NOTE: relies on the scoping class always being adjacent to the
	              // SCOPE_NAME class.
	              var classIdx = classes.indexOf(_styleTransformer2.default.SCOPE_NAME);
	              if (classIdx >= 0) {
	                var _scope = classes[classIdx + 1];
	                if (_scope) {
	                  _styleTransformer2.default.dom(_n, _scope, true);
	                }
	              }
	            }
	          }
	        }
	      }
	    };
	
	    var observer = new MutationObserver(handler);
	    var start = function start(node) {
	      observer.observe(node, { childList: true, subtree: true });
	    };
	    var nativeCustomElements = window.customElements && !window.customElements.flush;
	    // need to start immediately with native custom elements
	    // TODO(dfreedm): with polyfilled HTMLImports and native custom elements
	    // excessive mutations may be observed; this can be optimized via cooperation
	    // with the HTMLImports polyfill.
	    if (nativeCustomElements) {
	      start(document);
	    } else {
	      (function () {
	        var delayedStart = function delayedStart() {
	          start(document.body);
	        };
	        // use polyfill timing if it's available
	        if (window.HTMLImports) {
	          window.HTMLImports.whenReady(delayedStart);
	          // otherwise push beyond native imports being ready
	          // which requires RAF + readystate interactive.
	        } else {
	          requestAnimationFrame(function () {
	            if (document.readyState === 'loading') {
	              (function () {
	                var listener = function listener() {
	                  delayedStart();
	                  document.removeEventListener('readystatechange', listener);
	                };
	                document.addEventListener('readystatechange', listener);
	              })();
	            } else {
	              delayedStart();
	            }
	          });
	        }
	      })();
	    }
	
	    exports.flush = flush = function flush() {
	      handler(observer.takeRecords());
	    };
	  })();
	}

/***/ },
/* 80 */
/***/ function(module, exports) {

	/**
	@license
	Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
	This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	Code distributed by Google as part of the polymer project is also
	subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	*/
	
	/*
	Wrapper over <style> elements to co-operate with ShadyCSS
	
	Example:
	<custom-style>
	  <style>
	  ...
	  </style>
	</custom-style>
	*/
	
	'use strict';
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ShadyCSS = window.ShadyCSS;
	
	var enqueued = false;
	
	var customStyles = [];
	
	var hookFn = null;
	
	/*
	If a page only has <custom-style> elements, it will flash unstyled content,
	as all the instances will boot asynchronously after page load.
	
	Calling ShadyCSS.updateStyles() will force the work to happen synchronously
	*/
	function enqueueDocumentValidation() {
	  if (enqueued) {
	    return;
	  }
	  enqueued = true;
	  if (window.HTMLImports) {
	    window.HTMLImports.whenReady(validateDocument);
	  } else if (document.readyState === 'complete') {
	    validateDocument();
	  } else {
	    document.addEventListener('readystatechange', function () {
	      if (document.readyState === 'complete') {
	        validateDocument();
	      }
	    });
	  }
	}
	
	function validateDocument() {
	  requestAnimationFrame(function () {
	    if (enqueued || ShadyCSS._elementsHaveApplied) {
	      ShadyCSS.updateStyles();
	    }
	    enqueued = false;
	  });
	}
	
	var CustomStyle = function (_HTMLElement) {
	  _inherits(CustomStyle, _HTMLElement);
	
	  _createClass(CustomStyle, null, [{
	    key: 'findStyles',
	    value: function findStyles() {
	      for (var i = 0; i < customStyles.length; i++) {
	        var c = customStyles[i];
	        if (!c._style) {
	          var style = c.querySelector('style');
	          if (!style) {
	            continue;
	          }
	          // HTMLImports polyfill may have cloned the style into the main document,
	          // which is referenced with __appliedElement.
	          // Also, we must copy over the attributes.
	          if (style.__appliedElement) {
	            for (var _i = 0; _i < style.attributes.length; _i++) {
	              var attr = style.attributes[_i];
	              style.__appliedElement.setAttribute(attr.name, attr.value);
	            }
	          }
	          c._style = style.__appliedElement || style;
	          if (hookFn) {
	            hookFn(c._style);
	          }
	          ShadyCSS._transformCustomStyleForDocument(c._style);
	        }
	      }
	    }
	  }, {
	    key: '_revalidateApplyShim',
	    value: function _revalidateApplyShim() {
	      for (var i = 0; i < customStyles.length; i++) {
	        var c = customStyles[i];
	        if (c._style) {
	          ShadyCSS._revalidateApplyShim(c._style);
	        }
	      }
	    }
	  }, {
	    key: 'applyStyles',
	    value: function applyStyles() {
	      for (var i = 0; i < customStyles.length; i++) {
	        var c = customStyles[i];
	        if (c._style) {
	          ShadyCSS._applyCustomStyleToDocument(c._style);
	        }
	      }
	      enqueued = false;
	    }
	  }, {
	    key: '_customStyles',
	    get: function get() {
	      return customStyles;
	    }
	  }, {
	    key: 'processHook',
	    get: function get() {
	      return hookFn;
	    },
	    set: function set(fn) {
	      hookFn = fn;
	    }
	  }, {
	    key: '_documentDirty',
	    get: function get() {
	      return enqueued;
	    }
	  }]);
	
	  function CustomStyle() {
	    _classCallCheck(this, CustomStyle);
	
	    var _this = _possibleConstructorReturn(this, (CustomStyle.__proto__ || Object.getPrototypeOf(CustomStyle)).call(this));
	
	    customStyles.push(_this);
	    enqueueDocumentValidation();
	    return _this;
	  }
	
	  return CustomStyle;
	}(HTMLElement);
	
	window['CustomStyle'] = CustomStyle;
	window.customElements.define('custom-style', CustomStyle);

/***/ }
/******/ ])
});
;

},{}],4:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("incremental-dom"));
	else if(typeof define === 'function' && define.amd)
		define(["incremental-dom"], factory);
	else if(typeof exports === 'object')
		exports["skate"] = factory(require("incremental-dom"));
	else
		root["skate"] = factory(root["IncrementalDOM"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_14__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 38);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return connected; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return created; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return name; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return ctorCreateInitProps; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return ctorObservedAttributes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return ctorProps; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return ctorPropsMap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return props; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ref; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return renderer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return rendering; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return rendererDebounced; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return updated; });
var connected = '____skate_connected';
var created = '____skate_created';

// DEPRECATED
//
// This is the only "symbol" that must stay a string. This is because it is
// relied upon across several versions. We should remove it, but ensure that
// it's considered a breaking change that whatever version removes it cannot
// be passed to vdom functions as tag names.
var name = '____skate_name';

// Used on the Constructor
var ctorCreateInitProps = '____skate_ctor_createInitProps';
var ctorObservedAttributes = '____skate_ctor_observedAttributes';
var ctorProps = '____skate_ctor_props';
var ctorPropsMap = '____skate_ctor_propsMap';

// Used on the Element
var props = '____skate_props';
var ref = '____skate_ref';
var renderer = '____skate_renderer';
var rendering = '____skate_rendering';
var rendererDebounced = '____skate_rendererDebounced';
var updated = '____skate_updated';

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__is_type__ = __webpack_require__(2);
/* harmony export (immutable) */ __webpack_exports__["a"] = getPropNamesAndSymbols;

/**
 * Returns array of owned property names and symbols for the given object
 */
function getPropNamesAndSymbols() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var listOfKeys = Object.getOwnPropertyNames(obj);
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__is_type__["a" /* isFunction */])(Object.getOwnPropertySymbols) ? listOfKeys.concat(Object.getOwnPropertySymbols(obj)) : listOfKeys;
}

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return isFunction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return isObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return isString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return isSymbol; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return isUndefined; });
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isFunction = function isFunction(val) {
  return typeof val === 'function';
};
var isObject = function isObject(val) {
  return (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' && val !== null;
};
var isString = function isString(val) {
  return typeof val === 'string';
};
var isSymbol = function isSymbol(val) {
  return (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'symbol';
};
var isUndefined = function isUndefined(val) {
  return typeof val === 'undefined';
};

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* harmony default export */ __webpack_exports__["a"] = typeof window === 'undefined' ? global : window;
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(37)))

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__get_prop_names_and_symbols__ = __webpack_require__(1);


// We are not using Object.assign if it is defined since it will cause problems when Symbol is polyfilled.
// Apparently Object.assign (or any polyfill for this method) does not copy non-native Symbols.
/* harmony default export */ __webpack_exports__["a"] = function (obj) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  args.forEach(function (arg) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__get_prop_names_and_symbols__["a" /* default */])(arg).forEach(function (nameOrSymbol) {
      return obj[nameOrSymbol] = arg[nameOrSymbol];
    });
  }); // eslint-disable-line no-return-assign
  return obj;
};

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony default export */ __webpack_exports__["a"] = function (element) {
  var namespace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var data = element.__SKATE_DATA || (element.__SKATE_DATA = {});
  return namespace && (data[namespace] || (data[namespace] = {})) || data; // eslint-disable-line no-mixed-operators
};

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony default export */ __webpack_exports__["a"] = function (val) {
  return typeof val === 'undefined' || val === null;
};

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_assign__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_get_prop_names_and_symbols__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_get_props_map__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__util_is_type__ = __webpack_require__(2);






function get(elem) {
  var props = {};

  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_get_prop_names_and_symbols__["a" /* default */])(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_get_props_map__["a" /* default */])(elem.constructor)).forEach(function (nameOrSymbol) {
    props[nameOrSymbol] = elem[nameOrSymbol];
  });

  return props;
}

function set(elem, newProps) {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_assign__["a" /* default */])(elem, newProps);
  if (elem[__WEBPACK_IMPORTED_MODULE_0__util_symbols__["d" /* renderer */]]) {
    elem[__WEBPACK_IMPORTED_MODULE_0__util_symbols__["d" /* renderer */]]();
  }
}

/* harmony default export */ __webpack_exports__["a"] = function (elem, newProps) {
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_is_type__["b" /* isUndefined */])(newProps) ? get(elem) : set(elem, newProps);
};

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_incremental_dom__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_incremental_dom___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_assign__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_create_symbol__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__util_data__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__util_debounce__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__util_attributes_manager__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__util_get_own_property_descriptors__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__util_get_prop_names_and_symbols__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__util_get_props_map__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__props__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__lifecycle_props_init__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__util_is_type__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__polyfills_object_is__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__util_set_ctor_native_property__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__util_root__ = __webpack_require__(3);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


















var HTMLElement = __WEBPACK_IMPORTED_MODULE_15__util_root__["a" /* default */].HTMLElement || function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  return _class;
}();
var _prevName = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_create_symbol__["a" /* default */])('prevName');
var _prevOldValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_create_symbol__["a" /* default */])('prevOldValue');
var _prevNewValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_create_symbol__["a" /* default */])('prevNewValue');

// TEMPORARY: Once deprecations in this file are removed, this can be removed.
function deprecated(elem, oldUsage, newUsage) {
  if (process.env.NODE_ENV !== 'production') {
    var ownerName = elem.localName ? elem.localName : String(elem);
    console.warn(ownerName + ' ' + oldUsage + ' is deprecated. Use ' + newUsage + '.');
  }
}

function preventDoubleCalling(elem, name, oldValue, newValue) {
  return name === elem[_prevName] && oldValue === elem[_prevOldValue] && newValue === elem[_prevNewValue];
}

// TODO remove when not catering to Safari < 10.
function createNativePropertyDescriptors(Ctor) {
  var propDefs = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_9__util_get_props_map__["a" /* default */])(Ctor);
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_8__util_get_prop_names_and_symbols__["a" /* default */])(propDefs).reduce(function (propDescriptors, nameOrSymbol) {
    propDescriptors[nameOrSymbol] = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_11__lifecycle_props_init__["a" /* createNativePropertyDescriptor */])(propDefs[nameOrSymbol]);
    return propDescriptors;
  }, {});
}

// TODO refactor when not catering to Safari < 10.
//
// We should be able to simplify this where all we do is Object.defineProperty().
function createInitProps(Ctor) {
  var propDescriptors = createNativePropertyDescriptors(Ctor);

  return function (elem) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_8__util_get_prop_names_and_symbols__["a" /* default */])(propDescriptors).forEach(function (nameOrSymbol) {
      var propDescriptor = propDescriptors[nameOrSymbol];
      propDescriptor.beforeDefineProperty(elem);

      // We check here before defining to see if the prop was specified prior
      // to upgrading.
      var hasPropBeforeUpgrading = nameOrSymbol in elem;

      // This is saved prior to defining so that we can set it after it it was
      // defined prior to upgrading. We don't want to invoke the getter if we
      // don't need to, so we only get the value if we need to re-sync.
      var valueBeforeUpgrading = hasPropBeforeUpgrading && elem[nameOrSymbol];

      // https://bugs.webkit.org/show_bug.cgi?id=49739
      //
      // When Webkit fixes that bug so that native property accessors can be
      // retrieved, we can move defining the property to the prototype and away
      // from having to do if for every instance as all other browsers support
      // this.
      Object.defineProperty(elem, nameOrSymbol, propDescriptor);

      // DEPRECATED
      //
      // We'll be removing get / set callbacks on properties. Use the
      // updatedCallback() instead.
      //
      // We re-set the prop if it was specified prior to upgrading because we
      // need to ensure set() is triggered both in polyfilled environments and
      // in native where the definition may be registerd after elements it
      // represents have already been created.
      if (hasPropBeforeUpgrading) {
        elem[nameOrSymbol] = valueBeforeUpgrading;
      }
    });
  };
}

var _class2 = function (_HTMLElement) {
  _inherits(_class2, _HTMLElement);

  _createClass(_class2, null, [{
    key: 'observedAttributes',


    /**
     * Returns unique attribute names configured with props and
     * those set on the Component constructor if any
     */
    get: function get() {
      var attrsOnCtor = this.hasOwnProperty(__WEBPACK_IMPORTED_MODULE_1__util_symbols__["f" /* ctorObservedAttributes */]) ? this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["f" /* ctorObservedAttributes */]] : [];
      var propDefs = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_9__util_get_props_map__["a" /* default */])(this);

      // Use Object.keys to skips symbol props since they have no linked attributes
      var attrsFromLinkedProps = Object.keys(propDefs).map(function (propName) {
        return propDefs[propName].attrSource;
      }).filter(Boolean);

      var all = attrsFromLinkedProps.concat(attrsOnCtor).concat(_get(_class2.__proto__ || Object.getPrototypeOf(_class2), 'observedAttributes', this));
      return all.filter(function (item, index) {
        return all.indexOf(item) === index;
      });
    },
    set: function set(value) {
      value = Array.isArray(value) ? value : [];
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_14__util_set_ctor_native_property__["a" /* default */])(this, 'observedAttributes', value);
    }

    // Returns superclass props overwritten with this Component props

  }, {
    key: 'props',
    get: function get() {
      return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_assign__["a" /* default */])({}, _get(_class2.__proto__ || Object.getPrototypeOf(_class2), 'props', this), this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["g" /* ctorProps */]]);
    },
    set: function set(value) {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_14__util_set_ctor_native_property__["a" /* default */])(this, __WEBPACK_IMPORTED_MODULE_1__util_symbols__["g" /* ctorProps */], value);
    }

    // Passing args is designed to work with document-register-element. It's not
    // necessary for the webcomponents/custom-element polyfill.

  }]);

  function _class2() {
    var _ref;

    _classCallCheck(this, _class2);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = _class2.__proto__ || Object.getPrototypeOf(_class2)).call.apply(_ref, [this].concat(args)));

    var constructor = _this.constructor;

    // Used for the ready() function so it knows when it can call its callback.

    _this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["c" /* created */]] = true;

    // TODO refactor to not cater to Safari < 10. This means we can depend on
    // built-in property descriptors.
    // Must be defined on constructor and not from a superclass
    if (!constructor.hasOwnProperty(__WEBPACK_IMPORTED_MODULE_1__util_symbols__["h" /* ctorCreateInitProps */])) {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_14__util_set_ctor_native_property__["a" /* default */])(constructor, __WEBPACK_IMPORTED_MODULE_1__util_symbols__["h" /* ctorCreateInitProps */], createInitProps(constructor));
    }

    // Set up a renderer that is debounced for property sets to call directly.
    _this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["i" /* rendererDebounced */]] = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__util_debounce__["a" /* default */])(_this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["d" /* renderer */]].bind(_this));

    // Set up property lifecycle.
    var propDefsCount = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_8__util_get_prop_names_and_symbols__["a" /* default */])(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_9__util_get_props_map__["a" /* default */])(constructor)).length;
    if (propDefsCount && constructor[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["h" /* ctorCreateInitProps */]]) {
      constructor[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["h" /* ctorCreateInitProps */]](_this);
    }

    // DEPRECATED
    //
    // static render()
    // Note that renderCallback is an optional method!
    if (!_this.renderCallback && constructor.render) {
      deprecated(_this, 'static render', 'renderCallback');
      _this.renderCallback = constructor.render.bind(constructor, _this);
    }

    // DEPRECATED
    //
    // static created()
    //
    // Props should be set up before calling this.
    var created = constructor.created;

    if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(created)) {
      deprecated(_this, 'static created', 'constructor');
      created(_this);
    }

    // DEPRECATED
    //
    // Feature has rarely been used.
    //
    // Created should be set before invoking the ready listeners.
    var elemData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_data__["a" /* default */])(_this);
    var readyCallbacks = elemData.readyCallbacks;
    if (readyCallbacks) {
      readyCallbacks.forEach(function (cb) {
        return cb(_this);
      });
      delete elemData.readyCallbacks;
    }
    return _this;
  }

  // Custom Elements v1


  _createClass(_class2, [{
    key: 'connectedCallback',
    value: function connectedCallback() {
      // Reflect attributes pending values
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_attributes_manager__["a" /* default */])(this).resumeAttributesUpdates();

      // Used to check whether or not the component can render.
      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["j" /* connected */]] = true;

      // Render!
      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["i" /* rendererDebounced */]]();

      // DEPRECATED
      //
      // static attached()
      var attached = this.constructor.attached;

      if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(attached)) {
        deprecated(this, 'static attached', 'connectedCallback');
        attached(this);
      }

      // DEPRECATED
      //
      // We can remove this once all browsers support :defined.
      this.setAttribute('defined', '');
    }

    // Custom Elements v1

  }, {
    key: 'disconnectedCallback',
    value: function disconnectedCallback() {
      // Suspend updating attributes until re-connected
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_attributes_manager__["a" /* default */])(this).suspendAttributesUpdates();

      // Ensures the component can't be rendered while disconnected.
      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["j" /* connected */]] = false;

      // DEPRECATED
      //
      // static detached()
      var detached = this.constructor.detached;

      if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(detached)) {
        deprecated(this, 'static detached', 'disconnectedCallback');
        detached(this);
      }
    }

    // Custom Elements v1

  }, {
    key: 'attributeChangedCallback',
    value: function attributeChangedCallback(name, oldValue, newValue) {
      // Polyfill calls this twice.
      if (preventDoubleCalling(this, name, oldValue, newValue)) {
        return;
      }

      // Set data so we can prevent double calling if the polyfill.
      this[_prevName] = name;
      this[_prevOldValue] = oldValue;
      this[_prevNewValue] = newValue;

      var propNameOrSymbol = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_data__["a" /* default */])(this, 'attrSourceLinks')[name];
      if (propNameOrSymbol) {
        var changedExternally = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_attributes_manager__["a" /* default */])(this).onAttributeChanged(name, newValue);
        if (changedExternally) {
          // Sync up the property.
          var propDef = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_9__util_get_props_map__["a" /* default */])(this.constructor)[propNameOrSymbol];
          var newPropVal = newValue !== null && propDef.deserialize ? propDef.deserialize(newValue) : newValue;

          var propData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_data__["a" /* default */])(this, 'props')[propNameOrSymbol];
          propData.settingPropFromAttrSource = true;
          this[propNameOrSymbol] = newPropVal;
          propData.settingPropFromAttrSource = false;
        }
      }

      // DEPRECATED
      //
      // static attributeChanged()
      var attributeChanged = this.constructor.attributeChanged;

      if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(attributeChanged)) {
        deprecated(this, 'static attributeChanged', 'attributeChangedCallback');
        attributeChanged(this, { name: name, newValue: newValue, oldValue: oldValue });
      }
    }

    // Skate

  }, {
    key: 'updatedCallback',
    value: function updatedCallback(prevProps) {
      if (this.constructor.hasOwnProperty('updated')) {
        deprecated(this, 'static updated', 'updatedCallback');
      }
      return this.constructor.updated(this, prevProps);
    }

    // Skate

  }, {
    key: 'renderedCallback',
    value: function renderedCallback() {
      if (this.constructor.hasOwnProperty('rendered')) {
        deprecated(this, 'static rendered', 'renderedCallback');
      }
      return this.constructor.rendered(this);
    }

    // Skate
    //
    // Maps to the static renderer() callback. That logic should be moved here
    // when that is finally removed.
    // TODO: finalize how to support different rendering strategies.

  }, {
    key: 'rendererCallback',
    value: function rendererCallback() {
      // TODO: cannot move code here because tests expects renderer function to still exist on constructor!
      return this.constructor.renderer(this);
    }

    // Skate
    // @internal
    // Invokes the complete render lifecycle.

  }, {
    key: __WEBPACK_IMPORTED_MODULE_1__util_symbols__["d" /* renderer */],
    value: function value() {
      if (this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["k" /* rendering */]] || !this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["j" /* connected */]]) {
        return;
      }

      // Flag as rendering. This prevents anything from trying to render - or
      // queueing a render - while there is a pending render.
      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["k" /* rendering */]] = true;
      if (this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["l" /* updated */]]() && __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(this.renderCallback)) {
        this.rendererCallback();
        this.renderedCallback();
      }

      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["k" /* rendering */]] = false;
    }

    // Skate
    // @internal
    // Calls the updatedCallback() with previous props.

  }, {
    key: __WEBPACK_IMPORTED_MODULE_1__util_symbols__["l" /* updated */],
    value: function value() {
      var prevProps = this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["m" /* props */]];
      this[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["m" /* props */]] = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_10__props__["a" /* default */])(this);
      return this.updatedCallback(prevProps);
    }

    // Skate

  }], [{
    key: 'extend',
    value: function extend() {
      var definition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var Base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;

      // Create class for the user.
      var Ctor = function (_Base) {
        _inherits(Ctor, _Base);

        function Ctor() {
          _classCallCheck(this, Ctor);

          return _possibleConstructorReturn(this, (Ctor.__proto__ || Object.getPrototypeOf(Ctor)).apply(this, arguments));
        }

        return Ctor;
      }(Base);

      // For inheriting from the object literal.


      var opts = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_7__util_get_own_property_descriptors__["a" /* default */])(definition);
      var prot = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_7__util_get_own_property_descriptors__["a" /* default */])(definition.prototype);

      // Prototype is non configurable (but is writable).
      delete opts.prototype;

      // Pass on static and instance members from the definition.
      Object.defineProperties(Ctor, opts);
      Object.defineProperties(Ctor.prototype, prot);

      return Ctor;
    }

    // Skate
    //
    // DEPRECATED
    //
    // Stubbed in case any subclasses are calling it.

  }, {
    key: 'rendered',
    value: function rendered() {}

    // Skate
    //
    // DEPRECATED
    //
    // Move this to rendererCallback() before removing.

  }, {
    key: 'renderer',
    value: function renderer(elem) {
      if (!elem.shadowRoot) {
        elem.attachShadow({ mode: 'open' });
      }
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["patchInner"])(elem.shadowRoot, function () {
        var possibleFn = elem.renderCallback(elem);
        if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(possibleFn)) {
          possibleFn();
        } else if (Array.isArray(possibleFn)) {
          possibleFn.forEach(function (fn) {
            if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_12__util_is_type__["a" /* isFunction */])(fn)) {
              fn();
            }
          });
        }
      });
    }

    // Skate
    //
    // DEPRECATED
    //
    // Move this to updatedCallback() before removing.

  }, {
    key: 'updated',
    value: function updated(elem, previousProps) {
      // The 'previousProps' will be undefined if it is the initial render.
      if (!previousProps) {
        return true;
      }

      // The 'previousProps' will always contain all of the keys.
      //
      // Use classic loop because:
      // 'for ... in' skips symbols and 'for ... of' is not working yet with IE!?
      // for (let nameOrSymbol of getPropNamesAndSymbols(previousProps)) {
      var namesAndSymbols = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_8__util_get_prop_names_and_symbols__["a" /* default */])(previousProps);
      for (var i = 0; i < namesAndSymbols.length; i++) {
        var nameOrSymbol = namesAndSymbols[i];

        // With Object.is NaN is equal to NaN
        if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_13__polyfills_object_is__["a" /* default */])(previousProps[nameOrSymbol], elem[nameOrSymbol])) {
          return true;
        }
      }

      return false;
    }
  }]);

  return _class2;
}(HTMLElement);

_class2.is = '';
/* harmony default export */ __webpack_exports__["a"] = _class2;
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(13)))

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__to_null_or_string__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__is_type__ = __webpack_require__(2);
/* harmony export (immutable) */ __webpack_exports__["a"] = getAttrMgr;
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }




/**
 * @internal
 * Attributes Manager
 *
 * Postpones attributes updates until when connected.
 */

var AttributesManager = function () {
  function AttributesManager(elem) {
    _classCallCheck(this, AttributesManager);

    this.elem = elem;
    this.connected = false;
    this.pendingValues = {};
    this.lastSetValues = {};
  }

  /**
   * Called from disconnectedCallback
   */


  _createClass(AttributesManager, [{
    key: 'suspendAttributesUpdates',
    value: function suspendAttributesUpdates() {
      this.connected = false;
    }

    /**
     * Called from connectedCallback
     */

  }, {
    key: 'resumeAttributesUpdates',
    value: function resumeAttributesUpdates() {
      var _this = this;

      this.connected = true;
      var names = Object.keys(this.pendingValues);
      names.forEach(function (name) {
        var value = _this.pendingValues[name];
        // Skip if already cleared
        if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__is_type__["b" /* isUndefined */])(value)) {
          delete _this.pendingValues[name];
          _this._syncAttrValue(name, value);
        }
      });
    }

    /**
     * Returns true if the value is different from the one set internally
     * using setAttrValue()
     */

  }, {
    key: 'onAttributeChanged',
    value: function onAttributeChanged(name, value) {
      value = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__to_null_or_string__["a" /* default */])(value);

      // A new attribute value voids the pending one
      this._clearPendingValue(name);

      var changed = this.lastSetValues[name] !== value;
      this.lastSetValues[name] = value;
      return changed;
    }

    /**
     * Updates or removes the attribute if value === null.
     *
     * When the component is not connected the value is saved and
     * the attribute is only updated when the component is re-connected.
     */

  }, {
    key: 'setAttrValue',
    value: function setAttrValue(name, value) {
      value = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__to_null_or_string__["a" /* default */])(value);

      this.lastSetValues[name] = value;

      if (this.connected) {
        this._clearPendingValue(name);
        this._syncAttrValue(name, value);
      } else {
        this.pendingValues[name] = value;
      }
    }
  }, {
    key: '_syncAttrValue',
    value: function _syncAttrValue(name, value) {
      var currAttrValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__to_null_or_string__["a" /* default */])(this.elem.getAttribute(name));
      if (value !== currAttrValue) {
        if (value === null) {
          this.elem.removeAttribute(name);
        } else {
          this.elem.setAttribute(name, value);
        }
      }
    }
  }, {
    key: '_clearPendingValue',
    value: function _clearPendingValue(name) {
      if (name in this.pendingValues) {
        delete this.pendingValues[name];
      }
    }
  }]);

  return AttributesManager;
}();

// Only used by getAttrMgr


var $attributesMgr = '____skate_attributesMgr';

/**
 * @internal
 * Returns attribute manager instance for the given Component
 */
function getAttrMgr(elem) {
  var mgr = elem[$attributesMgr];
  if (!mgr) {
    mgr = new AttributesManager(elem);
    elem[$attributesMgr] = mgr;
  }
  return mgr;
}

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__get_prop_names_and_symbols__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__prop_definition__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__set_ctor_native_property__ = __webpack_require__(11);
/* harmony export (immutable) */ __webpack_exports__["a"] = getPropsMap;





/**
 * Memoizes a map of PropDefinition for the given component class.
 * Keys in the map are the properties name which can a string or a symbol.
 *
 * The map is created from the result of: static get props
 */
function getPropsMap(Ctor) {
  // Must be defined on constructor and not from a superclass
  if (!Ctor.hasOwnProperty(__WEBPACK_IMPORTED_MODULE_0__symbols__["e" /* ctorPropsMap */])) {
    (function () {
      var props = Ctor.props || {};

      var propsMap = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__get_prop_names_and_symbols__["a" /* default */])(props).reduce(function (result, nameOrSymbol) {
        result[nameOrSymbol] = new __WEBPACK_IMPORTED_MODULE_2__prop_definition__["a" /* default */](nameOrSymbol, props[nameOrSymbol]);
        return result;
      }, {});
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__set_ctor_native_property__["a" /* default */])(Ctor, __WEBPACK_IMPORTED_MODULE_0__symbols__["e" /* ctorPropsMap */], propsMap);
    })();
  }

  return Ctor[__WEBPACK_IMPORTED_MODULE_0__symbols__["e" /* ctorPropsMap */]];
}

/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = setCtorNativeProperty;
/**
 * This is needed to avoid IE11 "stack size errors" when creating
 * a new property on the constructor of an HTMLElement
 */
function setCtorNativeProperty(Ctor, propName, value) {
  Object.defineProperty(Ctor, propName, { configurable: true, value: value });
}

/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__empty__ = __webpack_require__(6);

/**
 * Attributes value can only be null or string;
 */
var toNullOrString = function toNullOrString(val) {
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__empty__["a" /* default */])(val) ? null : String(val);
};

/* harmony default export */ __webpack_exports__["a"] = toNullOrString;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_14__;

/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__api_prop__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__api_symbols__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__api_vdom__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__api_component__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__api_define__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__api_emit__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__api_link__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__api_props__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__api_ready__ = __webpack_require__(20);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Component", function() { return __WEBPACK_IMPORTED_MODULE_3__api_component__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "define", function() { return __WEBPACK_IMPORTED_MODULE_4__api_define__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "emit", function() { return __WEBPACK_IMPORTED_MODULE_5__api_emit__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "link", function() { return __WEBPACK_IMPORTED_MODULE_6__api_link__["a"]; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "prop", function() { return __WEBPACK_IMPORTED_MODULE_0__api_prop__; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "props", function() { return __WEBPACK_IMPORTED_MODULE_7__api_props__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ready", function() { return __WEBPACK_IMPORTED_MODULE_8__api_ready__["a"]; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "symbols", function() { return __WEBPACK_IMPORTED_MODULE_1__api_symbols__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "vdom", function() { return __WEBPACK_IMPORTED_MODULE_2__api_vdom__; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return h; });










var h = __WEBPACK_IMPORTED_MODULE_2__api_vdom__["builder"]();



/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__component__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_unique_id__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_root__ = __webpack_require__(3);
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };





/* harmony default export */ __webpack_exports__["a"] = function () {
  var customElements = __WEBPACK_IMPORTED_MODULE_2__util_root__["a" /* default */].customElements,
      HTMLElement = __WEBPACK_IMPORTED_MODULE_2__util_root__["a" /* default */].HTMLElement;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var name = args[0],
      Ctor = args[1];


  if (!customElements) {
    throw new Error('Skate requires native custom element support or a polyfill.');
  }

  // DEPRECATED remove when removing the "name" argument.
  if (process.env.NODE_ENV !== 'production' && args.length === 2) {
    console.warn('The "name" argument to define() is deprecated. Please define a `static is` property on the constructor instead.');
  }

  // DEPRECATED remove when removing the "name" argument.
  if (args.length === 1) {
    Ctor = name;
    name = null;
  }

  // DEPRECATED Object literals.
  if ((typeof Ctor === 'undefined' ? 'undefined' : _typeof(Ctor)) === 'object') {
    Ctor = __WEBPACK_IMPORTED_MODULE_0__component__["a" /* default */].extend(Ctor);
  }

  // Ensure a custom element is passed.
  if (!(Ctor.prototype instanceof HTMLElement)) {
    throw new Error('You must provide a constructor that extends HTMLElement to define().');
  }

  // DEPRECATED two arguments
  if (args.length === 2) {
    customElements.define(customElements.get(name) ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_unique_id__["a" /* default */])(name) : name, Ctor);
  } else {
    // We must use hasOwnProperty() because we want to know if it was specified
    // directly on this class, not subclasses, as we don't want to inherit tag
    // names from subclasses.
    if (!Ctor.hasOwnProperty('is')) {
      // If we used defineProperty() then the consumer must also use it and
      // cannot use property initialisers. Instead we just set it so they can
      // use whatever method of overridding that they want.
      Ctor.is = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_unique_id__["a" /* default */])();
    }
    customElements.define(Ctor.is, Ctor);
  }

  // The spec doesn't return but this allows for a simpler, more concise API.
  return Ctor;
};
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(13)))

/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_root__ = __webpack_require__(3);


var Event = function (TheEvent) {
  if (TheEvent) {
    try {
      new TheEvent('emit-init'); // eslint-disable-line no-new
    } catch (e) {
      return undefined;
    }
  }
  return TheEvent;
}(__WEBPACK_IMPORTED_MODULE_0__util_root__["a" /* default */].Event);

function createCustomEvent(name) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var detail = opts.detail;

  delete opts.detail;

  var e = void 0;
  if (Event) {
    e = new Event(name, opts);
    Object.defineProperty(e, 'detail', { value: detail });
  } else {
    e = document.createEvent('CustomEvent');
    Object.defineProperty(e, 'composed', { value: opts.composed });
    e.initCustomEvent(name, opts.bubbles, opts.cancelable, detail);
  }
  return e;
}

/* harmony default export */ __webpack_exports__["a"] = function (elem, name) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (opts.bubbles === undefined) {
    opts.bubbles = true;
  }
  if (opts.cancelable === undefined) {
    opts.cancelable = true;
  }
  if (opts.composed === undefined) {
    opts.composed = true;
  }
  return elem.dispatchEvent(createCustomEvent(name, opts));
};

/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__props__ = __webpack_require__(7);
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



function getValue(elem) {
  var type = elem.type;
  if (type === 'checkbox' || type === 'radio') {
    return elem.checked ? elem.value || true : false;
  }
  return elem.value;
}

/* harmony default export */ __webpack_exports__["a"] = function (elem, target) {
  return function (e) {
    // We fallback to checking the composed path. Unfortunately this behaviour
    // is difficult to impossible to reproduce as it seems to be a possible
    // quirk in the shadydom polyfill that incorrectly returns null for the
    // target but has the target as the first point in the path.
    // TODO revisit once all browsers have native support.
    var localTarget = e.target || e.composedPath()[0];
    var value = getValue(localTarget);
    var localTargetName = target || localTarget.name || 'value';

    if (localTargetName.indexOf('.') > -1) {
      var parts = localTargetName.split('.');
      var firstPart = parts[0];
      var propName = parts.pop();
      var obj = parts.reduce(function (prev, curr) {
        return prev && prev[curr];
      }, elem);

      obj[propName || e.target.name] = value;
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__props__["a" /* default */])(elem, _defineProperty({}, firstPart, elem[firstPart]));
    } else {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__props__["a" /* default */])(elem, _defineProperty({}, localTargetName, value));
    }
  };
};

/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_assign__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_empty__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_to_null_or_string__ = __webpack_require__(12);
/* harmony export (immutable) */ __webpack_exports__["create"] = create;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "array", function() { return array; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "boolean", function() { return boolean; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "number", function() { return number; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "string", function() { return string; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "object", function() { return object; });




function create(def) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args.unshift({}, def);
    return __WEBPACK_IMPORTED_MODULE_0__util_assign__["a" /* default */].apply(undefined, args);
  };
}

var parseIfNotEmpty = function parseIfNotEmpty(val) {
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_empty__["a" /* default */])(val) ? null : JSON.parse(val);
};

var array = create({
  coerce: function coerce(val) {
    return Array.isArray(val) ? val : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_empty__["a" /* default */])(val) ? null : [val];
  },
  default: function _default() {
    return [];
  },
  deserialize: parseIfNotEmpty,
  serialize: JSON.stringify
});

var boolean = create({
  coerce: function coerce(val) {
    return !!val;
  },
  default: false,
  // TODO: 'false' string must deserialize to false for angular 1.x to work
  // This breaks one existing test.
  // deserialize: val => !(val === null || val === 'false'),
  deserialize: function deserialize(val) {
    return !(val === null);
  },
  serialize: function serialize(val) {
    return val ? '' : null;
  }
});

// defaults empty to 0 and allows NaN
var zeroIfEmptyOrNumberIncludesNaN = function zeroIfEmptyOrNumberIncludesNaN(val) {
  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_empty__["a" /* default */])(val) ? 0 : Number(val);
};

var number = create({
  default: 0,
  coerce: zeroIfEmptyOrNumberIncludesNaN,
  deserialize: zeroIfEmptyOrNumberIncludesNaN,
  serialize: __WEBPACK_IMPORTED_MODULE_2__util_to_null_or_string__["a" /* default */]
});

var string = create({
  default: '',
  coerce: __WEBPACK_IMPORTED_MODULE_2__util_to_null_or_string__["a" /* default */],
  deserialize: __WEBPACK_IMPORTED_MODULE_2__util_to_null_or_string__["a" /* default */],
  serialize: __WEBPACK_IMPORTED_MODULE_2__util_to_null_or_string__["a" /* default */]
});

var object = create({
  default: function _default() {
    return {};
  },
  deserialize: parseIfNotEmpty,
  serialize: JSON.stringify
});

/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_data__ = __webpack_require__(5);



/* harmony default export */ __webpack_exports__["a"] = function (elem, done) {
  var info = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_data__["a" /* default */])(elem);
  if (elem[__WEBPACK_IMPORTED_MODULE_0__util_symbols__["c" /* created */]]) {
    done(elem);
  } else if (info.readyCallbacks) {
    info.readyCallbacks.push(done);
  } else {
    info.readyCallbacks = [done];
  }
};

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_symbols__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "name", function() { return __WEBPACK_IMPORTED_MODULE_0__util_symbols__["b"]; });
// DEPRECTAED
//
// We should not be relying on internals for symbols as this creates version
// coupling. We will move forward with platform agnostic ways of doing this.


/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_incremental_dom__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_incremental_dom___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_prop_context__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_root__ = __webpack_require__(3);
/* harmony export (immutable) */ __webpack_exports__["element"] = element;
/* harmony export (immutable) */ __webpack_exports__["builder"] = builder;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attr", function() { return newAttr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "elementClose", function() { return newElementClose; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "elementOpen", function() { return newElementOpen; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "elementOpenEnd", function() { return newElementOpenEnd; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "elementOpenStart", function() { return newElementOpenStart; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "elementVoid", function() { return newElementVoid; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "text", function() { return newText; });
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint no-plusplus: 0 */






var customElements = __WEBPACK_IMPORTED_MODULE_3__util_root__["a" /* default */].customElements,
    HTMLElement = __WEBPACK_IMPORTED_MODULE_3__util_root__["a" /* default */].HTMLElement;

var applyDefault = __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["attributes"][__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["symbols"].default];

// A stack of children that corresponds to the current function helper being
// executed.
var stackChren = [];

var $skip = '__skip';
var $currentEventHandlers = '__events';
var $stackCurrentHelperProps = '__props';

// The current function helper in the stack.
var stackCurrentHelper = void 0;

// This is used for the Incremental DOM overrides to keep track of what args
// to pass the main elementOpen() function.
var overrideArgs = void 0;

// The number of levels deep after skipping a tree.
var skips = 0;

var noop = function noop() {};

// Adds or removes an event listener for an element.
function applyEvent(elem, ename, newFunc) {
  var events = elem[$currentEventHandlers];

  if (!events) {
    events = elem[$currentEventHandlers] = {};
  }

  // Undefined indicates that there is no listener yet.
  if (typeof events[ename] === 'undefined') {
    // We only add a single listener once. Originally this was a workaround for
    // the Webcomponents ShadyDOM polyfill not removing listeners, but it's
    // also a simpler model for binding / unbinding events because you only
    // have a single handler you need to worry about and a single place where
    // you only store one event handler
    elem.addEventListener(ename, function (e) {
      if (events[ename]) {
        events[ename].call(this, e);
      }
    });
  }

  // Not undefined indicates that we have set a listener, so default to null.
  events[ename] = typeof newFunc === 'function' ? newFunc : null;
}

var attributesContext = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_prop_context__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["attributes"], _defineProperty({
  // Attributes that shouldn't be applied to the DOM.
  key: noop,
  statics: noop,

  // Attributes that *must* be set via a property on all elements.
  checked: __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["applyProp"],
  className: __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["applyProp"],
  disabled: __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["applyProp"],
  value: __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["applyProp"],

  // Ref handler.
  ref: function ref(elem, name, value) {
    elem[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["a" /* ref */]] = value;
  },


  // Skip handler.
  skip: function skip(elem, name, value) {
    if (value) {
      elem[$skip] = true;
    } else {
      delete elem[$skip];
    }
  }
}, __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["symbols"].default, function (elem, name, value) {
  var ce = customElements.get(elem.localName);
  var props = ce && ce.props || {};
  var prototype = ce && ce.prototype || {};

  // TODO when refactoring properties to not have to workaround the old
  // WebKit bug we can remove the "name in props" check below.
  //
  // NOTE: That the "name in elem" check won't work for polyfilled custom
  // elements that set a property that isn't explicitly specified in "props"
  // or "prototype" unless it is added to the element explicitly as a
  // property prior to passing the prop to the vdom function. For example, if
  // it were added in a lifecycle callback because it wouldn't have been
  // upgraded yet.
  //
  // We prefer setting props, so we do this if there's a property matching
  // name that was passed. However, certain props on SVG elements are
  // readonly and error when you try to set them.
  if ((name in props || name in elem || name in prototype) && !('ownerSVGElement' in elem)) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["applyProp"])(elem, name, value);
    return;
  }

  // Explicit false removes the attribute.
  if (value === false) {
    applyDefault(elem, name);
    return;
  }

  // Handle built-in and custom events.
  if (name.indexOf('on') === 0) {
    var firstChar = name[2];
    var eventName = void 0;

    if (firstChar === '-') {
      eventName = name.substring(3);
    } else if (firstChar === firstChar.toUpperCase()) {
      eventName = firstChar.toLowerCase() + name.substring(3);
    }

    if (eventName) {
      applyEvent(elem, eventName, value);
      return;
    }
  }

  applyDefault(elem, name, value);
}));

function resolveTagName(name) {
  // We return falsy values as some wrapped IDOM functions allow empty values.
  if (!name) {
    return name;
  }

  // We try and return the cached tag name, if one exists. This will work with
  // *any* web component of any version that defines a `static is` property.
  if (name.is) {
    return name.is;
  }

  // Get the name for the custom element by constructing it and using the
  // localName property. Cache it and lookup the cached value for future calls.
  if (name.prototype instanceof HTMLElement) {
    if (name[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["b" /* name */]]) {
      return name[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["b" /* name */]];
    }

    // eslint-disable-next-line
    var elem = new name();
    return elem[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["b" /* name */]] = elem.localName;
  }

  // Pass all other values through so IDOM gets what it's expecting.
  return name;
}

// Incremental DOM's elementOpen is where the hooks in `attributes` are applied,
// so it's the only function we need to execute in the context of our attributes.
var elementOpen = attributesContext(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["elementOpen"]);

function elementOpenStart(tag) {
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var statics = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  overrideArgs = [tag, key, statics];
}

function elementOpenEnd() {
  var node = newElementOpen.apply(undefined, _toConsumableArray(overrideArgs)); // eslint-disable-line no-use-before-define
  overrideArgs = null;
  return node;
}

function wrapIdomFunc(func) {
  var tnameFuncHandler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

  return function wrap() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args[0] = resolveTagName(args[0]);
    stackCurrentHelper = null;
    if (typeof args[0] === 'function') {
      // If we've encountered a function, handle it according to the type of
      // function that is being wrapped.
      stackCurrentHelper = args[0];
      return tnameFuncHandler.apply(undefined, args);
    } else if (stackChren.length) {
      // We pass the wrap() function in here so that when it's called as
      // children, it will queue up for the next stack, if there is one.
      stackChren[stackChren.length - 1].push([wrap, args]);
    } else {
      if (func === elementOpen) {
        if (skips) {
          return ++skips;
        }

        var elem = func.apply(undefined, args);

        if (elem[$skip]) {
          ++skips;
        }

        return elem;
      }

      if (func === __WEBPACK_IMPORTED_MODULE_0_incremental_dom__["elementClose"]) {
        if (skips === 1) {
          __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["skip"])();
        }

        // We only want to skip closing if it's not the last closing tag in the
        // skipped tree because we keep the element that initiated the skpping.
        if (skips && --skips) {
          return;
        }

        var _elem = func.apply(undefined, args);
        var ref = _elem[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["a" /* ref */]];

        // We delete so that it isn't called again for the same element. If the
        // ref changes, or the element changes, this will be defined again.
        delete _elem[__WEBPACK_IMPORTED_MODULE_1__util_symbols__["a" /* ref */]];

        // Execute the saved ref after esuring we've cleand up after it.
        if (typeof ref === 'function') {
          ref(_elem);
        }

        return _elem;
      }

      // We must call elementOpenStart and elementOpenEnd even if we are
      // skipping because they queue up attributes and then call elementClose.
      if (!skips || func === elementOpenStart || func === elementOpenEnd) {
        return func.apply(undefined, args);
      }
    }
  };
}

function newAttr() {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  if (stackCurrentHelper) {
    stackCurrentHelper[$stackCurrentHelperProps][args[0]] = args[1];
  } else if (stackChren.length) {
    stackChren[stackChren.length - 1].push([newAttr, args]);
  } else {
    overrideArgs.push(args[0]);
    overrideArgs.push(args[1]);
  }
}

function stackOpen(tname, key, statics) {
  var props = { key: key, statics: statics };

  for (var _len3 = arguments.length, attrs = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
    attrs[_key3 - 3] = arguments[_key3];
  }

  for (var a = 0; a < attrs.length; a += 2) {
    props[attrs[a]] = attrs[a + 1];
  }
  tname[$stackCurrentHelperProps] = props;
  stackChren.push([]);
}

function stackClose(tname) {
  var chren = stackChren.pop();
  var props = tname[$stackCurrentHelperProps];
  delete tname[$stackCurrentHelperProps];
  var elemOrFn = tname(props, function () {
    return chren.forEach(function (args) {
      return args[0].apply(args, _toConsumableArray(args[1]));
    });
  });
  return typeof elemOrFn === 'function' ? elemOrFn() : elemOrFn;
}

// Incremental DOM overrides
// -------------------------

// We must override internal functions that call internal Incremental DOM
// functions because we can't override the internal references. This means
// we must roughly re-implement their behaviour. Luckily, they're fairly
// simple.
var newElementOpenStart = wrapIdomFunc(elementOpenStart, stackOpen);
var newElementOpenEnd = wrapIdomFunc(elementOpenEnd);

// Standard open / closed overrides don't need to reproduce internal behaviour
// because they are the ones referenced from *End and *Start.
var newElementOpen = wrapIdomFunc(elementOpen, stackOpen);
var newElementClose = wrapIdomFunc(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["elementClose"], stackClose);

// Ensure we call our overridden functions instead of the internal ones.
function newElementVoid(tag) {
  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }

  newElementOpen.apply(undefined, [tag].concat(args));
  return newElementClose(tag);
}

// Text override ensures their calls can queue if using function helpers.
var newText = wrapIdomFunc(__WEBPACK_IMPORTED_MODULE_0_incremental_dom__["text"]);

// Convenience function for declaring an Incremental DOM element using
// hyperscript-style syntax.
function element(tname, attrs) {
  var atype = typeof attrs === 'undefined' ? 'undefined' : _typeof(attrs);

  // If attributes are a function, then they should be treated as children.

  for (var _len5 = arguments.length, chren = Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
    chren[_key5 - 2] = arguments[_key5];
  }

  if (atype === 'function' || atype === 'string' || atype === 'number') {
    chren.unshift(attrs);
  }

  // Ensure the attributes are an object. Null is considered an object so we
  // have to test for this explicitly.
  if (attrs === null || atype !== 'object') {
    attrs = {};
  }

  // We open the element so we can set attrs after.
  newElementOpenStart(tname, attrs.key, attrs.statics);

  // Delete so special attrs don't actually get set.
  delete attrs.key;
  delete attrs.statics;

  // Set attributes.
  Object.keys(attrs).forEach(function (name) {
    return newAttr(name, attrs[name]);
  });

  // Close before we render the descendant tree.
  newElementOpenEnd(tname);

  chren.forEach(function (ch) {
    var ctype = typeof ch === 'undefined' ? 'undefined' : _typeof(ch);
    if (ctype === 'function') {
      ch();
    } else if (ctype === 'string' || ctype === 'number') {
      newText(ch);
    } else if (Array.isArray(ch)) {
      ch.forEach(function (sch) {
        return sch();
      });
    }
  });

  return newElementClose(tname);
}

// Even further convenience for building a DSL out of JavaScript functions or hooking into standard
// transpiles for JSX (React.createElement() / h).
function builder() {
  for (var _len6 = arguments.length, tags = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    tags[_key6] = arguments[_key6];
  }

  if (tags.length === 0) {
    return function () {
      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return element.bind.apply(element, [null].concat(args));
    };
  }
  return tags.map(function (tag) {
    return function () {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return element.bind.apply(element, [null, tag].concat(args));
    };
  });
}

// We don't have to do anything special for the text function; it's just a
// straight export from Incremental DOM.


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_symbols__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_data__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_empty__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_attributes_manager__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__util_get_default_value__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__util_get_initial_value__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__util_get_prop_data__ = __webpack_require__(32);
/* harmony export (immutable) */ __webpack_exports__["a"] = createNativePropertyDescriptor;








function createNativePropertyDescriptor(propDef) {
  var nameOrSymbol = propDef.nameOrSymbol;


  var prop = {
    configurable: true,
    enumerable: true
  };

  prop.beforeDefineProperty = function (elem) {
    var propData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_get_prop_data__["a" /* default */])(elem, nameOrSymbol);
    var attrSource = propDef.attrSource;

    // Store attrSource name to property link.
    if (attrSource) {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_data__["a" /* default */])(elem, 'attrSourceLinks')[attrSource] = nameOrSymbol;
    }

    // prop value before upgrading
    var initialValue = elem[nameOrSymbol];

    // Set up initial value if it wasn't specified.
    var valueFromAttrSource = false;
    if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_empty__["a" /* default */])(initialValue)) {
      if (attrSource && elem.hasAttribute(attrSource)) {
        valueFromAttrSource = true;
        initialValue = propDef.deserialize(elem.getAttribute(attrSource));
      } else if ('initial' in propDef) {
        initialValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__util_get_initial_value__["a" /* default */])(elem, propDef);
      } else {
        initialValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_get_default_value__["a" /* default */])(elem, propDef);
      }
    }

    initialValue = propDef.coerce(initialValue);

    propData.internalValue = initialValue;

    // Reflect to Target Attribute
    var mustReflect = propDef.attrTarget && !__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_empty__["a" /* default */])(initialValue) && (!valueFromAttrSource || propDef.attrTargetIsNotSource);

    if (mustReflect) {
      var serializedValue = propDef.serialize(initialValue);
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_attributes_manager__["a" /* default */])(elem).setAttrValue(propDef.attrTarget, serializedValue);
    }
  };

  prop.get = function get() {
    var propData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_get_prop_data__["a" /* default */])(this, nameOrSymbol);
    var internalValue = propData.internalValue;

    return propDef.get ? propDef.get(this, { name: nameOrSymbol, internalValue: internalValue }) : internalValue;
  };

  prop.set = function set(newValue) {
    var propData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__util_get_prop_data__["a" /* default */])(this, nameOrSymbol);

    var useDefaultValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_empty__["a" /* default */])(newValue);
    if (useDefaultValue) {
      newValue = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_get_default_value__["a" /* default */])(this, propDef);
    }

    newValue = propDef.coerce(newValue);

    if (propDef.set) {
      var oldValue = propData.oldValue;


      if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_empty__["a" /* default */])(oldValue)) {
        oldValue = null;
      }
      var changeData = { name: nameOrSymbol, newValue: newValue, oldValue: oldValue };
      propDef.set(this, changeData);
    }

    // Queue a re-render.
    this[__WEBPACK_IMPORTED_MODULE_0__util_symbols__["i" /* rendererDebounced */]](this);

    // Update prop data so we can use it next time.
    propData.internalValue = propData.oldValue = newValue;

    // Reflect to Target attribute.
    var mustReflect = propDef.attrTarget && (propDef.attrTargetIsNotSource || !propData.settingPropFromAttrSource);
    if (mustReflect) {
      // Note: setting the prop to empty implies the default value
      // and therefore no attribute should be present!
      var serializedValue = useDefaultValue ? null : propDef.serialize(newValue);
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_attributes_manager__["a" /* default */])(this).setAttrValue(propDef.attrTarget, serializedValue);
    }
  };

  return prop;
}

/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Polyfill Object.is for IE
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
if (!Object.is) {
  Object.is = function (x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  };
}
/* harmony default export */ __webpack_exports__["a"] = Object.is;

/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createSymbol;
function createSymbol(description) {
  return typeof Symbol === 'function' ? Symbol(description) : description;
}

/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony default export */ __webpack_exports__["a"] = function (str) {
  return str.split(/([A-Z])/).reduce(function (one, two, idx) {
    var dash = !one || idx % 2 === 0 ? '' : '-';
    return '' + one + dash + two.toLowerCase();
  });
};

/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__native__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root__ = __webpack_require__(3);
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }




var MutationObserver = __WEBPACK_IMPORTED_MODULE_1__root__["a" /* default */].MutationObserver;


function microtaskDebounce(cbFunc) {
  var scheduled = false;
  var i = 0;
  var cbArgs = [];
  var elem = document.createElement('span');
  var observer = new MutationObserver(function () {
    cbFunc.apply(undefined, _toConsumableArray(cbArgs));
    scheduled = false;
    cbArgs = null;
  });

  observer.observe(elem, { childList: true });

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    cbArgs = args;
    if (!scheduled) {
      scheduled = true;
      elem.textContent = '' + i;
      i += 1;
    }
  };
}

// We have to use setTimeout() for IE9 and 10 because the Mutation Observer
// polyfill requires that the element be in the document to trigger Mutation
// Events. Mutation Events are also synchronous and thus wouldn't debounce.
//
// The soonest we can set the timeout for in IE is 1 as they have issues when
// setting to 0.
function taskDebounce(cbFunc) {
  var scheduled = false;
  var cbArgs = [];
  return function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    cbArgs = args;
    if (!scheduled) {
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        cbFunc.apply(undefined, _toConsumableArray(cbArgs));
      }, 1);
    }
  };
}
/* harmony default export */ __webpack_exports__["a"] = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__native__["a" /* default */])(MutationObserver) ? microtaskDebounce : taskDebounce;

/***/ }),
/* 28 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = error;
function error(message) {
  throw new Error(message);
}

/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getDefaultValue;
function getDefaultValue(elem, propDef) {
  return typeof propDef.default === 'function' ? propDef.default(elem, { name: propDef.nameOrSymbol }) : propDef.default;
}

/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getInitialValue;
function getInitialValue(elem, propDef) {
  return typeof propDef.initial === 'function' ? propDef.initial(elem, { name: propDef.nameOrSymbol }) : propDef.initial;
}

/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__get_prop_names_and_symbols__ = __webpack_require__(1);


/* harmony default export */ __webpack_exports__["a"] = function () {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__get_prop_names_and_symbols__["a" /* default */])(obj).reduce(function (prev, nameOrSymbol) {
    prev[nameOrSymbol] = Object.getOwnPropertyDescriptor(obj, nameOrSymbol);
    return prev;
  }, {});
};

/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__data__ = __webpack_require__(5);
/* harmony export (immutable) */ __webpack_exports__["a"] = getPropData;


function getPropData(elem, name) {
  var elemData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__data__["a" /* default */])(elem, 'props');
  return elemData[name] || (elemData[name] = {});
}

/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var nativeHints = ['native code', '[object MutationObserverConstructor]' // for mobile safari iOS 9.0
];
/* harmony default export */ __webpack_exports__["a"] = function (fn) {
  return nativeHints.map(function (hint) {
    return (fn || '').toString().indexOf([hint]) > -1;
  }).reduce(function (a, b) {
    return a || b;
  });
};

/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assign__ = __webpack_require__(4);


function enter(object, props) {
  var saved = {};
  Object.keys(props).forEach(function (key) {
    saved[key] = object[key];
    object[key] = props[key];
  });
  return saved;
}

function exit(object, saved) {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__assign__["a" /* default */])(object, saved);
}

// Decorates a function with a side effect that changes the properties of an
// object during its execution, and restores them after. There is no error
// handling here, if the wrapped function throws an error, properties are not
// restored and all bets are off.
/* harmony default export */ __webpack_exports__["a"] = function (object, props) {
  return function (func) {
    return function () {
      var saved = enter(object, props);
      var result = func.apply(undefined, arguments);
      exit(object, saved);
      return result;
    };
  };
};

/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__dash_case__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__empty__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__error__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__is_type__ = __webpack_require__(2);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }






/**
 * @internal
 * Property Definition
 *
 * Internal meta data and strategies for a property.
 * Created from the options of a PropOptions config object.
 *
 * Once created a PropDefinition should be treated as immutable and final.
 * 'getPropsMap' function memoizes PropDefinitions by Component's Class.
 *
 * The 'attribute' option is normalized to 'attrSource' and 'attrTarget' properties.
 */

var PropDefinition = function () {
  function PropDefinition(nameOrSymbol, propOptions) {
    var _this = this;

    _classCallCheck(this, PropDefinition);

    this._nameOrSymbol = nameOrSymbol;

    propOptions = propOptions || {};

    // default 'attrSource': no observed source attribute (name)
    this.attrSource = null;

    // default 'attrTarget': no reflected target attribute (name)
    this.attrTarget = null;

    // default 'attrTargetIsNotSource'
    this.attrTargetIsNotSource = false;

    // default 'coerce': identity function
    this.coerce = function (value) {
      return value;
    };

    // default 'default': set prop to 'null'
    this.default = null;

    // default 'deserialize': return attribute's value (string or null)
    this.deserialize = function (value) {
      return value;
    };

    // default 'get': no function
    this.get = null;

    // 'initial' default: unspecified
    // 'initial' option is truly optional and it cannot be initialized.
    // Its presence is tested using: ('initial' in propDef)

    // 'serialize' default: return string value or null
    this.serialize = function (value) {
      return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__empty__["a" /* default */])(value) ? null : String(value);
    };

    // default 'set': no function
    this.set = null;

    // Note: option key is always a string (no symbols here)
    Object.keys(propOptions).forEach(function (option) {
      var optVal = propOptions[option];

      // Only accept documented options and perform minimal input validation.
      switch (option) {
        case 'attribute':
          if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__is_type__["c" /* isObject */])(optVal)) {
            _this.attrSource = _this.attrTarget = resolveAttrName(optVal, nameOrSymbol);
          } else {
            var source = optVal.source,
                target = optVal.target;

            if (!source && !target) {
              __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__error__["a" /* default */])(option + ' \'source\' or \'target\' is missing.');
            }
            _this.attrSource = resolveAttrName(source, nameOrSymbol);
            _this.attrTarget = resolveAttrName(target, nameOrSymbol);
            _this.attrTargetIsNotSource = _this.attrTarget !== _this.attrSource;
          }
          break;
        case 'coerce':
        case 'deserialize':
        case 'get':
        case 'serialize':
        case 'set':
          if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__is_type__["a" /* isFunction */])(optVal)) {
            _this[option] = optVal;
          } else {
            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__error__["a" /* default */])(option + ' must be a function.');
          }
          break;
        case 'default':
        case 'initial':
          _this[option] = optVal;
          break;
        default:
          // TODO: undocumented options?
          _this[option] = optVal;
          break;
      }
    });
  }

  _createClass(PropDefinition, [{
    key: 'nameOrSymbol',
    get: function get() {
      return this._nameOrSymbol;
    }
  }]);

  return PropDefinition;
}();

/* harmony default export */ __webpack_exports__["a"] = PropDefinition;


function resolveAttrName(attrOption, nameOrSymbol) {
  if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__is_type__["d" /* isSymbol */])(nameOrSymbol)) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__error__["a" /* default */])(nameOrSymbol.toString() + ' symbol property cannot have an attribute.');
  } else {
    if (attrOption === true) {
      return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__dash_case__["a" /* default */])(String(nameOrSymbol));
    }
    if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__is_type__["e" /* isString */])(attrOption)) {
      return attrOption;
    }
  }
  return null;
}

/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = uniqueId;
// DEPRECATED prefix when we deprecated the name argument to define()
function uniqueId(prefix) {
  // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
  var rand = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    // eslint-disable-next-line no-mixed-operators
    var v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
  return (prefix || 'x') + '-' + rand;
}

/***/ }),
/* 37 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(15);


/***/ })
/******/ ]);
});

},{"incremental-dom":1}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('skatejs-web-components');

var _skatejs = require('skatejs');

var skate = _interopRequireWildcard(_skatejs);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

customElements.define('global-navigation', function (_skate$Component) {
	_inherits(_class, _skate$Component);

	function _class() {
		_classCallCheck(this, _class);

		return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
	}

	_createClass(_class, [{
		key: 'style',
		value: function style() {
			return skate.h(
				'style',
				null,
				'@import \'http://wikiadesignsystem.com/assets/design-system.css\''
			);
		}
	}, {
		key: 'logo',
		value: function logo() {
			if (!this.model.logo.header) {
				return;
			}

			return skate.h(
				'a',
				{ 'class': 'wds-global-navigation__logo', href: this.model.logo.module.main.href },
				skate.h(
					'svg',
					{ 'class': 'wds-global-navigation__logo-image wds-is-wds-company-logo-fandom', xmlns: 'http://www.w3.org/2000/svg', width: '117', height: '23', viewBox: '0 0 117 23' },
					skate.h(
						'defs',
						null,
						skate.h(
							'linearGradient',
							{ id: 'logo-fandom-gradient', x1: '0%', x2: '63.848%', y1: '100%', y2: '32.54%' },
							skate.h('stop', { 'stop-color': '#94D11F', offset: '0%' }),
							skate.h('stop', { 'stop-color': '#09D3BF', offset: '100%' })
						)
					),
					skate.h(
						'g',
						{ 'fill-rule': 'evenodd' },
						skate.h('path', { d: 'M114.543 8.924c-1.028-1.086-2.48-1.66-4.197-1.66-1.748 0-3.18.79-4.062 2.23-.882-1.44-2.315-2.23-4.063-2.23-1.71 0-3.16.574-4.19 1.66-.96 1.013-1.48 2.432-1.48 3.997v6.48h3.24v-6.48c0-1.75.89-2.75 2.445-2.75s2.444 1.01 2.444 2.76v6.48h3.24v-6.48c0-1.75.89-2.75 2.44-2.75 1.554 0 2.444 1.005 2.444 2.756v6.48h3.24v-6.48c0-1.564-.53-2.983-1.487-3.996M37.3 1.467c-.26-.038-.53-.078-.81-.078-3.886 0-6.496 2.47-6.496 6.15V19.4h3.24v-8.717h3.397V7.78h-3.39v-.263c0-2.077 1.15-3.13 3.41-3.13.22 0 .43.035.657.073.085.014.17.03.26.042l.163.024v-3l-.13-.016-.29-.05m10.31 11.923c0 2.11-1.083 3.224-3.133 3.224-2.81 0-3.23-2.02-3.23-3.224 0-2.05 1.18-3.223 3.23-3.223 2.007 0 3.03 1.058 3.135 3.226m3.254.602c-.004-.226-.007-.43-.014-.61-.153-3.774-2.594-6.12-6.373-6.12-1.95 0-3.6.62-4.77 1.792-1.1 1.096-1.7 2.627-1.7 4.31 0 3.507 2.63 6.152 6.12 6.152 1.66 0 3.01-.6 3.92-1.736.134.534.32 1.05.56 1.54l.04.08h3.264l-.09-.19c-.91-1.938-.94-3.91-.96-5.217m8.774-6.73c-1.86 0-3.436.62-4.553 1.79-1.046 1.09-1.622 2.63-1.622 4.34v6.01h3.24v-6.01c0-2.05 1.07-3.23 2.935-3.23s2.938 1.174 2.938 3.223v6.01h3.237v-6.01c0-1.7-.576-3.24-1.622-4.336-1.115-1.17-2.69-1.79-4.552-1.79m17.61 6.125c0 2.11-1.085 3.224-3.135 3.224-2.812 0-3.232-2.02-3.232-3.224 0-2.05 1.18-3.22 3.235-3.22 2.006 0 3.03 1.055 3.134 3.223m2.786 0V3.095h-3.13v4.85c-.994-.423-1.724-.68-2.962-.68-3.82 0-6.385 2.453-6.385 6.103 0 3.5 2.655 6.15 6.17 6.15 1.79 0 3.085-.51 3.94-1.56.14.55.34 1.15.58 1.71l.033.082h3.27l-.088-.19c-1.048-2.27-1.428-4.937-1.428-6.174m11.655-.003c0 2.05-1.16 3.225-3.183 3.225-2.024 0-3.184-1.175-3.184-3.224 0-2.05 1.16-3.22 3.185-3.22 2.024 0 3.184 1.175 3.184 3.225M88.52 7.26c-3.78 0-6.42 2.52-6.42 6.13s2.64 6.13 6.42 6.13 6.42-2.52 6.42-6.127c0-3.607-2.64-6.126-6.42-6.126' }),
						skate.h('path', { fill: 'url(#logo-fandom-gradient)', d: 'M10.175 16.803c0 .19-.046.46-.26.666l-.81.69-7.362-6.94V8.51l8.094 7.627c.126.12.338.367.338.666zm11.21-8.096v2.525l-9.158 8.86a.673.673 0 0 1-.493.21.73.73 0 0 1-.514-.21l-.838-.76L21.384 8.707zm-6.976 4.498l-2.54 2.422-8.04-7.672a1.997 1.997 0 0 1-.01-2.9l2.54-2.423 8.04 7.672c.84.8.84 2.1 0 2.9zm-1.5-6.682L15.55 4c.406-.387.945-.6 1.52-.6.575 0 1.114.213 1.52.6l2.73 2.605-4.164 3.973-1.52-1.45-2.73-2.605zm10.17-.403L17.09.317l-.125-.12-.124.12-5.22 5.03L6.96.867 6.953.864 6.948.858l-.583-.47-.12-.098-.115.106L.052 6.11 0 6.16v5.76l.05.05 11.396 10.867.123.117.12-.117L23.07 11.97l.05-.05V6.17l-.05-.05z' })
					)
				),
				skate.h(
					'svg',
					{ 'class': 'wds-global-navigation__logo-image wds-is-wds-company-logo-powered-by-wikia', width: '128', height: '13', viewBox: '0 0 128 13', xmlns: 'http://www.w3.org/2000/svg' },
					skate.h(
						'g',
						{ fill: 'none', 'fill-rule': 'evenodd' },
						skate.h('path', { d: 'M3.233 8.427c.208 0 .409-.015.602-.046.194-.032.363-.091.51-.18a.986.986 0 0 0 .353-.376c.089-.163.134-.374.134-.637 0-.262-.045-.475-.134-.637a.99.99 0 0 0-.353-.377 1.395 1.395 0 0 0-.51-.178 3.69 3.69 0 0 0-.602-.046H1.819v2.477h1.414zm.497-3.89c.518 0 .958.075 1.32.226.364.15.66.349.887.596.228.247.394.528.499.845a3.158 3.158 0 0 1 0 1.963c-.105.319-.27.603-.5.85a2.458 2.458 0 0 1-.885.596c-.363.15-.803.226-1.321.226H1.819v2.964H0V4.536h3.73zm5.696 5.181c.08.328.21.623.388.885.177.262.41.472.695.63.286.16.633.238 1.043.238.409 0 .757-.079 1.043-.237.286-.159.517-.369.695-.631a2.71 2.71 0 0 0 .388-.885c.08-.328.122-.666.122-1.013a4.53 4.53 0 0 0-.122-1.054 2.799 2.799 0 0 0-.388-.908 1.968 1.968 0 0 0-.695-.637c-.286-.158-.634-.238-1.043-.238-.41 0-.757.08-1.043.238-.286.158-.518.37-.695.637a2.749 2.749 0 0 0-.388.908 4.471 4.471 0 0 0 0 2.067M7.763 6.985c.186-.528.452-.989.8-1.384a3.665 3.665 0 0 1 1.28-.925c.507-.224 1.077-.336 1.71-.336.64 0 1.213.112 1.715.336.502.223.927.533 1.275.925.347.395.614.856.8 1.384a5.19 5.19 0 0 1 .277 1.72 5.01 5.01 0 0 1-.278 1.684 4.017 4.017 0 0 1-.8 1.36 3.664 3.664 0 0 1-1.274.909c-.502.22-1.074.33-1.715.33-.633 0-1.203-.11-1.708-.33a3.654 3.654 0 0 1-1.281-.909 4.017 4.017 0 0 1-.8-1.36 4.981 4.981 0 0 1-.278-1.684c0-.617.092-1.19.278-1.72m15.282 5.818l-1.402-5.627h-.023l-1.38 5.627H18.4l-2.19-8.266h1.818l1.31 5.627h.023L20.8 4.537h1.7l1.414 5.695h.023l1.356-5.695h1.785l-2.225 8.266zm11.169-8.266v1.528h-4.368v1.771h4.01V9.25h-4.01v2.025h4.46v1.528h-6.28V4.537zm5.249 3.739c.417 0 .73-.092.939-.278.208-.185.312-.485.312-.903 0-.4-.104-.692-.312-.874-.21-.181-.522-.272-.94-.272h-1.992v2.327h1.993zm.649-3.74c.37 0 .705.061 1.002.18.297.12.552.284.764.492.213.21.375.45.487.723.111.274.168.57.168.887 0 .485-.103.906-.306 1.262-.206.354-.54.625-1.003.81v.023c.223.061.41.156.556.284a1.6 1.6 0 0 1 .36.451c.092.174.16.364.202.573.042.208.07.416.087.625.007.132.016.285.023.464.008.177.02.358.041.543.019.186.05.36.092.527.043.166.107.307.19.422H40.96a3.17 3.17 0 0 1-.186-.937c-.024-.363-.058-.71-.104-1.042-.062-.433-.193-.748-.394-.95-.201-.2-.53-.3-.985-.3h-1.82v3.23h-1.819V4.536h4.462zm10.207.001v1.528h-4.368v1.771h4.01V9.25h-4.01v2.025h4.46v1.528h-6.28V4.537zm4.878 6.738c.263 0 .517-.043.764-.128a1.7 1.7 0 0 0 .662-.422c.192-.197.347-.453.463-.77.116-.317.173-.702.173-1.157 0-.417-.04-.794-.12-1.13a2.278 2.278 0 0 0-.4-.863 1.776 1.776 0 0 0-.736-.548c-.305-.129-.683-.192-1.13-.192h-1.298v5.21h1.622zm.128-6.738c.532 0 1.03.085 1.49.254.458.17.856.425 1.192.765.335.34.598.764.789 1.273.188.51.282 1.108.282 1.795 0 .602-.077 1.157-.23 1.666-.155.51-.39.95-.702 1.32-.313.37-.704.662-1.17.875-.468.212-1.018.318-1.65.318h-3.57V4.537h3.57zm12.235 6.853c.178 0 .348-.016.51-.052.162-.034.305-.092.43-.174a.875.875 0 0 0 .294-.33c.073-.138.11-.316.11-.532 0-.423-.12-.727-.358-.908-.24-.182-.556-.273-.95-.273h-1.983v2.27h1.947zm-.104-3.508c.324 0 .59-.076.8-.231.208-.155.312-.404.312-.753a.954.954 0 0 0-.104-.474.761.761 0 0 0-.278-.29 1.165 1.165 0 0 0-.4-.144 2.63 2.63 0 0 0-.47-.041h-1.703v1.933h1.843zm.233-3.345c.394 0 .754.035 1.078.104.324.07.602.183.834.341.231.159.411.369.539.631.126.263.19.588.19.973 0 .417-.094.765-.284 1.041-.189.28-.468.506-.84.684.51.147.891.403 1.142.77.25.366.376.808.376 1.326 0 .416-.08.776-.242 1.082a2.12 2.12 0 0 1-.656.746 2.897 2.897 0 0 1-.938.43 4.255 4.255 0 0 1-1.083.137h-4.01V4.537h3.894zm3.486 0h2.04l1.934 3.265 1.923-3.265h2.028L76.03 9.63v3.172h-1.819V9.584z', fill: '#656E78' }),
						skate.h('path', { d: 'M102.992.404V12.81h2.79v-2.233l.96-.913 1.9 3.146h3.617l-3.487-5.004 3.346-3.268h-3.989l-1.604 1.89-.744.929V.404zM92.934 4.536l-1.05 5.649-1.375-5.65H87.3l-1.353 5.65-1.056-5.65H81.98l2.15 8.272h3.737l1.047-4.292 1.047 4.292H93.7l2.155-8.271zm32.036 5.173c-.355.463-.912.772-1.64.772-.834 0-1.5-.54-1.5-1.824 0-1.283.666-1.824 1.5-1.824.728 0 1.285.31 1.64.773V9.71zm2.784-2.767l.155-2.406h-2.546l-.192.906c-.587-.617-1.316-1.128-2.598-1.128-2.322 0-3.59 1.5-3.59 4.343 0 2.844 1.268 4.343 3.59 4.343 1.282 0 2.011-.51 2.598-1.128l.2.936h2.538l-.155-2.435V6.942zM98.83.45a1.594 1.594 0 1 0-.001 3.187A1.594 1.594 0 0 0 98.83.45m2.402 5.83V4.536h-3.996v8.272h3.996v-1.735h-1.253V6.28zM114.4 2.043a1.595 1.595 0 0 0 3.19 0 1.595 1.595 0 1 0-3.19 0m.445 4.237v4.793h-1.252v1.735h3.997V4.536h-3.997V6.28z', fill: '#092344' })
					)
				)
			);
		}
	}, {
		key: 'globalNavOnclick',
		value: function globalNavOnclick(event) {
			var $eventTarget = (0, _jquery2.default)(event.target),
			    $clickedToggle = $eventTarget.closest('.wds-dropdown__toggle'),
			    $clickedDropdown = $eventTarget.closest('.wds-dropdown');

			if ($clickedToggle.length) {
				$clickedDropdown.toggleClass('wds-is-active');

				if ($clickedDropdown.hasClass('wds-is-active')) {
					$clickedDropdown.trigger('wds-dropdown-open');
				}
			}

			(0, _jquery2.default)('.wds-dropdown.wds-is-active').not($clickedDropdown).removeClass('wds-is-active').trigger('wds-dropdown-close');

			(0, _jquery2.default)('.wds-global-navigation').toggleClass('wds-dropdown-is-open', Boolean($clickedDropdown.hasClass('wds-is-active')));
		}
	}, {
		key: 'renderCallback',
		value: function renderCallback() {
			return skate.h(
				'div',
				{ 'class': 'wds-global-navigation' },
				this.style(),
				skate.h(
					'div',
					{ 'class': 'wds-global-navigation__content-bar', onClick: this.globalNavOnclick },
					this.logo(),
					skate.h(
						'div',
						{ 'class': 'wds-global-navigation__links-and-search' },
						skate.h(
							'a',
							{ 'class': 'wds-global-navigation__link wds-is-games' },
							'Games'
						),
						skate.h(
							'a',
							{ 'class': 'wds-global-navigation__link wds-is-movies' },
							'Movies'
						),
						skate.h(
							'a',
							{ 'class': 'wds-global-navigation__link wds-is-tv' },
							'TV'
						),
						skate.h(
							'div',
							{ 'class': 'wds-global-navigation__wikis-menu wds-dropdown' },
							skate.h(
								'div',
								{ 'class': 'wds-global-navigation__dropdown-toggle wds-dropdown__toggle' },
								skate.h(
									'span',
									null,
									'Wikis'
								),
								skate.h(
									'svg',
									{ 'class': 'wds-icon wds-icon-tiny wds-dropdown__toggle-chevron', width: '12', height: '12', viewBox: '0 0 12 12', xmlns: 'http://www.w3.org/2000/svg' },
									skate.h('path', { d: 'M1 3h10L6 9z' })
								)
							),
							skate.h(
								'div',
								{ 'class': 'wds-global-navigation__dropdown-content wds-dropdown__content' },
								skate.h(
									'ul',
									{ 'class': 'wds-is-linked wds-list' },
									skate.h(
										'li',
										null,
										skate.h(
											'a',
											{ 'class': 'wds-global-navigation__dropdown-link' },
											'Explore Wikis'
										)
									),
									skate.h(
										'li',
										null,
										skate.h(
											'a',
											{ 'class': 'wds-global-navigation__dropdown-link' },
											'Community Central'
										)
									),
									skate.h(
										'li',
										null,
										skate.h(
											'a',
											{ 'class': 'wds-global-navigation__dropdown-link' },
											'Fandom University'
										)
									)
								)
							)
						),
						skate.h(
							'form',
							{ 'class': 'wds-global-navigation__search' },
							skate.h(
								'div',
								{ 'class': 'wds-global-navigation__search-input-wrapper wds-dropdown ' },
								skate.h(
									'label',
									{ 'class': 'wds-dropdown__toggle wds-global-navigation__search-label' },
									skate.h(
										'svg',
										{ 'class': 'wds-icon wds-icon-small wds-global-navigation__search-label-icon', width: '24', height: '24', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
										skate.h(
											'g',
											{ 'fill-rule': 'evenodd' },
											skate.h('path', { d: 'M21.747 20.524l-4.872-4.871a.864.864 0 1 0-1.222 1.222l4.871 4.872a.864.864 0 1 0 1.223-1.223z' }),
											skate.h('path', { d: 'M3.848 10.763a6.915 6.915 0 0 1 6.915-6.915 6.915 6.915 0 0 1 6.915 6.915 6.915 6.915 0 0 1-6.915 6.915 6.915 6.915 0 0 1-6.915-6.915zm-1.729 0a8.643 8.643 0 0 0 8.644 8.644 8.643 8.643 0 0 0 8.644-8.644 8.643 8.643 0 0 0-8.644-8.644 8.643 8.643 0 0 0-8.644 8.644z' })
										)
									),
									skate.h('input', { type: 'search', name: 'query', placeholder: 'Search', autocomplete: 'off', 'class': 'wds-global-navigation__search-input' })
								),
								skate.h(
									'button',
									{ 'class': 'wds-button wds-is-text wds-global-navigation__search-close', type: 'reset', 'data-ember-action': '690' },
									skate.h(
										'svg',
										{ 'class': 'wds-icon wds-icon-small wds-global-navigation__search-close-icon', width: '24', height: '24', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
										skate.h('path', { d: 'M19.707 4.293a.999.999 0 0 0-1.414 0L12 10.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L10.586 12l-6.293 6.293a.999.999 0 1 0 1.414 1.414L12 13.414l6.293 6.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L13.414 12l6.293-6.293a.999.999 0 0 0 0-1.414', 'fill-rule': 'evenodd' })
									)
								),
								skate.h(
									'div',
									{ 'class': 'wds-dropdown__content wds-global-navigation__search-suggestions' },
									skate.h('ul', { 'class': 'wds-has-ellipsis wds-is-linked wds-list' })
								),
								skate.h(
									'button',
									{ 'class': 'wds-button wds-global-navigation__search-submit', type: 'button', disabled: true },
									skate.h(
										'svg',
										{ 'class': 'wds-icon wds-icon-small wds-global-navigation__search-submit-icon', width: '24', height: '24', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
										skate.h('path', { d: 'M22.999 12a1 1 0 0 0-1-1H4.413l5.293-5.293a.999.999 0 1 0-1.414-1.414l-7 7a1 1 0 0 0 0 1.415l7 7a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.415L4.413 13h17.586a1 1 0 0 0 1-1', 'fill-rule': 'evenodd' })
									)
								)
							)
						)
					),
					skate.h(
						'div',
						{ 'class': 'wds-global-navigation__account-menu wds-dropdown' },
						skate.h(
							'div',
							{ 'class': 'wds-global-navigation__dropdown-toggle wds-dropdown__toggle' },
							skate.h(
								'svg',
								{ 'class': 'wds-icon wds-icon-small', width: '24', height: '24', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
								skate.h('path', { d: 'M12 14c3.309 0 6-2.691 6-6V6c0-3.309-2.691-6-6-6S6 2.691 6 6v2c0 3.309 2.691 6 6 6zm5 2H7c-3.86 0-7 3.14-7 7a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1c0-3.86-3.14-7-7-7z', 'fill-rule': 'evenodd' })
							),
							skate.h(
								'span',
								{ 'class': 'wds-global-navigation__account-menu-caption' },
								'My Account'
							),
							skate.h(
								'svg',
								{ 'class': 'wds-icon wds-icon-tiny wds-dropdown__toggle-chevron', width: '12', height: '12', viewBox: '0 0 12 12', xmlns: 'http://www.w3.org/2000/svg' },
								skate.h('path', { d: 'M1 3h10L6 9z' })
							)
						),
						skate.h(
							'div',
							{ 'class': 'wds-global-navigation__dropdown-content wds-dropdown__content wds-is-right-aligned' },
							skate.h(
								'ul',
								{ 'class': 'wds-has-lines-between wds-list' },
								skate.h(
									'li',
									null,
									skate.h(
										'a',
										{ rel: 'nofollow', href: '', 'class': 'wds-button wds-is-full-width' },
										'Sign In'
									)
								),
								skate.h(
									'li',
									null,
									skate.h(
										'div',
										{ 'class': 'wds-global-navigation__account-menu-dropdown-caption' },
										'Don\'t have an account?'
									),
									skate.h(
										'a',
										{ rel: 'nofollow', href: '', 'class': 'wds-button wds-is-full-width wds-is-secondary' },
										'Register'
									)
								)
							)
						)
					),
					skate.h(
						'div',
						{ 'class': 'wds-global-navigation__start-a-wiki' },
						skate.h(
							'a',
							{ 'class': 'wds-global-navigation__start-a-wiki-button wds-button wds-is-squished wds-is-secondary', href: 'http://www.wikia.com/Special:CreateNewWiki' },
							skate.h(
								'span',
								{ 'class': 'wds-global-navigation__start-a-wiki-caption' },
								'Start a Wiki'
							),
							skate.h(
								'svg',
								{ 'class': 'wds-global-navigation__start-a-wiki-icon wds-icon', width: '24', height: '24', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
								skate.h('path', { d: 'M11 13v9a1 1 0 1 0 2 0v-9h9a1 1 0 1 0 0-2h-9V2a1 1 0 1 0-2 0v9H2a1 1 0 1 0 0 2h9z', 'fill-rule': 'evenodd' })
							)
						)
					)
				)
			);
		}
	}], [{
		key: 'props',
		get: function get() {
			return {
				model: {
					attribute: true,
					deserialize: function deserialize(value) {
						return JSON.parse(value);
					},
					serialize: function serialize(value) {
						return JSON.stringify(value);
					}
				}
			};
		}
	}]);

	return _class;
}(skate.Component));

},{"jquery":2,"skatejs":4,"skatejs-web-components":3}]},{},[5]);
