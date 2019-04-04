const debug = false;
const verbose = true;

const Cyton = require('@openbci/cyton');
const board = new Cyton({
  debug: false
});

board.autoFindOpenBCIBoard().then(portName => {
  console.log("port found ", portName);
  board.connect(portName).then(() => {
    console.log("connected");
    board.softReset();

    board.on('ready',(sample) => {
      console.log("ready");
      console.log("Board info: ",board.getInfo());
      console.log("Firmware v2: ", board.usingVersionTwoFirmware());
      console.log("Channels: ", board.numberOfChannels());
      console.log("Sample Rate", board.sampleRate());
      board.streamStart();
      board.on('sample',(sample) => {
        for (let i = 0; i < board.numberOfChannels(); i++) {
          console.log("Channel " + (i + 1) + ": " + sample.channelData[i].toFixed(8) + " Volts.");
        }
        if(board.isStreaming()){
          board.streamStop();
        }
      })
    })
  })
})


function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    board.removeAllListeners();
    /** Do additional clean up here */
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    board.disconnect().catch(console.log);
  }
}


// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));
