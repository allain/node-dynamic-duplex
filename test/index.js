var assert = require('assert');
var streamify = require('stream-array');
var concat = require('concat-stream');
var through = require('through2').obj;
var Readable = require('stream').Readable;

var dynamicDuplex = require('..');

describe('dynamic-duplex', function() {
	var input;
  beforeEach(function() {
		input = new Readable({objectMode: true});
		input._read = function() {};
	});

  it('should support wiring up to nothing', function(done) {
		input.pipe(dynamicDuplex(function(chunk, en, cb) {
			cb(null, null);	
		})).pipe(through(function(chunk, enc, cb) {
      assert.fail('should never get here since wired to null');
		}));
	
		input.push('A');	
		setTimeout(function() {
      done();
		}, 10);
  });
  
	it('supports swapping out', function(done) {
    var streams = {
			a: streamify([1,2,3,4]),
			b: streamify([5,6,7,8])
		};

		var expectedOutput = [1,2,3,4,5,6,7,8];

		input.pipe(dynamicDuplex(function(letter, en, cb) {
			cb(null, streams[letter]);	
		})).pipe(through(function(chunk, end, cb) {
      var expected = expectedOutput.shift();
      assert.equal(chunk, expected);
      if (expectedOutput.length === 0) return done();

      if (chunk === 4) {
				// force a switch to stream b
        input.push('b');
			}

      cb();
		}));

    input.push('a');
  });
	
  it('does swapping out mid stream', function(done) {
    var streams = {
			a: streamify([1,2,3,4]),
			b: streamify([5,6,7,8])
		};

		var expectedOutput = [1,2,5,6];

		input.pipe(dynamicDuplex(function(letter, en, cb) {
			cb(null, streams[letter]);	
		})).pipe(through(function(chunk, end, cb) {
      var expected = expectedOutput.shift();
      assert.equal(chunk, expected);
      if (expectedOutput.length === 0) return done();

      if (chunk === 2) {
				// force a switch to stream b
        input.push('b');
			}

      cb();
		}));

    input.push('a');
  });
  
  it('supports swapping out to null', function(done) {
    var streams = {
			a: streamify([1,2,3,4]),
			b: null,
			c: streamify([5,6,7,8])
		};

		var expectedOutput = [1,2,5,6];

		input.pipe(dynamicDuplex(function(letter, en, cb) {
			cb(null, streams[letter]);	
		})).pipe(through(function(chunk, end, cb) {
      var expected = expectedOutput.shift();

      assert.equal(chunk, expected);
      if (expectedOutput.length === 0) return done();

      if (chunk === 2) {
        input.push('b');
				setTimeout(function() {
					input.push('c');	
				}, 25);
			}
      cb();
		}));

    input.push('a');
  });
});
