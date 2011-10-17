self.onmessage = (e) ->
  self.postMessage "Gotcha: "+e.data



DynWorker = (path = "dynworker.js") ->
  worker = new Worker(path)
  
  receive = (callback) ->
    worker.onmessage = callback
  
  send = (msg) ->
    worker.postMessage(msg)
  
  return {
    receive: receive
    send: send
  }



if typeof window == "undefined"
  self.DynWorker = DynWorker
else
  window.DynWorker = DynWorker
