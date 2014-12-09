var assert = require('chai').assert,
   sinon = require('sinon'),
   Proxy = require('./lib/ProxyStream'),
   cmd = require('../');

describe('Writing to target stream', function(){

   var stream;

   beforeEach(function(){
      stream = new Proxy();
      stream.setEncoding('utf8');
   });

   afterEach(function(){
      stream.end();
      stream = null;
   });


   describe("write(data|function)", function() {

      it("writes specified data to stream", function(done) {

         var cb = sinon.spy();
         stream.on('data', cb);

         cmd(stream, function(){
            write('data');
         }, function(){
            assert(cb.calledOnce, 'data received');
            assert(cb.calledWith('data'), 'correct data received');
            done();
         });

      });

      it('supports a function as an argument - invoked to get data to send', function(done){

         var cb = sinon.spy();
         var getData = sinon.spy(function(){
            return 'data';
         });

         stream.on('data', cb);

         cmd(stream, function(){
            write(getData);
         }, function(){
            assert(getData.calledOnce, 'getter-function is called');
            assert(cb.calledOnce, 'data received');
            assert(cb.calledWith('data'), 'correct data received');
            done();
         });

      });

   });

   describe("at(data|function)", function() {

      it("writes specified data to stream prefixed with AT and followed by CR+LF", function(done) {

         var cb = sinon.spy();
         stream.on('data', cb);

         cmd(stream, function(){
            at('data');
         }, function(){
            assert(cb.calledOnce, 'data received');
            assert(cb.calledWith('ATdata\r\n'), 'correct data received');
            done();
         });

      });

      it('supports a function as an argument - invoked to get data to send', function(done){

         var cb = sinon.spy();
         var getData = sinon.spy(function(){
            return 'data';
         });

         stream.on('data', cb);

         cmd(stream, function(){
            at(getData);
         }, function(){
            assert(getData.calledOnce, 'getter-function is called');
            assert(cb.calledOnce, 'data received');
            assert(cb.calledWith('ATdata\r\n'), 'correct data received');
            done();
         });

      });

   });

   describe('ctrlz()', function(){

      it('Sends Ctrl+Z', function(done){

         var cb = sinon.spy();

         stream.on('data', cb);

         cmd(stream, function(){
            ctrlz();
         }, function(){
            assert(cb.calledOnce, 'data received');
            assert(cb.calledWith(String.fromCharCode(26)), 'correct data received');
            done();
         });

      });

   });

});