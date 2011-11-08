(function() {
  /*
  DynWorker is copyright Félix "passcod" Saparelli
   and licensed under MIT: http://mit.passcod.net
  */
  "use strict";
  var DynWorker, InWorker;
  var __slice = Array.prototype.slice;
  DynWorker = function(path) {
    var cmd, inject, log, receive, run, send, store, weval, worker;
    if (path == null) {
      path = DynWorker.libpath;
    }
    worker = new Worker(path);
    receive = function(func) {
      var callback;
      callback = function(e) {
        return func(e, JSON.parse(e.data));
      };
      return worker.addEventListener("message", callback, false);
    };
    log = function() {
      return receive(function(e, data) {
        return console.log(data);
      });
    };
    send = function(msg) {
      return worker.postMessage(JSON.stringify(msg));
    };
    cmd = function() {
      var action, arg, args, msg, objAdd, _i, _len;
      action = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      msg = {
        DynWorkerAction: action,
        args: 0
      };
      objAdd = function(arg) {
        msg.args++;
        return msg["arg" + msg.args] = arg;
      };
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        objAdd(arg);
      }
      return send(msg);
    };
    weval = function(code) {
      return cmd('eval', code);
    };
    inject = function(name, func) {
      var sfunc;
      sfunc = func.toString();
      if (!/^function \(/.test(sfunc)) {
        sfunc.replace(/^function [^\(]+\(/, 'function (');
      }
      return weval("$.ns['" + name + "']=" + sfunc + ";");
    };
    run = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return weval("$.send($.ns['" + name + "'].apply(null, " + (JSON.stringify(args)) + "));");
    };
    store = function(type, action, key, data) {
      switch (action) {
        case 'set':
          if (type === 'local') {
            return window.localStorage.setItem(key, data);
          } else {
            return window.sessionStorage.setItem(key, data);
          }
          break;
        case 'remove':
          if (type === 'local') {
            return window.localStorage.removeItem(key);
          } else {
            return window.sessionStorage.removeItem(key);
          }
          break;
        case 'clear':
          if (type === 'local') {
            return window.localStorage.clear();
          } else {
            return window.sessionStorage.clear();
          }
      }
    };
    receive(function(e, data) {
      switch (data['DynWorkerAction']) {
        case 'domstorage':
          return store(data.arg1, data.arg2, data.arg3, data.arg4);
      }
    });
    return {
      receive: receive,
      log: log,
      send: send,
      cmd: cmd,
      eval: weval,
      inject: inject,
      run: run
    };
  };
  DynWorker.libpath = "dynworker.js";
  DynWorker.path = function(path) {
    if (path) {
      return DynWorker.libpath = path;
    }
  };
  InWorker = function() {
    var cmd, receive, send, store;
    receive = function(func) {
      var callback;
      callback = function(e) {
        return func(e, JSON.parse(e.data));
      };
      return self.addEventListener("message", callback, false);
    };
    send = function(msg) {
      return self.postMessage(JSON.stringify(msg));
    };
    cmd = function() {
      var action, arg, args, msg, objAdd, _i, _len;
      action = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      msg = {
        DynWorkerAction: action,
        args: 0
      };
      objAdd = function(arg) {
        msg.args++;
        return msg["arg" + msg.args] = arg;
      };
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        objAdd(arg);
      }
      return send(msg);
    };
    store = {
      'local': {
        setItem: function(key, data) {
          return cmd('domstorage', 'local', 'set', key, data);
        },
        removeItem: function(key) {
          return cmd('domstorage', 'local', 'remove', key);
        },
        clear: function() {
          return cmd('domstorage', 'local', 'clear');
        }
      },
      'session': {
        setItem: function(key, data) {
          return cmd('domstorage', 'session', 'set', key, data);
        },
        removeItem: function(key) {
          return cmd('domstorage', 'session', 'remove', key);
        },
        clear: function() {
          return cmd('domstorage', 'session', 'clear');
        }
      }
    };
    return {
      ns: {},
      receive: receive,
      send: send,
      cmd: cmd,
      localStorage: store.local,
      sessionStorage: store.session
    };
  };
  if (typeof window === "undefined") {
    self.DynWorker = DynWorker;
    self.$ = new InWorker();
    $.receive(function(e, data) {
      switch (data['DynWorkerAction']) {
        case 'eval':
          return eval(data['arg1']);
      }
    });
  } else {
    window.DynWorker = DynWorker;
  }
}).call(this);
