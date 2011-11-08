DynWorker
=========


The Talk
--------

DynWorker is a WebWorker library which makes it easier to work with workers (haha).
You no longer need to create a separate file for each different worker... the only
extra file you will ever have to load is `dynworker.js`.

DynWorker contains a few utilities to augment your worker. You can easily inject
functions into the worker, run arbitrary code, pass messages containing mixed
data (everything is JSON-encoded), and access DOM storage.

Future developments may include being able to clone workers, access the DOM asynchronously,
make full XHR requests (including XML parsing), access the indexedDB directly from
the worker, and/or (un)serialize a worker.


The Code
--------

```javascript
// If the library is in the current dir and
// is named dynworker.js, this works:
var worker = new DynWorker();

// Otherwise you need to specify a filename,
// but it needs to be on the same domain.
var worker = new DynWorker("/js/lib/dynworker.min.js");

// You can have a shortcut with Ender:
var worker = new $.worker();

// You can also modify the default path once and for all:
DynWorker.path("path/to/dynworker.js");
var worker = new DynWorker();


// The function is namespaced under $.ns
// inside the worker.
worker.inject("funcName", function(arg1, arg2) {
  var result = "Do something awesome here";
  
  // In-worker helpers are namespaced under $
  $.receive(function(e, data) {
    // Receive messages from the main thread
  });
  
  return result;
});

// The callback gets back the raw event and the
// parsed data
worker.receive(function(e, data) {
  data; // Display and strike awe
});


// The #run function wraps the function call in a
// $.send() so the return value of the
// function is sent up.
worker.run("funcName", arg1, arg2);

// Hence, these two are equivalent:
worker.run("funcName");
worker.eval("$.send($.ns['funcName']());");
```

### DOM storage

The `$.localStorage` API mimics the `window.localStorage` API, minus
the array-like interface. Under the hood, all calls are asynchronous, but it
doesn't matter too much. All workers and the main thread use the same DOM
storage. The `$.sessionStorage` API is the same.

Inside the worker:

```javascript
$.localStorage.setItem("key", "data");
$.localStorage.getItem("key", function(data) {
  // Do something with that data
});
```


The License
-----------

DynWorker is licensed under this [MIT License](http://mit.passcod.net).
