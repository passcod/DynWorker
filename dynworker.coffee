"use strict"
###* DynWorker
 *
 * Ver: 2.0.0-pre
 * Who: Félix Saparelli
 * Web: https://passcod.net/DynWorker
 * Git: https://github.com/passcod/DynWorker
 *
 * Released in the Public Domain
 * https://passcod.net/license.html
###


Workers = (args...) ->
  select = (sel) ->
    if sel == "*"
      Workers.all
    else if sel[0] == "."
      sel.shift()
      Workers.all.filter (w) -> w.hasClass sel
    else
      []
  
  new Workers.wrap args.map (arg) ->
    if typeof arg == "string"
      select arg
    else if arg instanceof DynWorker
      arg

Workers.all = []

class Workers.wrap
  contructor: (@selection) ->
  
  create: (n) ->
    unless n <= 0
      while n -= 1
        @selection.push new DynWorker
    return @
  
  # Until we get Harmony's _proxies_ or SpiderMonkey's
  # _noSuchMethod_ we'll have to stick with doing things
  # manually. Although the list could probably be pulled
  # from `DynWorker.prototype`…
  for method in ["addClass", "removeClass", "hasClass",
    "push", "pull", "send", "eval", "destroy", "listen"]
    ((m) ->
      @prototype[m] = (args...) ->
        @selection.map (w) ->
          w[m] args...
        return @
    ).call @, method
  
  get: (n) ->
    n ||= 0
    @selection[n]

class DynWorker
  constructor: (@metal = new Worker DynWorker.self) ->
    @classes = []
    @callbacks = []
    @listeners = []
    
    Workers.all.push @
    @metal.addEventListener "message", (e) ->
      msg = e.data
      cmds = msg.split ":", 3
      if cmds[0] == "DynWorker"
        if cmds[1] == "callback"
          cbk = JSON.parse cmds[2]
          callbacks[cbk.callback].apply @, cbk.args
          callbacks[cbk.callback] =  undefined
      else
        listeners.forEach (l) -> l.apply @, msg
    , false
    @send "start"
  
  send: (val...) ->
    val.unshift "DynWorker"
    @metal.postMessage val.join ":"
  
  eval: (code) ->
    @send "eval", JSON.stringify code
  
  addClass: (klass) ->
    klass.split(" ").forEach (k) ->
      k = k.replace /^\./, ""
      if @classes.indexOf(k) == -1
        @classes.push k
  
  removeClass: (klass) ->
    klass.split(" ").forEach (k) ->
      k = k.replace /^\./, ""
      unless @classes.indexOf(k) == -1
        @classes.splice @classes.indexOf(k), 1
  
  hasClass: (klass, all = true) ->
    klass.split(" ").forEach (k) ->
      has = @classes.indexOf(k) != -1
      return true if (has && !all) || (!has && all)
  
  push: (name, data) ->
    if typeof data == "function"
      @send "function", JSON.stringify
        name: name
        source: data.toString()
    else
      @send "data", JSON.stringify
        name: name
        data: data
  
  pull: (name, callback) ->
    @send "pull", JSON.stringify
      callback: @callbacks.push(callback) - 1
      name: name
  
  destroy: (kill) ->
    if kill
      @metal.terminate()
    else
      @eval "self.close()"
  
    Workers.all.splice Workers.all.indexOf(@), 1
    @metal = null
  
  listen: (callback) ->
    listeners.push callback


# Simple queue for functions
# to be run whenever DynWorker
# is ready or immediately once
# it is.
readies  = []
DynWorker.ready = (cbk) -> readies.push cbk
were_ready = ->
  readies.forEach (cbk) -> cbk()
  DynWorker.ready = (fn) -> fn()


if typeof window == "undefined"
  # Have a way to call back up
  self.Parent = new DynWorker self
  Workers.all.pop()

  # If this is loading from within a worker,
  # we will have to ask the parent thread
  # for its copy of ourselves.
  Parent.pull "DynWorker.self", (us) ->
    DynWorker.self = us
    were_ready()
else
  # This is actually useful. Honest.
  window.self = window
  
  # To have DynWorker work properly, the script
  # tag that loads it needs to have an HTML5
  # `data-dynworker` attribute on it. See the
  # README for markup and async examples.
  DynWorker.file ||= document.querySelector("script[data-dynworker]").src
  req = new XMLHttpRequest()
  req.onreadystatechange = (e) ->
    if req.readyState == 4 && (req.status == 200 || req.status == 304)
      DynWorker.self = "data:text/javascript;base64,#{btoa req.responseText}"
      were_ready()
  req.open "GET", DynWorker.file, true
  req.send null


self.addEventListener "message", (e) ->
  cmds = e.data.split ":", 3
  
  if cmds[0] == "DynWorker"
    # Need some input handling here
    msg = JSON.parse cmds[2]
    switch cmds[1]
      when "eval"
        eval.call self, msg
      when "data"
        self[msg.name] = msg.data
      when "function"
        eval.call self, "self.#{msg.name} = #{msg.source};"
      when "pull"
        eval.call self, "self.postMessage('DynWorker:callback:'+" +
          "JSON.stringify({" +
            "callback:#{msg.callback}," +
            "args:[self.#{msg.name}]" +
          "}));"
, false


# Export
@DynWorker = DynWorker
@Workers = Workers