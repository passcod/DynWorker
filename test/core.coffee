###*
 * Core
 * 
 * This tests the core functionality:
 * - Worker creation
 * - In-worker-eval
 * - Worker-to-main communication
###
casper = require('casper').create()

casper.on "remote.message", (msg) ->
  @echo "Page says: #{msg}"

casper.start "http://localhost:158080", ->
  @evaluate ->
    window.thread = new DynWorker()
    thread.listen (msg) -> @echo "Worker says: #{msg}"
    thread.eval "self.test = 'foo';"
    thread.eval "sendMessage('hello world');"


casper.run()