function TransportHandler(transport) {
	this.transport = transport;
  this.transport.isMetronomeEnabled().markInterested();
	this.transport.isPlaying().markInterested();
	this.transport.isPlaying().addValueObserver(applicationPlayObserver);
  this.transport.tempo().markInterested();
	this.transport.getPosition().addValueObserver(applicationPositionObserver);
}

TransportHandler.prototype.applicationPlay = function() {
	this.transport.play();
};

TransportHandler.prototype.applicationStopAndZeroPosition = function() {
	println('Stopping bitwig and zeroing play position');
	this.transport.stop();
};

TransportHandler.prototype.applicationPlayUpdate = function() {
	const onOff = this.transport.isPlaying().get();
	println('bitwig is playing: ' + onOff);
	println("this.cursorDevice.isRemoteControlsSectionVisible ().get(): " + onOff);
	const oscArgs = [];
	oscArgs[0] = onOff;

	try {
		sender.sendMessage('/application/play', oscArgs);
	} catch (err) {
		println("error sending level: " + err);
	}
};

TransportHandler.prototype.applicationPositionUpdate = function() {
	const position = this.transport.getPosition().getFormatted();
	// println('bitwig play position: ' + position);
	const oscArgs = [];
	oscArgs[0] = position;

	try {
		sender.sendMessage('/position/beats', oscArgs);
	} catch (err) {
		println("error sending position: " + err);
	}
};

TransportHandler.prototype.setTempo = function(bpm, absolute) {
	const oldTempo = this.transport.tempo();
  let newTempo;
  println('previous tempo value is: ' + oldTempo.value().getRaw());
  if (absolute) {
    this.transport.tempo().setRaw(bpm);
    newTempo = bpm;
  } else {
		println('change bpm by: ' + bpm);
		newTempo = oldTempo.value().getRaw() + bpm;
		this.transport.tempo().setRaw(newTempo);
  }
  // if we read the new tempo immediately there can be problems due to lack of async implementation
  // so assume success, do the calculation ourselves and return it, rounded to 2 decimal points
  println('ppdated tempo value is: ' + roundFloatToTwoPlaces(newTempo));
  try {
		sender.sendMessage('/tempo/set', roundFloatToTwoPlaces(newTempo));
	} catch (err) {
		println("error sending tempo: " + err);
	}
};

TransportHandler.prototype.getTempo = function() {
	const tempo = this.transport.tempo();
  println('Current tempo value is: ' + roundFloatToTwoPlaces(tempo.value().getRaw()));
  try {
		sender.sendMessage('/tempo', roundFloatToTwoPlaces(tempo.value().getRaw()));
	} catch (err) {
		println("error sending tempo: " + err);
	}
};

TransportHandler.prototype.getMetronome = function() {
  try {
		sender.sendMessage('/metronome', this.transport.isMetronomeEnabled().get());
	} catch (err) {
		println("error sending metronome: " + err);
	}
};

TransportHandler.prototype.toggleMetronome = function() {
  this.transport.isMetronomeEnabled().toggle();
  println('Metronome is enabled: ' + !this.transport.isMetronomeEnabled().get());
  try {
    sender.sendMessage('/metronome', !this.transport.isMetronomeEnabled().get());
  } catch (err) {
    println("error sending metronome: " + err);
  }
};

const roundFloatToTwoPlaces = function(float) {
	return Math.round(float * 100) / 100;
}