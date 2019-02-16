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
   * @param {Function} call callback util dependencies load completes
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

  // pre-check and fix the dependence
  var rUrl = /\//;  // releative url
  var rAbsoluteUrl = /^\/|^https?:\/\//;  // absolute url or external url
  function generateVaildUrl(url, baseUrl){
    var shim = CONFIG.shim[url], inpaths = false;
    if (CONFIG.paths[url]) {
      url = CONFIG.paths[url];
      inpaths = true;
    }

    if (rAbsoluteUrl.test(url)) {
      url = id2Url(url, baseUrl);
    } else if (rUrl.test(url)) {
      url = id2Url(url, inpaths ? CONFIG.baseUrl : baseUrl);
    }

    if (shim && !SHIMMAP[url]) {
      SHIMMAP[url] = shim;
    }
    return url;
  }
  function getVailddependencies(dependencies, baseUrl) {
    var vailddependencies = [];
    each(dependencies, function(dep){
      vailddependencies.push(generateVaildUrl(dep, baseUrl));
    })
    return vailddependencies;
  }

  // # region of Module class
  // static property of Module
  var STATUS = {
    // init, when module is created
    INIT: 0,
    // fetch, when fetch source code
    FETCH: 1,
    // save, save dependencies info
    SAVE = 2,
    // load, parse dependencies, resolve dependces
    LOAD: 3,
    // executing module, exports is not unused
    EXECUTING: 4,
    // executed, exports is ready to use
    EXECUTED: 5,
    // error
    ERROR: 6,
  };
  function Module(url, dependencies) {
    if (this instanceof Module) {
      this.url = url;
      this.dependenciesUrl = getVailddependencies(dependencies || [], url);
      this.dependenciesModules = [];
      this.refs = [];
      this.status = STATUS.INIT;
      this.exports = {};
    } else {
      return new Module(url, dependencies);
    }
  }
  Module.STATUS = STATUS;
  Module.prototype = {
    constructor: Module,
    // resolve every dependene as module
    resolve: function() {
      var mod = this;
      each(mod.dependenciesUrl, function (dep) {
        var m = Module.get(url);
        m.dependenciesModules.push(m);
      });
    },
    setdependencies: function () {
      var mod = this;
      each(mod.dependenciesModules, function (dependenceModule) {
        var exsit = false;
        each(mod.refs, function (ref) {
          if (ref === mod.url) return (exsit = true);

          if (!exsit) dependenceModule.refs.push(mod.url);
        })
      });
    },

    // check and resolve circular dependence
    checkCircular: function () {
      var mod = this, args = [], isCircular = false;
      each(mod.dependenciesModules, function (dependenceModule) {
        if (dependenceModule.status !== STATUS.EXECUTING) return;
        
        isCircular = false;
        each(dependenceModule.dependenciesModules, function(m) {
          if (m.url === mod.url) return (isCircular = true);
        });
        if (!isCircular) return;
        each(dependenceModule.dependenciesModules, function (m) {
          if (m.url !== mod.url && m.status >= STATUS.EXECUTED) {
            args.push(m.exports);
          } else if(m.url === mod.url){
            args.push(undefined);
          }
        });

        if (args.length !== dependenceModule.dependenciesModules.length) {
          args.push(dependenceModule.exports)
        }
        try {
          dependenceModule.exports = isFunction(dependenceModule.factory)
            ? dependenceModule.factory.apply(root, args) : dependenceModule.factory;
          dependenceModule.status = STATUS.EXECUTED;
        } catch (e) {
          dependenceModule.exports = undefined;
          dependenceModule.status = STATUS.error;
          throw new Error("Can't fix circular dependency" + mod.url + "-->" + dependenceModule.url);
        }
      });
    },
    makeExports: function(args) {
      var mod = this;
      var result = isFunction(mod.factory) ? mod.factory.apply(root, args) : mod.factory;
      mod.exports = isPlainObject(mod.exports) ? result : mod.exports;
    },
    notifyDependencies: function() {
      var mod = this;

      each(mod.refs, function(ref) {
        var args = [];
        ref = Module.get(ref);

        each(ref.dependencies, function(m) {
          if (m.status >= STATUS.EXECUTED) args.push(m.exports);
        });

        if (args.length === ref.dependencies.length) {
          args.push(ref.exports);
          ref.makeExports(args);
          ref.status = STATUS.EXECUTED;
          ref.notifyDependencies()
        } else {
          ref.load();
        }
      });
    },
    fetch: function () {
      var mod = this;

      if (mod.status >= STATUS.FETCH) return mod;
      mod.status = STATUS.FETCH;

      loadScript(mod.url, function(error) {
        mod.onload(error);
      });
    },
    onload: function () {
      
    }
    load: function() {
      var mod = this;
      var args = [];

      if (mod.status >= STATUS.load) return mod;

      mod = STATUS.LOAD;
      mod.resolve();  // resolve every dependence of current module

      // set dependence to ensure when dependence module is loaded,
      // current module will be notified.
      mod.setdependencies();

      // try to resolve circular dependency
      mod.checkCircular();

      // make every dependency of current module to load
      each(mod.dependencies, function(dep) {
        if (dep.status < STATUS.FETCH) {
          dep.fetch();
        } else if (dep.status === STATUS.SAVE) {
          dep.load();
        } else if (dep.status >= STATUS.EXECUTED) {
          args.push(dep.exports);
        }
      });

      mod.status = STATUS.EXECUTING;

      if (args.length === mod.dependenciesModules.length) {
        args.push(mod.exports);
        mod.makeExports(args);
        mod.status = STATUS.EXECUTED;

        // current module is ready, notify other modules which are depend on current module
        mod.notifyDependencies();
      }
    }
  }

  Module.get = function(url, deps) {
    return MODULES[url] || (MODULES[url] = new Module(url, deps));
  };
  // # end region
})(this)