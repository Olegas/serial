var Duplex = require('stream').Duplex,
    inherits = require('util').inherits;

function Proxy() {
   Duplex.call(this);
}

inherits(Proxy, Duplex);

Proxy.prototype._write = function(chunk, e, d) {
   this.emit('written', chunk.toString());
   d();
};

Proxy.prototype.inQueue = function(c) {
 this.push(c);
};

Proxy.prototype._read = function(){
};

module.exports = Proxy;
