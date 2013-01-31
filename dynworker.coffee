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


class Thread
  constructor: ->
    @worker = new libworker
    @worker.eval "
self.onmessage = function (e) {
  if (e.data.slice(0,5) !== 'dyno:') return;
  var data = e.data.slice(5);

  
};"