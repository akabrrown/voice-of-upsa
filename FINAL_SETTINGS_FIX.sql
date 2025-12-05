
function getImagePreloadKey(href, imageSrcSet, imageSizes) {
  var uniquePart = '';

  if (typeof imageSrcSet === 'string' && imageSrcSet !== '') {
    uniquePart += '[' + imageSrcSet + ']';

    if (typeof imageSizes === 'string') {
      uniquePart += '[' + imageSizes + ']';
    }
  } else {
    uniquePart += '[][]' + href;
  }

  return "[image]" + uniquePart;
}

var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
function prepareHostDispatcher() {
  ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
} // Used to distinguish these contexts from ones used in other renderers.
// small, smaller than how we encode undefined, and is unambiguous. We could use
// a different tuple structure to encode this instead but this makes the runtime
// cost cheaper by eliminating a type checks in more positions.
// prettier-ignore

function createHints() {
  return new Set();
}

// We do this globally since the async work can potentially eagerly
// start before the first request and once requests start they can interleave.
// In theory we could enable and disable using a ref count of active requests
// but given that typically this is just a live server, it doesn't really matter.

function initAsyncDebugInfo() {
  {
    createAsyncHook({
      init: function (asyncId, type, triggerAsyncId) {// TODO
      },
      promiseResolve: function (asyncId) {
        // TODO
        executionAsyncId();
      },
      destroy: function (asyncId) {// TODO
      }
    }).enable();
  }
}

var supportsRequestStorage = typeof AsyncLocalStorage === 'function';
var requestStorage = supportsRequestStorage ? new AsyncLocalStorage() : null; // We use the Node version but get access to async_hooks from a global.

var createAsyncHook = typeof async_hooks === 'object' ? async_hooks.createHook : function () {
  return {
    enable: function () {},
    disable: function () {}
  };
};
var executionAsyncId = typeof async_hooks === 'object' ? async_hooks.executionAsyncId : null;

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = 