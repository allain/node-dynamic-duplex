var duplexer = require('duplexer');
var stream = require('stream');

module.exports = function (decider) {
  var input = new stream.PassThrough({objectMode: true});

  // provides an endpoint to be pushed to from the internal reader
  var output = new stream.Readable({objectMode: true});
	output._read = function(size) {};

  var readable = null;
  var currentListener = null;

  var deciderStream = new stream.Writable({objectMode: true});
  deciderStream._write = function(chunk, encoding, cb) {
    decider(chunk, encoding, function(err, newReadable) {
			if (newReadable === readable) {
				return cb();
			}

			if (readable) {
				readable.removeListener('data', currentListener);
				currentListener = null;
			}

			readable = newReadable;
		  if (readable) {
				currentListener = buildDataPusher(readable);
				readable.on('data', currentListener);
			}

      cb();
		});
  };

	function buildDataPusher(stream) {
		return function dataDataPusher(data) {
			// It is possible that these pushes are from before the stream was swapped
      if (readable === stream) {
				output.push(data);
			}
		};
	}

  input.pipe(deciderStream, {end: false});

  return duplexer(input, output);
};
