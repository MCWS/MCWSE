const WebSocket = require("ws");
const os = require("os");
const fs = require("fs");
const exec = require("child_process").exec;
//const ndarray = require("ndarray");
//const sleep = require("sleep");
const {
  Command
} = require("commander");
const font = require("./res/mcfont")
const termColor = {
  black: '\033[30m',
  red: '\033[31m',
  green: '\033[32m',
  orange: '\033[33m',
  blue: '\033[34m',
  magenta: '\033[35m',
  cyan: '\033[36m',
  gray: '\033[37m',
  normal: '\033[39m',
}

function getIPAddress() {
  let interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    let iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

function time() {
  return (new Date()).getTime();
};

function timeStamp() {
  let date = new Date();
  let time = date.toTimeString().slice(0, 8);
  return '[' + time + ']';
};

function log(...arg) {
  console.log(timeStamp(), ...arg);
};

//scripts
const scripts = new Map();
scripts._list = '';
fs.readdir('./scripts/', (err, files) => {
  if (err) {
    console.log(`Error while loading scripts: ${err}`);
  }
  files.forEach((file) => {
    let scriptName = file.split('.')[0];
    try {
      scripts.set(scriptName, require('./scripts/' + scriptName));
      scripts._list += scriptName + ' '
      log(`${termColor.cyan}Loaded script ${termColor.green}${scriptName}${termColor.normal}`)
    } catch (error) {
      log(`Failed due to ${error}`);
    }
  })
});

function messageHandler(msgJson) {

  let properties = msgJson.body.properties;
  let textMsg = properties.Message.trim();
  let sender = properties.Sender;
  if (sender != '外部' && sender != 'External') {
    log(`Sender: ${sender} Message: ${textMsg}`);
  } else {
    return;
  }

  if (textMsg.startsWith('$')) {
    exec(textMsg.slice(1), (err, stdout, stderr) => {
      if (err) {
        log(`Error while client ${this.name} exec ${textMsg.slice(1)}:\n${stderr.trim()}`);
        this.tellraw(`${stderr.trim()}`, {
          withTime: false
        });
      } else {
        log(`Client ${this.name} Exec ${textMsg.slice(1)} succeed:\n${stdout.trim()}`);
        this.tellraw(`${stdout.trim()}`, {
          withTime: false
        });
      }
    });
  } else if (textMsg.startsWith('%')) {
    try {
      let command = textMsg.slice(1)
      let result = eval(command);
      log(`Client ${this.name} command ${command} succeed:\n${result}`);
      this.tellraw(result);
    } catch (err) {
      log(`Error while client ${this.name} command ${command}:\n${err}`);
      this.tellraw(err);
    };
  } else if (textMsg.startsWith('./')) {
    let command = textMsg.slice(2);
    this.command(command, (session, msgjson) => {
      session.tellraw(JSON.stringify(msgjson, null, 2), {
        withTime: false
      })
    });
  } else if (textMsg.startsWith('+')) {
    let event = textMsg.slice(1)
    this.subscribe(event, (msgjson) => {
      this.tellraw(JSON.stringify(msgjson, null, 2), {
        withTime: false
      });
    });
  } else if (textMsg.startsWith('-')) {
    let event = textMsg.slice(1)
    this.unsubscribe(event);
  } else {
    let splitMsg = textMsg.split(' ');
    let doWhat = splitMsg[0];
    switch (doWhat) {
      case ('pos'):
        this.tellraw(`${font.blue}Position is: ${font.clear}[${font.green}${this.pos.toString()}${font.clear}]`);
        break;
      case ('getpos'):
        this.getpos();
        break;
      case ('setpos'):
        this.pos = [...splitMsg.slice(1, 4)];
        this.tellraw(`${font.blue}Position set: ${font.clear}[${font.green}${this.pos.toString()}${font.clear}]`);
        break;
      case ('exit'):
        this.tellraw(`${font.blue}Exiting...`);
        this.command('connect out');
        this.ws.close();
        break;
      case ('speed'):
        let speed = +splitMsg[1];
        if (speed >= 0 && speed < 4) {
          this.commandSpeed = speed;
          this.tellraw(`${font.blue}Speed set to ${font.green}${speed}`)
        } else {
          this.tellraw(`${font.pink}Too large!`);
        }
        break;
      default:
        try {
          if (scripts.has(doWhat)) {
            if (splitMsg.length == 1){
              this.tellraw(scripts.get(doWhat).helpStr);
            } else {
            this.commandStartTime = time();
            scripts.get(doWhat).bind(this)(textMsg);
            }
          };
        } catch (err) {
          this.tellraw(`Error: ${err}`);
        }
        break;
    };
  };
}

class WSServer {

  static serverList = new Set();

  constructor(port) {

    this.IP = getIPAddress();
    if (process.platform.toLowerCase() == "windows") {
      this.IP = "localhost";
    };
    this.port = port;

    let server = new WebSocket.Server({
      host: this.IP,
      port: this.port
    });
    this.server = server;
    WSServer.serverList.add(this);

    server.on("listening", () => {
      log(`${termColor.cyan}Server is running at ${termColor.green}${this.IP}:${this.port}${termColor.normal}`);
    })

    this.sessions = new Set();

    server.on("connection", (ws, req) => {

      let consock = req.connection;
      let session = new Session(ws, this, consock);

    });

    server.on("error", function(err) {
      log(`Server error:`, err);
    });

    server.on("close", function() {
      clearInterval(heartbeat);
      log("Server closed!");
    });

  }
}

class Session {

  constructor(websocket, server, consock) {
    this.ws = websocket;
    this.baseServer = server;
    server.sessions.add(this);

    this.commands = new Map();
    this.commandID = 0;
    this.commandAwait = new Array();
    this.commandAwaitResponser = null;

    this.commandTotal = 0;
    this.commandSent = 0;
    this.commandStartTime = time();
    this.commandSentLast = 0;
    this.commandSentLastTime = time();

    this.eventResponser = new Map();
    this.commandResponser = new Map();

    this.commandSpeed = 1;

    this.IP = consock.remoteAddress;
    this.port = consock.remotePort;

    // Wait to avoid dropping packets
    setTimeout(() => {
      this.subscribe("PlayerMessage", messageHandler);
      this.unsubscribe("PlayerTravelled");
      this.pingDelay = time();
      this.ws.ping();

      this.command('testfor @s', (session, msgjson) => {
        session.name = msgjson.body.victim[0];
        log(`Client ${session.name} connected from ${session.IP}:${session.port}`);
        session.tellraw(`${font.pink}${font.bold}Script Engine ${font.clear}${font.blue}connected!`);
        session.tellraw(`${font.blue}Loaded scripts: ${font.green}${scripts._list}`);
        session.getpos();
      });
    }, 200);

    this.commandInterval = setInterval(() => {
      if (this.commandAwait.length) {
        switch (this.commandSpeed) {
          case 3:
            process.nextTick(() => {
              this.command(this.commandAwait.shift(), this.commandAwaitResponser, '00000001');
            });
          case 2:
            setImmediate(() => {
              this.command(this.commandAwait.shift(), this.commandAwaitResponser, '00000001')
            });
          case 1:
            this.command(this.commandAwait.shift(), this.commandAwaitResponser, '00000001');
        }
      }
    }, 0)

    this.ws.on("message", (msg) => {

      let msgJson = JSON.parse(msg);
      let msgPurpose = msgJson.header.messagePurpose;
      let reqID = +msgJson.header.requestId.slice(-12);

      switch (msgPurpose) {
        case 'event':
          let eventName = msgJson.body.eventName;
          let properties = msgJson.body.properties;
          let eventCallBack = this.eventResponser.get(eventName);

          if (eventCallBack) {
            eventCallBack.bind(this)(msgJson);
          } else {
            log(`Event: ${eventName} from client ${this.name}`);
            console.log(msgJson);
          };

          if (!this.properties) {
            this.properties = properties;
            log(`Client Details: \nName: ${this.name} \nIP: ${this.IP}:${this.port} \nPlatform: ${properties.Plat} \nMCVersion: ${properties.Build} \nMode: ${['Survival','Creative','Adventure'][properties.Mode]}`);
          };
          break;
        case 'commandResponse':
          if (this.commandTotal) {
            let typeMark = +msgJson.header.requestId.slice(0, 8);
            if (typeMark == 1) {
              this.commandSent += 1;
              if (this.commandSent == this.commandTotal) {
                this.tellraw(`${font.blue}Successfully send ${font.green}${this.commandTotal} ${font.blue}commands in ${font.green}${(time()-this.commandStartTime)/1000} ${font.blue}seconds!`);
                this.commandSent = 0;
                this.commandTotal = 0;
                this.commandSentLast = 0;
                this.commandSentLastTime = time();
              }
            };
          };
          this.commands.delete(reqID);
          let callback = this.commandResponser.get(reqID);
          if (callback) {
            try {
              callback(this, msgJson);
            } catch (err) {
              log("Client", this.name, "Error:", err, `\nFrom callback: \n${callback.toString()}`);
            } finally {
              this.commandResponser.delete(reqID);
            }
          }
          break;
        case 'error':
          if (this.commandTotal){
            let typeMark = +msgJson.header.requestId.slice(0, 8);
            if (typeMark == 1){
              this.commandFromID(reqID, "00000001");
            } else {
              this.commandFromID(reqID);
            };
          };
          break;
        default:
          log(`Unknown response from ${this.name}`);
          log(msgJson);
      }
    })

    let heartbeat = setInterval(() => {
      if (this.pingDelay < 1000000) {
        if (this.commandTotal){
          this.titleraw(`${font.blue}Delay is: ${font.green}${this.pingDelay} ${font.blue}ms\n${font.blue}Total: ${font.green}${this.commandTotal} ${font.blue}Sent: ${font.green}${this.commandSent} ${font.blue}Speed: ${font.green}${Math.floor((this.commandSent-this.commandSentLast)/(time()-this.commandSentLastTime)*1000)} ${font.blue}blocks/s`);
          this.commandSentLast = this.commandSent;
          this.commandSentLastTime = time();
        } else {
          this.titleraw(`${font.blue}Delay is: ${font.green}${this.pingDelay} ${font.blue}ms`);
        };
      };
      this.pingDelay = time();
      this.ws.ping();
    }, 1000);
    this.heartbeat = heartbeat;
    this.ws.on("pong", () => {
      this.pingDelay = time() - this.pingDelay;
    });

    this.ws.on("error", (err) => {
      log(`Client error:`, err, `from ${this.name} ${this.clientIP}:${this.clientport}`);
    });

    this.ws.on("close", () => {
      clearInterval(this.heartbeat);
      clearInterval(this.commandInterval);
      log(`Client ${this.name} left from ${this.IP}:${this.port}`);
    });

  };

  parse(msg) {
    let parser = new Command();
    let splitMsg = msg.split(' ');
    let argv = ['', ...splitMsg];
    try {
      parser
        .option('-z, --path <str>', 'File Path', this.path)
        .option('-w, --width <int>','Width',32)
        .option('-h, --height <int>','Height',80)
        .option('-l, --length <int>','Length',32)
        .option('--seed <int>','Seed', Math.floor(Math.random() * Math.pow(2, 31)))
        .option('--full','Full version',false)
        .option('--with-ore','With ore',false)
        .parse(argv);
    } catch (err) {
      this.tellraw(`Error: ${err}`);
      return false;
    }
    return parser.opts();
  }

  send(msg) {
    this.ws.send(msg);
  };

  push(cmd) {
    this.commandAwait.push(cmd);
    this.commandTotal += 1;
  };

  command(cmd, callback = null, typeMark = '00000000') {
    let cID = this.commandID;
    this.commands.set(cID, cmd);
    if (callback) {
      this.commandResponser.set(cID, callback);
    };
    this.send(JSON.stringify({
      body: {
        origin: {
          type: "player"
        },
        commandLine: cmd,
        version: 1
      },
      header: {
        requestId: typeMark + '-0000-0000-0000-' + cID.toString().padStart(12, '0'),
        messagePurpose: "commandRequest",
        version: 1,
        messageType: "commandRequest"
      }
    }));
    this.commandID += 1;
  };

  commandFromID(ID, typeMark = "00000000") {
    this.send(JSON.stringify({
      body: {
        origin: {
          type: "player"
        },
        commandLine: this.commands.get(ID),
        version: 1
      },
      header: {
        requestId: typeMark + '-0000-0000-0000-' + ID.toString().padStart(12, '0'),
        messagePurpose: "commandRequest",
        version: 1,
        messageType: "commandRequest"
      }
    }));
  }

  getpos() {
    this.command('testforblock ~ ~ ~ air', (session, msgJson) => {
      let pos = msgJson.body.position;
      session.pos = [pos.x, pos.y, pos.z];
      session.tellraw(`${font.blue}Position got: ${font.clear}[${font.green}${this.pos.toString()}${font.clear}]`);
    })
  }

  tellraw(msg, {
    target = '@s',
    withTime = false,
    clear = false,
    icon = `${font.blue}[${font.italic}${font.green}SE${font.clear}${font.blue}]${font.clear} `
  } = {}) {
    if (withTime) {
      msg = timeStamp() + msg;
    };
    if (clear) {
      msg = '§一' + msg;
    };
    this.command('tellraw ' + target + ' ' + JSON.stringify({
      rawtext: [{
        text: icon + msg
      }]
    }))
  };

  titleraw(msg, {
    target = '@s',
    titleType = 'actionbar',
    clear = false
  } = {}) {
    if (clear) {
      msg = '§一' + msg;
    };
    this.command('titleraw ' + target + ' ' + titleType + ' ' + JSON.stringify({
      rawtext: [{
        text: msg
      }]
    }))
  };

  subscribe(event = 'PlayerMessage', callback = null) {
    this.send(JSON.stringify({
      body: {
        eventName: event
      },
      header: {
        requestId: "00000000-0000-0000-0000-000000000000",
        messagePurpose: "subscribe",
        version: 1,
        messageType: "commandRequest"
      }
    }));
    this.eventResponser.set(event, callback);
  };

  unsubscribe(event = 'PlayerTravelled') {
    this.send(JSON.stringify({
      body: {
        eventName: event
      },
      header: {
        requestId: "00000000-0000-0000-0000-000000000000",
        messagePurpose: "unsubscribe",
        version: 1,
        messageType: "commandRequest"
      }
    }));
    this.eventResponser.delete(event);
  };
}

const wss = new WSServer(8080);

process.stdin.on("data", (msg) => {
  msg = msg.toString().trim();
  switch (msg.slice(0, 1)) {
    case '/':
      for (server of WSServer.serverList) {
        for (client of server.sessions) {
          client.command(msg.slice(1), (session, msgjson) => {
            log(`CommandResponse from ${session.name}`);
            log(msgjson);
          });
        };
      };
      break;
    case '@':
      if (msg.indexOf('/') > 0) {
        let [name, command] = msg.slice(1).split('/');
        for (server of WSServer.serverList) {
          for (client of server.sessions) {
            if (client.name == name) {
              client.command(command, (session, msgjson) => {
                log(`CommandResponse from ${session.name}`);
                log(msgjson);
              });
            };
          };
        };
      } else if (msg.indexOf('+') > 0) {
        let [name, event] = msg.slice(1).split('+');
        for (server of WSServer.serverList) {
          for (client of server.sessions) {
            if (client.name == name) {
              client.subscribe(event);
            };
          };
        };
      } else if (msg.indexOf('-') > 0) {
        let [name, event] = msg.slice(1).split('-');
        for (server of WSServer.serverList) {
          for (client of server.sessions) {
            if (client.name == name) {
              client.unsubscribe(event);
            };
          };
        };
      } else if (msg.indexOf('?') > 0) {
        let [name, prop] = msg.slice(1).split('?');
        for (server of WSServer.serverList) {
          for (client of server.sessions) {
            if (client.name == name) {
              log(client[prop]);
            };
          };
        };
      };
      break;
    case '+':
      for (server of WSServer.serverList) {
        for (client of server.sessions) {
          client.subscribe(msg.slice(1));
        };
      };
      break;
    case '-':
      for (server of WSServer.serverList) {
        for (client of server.sessions) {
          client.unsubscribe(msg.slice(1));
        };
      };
      break;
    case '%':
      console.log(eval(msg.slice(1)));
      break;
    case '$':
      exec(msg.slice(1), {
        encoding: 'utf-8'
      }, (err, stdout, stderr) => {
        if (err) {
          console.log(`Error while exec ${msg.slice(1)}:\n${stderr.trim()}`);
        } else {
          console.log(stdout.trim());
        }
      });
      break;
  };
});

process.on("exit", () => {
  log("All stopped!");
});

console.log(`
[0;1;35;95m▞▀[0;1;31;91m▖[0m      [0;1;36;96m▗[0m    [0;1;31;91m▐[0m   [0;1;32;92m▛▀[0;1;36;96m▘[0m      [0;1;31;91m▗[0m       
[0;1;31;91m▚▄[0m [0;1;33;93m▞[0;1;32;92m▀▖[0;1;36;96m▙▀[0;1;34;94m▖▄[0m [0;1;35;95m▛[0;1;31;91m▀▖[0;1;33;93m▜▀[0m  [0;1;36;96m▙▄[0m [0;1;34;94m▛[0;1;35;95m▀▖[0;1;31;91m▞▀[0;1;33;93m▌▄[0m [0;1;32;92m▛[0;1;36;96m▀▖[0;1;34;94m▞▀[0;1;35;95m▖[0m
[0;1;33;93m▖[0m [0;1;32;92m▌▌[0m [0;1;36;96m▖[0;1;34;94m▌[0m  [0;1;35;95m▐[0m [0;1;31;91m▙[0;1;33;93m▄▘[0;1;32;92m▐[0m [0;1;36;96m▖[0m [0;1;34;94m▌[0m  [0;1;35;95m▌[0m [0;1;31;91m▌[0;1;33;93m▚▄[0;1;32;92m▌▐[0m [0;1;36;96m▌[0m [0;1;34;94m▌[0;1;35;95m▛▀[0m 
[0;1;32;92m▝▀[0m [0;1;36;96m▝[0;1;34;94m▀[0m [0;1;35;95m▘[0m  [0;1;31;91m▀[0;1;33;93m▘▌[0m   [0;1;36;96m▀[0m  [0;1;35;95m▀▀[0;1;31;91m▘▘[0m [0;1;33;93m▘[0;1;32;92m▗▄[0;1;36;96m▘▀[0;1;34;94m▘▘[0m [0;1;35;95m▘[0;1;31;91m▝▀[0;1;33;93m▘[0m
`)
