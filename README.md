serial
======

A "DSL" to perform serial interchange (i.e. using AT-commands with modem on some UART port)

Use it to interact with some serial device on a port, represented by duplex stream.

```javascript
  var serial = require('serial');

  var uart = getUARTStreamSomehow();

  serial(uart, function() {

    linemode();
    at('Z');    // ATZ
    wait('OK');
    label('waitIncoming');
    timeout(60000);
    wait('RING');
    wait(/\+CLIP: "([^"]+)"/); // RegExps are supported
    perform(function(line, match, match0) {
        console.log('Incoming call from ' + match0); // Captured group!
        return mustAcceptCall(match0);
    });
    ifNotOk('hangup');
    at('A');    // ATA
    // do something with accepted call
    label('hangup');
    at('H0'); // ATH0
    goto('waitIncoming');

  });
```

API
---

*TODO* To be documented...
