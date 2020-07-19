const fs = require("fs");
const NBT = require("nbt");
const ndarray = require("ndarray")
const {
  blockID,
  specBlocks,
  specb,
  specbd,
  buttonConvert
} = require("../res/blockID");
const font = require("../res/mcfont");

function sche(textMsg) {
  if (textMsg == 'sche list') {
    fs.readdir('./sche', (err, files) => {
      if (err) {
        this.tellraw(`${font.pink}${err}`);
      } else {
        let fNames = '';
        for (let fileName of files) {
          if (fileName.endsWith('.schematic')) {
            fNames += fileName.padEnd(20, ' ') + fs.statSync('./sche/' + fileName).size + '\n';
          };
        };
        this.tellraw(`${font.blue}Schematics: ${font.yellow}\n${fNames}`);
      };
    });
  } else {
    let options = this.parse(textMsg);
    if (options) {
      if (fs.existsSync(options.path)) {
        fs.readFile(options.path, (err, buffer) => {
          if (err) {
            this.tellraw(`${font.pink}${err}`);
          } else {
            NBT.parse(buffer, (error, data) => {
              if (error) {
                this.tellraw(error);
              }
              let width = data.value.Width.value;
              let height = data.value.Height.value;
              let length = data.value.Length.value;

              let [px, py, pz] = this.pos;

              console.log("Width(x):", width);
              console.log("Height(y):", height);
              console.log("Length(z):", length);

              this.tellraw(`${font.blue}File loaded\n${font.blue}Width(x): ${font.green}${width}\n${font.blue}Height(y): ${font.green}${height}\n${font.blue}Length(z): ${font.green}${length}`);

              let blocksRaw = data.value.Blocks.value;
              let datasRaw = data.value.Data.value;
              let blocks = ndarray(blocksRaw, [height, length, width]);
              let datas = ndarray(datasRaw, [height, length, width]);

              for (let y = 0; y < height; y++) {
                for (let z = 0; z < length; z++) {
                  for (let x = 0; x < width; x++) {
                    let nowBlock = blocks.get(y, z, x);
                    let bID = 'air';
                    let bD = 0;
                    if (nowBlock) {
                      if (nowBlock < 0) {
                        nowBlock += 256;
                      };
                      if (specBlocks.indexOf(nowBlock) >= 0) {
                        if (nowBlock >= 219 && nowBlock <= 234) {
                          bID = 'shulker_box';
                          bD = nowBlock - 219;
                        } else {
                          bID = specb[nowBlock];
                          bD = specbd[nowBlock];
                          if (nowBlock == 205) {
                            if (datas.get(y, z, x)) {
                              bD = 9;
                            }
                          }
                        }
                      } else {
                        bID = blockID[nowBlock];
                        bD = datas.get(y, z, x);
                        if (bID.indexOf('door') >= 0 && bD >= 8) {
                          continue;
                        }
                        if (bID.indexOf('button') >= 0) {
                          bD = buttonConvert[bD];
                        }
                      }
                      this.push(`setblock ${px+x} ${py+y} ${pz+z} ${bID} ${bD}`);
                    }
                  }
                }
              }
            });
          }
        })
      } else {
        this.tellraw(`${font.pink}Error: file doesn't exist`)
      };
    };
  };
}

sche.helpStr = `${font.green}${font.italic}sche${font.clear} : ${font.blue}Load a schematic file\n${font.yellow}Usage: \n    ${font.blue}sche list \n    sche -z <path>`;
module.exports = sche;
