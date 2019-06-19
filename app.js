const debug = false
const verbose = true

const Cyton = require('@openbci/cyton')
const IO = require('socket.io-client');
const Socket = IO('http://localhost:3000/api/v1/io/logs')

const board = new Cyton({
  debug: false,
  hardSet: true
})

board.autoFindOpenBCIBoard().then(portName => {
  console.log("[app][board] port found ", portName)
  board.connect(portName).then(() => {
    console.log("[app][board] connected")
    board.softReset()
    board.on('ready',(sample) => {
      console.log("[app][board] ready")
      console.log("[app][board] Board info: ",board.getInfo())
      console.log("[app][board] Firmware v2: ", board.usingVersionTwoFirmware())
      console.log("[app][board] Channels: ", board.numberOfChannels())
      console.log("[app][board] Sample Rate", board.sampleRate())

      board.on('sample',(sample) => {
        for (let i = 0; i < board.numberOfChannels(); i++) {
          console.log("[app][board] Channel " + (i + 1) + ": " + sample.channelData[i].toFixed(8) + " Volts.")
        }
        Socket.emit("sample", sample);
      })

    })
  })
})

// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}))

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}))

Socket.on('connect', () => {
  console.log('[app][socket] socket connected ')

  Socket.on('start', (data) => {
    console.log('[app][socket] start', data)
    board.streamStart()
  });

  Socket.on('stop', (data) => {
    console.log('[app][socket] start', data)
    board.streamStop()
  });

  Socket.on('write', (data) => {
    console.log('[app][socket] write', data)
    board.write(data).then((data)=>{
      console.log("[app][board] write result: ", data)
    }).catch((error)=>{
      console.log("[app][board] error: ", error)
    })
  });
});

Socket.on('disconnect', () => {
  console.log('[app][socket] disconnect')
});


function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean')
    board.removeAllListeners()
  }
  if (err) console.log(err.stack)
  if (options.exit) {
    if (verbose) console.log('exit')
    board.disconnect().catch(console.log)
  }
}
