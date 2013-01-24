###*
 * Core
 * 
 * This tests the core functionality:
 * - Worker creation
 * - In-worker-eval
 * - Worker-to-main communication
###

var answer = ""

casper.test.comment "Core: creation / forward & backward comms"

casper.on "remote.message", (msg) ->
  @log "Page says: #{msg}"
  answer = msg

casper.start "http://localhost:158080", ->
  @evaluate ->
    window.thread = new DynWorker()
    thread.listen (msg) -> @echo "Worker says: #{msg}"
    thread.eval "self.test = 'foo';"
    thread.eval "sendMessage('hello world');"

casper.then ->
  this.test.assertEquals answer, "hello world"

casper.run -> this.test.done 1