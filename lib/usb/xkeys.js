/*
 * This file is part of the Companion project
 * Copyright (c) 2021 VICREO BV
 * Author: Jeffrey Davidsz <jeffrey.davidsz@vicreo.eu>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 */


var util         = require('util');
const { XKeys }  = require('xkeys');
var debug        = require('debug')('lib/usb/xkeys');
var common       = require('./common');

function xkeys(system, devicepath) {
	var self = this;

	self.info = {};
	self.type = self.info.type = 'XKeys device';
	self.info.device_type = 'XKeys';
	self.info.config = [ 'brightness', 'orientation', 'page' ];
	self.info.keysPerRow = 10;
	self.info.keysTotal = 70;

	self.config = {
		brightness: 100,
		rotation: 0,
		page: 1
	};

	console.log('Adding xkeys USB device', devicepath);
	var myXkeysPanel = new XKeys(devicepath);
	console.log('identifier',myXkeysPanel.deviceType.identifier)
	self.buttonState = [];

	self.info.serialnumber = self.serialnumber = myXkeysPanel.deviceType.identifier;

	system.emit('log', 'device('+myXkeysPanel.deviceType.identifier+')', 'debug', 'XKeys detected');

	// How many items we have left to load until we're ready to begin
	self.loadingItems = 0;
	self.system = system;

	// send xkeys ready message to devices :)
	setImmediate(function() {
		system.emit('elgato_ready', devicepath);
	});
	// Light up all buttons
	// myXkeysPanel.setAllBacklights(true, false)
	// myXkeysPanel.setAllBacklights(true, true)
	
	// Listen to pressed keys:
	myXkeysPanel.on('down', keyIndex => {
		var key = self.reverseButton(keyIndex);
		console.log('Key pressed: ' + key)
		if (key === undefined) {
			return;
		}

		self.buttonState[key].pressed = true;
		self.system.emit('elgato_click', devicepath, key, true, self.buttonState);

		// Light up a button when pressed:
		myXkeysPanel.setBacklight(keyIndex, true)
	})
	// Listen to released keys:
	myXkeysPanel.on('up', keyIndex => {
		var key = self.reverseButton(keyIndex);
		console.log('Key released: ' + key)

		if (key === undefined) {
			return;
		}

		self.buttonState[key].pressed = false;
		self.system.emit('elgato_click', devicepath, key, false, self.buttonState);
		// Turn off button light when released:
		myXkeysPanel.setBacklight(keyIndex, false)
	})

	myXkeysPanel.on('error', error => {
		console.error(error);
		system.emit('elgatodm_remove_device', devicepath);
	});

	// Initialize button state hash
	for (var button = 0; button < global.MAX_BUTTONS; button++) {
		self.buttonState[button] = {
			pressed: false
		};
	}
	
	common.apply(this, arguments);

	// self.clearDeck();

	return self;
}

util.inherits(xkeys, common);
xkeys.device_type = 'Xkeys';

xkeys.prototype.getConfig = function () {
	var self = this;

	self.log('getConfig');

	return self.config;
};
//TODO
xkeys.prototype.setConfig = function (config) {
	var self = this;
	if (self.config.brightness != config.brightness && config.brightness !== undefined) {
		self.XKeys.setBrightness(config.brightness);
	}

	if (self.config.page != config.page && config.page !== undefined) {
		self.config.page = config.page;
	}

	self.config = config;
};
//TODO
xkeys.prototype.quit = function () {
	var self = this;
	var sd = self.Xkeys;

	if (sd !== undefined) {
		try {
			this.clearDeck();
		} catch (e) {}

		// Find the actual xkeys driver, to talk to the device directly
		if (sd.device === undefined && sd.XKeys !== undefined) {
			sd = sd.XKeys;
		}

		// If an actual xkeys is connected, disconnect
		if (sd.device !== undefined) {
			sd.device.close();
		}
	}
};

xkeys.prototype.begin = function() {
	var self = this;
	self.log('xkeys.prototype.begin()');

	self.XKeys.setBrightness(self.config.brightness);
};

xkeys.prototype.mapButton = function(input) {
	var self = this;
	var map = "10 9 8 7 6 5 4 3 2 1 0".split(/ /);
	var devkey = self.toDeviceKey(input);

	if (devkey < 0) {
		return -1;
	}

	return parseInt(map[devkey]);
}

xkeys.prototype.reverseButton = function(input) {
	var self = this;

	var map = "0 1 2 3 4 5 6 7 8 9 10".split(/ /);
	for (var pos = 0; pos < map.length; pos++) {
		if (map[input] == pos) return self.toGlobalKey(pos);
	}

	return;
};
exports = module.exports = xkeys;
