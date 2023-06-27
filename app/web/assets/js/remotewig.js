const bitwig = {};
bitwig.localState = [];
document.addEventListener("DOMContentLoaded", function () {
  if (window.navigator.standalone) {
    document.getElementById("messageArea").style.display = "none";
  }
  bitwig.initControls();

  setTimeout(() => {
    bitwig.getTempo();
    bitwig.getMetronome();
  }, 100);
});

const port = new osc.WebSocketPort({
  url: "ws://192.168.1.86:8081" // ws://10.0.0.21:8081 in win, ws://10.0.0.2:8081 in mac
});

const logLocalState = function() {
  console.log(bitwig.localState[0]);
  console.log(bitwig.localState[1]);
  console.log(bitwig.localState[2]);
  console.log(bitwig.localState[3]);
}

const sendOSCManual = function () {
  port.send({
    address: "/track",
    args: bitwig.localState
  });
};

port.on("bundle", function (oscBundle) {
  console.log("bundle received: " + oscBundle.packets[0].address);

  if (oscBundle.packets[0].address === "/track/position") {
    bitwig.renderTrackInfo(oscBundle);
  } else if (oscBundle.packets[0].address === "/track/render") {
    bitwig.renderTracks(oscBundle);
  } else if (oscBundle.packets[0].address === "/device-slot/devices") {
    bitwig.renderSlotDevices(oscBundle);
  } else if (oscBundle.packets[0].address === "/remote-controls/pages") {
    bitwig.renderRemoteControls(oscBundle);
  }
});

port.on("message", function (oscMessage) {
  const currentMessage = oscMessage;
  if (currentMessage.address !== '/position/beats') {
    console.log("bitwig.parseMessage: " + currentMessage.address);
    console.log(currentMessage.args);
  }

    switch (currentMessage.address) {
        case "/panel/meter":
            bitwig.toggle("#pMeter", currentMessage.args[0]);
            break;
        case "/panel/io":
            bitwig.toggle("#pIo", currentMessage.args[0]);
            break;
        case "/device/toggle":
            bitwig.toggle("#dToggle", currentMessage.args[0]);
            break;
        case "/device/detail":
            bitwig.toggle("#dDetail", currentMessage.args[0]);
            break;
        case "/device/expanded":
            bitwig.toggle("#dExpanded", currentMessage.args[0]);
            break;
        case "/device/remote-controls":
            bitwig.toggle("#dRemoteControls", currentMessage.args[0]);
            break;
        case "/application/play":
            bitwig.toggle("#aPlay", currentMessage.args[0]);
            break;
        case "/tempo/set":
        case "/tempo":
            bitwig.renderTempo(currentMessage.args[0]);
            break;
        case "/position/beats":
            bitwig.renderPositionBeats(currentMessage.args[0]);
            break;
        case "/metronome":
            bitwig.toggle("#aMetronome", currentMessage.args[0]);
            break;
    }
});

bitwig.toggle = function (button, onOff) {
  const el = document.querySelector(button);
  if (onOff == true) {
    el.classList.add("bActive");
  } else {
    el.classList.remove("bActive");
  }
};

bitwig.sendTempo = function (bpm, absolute = false) {
  port.send({
    address: "/tempo/set",
    args: [bpm, absolute]
  });
};

bitwig.getTempo = function () {
  const placeholder = 100;
  port.send({
    address: "/tempo",
    args: placeholder
  });
};

bitwig.getMetronome = function () {
  const placeholder = "green";
  port.send({
    address: "/metronome",
    args: placeholder
  });
};

bitwig.currentTrackName = function (oscMessage) {
  console.log("bitwig.currentTrackName:");
  console.log(oscMessage.args[0]);

  const trackName = oscMessage.args[0];
  const currentTrackEl = document.querySelector("#currentTrack");
  currentTrackEl.textContent = trackName;
};

bitwig.currentTrackColor = function (oscMessage) {
  console.log("bitwig.currentTrackColor:");
  console.log(oscMessage.args[0]);
  console.log(oscMessage.args[1]);
  console.log(oscMessage.args[2]);

  const trackRed = oscMessage.args[0];
  const trackGreen = oscMessage.args[1];
  const trackBlue = oscMessage.args[2];

  const strBegin = "rgb(";
  const strComma = ", ";
  const strEnd = ")";
  const strFull = strBegin.concat(trackRed, strComma, trackGreen, strComma, trackBlue, strEnd);
  console.log(strFull);

  const currentTrackEl = document.querySelector("#currentTrack");
  currentTrackEl.style.backgroundColor = strFull;
};

