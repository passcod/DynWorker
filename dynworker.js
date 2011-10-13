var workerData = [];

onmessage = function(e) {
  if (
};

(function(){
  var DynWorker = function() {
    /** @private */
    var worker = new Worker("dynworker.js");
    
    /** @public */
    var inject = function(data, type) {
      //
    };
    
    var run = function(funcname, args) {
      //
    };
    
    return {
      inject: inject,
      run: run
    };
  };
  
  window.DynWorker = DynWorker;
});
