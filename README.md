# dynamic-duplex

Dynamically wires up a duplex stream based on the data it receives.

[![build status](https://secure.travis-ci.org/allain/node-dynamic-duplex.png)](http://travis-ci.org/allain/node-dynamic-duplex)

## Installation

This module is installed via npm:

``` bash
$ npm install dynamic-duplex
```

## Testing

This module can be tested by running:

``` bash
$ npm run test
```

## Example Usage

``` js
var Readable = require('stream').Readable;
var streamify = require('stream-array');
var dynamicDuplex = require('dynamic-duplex');

var input = new Readable({objectMode: true});

var streams = {
	a: streamify([1,2,3,4]),
	b: streamify([5,6,7,8])
};
input.pipe(dynamicDuplex(function(letter, en, cb) {
	cb(null, streams[letter]);
})).pipe(through(function(chunk, end, cb) {
	console.log(chunk);

	if (chunk === 2) {
		// force a switch to stream b
		input.push('b');
	}

	cb();
}));

// To get the ball rolling
input.push('a');

// Expected output from this code is:
// 1 2 5 6 7 8
```