bitwig.renderTracks = function (oscBundle) {
  console.log("render tracks");
  document.querySelectorAll('.track').forEach(item => {
    item.remove();
  });

  console.log(oscBundle.packets[0].args[0]);
  const tracks = oscBundle.packets;

  tracks.forEach(function (value, index) {
    const trackName = tracks[index].args[3];
    const isActive = tracks[index].args[4];
    const strFull = bitwig.concatColor(tracks[index].args[0], tracks[index].args[1], tracks[index].args[2]);

    const track = {
      color: strFull,
      isActive: isActive,
      name: trackName,
      index: index
    };

    const markupTrack = `
		<button 
			class="track${track.isActive ? ' trackActive' : ''}" 
			data-track-index="${track.index}" 
			style="background-color: ${track.color}; ${track.isActive ? 'border-bottom:1px solid #fff' : 'border-bottom:1px solid #2e2e2e;'}">
			${track.name}
		</button>
		`;

    const tracksEl = document.querySelector("#tracks");
    tracksEl.insertAdjacentHTML("beforeend", markupTrack);
  });

  document.querySelectorAll('.track').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('.track').forEach(item => {
        item.classList.remove("trackActive");
      });
      event.target.classList.add("trackActive");

      const oscArgs = [];
      oscArgs[0] = parseInt(event.target.getAttribute("data-track-index"));

      port.send({
        address: "/track/select",
        args: oscArgs
      });

    });
  });

};

bitwig.concatColor = function (colorRed, colorGreen, colorBlue) {
  const trackRed = colorRed;
  const trackGreen = colorGreen;
  const trackBlue = colorBlue;
  const strBegin = "rgb(";
  const strComma = ", ";
  const strEnd = ")";
  const strFull = strBegin.concat(trackRed, strComma, trackGreen, strComma, trackBlue, strEnd);
  console.log(strFull);
  return strFull;
};

bitwig.renderTrackInfo = function (oscBundle) {
  console.log(oscBundle);

  const trackPosition = oscBundle.packets[0].args[0];
  bitwig.localState[0] = trackPosition;
  console.log("track position is: " + trackPosition);

  const trackName = oscBundle.packets[1].args[0];
  console.log("track name is: " + trackName);
  const currentTrackEl = document.querySelector("#currentTrack");
  currentTrackEl.textContent = trackName;

  const trackColor = oscBundle.packets[2];
  console.log("track color is: " + trackColor);
  const strFull = bitwig.concatColor(trackColor.args[0], trackColor.args[1], trackColor.args[2]);
  currentTrackEl.style.backgroundColor = strFull;

  const devices = oscBundle.packets[3].packets;
  console.log("devices inside this track:");
  console.log(devices);

  const devicesEl = document.querySelector("#devices");
  devicesEl.innerHTML = '';

  devices.forEach(function (value, index) {
    const isActive = value.packets[0].args[1];
    const device = {
      name: value.packets[0].args[0],
      index: index
    };

    const markupDevice = `
		<div>
			<button class="device${isActive ? ' deviceActive' : ''}" data-device-index="${device.index}">
				${device.name}
			</button>
			<span></span>
		</div>
		`;

    devicesEl.insertAdjacentHTML("beforeend", markupDevice);
    const nthChild = index + 1;

    if (value.packets[1]) {

      const deviceSlots = value.packets[1].packets;
      deviceSlots.forEach(function (slotValue, slotIndex) {

        const selectorString = "#devices div:nth-child(" + nthChild + ") span";
        const selector = document.querySelector(selectorString);

        const slot = {
          deviceSlot: slotValue.args[0],
          slotIndex: slotIndex,
          index: index
        };

        const markupDeviceSlot = `
				<button class="deviceSlot" data-slot-name="${slot.deviceSlot}" data-slot-index="${slot.slotIndex}" data-parent-device-index="${slot.index}">
					${slot.deviceSlot}
				</button>
				`;

        selector.insertAdjacentHTML("beforeend", markupDeviceSlot);
      });
    }

    if (index === 0 && value.packets[2]) {
      const instrChains = value.packets[2].packets;
      instrChains.forEach(function (instrValue, instrIndex) {

        const isActive = instrValue.args[1];
        const selectorString = "#devices div:nth-child(" + nthChild + ")";
        const selector = document.querySelector(selectorString);

        const instr = {
          instrName: instrValue.args[0],
          instrIndex: instrIndex,
          index: index
        };

        const markupInstr = `
				<button class="instr${isActive ? ' instrActive' : ''}" data-instr-name="${instr.instrName}" data-instr-index="${instr.instrIndex}" data-parent-device-index="${instr.index}">
					${instr.instrName}
				</button>
				`;

        selector.insertAdjacentHTML("beforeend", markupInstr);
      });
    }
  });

  document.querySelectorAll('.device').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('.device').forEach(item => {
        item.classList.remove("deviceActive");
      });
      document.querySelectorAll('.deviceSlot').forEach(item => {
        item.classList.remove("slotActive");
      });
      event.target.classList.add("deviceActive");

      bitwig.localState[1] = parseInt(event.target.getAttribute("data-device-index"));
      bitwig.localState[2] = -1;
      bitwig.localState[3] = -1;

      console.log("bitwig.localState prior to osc send");
      logLocalState();
      port.send({
        address: "/track",
        args: bitwig.localState
      });

    });
  });

  document.querySelectorAll('.deviceSlot').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('.device').forEach(item => {
        item.classList.remove("deviceActive");
      });
      document.querySelectorAll('.deviceSlot').forEach(item => {
        item.classList.remove("slotActive");
      });
      event.target.classList.add("slotActive");

      document.querySelectorAll('.deviceSlotDevice').forEach(item => {
        item.remove();
      });

      const deviceSlotIndex = parseInt(event.target.getAttribute("data-slot-index"));
      const parentDeviceIndex = parseInt(event.target.getAttribute("data-parent-device-index"));

      bitwig.localState[1] = parentDeviceIndex;
      bitwig.localState[2] = deviceSlotIndex;
      bitwig.localState[3] = 0;
      console.log("test begin");
      logLocalState();
      console.log("test end");

      port.send({
        address: "/track",
        args: bitwig.localState
      });

    });
  });

  document.querySelectorAll('.instr').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('.instr').forEach(item => {
        item.classList.remove("instrActive");
      });
      event.target.classList.add("instrActive");

      const oscArgs = [];
      oscArgs[0] = parseInt(event.target.getAttribute("data-instr-index"));

      port.send({
        address: "/device/instrument/select",
        args: oscArgs
      });

    });
  });

};

