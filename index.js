var chunkingStreams = require('chunking-streams');
var Chunker = chunkingStreams.SeparatorChunker;
var global = (function(){ return this || (1,eval)(this)})();

function nop() {}

module.exports = function(uart, source, end) {

   var sequence = [];

   initContext(global, sequence);

   try {
      source.apply(global);
   } catch (e) {
      end && end(e);
      return;
   }

   var state = {
      _mode: '',
      _step: -1,
      _chunker: new Chunker({ separator: '\r\n' }),
      _source: uart,
      _timeout: 5000,
      _timer: null,
      _lastLine: '',
      _lastMatch: [],
      _labels: {},
      _async: false,
      _lines: [],
      _raw: '',
      _rawHandler: null,
      _lineHandler: function(chunk) {
         this._lines.push(chunk.toString());
      },
      stopUntil: function(handlerLine, handlerRaw) {

         if (handlerLine && !handlerRaw) {
            handlerRaw = handlerLine;
         }

         var fin = function() {
            this._async = false;
            clearTimeout(this._timer);
            clearInterval(this._interval);
         }.bind(this);

         this._async = true;
         this._interval = setInterval(function(){
            var idx, ok = false;
            switch(this._mode) {
               case 'line':
                  while(this._lines.length && !ok) {
                     ok = handlerLine(this._lines.shift());
                  }
                  break;
               case 'raw':
                  idx = handlerRaw(this._raw);
                  if (idx >= 0) {
                     this._raw = this._raw.substr(idx);
                     ok = true;
                  }
                  break;
            }

            if (ok) {
               this._lastResult = true;
               fin();
               nextStep();
            }

         }.bind(this), 10);
         if (this._timeout) {
            this._timer = setTimeout(function(){
               fin();
               this._lastResult = false;
               throw new Error('timeout');
            }.bind(this), this._timeout);
         }
      }
   };

   state._chunker.on('data', state._lineHandler.bind(state));
   state._rawHandler = function(chunk) {
      this._raw += chunk.toString();
   }.bind(state);

   // TODO terminate on stream end

   function finalize(e) {
      clearInterval(state._interval);
      clearTimeout(state._timer);
      state._source.unpipe(state._chunker);
      state._source.removeListener('data', state._rawHandler);
      typeof end == 'function' && end(e);
   }

   function nextStep() {
      var fn = sequence[++state._step];
      if (fn) {
         try {
            fn.call(state);
            if (!state._async) {
               setImmediate(nextStep);
            }
         } catch (e) {
            finalize(e);
         }
      } else {
         setImmediate(finalize);
      }
   }

   (function dryRun() {
      sequence.forEach(function(f, step){
         state._step = step;
         if (f.immediate) {
            f.call(state);
            sequence[step] = nop;
         }
      });
      state._step = -1;
   })();

   nextStep();
};

function initContext(context, sequence) {

   var fns = functions();

   Object.keys(fns).forEach(function(name){
      context[name] = function() {
         var a = Array.prototype.slice.call(arguments);
         var f = function() {
            fns[name].apply(this, a);
         };
         f.immediate = fns[name].immediate;
         sequence.push(f);
      }
   });

}

