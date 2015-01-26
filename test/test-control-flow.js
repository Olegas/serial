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

   describe('goto(label)', function() {

      it('passes control to specified label', function(done) {

         var mustNotCall = sinon.spy(), mustCall = sinon.spy();

         cmd(stream, function(){

            goto('label');
            perform(mustNotCall);
            label('label');
            perform(mustCall);

         }, function(){
            assert(!mustNotCall.called);
            assert(mustCall.called);
            done();
         });

      });

      it('if label is not - throws error', function(done) {

         cmd(stream, function(){

            goto('labelX');

         }, function(e){
            assert(e);
            done();
         });

      });

      it('works in any direction', function(done){

         cmd(stream, function(){

            perform(function(){
               return false;
            });
            label('first');
            ifOk('end');
            perform(function(){
               return true;
            });
            goto('first');
            label('end');

         }, function(){
            done();
         });

      })


   });

   describe('performAsync(function(*, cb))', function(){

      it('performs function and waits for callback, until then execution is stopped', function(done){

         var mustCall = sinon.spy();

         cmd(stream, function(){

            perform(mustCall);
            performAsync(function(s, done){
               assert(mustCall.callCount == 1);
               done();
            });
            perform(mustCall);

         }, function(e){
            assert(mustCall.callCount == 2, "Correct step count");
            done();
         });

      });

      it('if callback(err) - execution stops', function(done){

         cmd(stream, function(){

            performAsync(function(s, done){
               done('async error');
            });

         }, function(e){
            assert(e == 'async error');
            done();
         });

      });

      it('if callback() - execution continues, last result is set to `true`', function(done){

         var mustNotCall = sinon.spy();

         cmd(stream, function(){

            performAsync(function(s, done){
               done();
            });
            ifOk('label');
            perform(mustNotCall);
            label('label')

         }, function(){
            assert(!mustNotCall.called);
            done();
         });

      });

      it('if callback(null, res) - execution continues, last result is set to res', function(done){

         var mustCall = sinon.spy();

         cmd(stream, function(){

            performAsync(function(s, done){
               done(null, false);
            });
            ifOk('label');
            perform(mustCall);
            label('label')

         }, function(){
            assert(mustCall.called);
            done();
         });

      });

   })

});