const fs = require("fs");
const readline = require("readline");
const font = require("../res/mcfont");

function func(textMsg) {
  if (textMsg == 'func list') {
    fs.readdir('./func', (err, files) => {
      if (err) {
        this.tellraw(`${font.pink}${err}`);
      } else {
        let fNames = '';
        for (let fileName of files) {
          if (fileName.endsWith('.mcfunction')) {
            fNames += fileName.padEnd(20, ' ') + fs.statSync('./func/' + fileName).size + '\n';
          };
        };
        this.tellraw(`${font.blue}MCFunctions: ${font.yellow}\n${fNames}`);
      };
    });
  } else {
    let options = this.parse(textMsg);
    if (options) {
      let [x, y, z] = this.pos;
      try {
        if (fs.existsSync(options.path)) {
          let fRead = fs.createReadStream(options.path);
          let reader = readline.createInterface({
            input: fRead
          });
          let commandCount = 0;
          reader.on("line", (text) => {
            this.push(`execute @s ${x} ${y} ${z} ${text}`);
            commandCount++;
          });
          reader.on("close", () => {
            this.tellraw(`${font.blue}File parsing done!\nCommand count: ${font.green}${commandCount}`);
          });
        } else {
          this.tellraw(`${font.pink}Error: file doesn't exist`)
        };
      } catch (err) {
        this.tellraw(`${font.pink}${err}`);
      };
    };
  };
}

func.helpStr = `${font.green}${font.italic}func${font.clear} : ${font.blue}Load a mcfunction file\n${font.yellow}Usage: \n    ${font.blue}func list \n    func -z <path>`;
module.exports = func;