function functions() {
   var f = {
      goto: function(label) {
         if (!(label in this._labels)) {
            throw new Error('No such label: ' + label);
         }
         this._step = this._labels[label];
      },
      any: function() {
         console.warn('UART-commander "any" function is used but it is not implemented yet');
      },
      on: function() {
         console.warn('UART-commander "on" function is used but it is not implemented yet');
      },
      ctrlz: function() {
         this._source.write(String.fromCharCode(26));
      },
      at: function(cmd) {
         if (typeof cmd == 'function') {
            cmd = cmd();
         }
         if (typeof cmd == 'string') {
            cmd = cmd.replace(/\$(\d)/, function(m, i){
               return this._lastMatch[i];
            }.bind(this));
         }
         this._source.write('AT' + cmd + '\r\n');
      },
      write: function(data) {
         if (typeof data == 'function') {
            data = data();
         }
         if (typeof data == 'string') {
            data = data.replace(/\$(\d)/, function(m, i){
               return this._lastMatch[i];
            }.bind(this));
         }
         this._source.write(data);
      },
      wait: function() {
         if (!this._mode) {
            throw new Error('Mode not set. Use linemode() or rawmode()');
         }
         this._lastMatch = [];
         var whatArr = [].slice.call(arguments);
         this.stopUntil(function(line){
            var is;
            for(var i = 0, l = whatArr.length; i < l; i++) {
               var what = whatArr[i];
               if (what instanceof RegExp) {
                  is = line.match(what);
                  if (is) {
                     this._lastMatch = is;
                     this._lastLine = line;
                  }
               } else {
                  is = line == what;
                  if (is) {
                     this._lastMatch = [];
                     this._lastLine = line;
                  }
               }
               if (is) {
                  break;
               }
            }
            return (is || whatArr.length === 0);
         }.bind(this), function(raw) {
            var res;
            for(var i = 0, l = whatArr.length; i < l; i++) {
               var what = whatArr[i];
               if (what instanceof RegExp) {
                  res = what.exec(raw);
                  if (res) {
                     this._lastMatch = res;
                     this._lastLine = res[0];
                     return raw.indexOf(res[0]) + res[0].length;
                  }
               } else {
                  res = raw.indexOf(what);
                  if (res != -1) {
                     this._lastMatch = [];
                     this._lastLine = what;
                     return res;
                  }
               }
            }
            return -1;
         }.bind(this));
      },
      timeout: function(value) {
         this._timeout = value;
      },
      label: function(name) {
         this._labels[name] = this._step;
      },
      ifOk: function(label) {
         if (!(label in this._labels)) {
            throw new Error('No such label: ' + label);
         }
         if (this._lastResult) {
            this._step = this._labels[label];
         }
      },
      ifNotOk: function(label) {
         if (!(label in this._labels)) {
            throw new Error('No such label: ' + label);
         }
         if (!this._lastResult) {
            this._step = this._labels[label];
         }
      },
      linemode: function() {
         this._mode = 'line';
         this._raw = '';
         this._lines.length = 0;
         this._source.removeListener('data', this._rawHandler);
         this._source.pipe(this._chunker);
      },
      rawmode: function() {
         this._mode = 'raw';
         this._raw = '';
         this._lines.length = 0;
         this._source.unpipe(this._chunker);
         this._source.on('data', this._rawHandler);
      },
      performAsync: function(f) {
         var lock;
         lock = true;
         this.stopUntil(function(){
            return !lock;
         });
         f.apply(null, [this._lastLine].concat(this._lastMatch || [], function(err, res) {
            if (err) {
               throw err;
            } else {
               this._lastResult = res;
            }
            lock = false;
         }.bind(this)));
      },
      perform: function(f) {
         this._lastResult = f.apply(null, [this._lastLine].concat(this._lastMatch || []));
      },
      consumeBytes: function(n) {
         if (this._mode !== 'raw') {
            throw new Error('consumeBytes can only be used in RAW mode');
         }
         if (typeof n == 'function') {
            n = n();
         }
         if (typeof n == 'string') {
            n = n.replace(/\$(\d)/, function(m, i){
               return this._lastMatch[i];
            }.bind(this));
         }

         n = +n;

         if (n <= 0) {
            throw new Error('bytes amount must be greater than zero');
         }

         var res = '';

         this.stopUntil(function(line){ }, function(raw){
            if (res.length + raw.length <= n) {
               res += raw;
            } else {
               res += raw.substr(0, n - res.length);
            }
            this._lastLine = res;
            return n - res.length;
         }.bind(this));
      }
   };
   f.label.immediate = true;
   return f;
}