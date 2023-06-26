function TransportHandler(transport) {
	this.transport = transport;
  this.transport.isMetronomeEnabled().markInterested();
	this.transport.isPlaying().markInterested();
	this.transport.isPlaying().addValueObserver(applicationPlayObserver);
  this.transport.tempo().markInterested();
}

TransportHandler.prototype.applicationPlay = function() {
	this.transport.play();
};

TransportHandler.prototype.applicationPlayUpdate = function() {
	var onOff = this.transport.isPlaying().get();

	println("this.cursorDevice.isRemoteControlsSectionVisible ().get(): " + onOff);
	var oscArgs = [];
	oscArgs[0] = onOff;

	try {
		sender.sendMessage('/application/play', oscArgs);
	} catch (err) {
		println("error sending level: " + err);
	};
};

TransportHandler.prototype.setTempo = function(bpm, absolute) {
	const oldTempo = this.transport.tempo();
  let newTempo = oldTempo;
  println('Previous tempo value is: ' + oldTempo.value().getRaw());
  if (absolute) {
    this.transport.tempo().setRaw(bpm);
    newTempo = bpm;
  } else {
    this.transport.increaseTempo(bpm, 647);
    newTempo = oldTempo.value().getRaw() + bpm;
  }
  // if we read the new tempo immediately there can be problems due to lack of async implementation
  // so just do the calculation ourselves and return it
  // round to 2 decimal points
  println('Updated tempo value is: ' + Math.round(newTempo * 100) / 100);
  try {
		sender.sendMessage('/tempo/set', Math.round(newTempo * 100) / 100);
	} catch (err) {
		println("error sending tempo: " + err);
	}
};

TransportHandler.prototype.getTempo = function() {
	const tempo = this.transport.tempo();
  println('Current tempo value is: ' + Math.round(tempo.value().getRaw() * 100 / 100));
  try {
		sender.sendMessage('/tempo', Math.round(tempo.value().getRaw() * 100 / 100));
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