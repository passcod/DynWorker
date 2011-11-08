###
DynWorker is Copyright Félix "passcod" Saparelli
 and licensed under MIT: http://mit.passcod.net
###

"use strict";

DynWorker = (path = DynWorker.libpath) ->
  worker = new Worker(path)
  
  receive = (func) ->
    callback = (e) ->
      e.data = JSON.parse e.data
      func e
    worker.addEventListener "message", callback, false
  
  log = ->
    receive (e) ->
      console.log e.data
  
  send = (msg) ->
    worker.postMessage(JSON.strinigfy msg)
  
  cmd = (action, args...) ->
    msg = {DynWorkerAction: action, args: 0}
    objAdd = (arg) ->
      msg.args++
      msg["arg#{msg.args}"] = arg
    objAdd arg for arg in args
    send msg
    
  
  weval = (code) ->
    cmd 'eval', code
  
  inject = (name, func) ->
    sfunc = func.toString()
    unless /^function \(/.test(sfunc)
      sfunc.replace(/^function [^\(]+\(/, 'function (')
    
    weval "DynWorker.ns['#{name}']=#{sfunc};"
  
  run = (name, args...) ->
    weval "DynWorker.send(DynWorker.ns['#{name}'].apply(null, #{JSON.stringify args}));"
  
  return {
    receive: receive
    log: log
    send: send
    cmd: cmd
    eval: weval
    inject: inject
    run: run
  }

DynWorker.ns = {}

DynWorker.libpath = "dynworker.js"
DynWorker.path = (path) ->
  if path then DynWorker.libpath = path

DynWorker.receive = (func) ->
  callback = (e) ->
    e.data = JSON.parse e.data
    func e
  self.addEventListener "message", callback, false

DynWorker.send = (msg) ->
  self.postMessage(JSON.stringify msg)

DynWorker.cmd = (action, args...) ->
  msg = {DynWorkerAction: action, args: 0}
  objAdd = (arg) ->
    msg.args++
    msg["arg#{msg.args}"] = arg
  objAdd arg for arg in args
  DynWorker.send msg


if typeof window == "undefined"
  self.DynWorker = DynWorker
  
  DynWorker.receive (e) ->
    switch e.data['DynWorkerAction']
      when 'eval' then eval e.data['arg1']
else
  window.DynWorker = DynWorker
