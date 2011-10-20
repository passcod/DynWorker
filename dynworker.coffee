self.onmessage = (e) ->
  switch e.data['DynWorkerAction']
    when 'eval' then eval e.data['code']



DynWorker = (path = "dynworker.js") ->
  worker = new Worker(path)
  
  receive = (callback) ->
    worker.onmessage = callback
  
  send = (msg) ->
    worker.postMessage(msg)
  
  runCode = (code) ->
    send {
      DynWorkerAction: 'eval'
      code: code
    }
  
  return {
    receive: receive
    send: send
    run: runCode
  }

DynWorker.send = (msg) ->
  self.postMessage(msg)


if typeof window == "undefined"
  self.DynWorker = DynWorker
else
  window.DynWorker = DynWorker
