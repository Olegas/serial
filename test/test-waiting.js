var assert = require('chai').assert,
   sinon = require('sinon'),
   Proxy = require('./lib/ProxyStream'),
   Proxy2 = require('./lib/ProxyStream2'),
   cmd = require('../');

describe('Waiting for specified data', function(){




   describe("wait(string)", function() {

      var stream;

      beforeEach(function(){
         stream = new Proxy();
         stream.setEncoding('utf8');
      });

      afterEach(function(){
         stream.end();
         stream = null;
      });

      it("Can wait for arbitrary string", function(done) {

         cmd(stream, function(){
            linemode();
            perform(function(){
               stream.write('XXX\r\n');
            });
            wait('XXX');
         }, done);

      });

      it('In line mode whole received line (without trailing CR+LF) is passed to next perform() call', function(done){

         var cb = sinon.spy();

         cmd(stream, function(){
            linemode();
            perform(function(){
               stream.write('XXX\r\n');
            });
            wait('XXX');
            perform(cb);
         }, function(){
            assert(cb.calledWith('XXX'), 'Correct data passed to perform call');
            done();
         });
      });


   });

   describe('wait(RegExp)', function(){

      var stream;

      beforeEach(function(){
         stream = new Proxy2();
      });

      afterEach(function(){
         stream.end();
         stream = null;
      });

      it('Can wait for RegExp', function(done){

         cmd(stream, function(){
            linemode();
            perform(function(){
               stream.inQueue('XXX\r\n');
            });
            wait(/X+/);
         }, done);

      });

      it('When waiting with RegExp, next perform call will receive a whole line, whole match, and all captured groups', function(done){

         var cb = sinon.spy();

         cmd(stream, function(){
            linemode();
            perform(function(){
               stream.inQueue('ABC <abc> CCC\r\n');
            });
            wait(/<([a-z]+)>/);
            perform(cb);
         }, function(){
            assert(cb.calledWith('ABC <abc> CCC', '<abc>', 'abc'), 'Correct data passed to perform call');
            done();
         });
      });

      it('Whole match and every captured group can be referenced in further write/at commands with $n', function(done){

         var cb = sinon.spy();

         stream.on('written', cb);

         cmd(stream, function(){
            linemode();
            perform(function(){
               stream.inQueue('ABC <abc> CCC\r\n');
            });
            wait(/<([a-z]+)>/);
            at('$0');
            write('$1');

         }, function(){
            assert(cb.firstCall.calledWith('AT<abc>\r\n'), 'Correct data received from at');
            assert(cb.secondCall.calledWith('abc'), 'Correct data received from write');
            done();
         });

      })

   });


});