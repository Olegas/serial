var Transform = require('stream').Transform,
    inherits = require('util').inherits;

function Proxy() {
   Transform.call(this);
}

inherits(Proxy, Transform);

Proxy.prototype._transform = function(chunk) {
   this.push(chunk);
};

Proxy.prototype._flush = function(done){
   done();
};

module.exports = Proxy;
