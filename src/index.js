(function (root) {
  var CONFIG = {
    baseUrl: '',
    chartset: '',
    paths: {},
    shim: {},
  };

  var MODULES = {};

  var SHIMMAP = {};
  var cache = {
    modules: MODULES,
    config: CONFIG,
  };

  var noop = function () { };
  var document = root.document;
  var head = document.head;
  var baseElement = document.getElementsByTagName('base')[0];
  var currentlyAddingScript, interactiveScript, anonymousMeta;

  // #utils region
  function isType(type) {
    return function (obj) {
      return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    };
  }

  var isFunction = isType('Funtion');
  var isString = isType('String');
  var isArray = isType('Array');

  function hasProp(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function _each(step) {
    return function (arr, callback) {
      if (!isArray(arr)) return;
      var _step = step > 0 ? 1 : -1;
      var start = step > 0 ? 0 : arr.length - 1;
      var end = step > 0 ? arr.length : 0;

      while (start !== end) {
        if (callback(arr[start], start, arr)) return;
        start += _step;
      }
    }
  }

  var each = _each(1);
  var eachReverse = _each(-1);

  function eachProp(obj, callback) {
    for (var prop in obj) {
      if (hasProp(obj, prop)) {
        if (callback(obj[prop], prop)) break;
      }
    }
  }

  function isPlainObject(obj) {
    if (typeof obj !== 'object' || obj === null) return false;

    var proto = Object.getPrototypeOf(obj);
    if (proto === null) return true;
    var baseProto = proto;

    while (Object.getPrototypeOf(obj)) {
      baseProto = Object.getPrototypeOf(baseProto);
    }

    return proto === baseProto;

  }
  /**
   * get global variable by path like name.length
   */
  function getGlobal(path) {
    if (!path) return path;

    var _global = root;
    var _path = path.split('.');

    each(_path, function (prop) {
      _global = (_global !== null) && _global[prop];
    })
    return _global;
  }

  /**
   * Mixin source props to target
   */

  function mixin(target, source) {
    if (source) {
      eachProp(source, function (value, prop) {
        target[prop] = value;
      });
    }

    return target;
  }
  // #end region

  // #format id region
  var dotReg = /\/\.\//g; // match /./
  var doubleDotReg = /\/[^/]+\/\.\.\//g; // match /a/../
  var multiSlashReg = /([^:/])\/+\//g;  // a/b/
  var ignorePartReg = /[?#].*$/; // main/test?foo#bar
  var suffixReg = /\.js$/;  // abc.js
  var dirnameReg = /[^?#]*\//;  // abc//

  function fixPath(path) {
    // /a/b/./c/./d --> /a/b/c/d
    path = path.replace(dotReg, '/');

    // a//b/c --> a/b/c
    // a///b////c --> a/b/c
    path = path.replace(multiSlashReg, '$1/');

    // /a/b/../ --> /a/
    while (path.match(doubleDotReg)) {
      path = path.replace(doubleDotReg, '/');
    }
    // main/test
    path = path.replace(ignorePartReg, '');

    // add .js suffix
    if (!suffixReg.test(path)) {
      path += 'js';
    }
  }

  function dirname(path) {
    var m = path.match(dirnameReg);
    return m ? m[0] : './';
  }

  function id2Url(url, baseUrl) {
    url = fixPath(url);
    if (baseUrl) {
      url = fixPath(dirname(baseUrl) + url);
    }
    if (CONFIG.urlArgs) {
      url += CONFIG.urlArgs;
    }

    return url;
  }
  // #end region

  function onload(error) {
    // ensure just execute once
    node.onload = node.onerror = node.onreadystatechange = null;

    head.remove(node);
    node = null;

    callback(error);
  }
  /**
   * load script
   * @param {String} script id
   * @param {Function} call callback util dependences load completes
   */
  function loadScript(url, callback) {
    var node = document.createElement('script');
    var supportOnLoad = 'onload' in node;

    node.chartset = CONFIG.chartset || 'utf-8';
    node.setAttribute('data-module', url);

    if (supportOnLoad) {
      node.onload = function () {
        onload()
      }

      node.onerror = function () {
        onload(true);
      }
    } else {
      node.onreadystatechange = function () {
        if (/loaded|complete/g.test(node.readyState)) {
          onload();
        }
      }
    }

    node.async = true;
    node.src = url;

    // https://gist.github.com/invernizzie/5260808#file-require-js-L1846

    // For some cache cases in IE 6-8, the script executes before the end
    //of the appendChild execution, so to tie an anonymous define
    //call to the module name (which is stored on the node), hold on
    //to a reference to this node, but clear after the DOM insertion.
    currentlyAddingScript = node;

    baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node);

    currentlyAddingScript = null;

    
  }

  function getScripts() {
    return document.getElementsByTagName('script');
  }

  // get interactive script

  function getInteractiveScript() {
    if (currentlyAddingScript) {
      return currentlyAddingScript;
    }

    if (interactiveScript &&
        interactiveScript.readyState === 'interactive') {
          return interactiveScript;
        }
    if(document.currentScript) {
      interactiveScript = document.currentScript;
      return interactiveScript;
    }

    eachReverse(getScripts, function(script) {
      if (script.readyState === 'interactive') {
        interactiveScript = script;
        return true;
      }
    });

    return interactiveScript;
  }
})(this)