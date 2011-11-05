(function() {
  /*
  DynWorker is Copyright 2011- Félix "passcod" Saparelli
  and licensed under MIT: http://passcod.mit-license.org
  */
  "use strict";
  var DynWorker;
  var __slice = Array.prototype.slice;
  self.onmessage = function(e) {
    switch (e.data['DynWorkerAction']) {
      case 'eval':
        return eval(e.data['code']);
    }
  };
  DynWorker = function(path) {
    var inject, log, receive, run, send, weval, worker;
    if (path == null) {
      path = DynWorker.libpath;
    }
    worker = new Worker(path);
    receive = function(callback) {
      return worker.addEventListener("message", callback, false);
    };
    log = function() {
      return receive(function(e) {
        return console.log(e.data);
      });
    };
    send = function(msg) {
      return worker.postMessage(msg);
    };
    weval = function(code) {
      return send({
        DynWorkerAction: 'eval',
        code: code
      });
    };
    inject = function(name, func) {
      var sfunc;
      sfunc = func.toString();
      if (!/^function \(/.test(sfunc)) {
        sfunc.replace(/^function [^\(]+\(/, 'function (');
      }
      return weval("DynWorker.ns['" + name + "']=" + sfunc + ";");
    };
    run = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return weval("DynWorker.send(DynWorker.ns['" + name + "'].apply(null, " + (JSON.stringify(args)) + "));");
    };
    return {
      receive: receive,
      log: log,
      send: send,
      eval: weval,
      inject: inject,
      run: run
    };
  };
  DynWorker.ns = {};
  DynWorker.libpath = "dynworker.js";
  DynWorker.path = function(path) {
    if (path) {
      return DynWorker.libpath = path;
    }
  };
  DynWorker.send = function(msg) {
    return self.postMessage(msg);
  };
  if (typeof window === "undefined") {
    self.DynWorker = DynWorker;
  } else {
    window.DynWorker = DynWorker;
  }
}).call(this);
