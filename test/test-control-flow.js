var assert = require('chai').assert,
    sinon = require('sinon'),
    Duplex = require('stream').Duplex,
    cmd = require('../');

describe('Control flow', function(){

   var stream;

   beforeEach(function(){
      stream = new Duplex();
   });

   afterEach(function(){
      stream.end();
      stream = null;
   });

   describe('label(string)', function(){
      it('Sets label', function(done){
         cmd(stream, function(){
            label('xxx');
         }, done)
      });

      it('works in any direction', function(){
         cmd(stream, function(){
            goto('l2');
            label('l1');

         })
      })
   });


   describe("perform(function)", function() {

      it("runs specified function synchronously", function(done) {

         var cb = sinon.spy();

         cmd(stream, function(){
            perform(cb);
         }, function(){
            assert(cb.calledOnce, "Perform calls function once");
            done()
         });

      });

   });

   describe('ifOk(label)', function(){

      it('if previous perform() result is "truthy" - goes to specified label', function(done){

         var mustNotCall = sinon.spy();

         cmd(stream, function(){

            perform(function(){
               return true;
            });
            ifOk('skip');
            perform(mustNotCall);
            label('skip');

         }, function(){
            assert(!mustNotCall.called, "Step skipped");
            done();
         })

      });

      it('if previous perform() result is "falsy" - goes not to specified label', function(done){

         var mustCall = sinon.spy();

         cmd(stream, function(){

            perform(function(){
               return false;
            });
            ifOk('skip');
            perform(mustCall);
            label('skip');

         }, function(){
            assert(mustCall.called, "Step is not skipped");
            done();
         })

      });

      it('Throws an exception if label is not exists', function(done){

         cmd(stream, function(){
            ifOk('skip');
         }, function(e){
            assert(e instanceof Error, 'Error caught');
            assert(e.message == 'No such label: skip', 'Correct message received');
            done();
         })

      });

   });

   describe('ifNotOk(label)', function(){

      it('if previous perform() result is "falsy" - goes to specified label', function(done){

         var mustNotCall = sinon.spy();

         cmd(stream, function(){

            perform(function(){
               return false;
            });
            ifNotOk('skip');
            perform(mustNotCall);
            label('skip');

         }, function(){
            assert(!mustNotCall.called, "Step skipped");
            done();
         })

      });

      it('if previous perform() result is "truthy" - goes not to specified label', function(done){

         var mustCall = sinon.spy();

         cmd(stream, function(){

            perform(function(){
               return true;
            });
            ifNotOk('skip');
            perform(mustCall);
            label('skip');

         }, function(){
            assert(mustCall.called, "Step is not skipped");
            done();
         })

      });

   });

});