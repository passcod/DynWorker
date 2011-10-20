(function() {
  var DynWorker;
  self.onmessage = function(e) {
    switch (e.data['DynWorkerAction']) {
      case 'eval':
        return eval(e.data['code']);
    }
  };
  DynWorker = function(path) {
    var receive, runCode, send, worker;
    if (path == null) {
      path = "dynworker.js";
    }
    worker = new Worker(path);
    receive = function(callback) {
      return worker.onmessage = callback;
    };
    send = function(msg) {
      return worker.postMessage(msg);
    };
    runCode = function(code) {
      return send({
        DynWorkerAction: 'eval',
        code: code
      });
    };
    return {
      receive: receive,
      send: send,
      run: runCode
    };
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
