(function() {
  var DynWorker;
  self.onmessage = function(e) {
    return self.postMessage("Gotcha: " + e.data);
  };
  DynWorker = function(path) {
    var receive, send, worker;
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
    return {
      receive: receive,
      send: send
    };
  };
  if (typeof window === "undefined") {
    self.DynWorker = DynWorker;
  } else {
    window.DynWorker = DynWorker;
  }
}).call(this);
