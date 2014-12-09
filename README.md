serial
======

[![Build Status](https://travis-ci.org/Olegas/uart-commander.svg?branch=master)](https://travis-ci.org/Olegas/uart-commander)
[![Coverage Status](https://coveralls.io/repos/Olegas/uart-commander/badge.png)](https://coveralls.io/r/Olegas/uart-commander)
[![NPM version](https://badge.fury.io/js/uart-commander.png)](http://badge.fury.io/js/uart-commander)

A "DSL" to perform serial interchange (i.e. using AT-commands with modem on some UART port)

Use it to interact with some serial device on a port, represented by duplex stream.

```javascript
  var cmd = require('uart-commander');

  var uart = getUARTStreamSomehow();

  cmd(uart, function() {

    linemode();
    at('Z');    // ATZ
    wait('OK');
    label('waitIncoming');
    timeout(60000); // Or use 0 for infinite timeout
    wait('RING');
    wait(/\+CLIP: "([^"]+)"/); // RegExps are supported
    perform(function(line, match, match0) {
        console.log('Incoming call from ' + match0); // Captured group!
        return mustAcceptCall(match0);
    });
    ifNotOk('hangup');
    at('A');    // ATA
    performAsync(function(done) {
       // do something with accepted call
       playAudioAsync(done);
    });
    label('hangup');
    at('H0'); // ATH0
    goto('waitIncoming');

  }, function(err) {
    // when script is finished
  });
```

API
---

*TODO* To be documented ...
