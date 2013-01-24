(function() {
  "use strict";

  /** DynWorker
   *
   * Ver: 2.0.0-pre
   * Who: Félix Saparelli
   * Web: https://passcod.net/DynWorker
   * Git: https://github.com/passcod/DynWorker
   *
   * Released in the Public Domain
   * https://passcod.net/license.html
   */

  var DynWorker, Workers, readies, req, were_ready,
    __slice = [].slice;

  Workers = function() {
    var args, select;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    select = function(sel) {
      if (sel === "*") {
        return Workers.all;
      } else if (sel[0] === ".") {
        sel.shift();
        return Workers.all.filter(function(w) {
          return w.hasClass(sel);
        });
      } else {
        return [];
      }
    };
    return new Workers.wrap(args.map(function(arg) {
      if (typeof arg === "string") {
        return select(arg);
      } else if (arg instanceof DynWorker) {
        return arg;
      }
    }));
  };

  Workers.all = [];

  Workers.wrap = (function() {
    var method, _fn, _i, _len, _ref;

    function wrap() {}

    wrap.prototype.contructor = function(selection) {
      this.selection = selection;
    };

    wrap.prototype.create = function(n) {
      if (!(n <= 0)) {
        while (n -= 1) {
          this.selection.push(new DynWorker);
        }
      }
      return this;
    };

    _ref = ["addClass", "removeClass", "hasClass", "push", "pull", "send", "eval", "destroy", "listen"];
    _fn = function(m) {
      return this.prototype[m] = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.selection.map(function(w) {
          return w[m].apply(w, args);
        });
        return this;
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      method = _ref[_i];
      _fn.call(wrap, method);
    }

    wrap.prototype.get = function(n) {
      n || (n = 0);
      return this.selection[n];
    };

    return wrap;

  })();

  DynWorker = (function() {

    function DynWorker(metal) {
      this.metal = metal != null ? metal : new Worker(DynWorker.self);
      this.classes = [];
      this.callbacks = [];
      this.listeners = [];
      Workers.all.push(this);
      this.metal.addEventListener("message", function(e) {
        var cbk, cmds, msg;
        msg = e.data;
        cmds = msg.split(":", 3);
        if (cmds[0] === "DynWorker") {
          if (cmds[1] === "callback") {
            cbk = JSON.parse(cmds[2]);
            callbacks[cbk.callback].apply(this, cbk.args);
            return callbacks[cbk.callback] = void 0;
          }
        } else {
          return listeners.forEach(function(l) {
            return l.apply(this, msg);
          });
        }
      }, false);
      this.send("start");
    }

    DynWorker.prototype.send = function() {
      var val;
      val = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      val.unshift("DynWorker");
      return this.metal.postMessage(val.join(":"));
    };

    DynWorker.prototype["eval"] = function(code) {
      return this.send("eval", JSON.stringify(code));
    };

    DynWorker.prototype.addClass = function(klass) {
      return klass.split(" ").forEach(function(k) {
        k = k.replace(/^\./, "");
        if (this.classes.indexOf(k) === -1) {
          return this.classes.push(k);
        }
      });
    };

    DynWorker.prototype.removeClass = function(klass) {
      return klass.split(" ").forEach(function(k) {
        k = k.replace(/^\./, "");
        if (this.classes.indexOf(k) !== -1) {
          return this.classes.splice(this.classes.indexOf(k), 1);
        }
      });
    };

    DynWorker.prototype.hasClass = function(klass, all) {
      if (all == null) {
        all = true;
      }
      return klass.split(" ").forEach(function(k) {
        var has;
        has = this.classes.indexOf(k) !== -1;
        if ((has && !all) || (!has && all)) {
          return true;
        }
      });
    };

    DynWorker.prototype.push = function(name, data) {
      if (typeof data === "function") {
        return this.send("function", JSON.stringify({
          name: name,
          source: data.toString()
        }));
      } else {
        return this.send("data", JSON.stringify({
          name: name,
          data: data
        }));
      }
    };

    DynWorker.prototype.pull = function(name, callback) {
      return this.send("pull", JSON.stringify({
        callback: this.callbacks.push(callback) - 1,
        name: name
      }));
    };

    DynWorker.prototype.destroy = function(kill) {
      if (kill) {
        this.metal.terminate();
      } else {
        this["eval"]("self.close()");
      }
      Workers.all.splice(Workers.all.indexOf(this), 1);
      return this.metal = null;
    };

    DynWorker.prototype.listen = function(callback) {
      return listeners.push(callback);
    };

    return DynWorker;

  })();

  readies = [];

  DynWorker.ready = function(cbk) {
    return readies.push(cbk);
  };

  were_ready = function() {
    readies.forEach(function(cbk) {
      return cbk();
    });
    return DynWorker.ready = function(fn) {
      return fn();
    };
  };

  if (typeof window === "undefined") {
    self.Parent = new DynWorker(self);
    Workers.all.pop();
    Parent.pull("DynWorker.self", function(us) {
      DynWorker.self = us;
      return were_ready();
    });
  } else {
    window.self = window;
    DynWorker.file || (DynWorker.file = document.querySelector("script[data-dynworker]").src);
    req = new XMLHttpRequest();
    req.onreadystatechange = function(e) {
      if (req.readyState === 4 && (req.status === 200 || req.status === 304)) {
        DynWorker.self = "data:text/javascript;base64," + (btoa(req.responseText));
        return were_ready();
      }
    };
    req.open("GET", DynWorker.file, true);
    req.send(null);
  }

  self.addEventListener("message", function(e) {
    var cmds, msg;
    cmds = e.data.split(":", 3);
    if (cmds[0] === "DynWorker") {
      msg = JSON.parse(cmds[2]);
      switch (cmds[1]) {
        case "eval":
          return eval.call(self, msg);
        case "data":
          return self[msg.name] = msg.data;
        case "function":
          return eval.call(self, "self." + msg.name + " = " + msg.source + ";");
        case "pull":
          return eval.call(self, "self.postMessage('DynWorker:callback:'+" + "JSON.stringify({" + ("callback:" + msg.callback + ",") + ("args:[self." + msg.name + "]") + "}));");
      }
    }
  }, false);

  this.DynWorker = DynWorker;
  this.Workers = Workers;
}).call(this);
