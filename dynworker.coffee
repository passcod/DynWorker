###
DynWorker is Copyright 2011- Félix "passcod" Saparelli
and licensed under MIT: http://passcod.mit-license.org
###

"use strict";

self.onmessage = (e) ->
  switch e.data['DynWorkerAction']
    when 'eval' then eval e.data['code']


DynWorker = (path = DynWorker.libpath) ->
  worker = new Worker(path)
  
  receive = (callback) ->
    worker.onmessage = callback
  
  send = (msg) ->
    worker.postMessage(msg)
  
  weval = (code) ->
    send {
      DynWorkerAction: 'eval'
      code: code
    }
  
  inject = (name, func) ->
    sfunc = func.toString()
    unless /^function \(/.test(sfunc)
      sfunc.replace(/^function [^\(]+\(/, 'function (')
    
    weval "DynWorker.ns['#{name}']=#{sfunc};"
  
  run = (name, args...) ->
    weval "DynWorker.send(DynWorker.ns['#{name}'].apply(null, #{JSON.stringify args}));"
  
  return {
    receive: receive
    send: send
    eval: weval
    inject: inject
    run: run
  }

DynWorker.ns = {}

DynWorker.libpath = "dynworker.js"
DynWorker.path = (path) ->
  if path then DynWorker.libpath = path;

DynWorker.send = (msg) ->
  self.postMessage(msg)


if typeof window == "undefined"
  self.DynWorker = DynWorker
else
  window.DynWorker = DynWorker
