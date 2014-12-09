var cmd = require('../'),
    assert = require('chai').assert;

describe('End handler', function(){

   it('When scenario ends - callback is called', function(done){

      var stream = new require('stream').Duplex();

      cmd(stream, function(){}, done)

   });

   it('If there was an error - it returned with first argument', function(done){

      var stream = new require('stream').Duplex();

      cmd(stream, function(){
         throw 'error';
      }, function(e){
         assert(e == 'error', 'Correct message received');
         done();
      })

   })

});