bitwig.renderPositionBeats = function (oscMessage) {
  document.querySelector("#positionBeatsDisplay").textContent = oscMessage;
}

bitwig.renderSlotDevices = function (oscBundle) {
  console.log(oscBundle);
  // const deviceSlotDevicesReversed = oscBundle.packets;
  const deviceSlotDevices = oscBundle.packets;
  console.log(deviceSlotDevices);

  document.querySelectorAll('.deviceSlotDevice').forEach(item => {
    item.remove();
  });

  deviceSlotDevices.forEach(function (value, index) {

    // when there are no device slot devices the array is empty
    if (deviceSlotDevices[index].args[0] == null) {
      return;
    }

    const isActive = deviceSlotDevices[index].args[1];
    const slotDevice = {
      name: deviceSlotDevices[index].args[0],
      index: index
    };

    const markupSlotDevice = `
		<button class="deviceSlotDevice${isActive ? ' slotDeviceActive' : ''}" data-slot-device="${slotDevice.index}">
			${slotDevice.name}
		</button>
		`;

    const slotActive = document.querySelector(".slotActive");
    slotActive.parentElement.insertAdjacentHTML("beforeend", markupSlotDevice);
  });

  document.querySelectorAll('.deviceSlotDevice').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('.deviceSlotDevice').forEach(item => {
        item.classList.remove("deviceActive");
      });
      document.querySelectorAll('.deviceSlot').forEach(item => {
        item.classList.remove("slotDeviceActive");
      });
      // event.target.classList.add("slotDeviceActive");

      const slotDeviceIndex = parseInt(event.target.getAttribute("data-slot-device"));
      bitwig.localState[3] = slotDeviceIndex;

      console.log("sending SLOT DEVICE");
      logLocalState();

      port.send({
        address: "/track",
        args: bitwig.localState
      });
    });
  });

};

