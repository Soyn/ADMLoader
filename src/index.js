(function(root){
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

  var noop = function() {};
  var document = root.document;
  var head = document.head;
  var baseElement = document.getElementsByTagName('base')[0];

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

      while(start !== end) {
        if (callback(arr[start], start, arr)) return;
        start += _step;
      }
    }
  }

  var each = _each(1);
  var eachReverse = _each(-1);

  function eachProp(obj, callback) {
    for(var prop in obj) {
      if (hasProp(obj, prop)) {
        if(callback(obj[prop], prop)) break;
      }
    }
  }

  function isPlainObject(obj) {
    if (typeof obj !== 'object' || obj === null) return false;

    var proto = Object.getPrototypeOf(obj);
    if (proto === null) return true;
    var baseProto = proto;

    while(Object.getPrototypeOf(obj)) {
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

    each(_path, function(prop) {
      _global = (_global !== null) && _global[prop];
    })
    return _global;
  }

  /**
   * Mixin source props to target
   */

   function mixin(target, source) {
     if (source) {
      eachProp(source, function(value, prop) {
        target[prop] = value;
      });
     }

     return target;
   }
  // #end region

})(this)