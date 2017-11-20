/*	event.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

/*
 *  The main.js, client.js and network.js modules can only send and recieve
 *  to each other if they import and pub/sub to the same EventEmitter object.
 * 
 *  The eventEmitter object instance created here must be imported by all 
 *  modules that wish to talk to each other.
 * 
 */

const EventEmitter = require('events').EventEmitter;
const eventEmitter = new EventEmitter.EventEmitter();

module.exports = eventEmitter;