bitwig.renderRemoteControls = function (oscBundle) {
  let isActive = false;
  document.querySelectorAll('#bwRemoteControls button').forEach(item => {
    item.remove();
  });

  const pages = oscBundle.packets;
  console.log(pages);

  const bwRemoteControlsEl = document.querySelector("#bwRemoteControls");
  if (pages.length > 6) {
    bwRemoteControlsEl.style.borderBottom = '5px solid #6e6e6e';
  } else {
    bwRemoteControlsEl.style.borderBottom = 'none';
  }

  pages.forEach(function (value, index) {
    const currentPage = value.args;
    isActive = currentPage[1];

    const page = {
      name: currentPage[0],
      index: index
    };

    const markupPage = `
		<button class="${isActive ? 'pageActive' : ''}" data-page="${page.index}">
			${page.name}
		</button>
		`;

    document.querySelector("#bwRemoteControls").insertAdjacentHTML("beforeend", markupPage);
  });

  document.querySelectorAll('#bwRemoteControls button').forEach(item => {
    item.addEventListener('click', event => {

      document.querySelectorAll('#bwRemoteControls button').forEach(item => {
        item.classList.remove("pageActive");
      });
      event.target.classList.add("pageActive");
      const selectedPage = parseInt(event.target.getAttribute("data-page"));
      port.send({
        address: "/remote-controls/select",
        args: selectedPage
      });

    });
  });
};

bitwig.renderTempo = function (oscMessage) {
  document.querySelector("#tempoDisplay").value = oscMessage;
}

bitwig.initControls = function () {

  document.querySelector("#pDevices").addEventListener('click', event => {
    console.log("pDevices pressed");
    const placeholder = "yellow";
    port.send({
      address: "/panel/devices",
      args: placeholder
    });
  });

  document.querySelector("#pNotes").addEventListener('click', event => {
    console.log("pNotes pressed");
    const placeholder = "red";
    port.send({
      address: "/panel/notes",
      args: placeholder
    });
  });

  document.querySelector("#pMeter").addEventListener('click', event => {
    console.log("pMeter pressed");
    const placeholder = "green";
    port.send({
      address: "/panel/meter",
      args: placeholder
    });
  });

  document.querySelector("#pIo").addEventListener('click', event => {
    console.log("pIo pressed");
    const placeholder = "purple";
    port.send({
      address: "/panel/io",
      args: placeholder
    });
  });

  document.querySelector("#pInspector").addEventListener('click', event => {
    console.log("pInspector pressed");
    const placeholder = "cyan";
    port.send({
      address: "/panel/inspector",
      args: placeholder
    });
  });

  document.querySelector("#dToggle").addEventListener('click', event => {
    console.log("dToggle pressed");
    const placeholder = "cyan";
    port.send({
      address: "/device/toggle",
      args: placeholder
    });
  });

  document.querySelector("#dDetail").addEventListener('click', event => {
    console.log("dDetail pressed");
    const placeholder = "magenta";
    port.send({
      address: "/device/detail",
      args: placeholder
    });
  });

  document.querySelector("#dExpanded").addEventListener('click', event => {
    console.log("dExpanded pressed");
    const placeholder = "black";
    port.send({
      address: "/device/expanded",
      args: placeholder
    });
  });

  document.querySelector("#dRemoteControls").addEventListener('click', event => {
    console.log("dRemoteControls pressed");
    const placeholder = "grey";
    port.send({
      address: "/device/remote-controls",
      args: placeholder
    });
  });

  document.querySelector("#aStopAndZero").addEventListener('click', event => {
    console.log("aStopAndZero pressed");
    const placeholder = "metal";
    port.send({
      address: "/application/stop",
      args: placeholder
    });
  });

  document.querySelector("#aPlay").addEventListener('click', event => {
    console.log("aPlay pressed");
    const placeholder = "metal";
    port.send({
      address: "/application/play",
      args: placeholder
    });
  });

  document.querySelector("#tempoMinusTen").addEventListener('click', event => {
    console.log("tempo - 10");
    bitwig.sendTempo(-10, false);
  });

  document.querySelector("#tempoMinusOne").addEventListener('click', event => {
    console.log("tempo - 1");
    bitwig.sendTempo(-1, false);
  });

  document.querySelector("#tempoPlusOne").addEventListener('click', event => {
    console.log("tempo + 1");
    bitwig.sendTempo(1, false);
  });

  document.querySelector("#tempoPlusTen").addEventListener('click', event => {
    console.log("tempo + 10");
    bitwig.sendTempo(10, false);
  });

  document.querySelector("#tempoDisplay").addEventListener('input', event => {
    console.log("tempo value updated");
    bitwig.sendTempo(event.target.value, true);
  });

  document.querySelector("#aMetronome").addEventListener('click', event => {
    console.log("metronome pressed");
    const placeholder = "cyan";
    port.send({
      address: "/metronome/toggle",
      args: placeholder
    });
  });
};

port.open();