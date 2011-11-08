###
DynWorker is copyright Félix "passcod" Saparelli
 and licensed under MIT: http://mit.passcod.net
###

"use strict";

DynWorker = (path = DynWorker.libpath) ->
  # The internal worker
  worker = new Worker(path)
  
  # Adds a listener to the "onmessage" event. The `e` object
  # cannot be touched, so we also pass a second parameter that
  # contains the unserialized data.
  receive = (func) ->
    callback = (e) ->
      func e, JSON.parse e.data
    worker.addEventListener "message", callback, false
  
  # A helper method for devs!
  log = ->
    receive (e, data) ->
      console.log data
  
  # Send a message to the worker. The message is JSON-ified, so
  # you can pass in whatever will get properly serialized.
  send = (msg) ->
    worker.postMessage(JSON.stringify msg)
  
  # Send a command to the worker. Args optional
  cmd = (action, args...) ->
    msg = {DynWorkerAction: action, args: 0}
    objAdd = (arg) ->
      msg.args++
      msg["arg#{msg.args}"] = arg
    objAdd arg for arg in args
    send msg
    
  # Eval code in the worker
  weval = (code) ->
    cmd 'eval', code
  
  # Inject a function in the worker. The function can be anonymous or
  # named, but the name will get stripped anyway, so you have to be
  # careful when writing recursive functions to use the internal name.
  inject = (name, func) ->
    # There's two kinds of functions: named and anonymous. We want them
    # all to be anonymous, so we can easily store them.
    sfunc = func.toString()
    unless /^function \(/.test(sfunc)
      sfunc.replace(/^function [^\(]+\(/, 'function (')
    
    # Namespace the function inside the worker
    weval "$.ns['#{name}']=#{sfunc};"
  
  # Run a function in the worker and pass it args
  run = (name, args...) ->
    # Send up what the function returns
    weval "$.send($.ns['#{name}'].apply(null, #{JSON.stringify args}));"
  
  # Use DOM Storage
  store = (type, action, key, data) ->
    switch action
      when 'key'
        val = if type is 'local'
          window.localStorage.key key
        else
          window.sessionStorage.key key
        cmd 'callback', data, [val]
      
      when 'get'
        val = if type is 'local'
          window.localStorage.getItem key
        else
          window.sessionStorage.getItem key
        cmd 'callback', data, [val]
      
      when 'set'
        if type is 'local'
          window.localStorage.setItem key, data
        else
          window.sessionStorage.setItem key, data
      
      when 'remove'
        if type is 'local'
          window.localStorage.removeItem key
        else
          window.sessionStorage.removeItem key
      
      when 'clear'
        if type is 'local'
          window.localStorage.clear()
        else
          window.sessionStorage.clear()
  
  # Respond to commands from worker
  receive (e, data) ->
    switch data['DynWorkerAction']
      when 'domstorage' then store data.arg1, data.arg2, data.arg3, data.arg4
  
  return {
    receive: receive
    log: log
    send: send
    cmd: cmd
    eval: weval
    inject: inject
    run: run
  }

# Default path and method to set it differently
DynWorker.libpath = "dynworker.js"
DynWorker.path = (path) ->
  if path then DynWorker.libpath = path



InWorker = ->
  # Hold callbacks here for doubly asynchronous processes
  callbacks = []
  
  # Run a callback stored above
  deepCallback = (index, arguments_array) ->
    callbacks[index].apply null, arguments_array
  
  # Receive a message from the parent (main) thread
  receive = (func) ->
    callback = (e) ->
      # Can't touch `e`, so use a second parameter
      func e, JSON.parse e.data
    self.addEventListener "message", callback, false
  
  # Send a message "up" (to the parent/main thread)
  send = (msg) ->
    self.postMessage(JSON.stringify msg)
  
  # Send a command to the parent (main) thread. This works
  # the same as worker.cmd does in the main thread.
  cmd = (action, args...) ->
    msg = {DynWorkerAction: action, args: 0}
    objAdd = (arg) ->
      msg.args++
      msg["arg#{msg.args}"] = arg
    objAdd arg for arg in args
    send msg
  
  # Use DOM Storage from the worker. Everything is async,
  # and the getters take a callback method instead of returning.
  store = (scope) ->
    return {
      key: (index, callback) ->
        i = callbacks.push callback
        cmd 'domstorage', scope, 'key', index, i-1
      getItem: (key, callback) ->
        i = callbacks.push callback
        cmd 'domstorage', scope, 'get', key, i-1
      setItem: (key, data) -> cmd 'domstorage', scope, 'set', key, data
      removeItem: (key) -> cmd 'domstorage', scope, 'remove', key
      clear: -> cmd 'domstorage', scope, 'clear'
    }
  
  
  return {
    ns: {} # Namespace for injected functions
    receive: receive
    send: send
    cmd: cmd
    callback: deepCallback
    localStorage: store('local')
    sessionStorage: store('session')
  }


if typeof window == "undefined"
  # This is a worker
  self.DynWorker = DynWorker
  
  self.$ = new InWorker();
  
  $.receive (e, data) ->
    switch data['DynWorkerAction']
      when 'eval' then eval data.arg1
      when 'callback' then $.callback data.arg1, data.arg2
else
  # This is the main thread
  window.DynWorker = DynWorker
