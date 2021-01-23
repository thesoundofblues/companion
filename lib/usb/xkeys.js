/*

 *
 */


var util         = require('util');
var debug        = require('debug')('lib/usb/xkeys');
var common       = require('./common');

function xkeys(system, devicepath) {
	var self = this;

	self.info = {};
	self.type = self.info.type = 'XKeys iDisplay device';
	self.info.device_type = 'XKeys';
	self.info.config = [ 'brightness', 'orientation', 'page' ];
	self.info.keysPerRow = 5;
	self.info.keysTotal = 15;

	self.config = {
		brightness: 100,
		rotation: 0,
		page: 1
	};

	console.log('Adding xkeys USB device', devicepath);


}

exports = module.exports = xkeys;
