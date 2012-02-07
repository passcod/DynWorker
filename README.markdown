DynWorker
=========

**DynWorker** is a lowish-level library designed to make threading fun.

## The Five Pillars

    DynWorker.file = '/dynworker.min.js';
    var thread = new DynWorker;

You do not need to specify a file anymore. You specify once which file
contains **DynWorker**, and we use that. A requirement, however, is that
this file should not be concatenated unless you know exactly what you're doing.

---

    thread.destroy();
    thread.destroy(true);

You can destroy a Worker at any time. The first version will tell the worker
to commit seppuku, while the second just guillotines them on-the-spot.

---

    thread.push('name', ['data']);

You can `push` data into a worker. This will store the data directly onto
the worker's global object, so you might want to do some namespacing on the
name (e.g. `'ns.name'`). Or not &ndash; you decide. The data can be any of:

  + String
  + Number
  + Boolean
  + Array
  + Object / Hashmap
  + Function

It cannot (yet) be an object or array containing functions.

---

    thread.pull('name', function (data) {});

You can `pull` a variable from the worker at any time. This is the inverse of
`push`, so the above restrictions apply.

---

    thread.listen(function (msg) {});

You can listen for messages from the worker. All internal messages are filtered
out, so you only get the good stuff.

---

    thread.run('func_name', args...);

You can easily `run` a function in the worker and pass arguments. The arguments
are also restricted by the list above.

---

    thread.eval('code');

You can `eval` code in the worker.

---

All these methods are also available from within a worker on the special
`parent_thread` global. The reverse the roles and allow data and code to be pushed,
pulled, ran, and evaluated in the parent thread _from the worker_. (This is
potentially very dangerous if you allow unchecked code to run within a worker.
So don't.)


## You, you, and you

Manipulating a single worker is cool, but we can do better. There's now a
special `Workers` object. Watch:

    var three_little_mice = Workers(thread1, thread2, thread3);
    three_little_mice.push('name', ['data']);

Okay, so we can take workers, group them, and execute stuff on all of them
at once. But, wait, there's more:

    Workers(thread1, thread2).addClass('furry');
    Workers('.furry').pull('tail', callback);

What's that? It looks like CSS! Well, you can add classes to workers and
use the class to select them. How is it different than the previous,
variable-based way? Well, you can add or remove workers in one part of your
code and use them in another, for one. Awesome, right?

    Workers().create(6).addClass('furry');

Oh wow: we've selected an empty set, created six workers, and gave them the
class `furry`. Similarly, you can `add` existing workers to a set, `remove`
matching workers, or even `destroy` them:

    // Add...
    Workers('.furry').add(a_thread)...
    Workers('.furry').add('.mammals')...
    
    // Remove...
    Workers('.furry').remove(a_thread)...
    Workers('.furry').remove('.rodents')...
    
    // This is a mice trap:
    Workers('.furry.rodents').destroy();


## We are Legion

Two more goodies (will, soon) make stuff even more interesting:

    Workers.pub('channel', data);
    Workers.sub('channel', function (data) {});

Pub/Sub for threading! What will they think of next?


Me & Thee
=========

Hiya! I'm Félix Saparelli, also known as [passcod](http://passcod.net). I lurk
in the streets of Auckland (and some other places), New Zealand, as well as on
[Twitter](https://twitter.com/passcod). I land some cool Javascript and Ruby
stuff &ndash; and some crappy things, too :)

You are just passing, but if you've read until the very end, then I'm pretty
sure I like you. So I'll give you all this, for
[free (which is written Em-Aye-Tee)](http://passcod.mit-license.org).