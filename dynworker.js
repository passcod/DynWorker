(function() {
  "use strict";
  var global, DynWorker, Workers, Parent;
  
  /* We should not care if we're in a worker or in a parent
   * thread, as children are allowed according to the spec,
   * if not all implementations. So all the tools should be
   * available, to the exception of the `parent` variable in
   * the main thread.
   */
  if (typeof window !== "undefined") {
    global = window;
  } else {
    global = self;
    
    self.addEventListener("message", function (event) {
      var msg = event.data;
      
      if (/^DynWorker\:/.test(msg)) {
        msg = msg.replace(/^DynWorker\:/, '');
        
        if (/^eval\:/.test(msg)) {
          msg = msg.replace(/^eval\:/, '');
          eval.call(self, JSON.parse(msg));
        }
        
        if (/^data\:/.test(msg)) {
          msg = JSON.parse(msg.replace(/^data\:/, ''));
          self[msg.name] = msg.data;
        }
        
        if (/^function\:/.test(msg)) {
          msg = JSON.parse(msg.replace(/^function\:/, ''));
          eval.call(self, "self."+msg.name+"="+msg.source);
        }
        
        if (/^pull\:/.test(msg)) {
          msg = JSON.parse(msg.replace(/^pull\:/, ''));
          eval.call(self, "self.postMessage('DynWorker:callback:'+JSON.stringify({callback:"+msg.callback+",args:[self."+msg.name+"]}));");
        }
      }
    }, false);
  }
  
  Workers = function () {
    var i, selection;
    
    /* The selection is originally empty. If no arguments are
     * passed, the foreach loop does not run, and it will
     * remain empty.
     */
    selection = [];
    
    for (i in arguments) {
      if (typeof arguments[i] === "string") {
        selection.push.apply(selection, select(arguments[i]));
      } else if (arguments[i] instanceof DynWorker) {
        selection.push(arguments[i]);
      }
    }
    
    return new Workers.wrap(selection);
    
    /* Go through the Workers.all array and return the
     * workers that match the given selector.
     * 
     * Currently supports:
     *  - `*`: get all workers
     *  - `.class`: get all workers that have the class
     */
    function select(selector) {
      if (selector === "*") {return Workers.all;}
      var i, selection = [];
      selector = selector.replace(/^\./, '');
      for (i in Workers.all) {
        if (Workers.all[i].hasClass(selector)) {
          selection.push(Workers.all[i]);
        }
      }
      return selection;
    }
  };
  
  Workers.all = [];
  
  Workers.wrap = function (selection) {this.selection = selection;}
  
  Workers.wrap.prototype.create = function (n) {
    for (var i = 0; i < n; i += 1) {
      this.selection.push(new DynWorker());
    }
    return this;
  };
  
  Workers.wrap.prototype.addClass = function (klass) {
    for (var i in this.selection) {
      this.selection[i].addClass(klass);
    }
    return this;
  };
  
  Workers.wrap.prototype.removeClass = function (klass) {
    for (var i in this.selection) {
      this.selection[i].removeClass(klass);
    }
    return this;
  };
  
  Workers.wrap.prototype.push = function (name, data) {
    for (var i in this.selection) {
      this.selection[i].push(name, data);
    }
    return this;
  };
  
  Workers.wrap.prototype.pull = function (name, callback) {
    for (var i in this.selection) {
      this.selection[i].pull(name, callback);
    }
    return this;
  };
  
  Workers.wrap.prototype.eval = function (code) {
    for (var i in this.selection) {
      this.selection[i].eval(code);
    }
    return this;
  };
  
  Workers.wrap.prototype.destroy = function (kill) {
    for (var i in this.selection) {
      this.selection[i].destroy(kill);
    }
    return this;
  };
  
  Workers.wrap.prototype.get = function (n) {
    return n? this.selection[n] : this.selection[0];
  };
  
  DynWorker = function () {
    var worker, classes, listeners,
        weval, listen, callbacks,
        addClass, removeClass, hasClass,
        push, pull,
        seppuku, guillotine;
    
    worker = new Worker(DynWorker.file);
    worker.postMessage("DynWorker:start");
    classes = [];
    listeners = [];
    callbacks = [];
    
    weval = function (code) {
      worker.postMessage("DynWorker:eval:"+JSON.stringify(code));
    };
    
    worker.addEventListener("message", function (event) {
      var i, msg = event.data;
      if (/^DynWorker\:/.test(msg)) {
        msg = msg.replace(/^DynWorker\:/, '');
        if (/^callback\:/.test(msg)) {
          msg = JSON.parse(msg.replace(/^callback\:/, ''));
          var callback = callbacks[msg.callback];
          callback.apply({}, msg.args);
          callbacks[msg.callback] = undefined;
        }
      } else {
        for (i in listeners) {
          listeners[i](msg);
        }
      }
    }, false);
    
    addClass = function (klass) {
      if (classes.indexOf(klass) === -1) {
        classes.push(klass);
      }
    };
    
    removeClass = function (klass) {
      if (classes.indexOf(klass) !== -1) {
        classes.splice(classes.indexOf(klass), 1);
      }
    };
    
    hasClass = function (klass) {
      return classes.indexOf(klass) !== -1;
    };
    
    
    push = function (name, data) {
      if (typeof data === "function") {
        worker.postMessage("DynWorker:function:"+JSON.stringify({
          name: name,
          source: data.toString()
        }));
      } else {
        worker.postMessage("DynWorker:data:"+JSON.stringify({
          name: name,
          data: data
        }));
      }
    };
    
    pull = function (name, callback) {
      worker.postMessage("DynWorker:pull:"+JSON.stringify({
        callback: callbacks.push(callback)-1,
        name: name
      }));
    };
    
    seppuku = function () {
      weval("self.close()");
    };
    
    guillotine = function () {
      worker.terminate();
    };
    
    
    this.addClass = addClass;
    this.removeClass = removeClass;
    this.hasClass = hasClass;
    
    this.push = push;
    this.pull = pull;
    this.destroy = function (kill) {
      if (kill) {
        guillotine();
      } else {
        seppuku();
      }
      
      Workers.all.splice(Workers.all.indexOf(this), 1);
      worker = null;
    };
    
    this.eval = weval;
    this.listen = function (callback) {
      listeners.push(callback);
    };
    
    Workers.all.push(this);
  };
  
  DynWorker.file = 'dynworker.js';
  
  
  Parent = function () {
    return {
      log: function () { return 'Hey'; }
    };
  };
  
  /* Add all our stuff to the global */
  global.Workers = Workers;
  global.DynWorker = DynWorker;
  
  if (typeof window === "undefined") {
    global.parent_thread = new Parent();
  }
}).call(this);
