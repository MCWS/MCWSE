const fs = require("fs");
const NBT = require("nbt");
const font = require("../res/mcfont");

function print(...args) {
  console.log(...args);
}

function nbt(textMsg) {
  if (textMsg == 'nbt list') {
    fs.readdir('./nbt', (err, files) => {
      if (err) {
        this.tellraw(`${font.pink}${err}`);
      } else {
        let fNames = '';
        for (let fileName of files) {
          if (fileName.endsWith('.nbt')) {
            fNames += fileName.padEnd(20, ' ') + fs.statSync('./nbt/' + fileName).size + '\n';
          };
        };
        this.tellraw(`${font.blue}NBTs: ${font.yellow}\n${fNames}`);
      };
    });
  } else {
    let options = this.parse(textMsg);
    if (options) {
      if (fs.existsSync(options.path)) {
        fs.readFile(options.path, (err, buffer) => {
          if (err) {
            this.tellraw(err);
          } else {
            NBT.parse(buffer, (error, data) => {
              if (error) {
                this.tellraw(error);
              }
              let size = data.value.size.value.value;

              let [width, height, length] = size;
              let [px, py, pz] = this.pos;

              console.log("Width(x):", width);
              console.log("Height(y):", height);
              console.log("Length(z):", length);

              this.tellraw(`${font.blue}File loaded\n${font.blue}Width(x): ${font.green}${width}\n${font.blue}Height(y): ${font.green}${height}\n${font.blue}Length(z): ${font.green}${length}`);

              let blockList = data.value.blocks.value.value;
              let paletteList = data.value.palette.value.value;

              let palette = new Array();
              for (let plt of paletteList) {
                let blockName = plt.Name.value.slice(10);
                if (blockName == 'concrete_powder') {
                  blockName = 'concretepowder';
                } else if (blockName == 'item_frame') {
                  blockName = 'frame';
                } else if (blockName == 'terracotta') {
                  blockName = 'hardened_clay';
                };
                let blockData = 0;
                if (plt.Properties) {
                  let prop = plt.Properties.value;
                  let variant = '';
                  let axis = '';
                  let facing = '';
                  let color = '';
                  let half = '';
                  try {
                    switch (blockName) {
                      case 'stone':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'stone':
                            break;
                          case 'granite':
                            blockData = 1;
                            break;
                          case 'diorite':
                            blockData = 3;
                            break;
                          case 'andesite':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'dirt':
                        variant = prop.variant.value;
                        if (variant == 'coarse') {
                          blockData = 1;
                        };
                        break;
                      case 'planks':
                      case 'sapling':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'oak':
                            break;
                          case 'spruce':
                            blockData = 1;
                            break;
                          case 'birch':
                            blockData = 2;
                            break;
                          case 'jungle':
                            blockData = 3;
                            break;
                          case 'acacia':
                            blockData = 4;
                            break;
                          case 'dark_oak':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'sand':
                        variant = prop.variant.value;
                        if (variant == 'red_sand') {
                          blockData = 1;
                        };
                        break;
                      case 'log':
                        variant = prop.variant.value;
                        axis = prop.axis.value;
                        switch (variant) {
                          case 'oak':
                            break;
                          case 'spruce':
                            blockData = 1;
                            break;
                          case 'birch':
                            blockData = 2;
                            break;
                          case 'jungle':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        switch (axis) {
                          case 'none':
                            break;
                          case 'y':
                            break;
                          case 'x':
                            blockData += 4;
                            break;
                          case 'z':
                            blockData += 8;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'log2':
                        variant = prop.variant.value;
                        axis = prop.axis.value;
                        switch (variant) {
                          case 'acacia':
                            break;
                          case 'dark_oak':
                            blockData = 1;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        switch (axis) {
                          case 'none':
                            break;
                          case 'y':
                            break;
                          case 'x':
                            blockData += 4;
                            break;
                          case 'z':
                            blockData += 8;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'leaves':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'oak':
                            break;
                          case 'spruce':
                            blockData = 1;
                            break;
                          case 'birch':
                            blockData = 2;
                            break;
                          case 'jungle':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'leaves2':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'acacia':
                            break;
                          case 'dark_oak':
                            blockData = 1;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'dispenser':
                      case 'dropper':
                      case 'observer':
                      case 'piston':
                      case 'sticky_piston':
                      case 'frame':
                      case 'end_rod':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'down':
                            break;
                          case 'up':
                            blockData = 1;
                            break;
                          case 'north':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          case 'west':
                            blockData = 4;
                            break;
                          case 'east':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'wool':
                      case 'carpet':
                      case 'stained_hardened_clay':
                      case 'stained_glass_pane':
                      case 'stained_glass':
                      case 'shulker_box':
                      case 'concrete':
                      case 'concretepowder':
                        color = prop.color.value;
                        switch (color) {
                          case 'white':
                            break;
                          case 'orange':
                            blockData = 1;
                            break;
                          case 'magenta':
                            blockData = 2;
                            break;
                          case 'light_blue':
                            blockData = 3;
                            break;
                          case 'yellow':
                            blockData = 4;
                            break;
                          case 'lime':
                            blockData = 5;
                            break;
                          case 'pink':
                            blockData = 6;
                            break;
                          case 'gray':
                            blockData = 7;
                            break;
                          case 'silver':
                            blockData = 8;
                            break;
                          case 'cyan':
                            blockData = 9;
                            break;
                          case 'purple':
                            blockData = 10;
                            break;
                          case 'blue':
                            blockData = 11;
                            break;
                          case 'brown':
                            blockData = 12;
                            break;
                          case 'green':
                            blockData = 13;
                            break;
                          case 'red':
                            blockData = 14;
                            break;
                          case 'black':
                            blockData = 15;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'stone_slab':
                        variant = prop.variant.value;
                        half = prop.half.value;
                        switch (variant) {
                          case 'stone':
                            break;
                          case 'sandstone':
                            blockData = 1;
                            break;
                          case 'petrified_oak':
                            blockData = 2;
                            break;
                          case 'cobblestone':
                            blockData = 3;
                            break;
                          case 'brick':
                            blockData = 4;
                            break;
                          case 'stone_brick':
                            blockData = 5;
                            break;
                          case 'quartz':
                            blockData = 6;
                            break;
                          case 'nether_brick':
                            blockData = 7;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'stone_slab2':
                        variant = prop.variant.value;
                        half = prop.half.value;
                        switch (variant) {
                          case 'red_sandstone':
                            break;
                          case 'purpur':
                            blockData = 1;
                            break;
                          case 'prismarine':
                            blockData = 2;
                            break;
                          case 'prismarine_brick':
                            blockData = 3;
                            break;
                          case 'dark_prismarine':
                            blockData = 4;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'stone_slab3':
                        variant = prop.variant.value;
                        half = prop.half.value;
                        switch (variant) {
                          case 'end_stone':
                            break;
                          case 'smooth_red_sandstone':
                            blockData = 1;
                            break;
                          case 'polished_andesite':
                            blockData = 2;
                            break;
                          case 'andesite':
                            blockData = 3;
                            break;
                          case 'diorite':
                            blockData = 4;
                            break;
                          case 'polished_diorite':
                            blockData = 5;
                            break;
                          case 'granite':
                            blockData = 6;
                            break;
                          case 'polished_granite':
                            blockData = 7;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'stone_slab4':
                        variant = prop.variant.value;
                        half = prop.half.value;
                        switch (variant) {
                          case 'mossy_stone_brick':
                            break;
                          case 'smooth_quartz':
                            blockData = 1;
                            break;
                          case 'stone':
                            blockData = 2;
                            break;
                          case 'cut_sandstone':
                            blockData = 3;
                            break;
                          case 'cut_red_sandstone':
                            blockData = 4;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'wooden_slab':
                        variant = prop.variant.value;
                        half = prop.half.value;
                        switch (variant) {
                          case 'oak':
                            break;
                          case 'spruce':
                            blockData = 1;
                            break;
                          case 'birch':
                            blockData = 2;
                            break;
                          case 'jungle':
                            blockData = 3;
                            break;
                          case 'acacia':
                            blockData = 4;
                            break;
                          case 'dark_oak':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'double_stone_slab':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'stone':
                            break;
                          case 'sandstone':
                            blockData = 1;
                            break;
                          case 'petrified_oak':
                            blockData = 2;
                            break;
                          case 'cobblestone':
                            blockData = 3;
                            break;
                          case 'brick':
                            blockData = 4;
                            break;
                          case 'stone_brick':
                            blockData = 5;
                            break;
                          case 'quartz':
                            blockData = 6;
                            break;
                          case 'nether_brick':
                            blockData = 7;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'double_stone_slab2':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'red_sandstone':
                            break;
                          case 'purpur':
                            blockData = 1;
                            break;
                          case 'prismarine':
                            blockData = 2;
                            break;
                          case 'prismarine_brick':
                            blockData = 3;
                            break;
                          case 'dark_prismarine':
                            blockData = 4;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'double_stone_slab3':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'end_stone':
                            break;
                          case 'smooth_red_sandstone':
                            blockData = 1;
                            break;
                          case 'polished_andesite':
                            blockData = 2;
                            break;
                          case 'andesite':
                            blockData = 3;
                            break;
                          case 'diorite':
                            blockData = 4;
                            break;
                          case 'polished_diorite':
                            blockData = 5;
                            break;
                          case 'granite':
                            blockData = 6;
                            break;
                          case 'polished_granite':
                            blockData = 7;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'double_stone_slab4':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'mossy_stone_brick':
                            break;
                          case 'smooth_quartz':
                            blockData = 1;
                            break;
                          case 'stone':
                            blockData = 2;
                            break;
                          case 'cut_sandstone':
                            blockData = 3;
                            break;
                          case 'cut_red_sandstone':
                            blockData = 4;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'double_wooden_slab':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'oak':
                            break;
                          case 'spruce':
                            blockData = 1;
                            break;
                          case 'birch':
                            blockData = 2;
                            break;
                          case 'jungle':
                            blockData = 3;
                            break;
                          case 'acacia':
                            blockData = 4;
                            break;
                          case 'dark_oak':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'torch':
                      case 'redstone_torch':
                      case 'unlit_redstone_torch':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'up':
                            break;
                          case 'east':
                            blockData = 1;
                            break;
                          case 'west':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          case 'north':
                            blockData = 4;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'chest':
                      case 'trapped_chest':
                      case 'ender_chest':
                      case 'furnace':
                      case 'wall_sign':
                      case 'spruce_wall_sign':
                      case 'birch_wall_sign':
                      case 'jungle_wall_sign':
                      case 'acacia_wall_sign':
                      case 'darkoak_wall_sign':
                      case 'ledder':
                      case 'hopper':
                      case 'wall_banner':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'down':
                            break;
                          case 'north':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          case 'west':
                            blockData = 4;
                            break;
                          case 'east':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'standing_sign':
                      case 'spruce_standing_sign':
                      case 'birch_standing_sign':
                      case 'jungle_standing_sign':
                      case 'acacia_standing_sign':
                      case 'darkoak_standing_sign':
                      case 'skull':
                      case 'standing_banner':
                        let rotation = prop.rotation.value;
                        blockData = rotation;
                        break;
                      case 'wooden_door':
                      case 'iron_door':
                      case 'spruce_door':
                      case 'birch_door':
                      case 'jungle_door':
                      case 'acacia_door':
                      case 'dark_oak_door':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'west':
                            break;
                          case 'north':
                            blockData = 1;
                            break;
                          case 'east':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        try {
                          half = prop.half.value;
                          if (half == 'upper') {
                            blockData += 8;
                          };
                        } catch (err) {
                          print(err);
                          print(blockName, prop);
                        };
                        break;
                      case 'oak_stairs':
                      case 'stone_stairs':
                      case 'brick_stairs':
                      case 'stone_brick_stairs':
                      case 'nether_brick_stairs':
                      case 'sandstone_stairs':
                      case 'spruce_stairs':
                      case 'birch_stairs':
                      case 'jungle_stairs':
                      case 'quartz_stairs':
                      case 'acacia_stairs':
                      case 'dark_oak_stairs':
                      case 'red_sandstone_stairs':
                      case 'purpur_stairs':
                      case 'prismarine_stairs':
                      case 'prismarine_bricks_stairs':
                      case 'dark_prismarine_stairs':
                      case 'normal_stone_stairs':
                      case 'granite_stairs':
                      case 'polished_granite_stairs':
                      case 'diorite_stairs':
                      case 'polished_diorite_stairs':
                      case 'andesite_stairs':
                      case 'polished_andesite_stairs':
                      case 'red_nether_brick_stairs':
                      case 'end_brick_stairs':
                      case 'mossy_stone_brick_stairs':
                      case 'mossy_cobblestone_stairs':
                      case 'smooth_sandstone_stairs':
                      case 'smooth_red_sandstone_stairs':
                      case 'smooth_quartz_stairs':
                        facing = prop.facing.value;
                        half = prop.half.value;
                        switch (facing) {
                          case 'east':
                            blockData = 0;
                            break;
                          case 'west':
                            blockData = 1;
                            break;
                          case 'south':
                            blockData = 2;
                            break;
                          case 'north':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 4;
                        }
                        break;
                      case 'lever':
                      case 'stone_button':
                      case 'wooden_button':
                      case 'spruce_button':
                      case 'birch_button':
                      case 'jungle_button':
                      case 'acacia_button':
                      case 'dark_oak_button':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'up':
                            break;
                          case 'east':
                            blockData = 1;
                            break;
                          case 'west':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          case 'north':
                            blockData = 4;
                            break;
                          case 'down':
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'powered_repeater':
                      case 'unpowered_repeater':
                        facing = prop.facing.value;
                        let delay = +prop.delay.value;
                        switch (facing) {
                          case 'north':
                            break;
                          case 'east':
                            blockData = 1;
                            break;
                          case 'south':
                            blockData = 2;
                            break;
                          case 'west':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        switch (delay) {
                          case 1:
                            break;
                          case 2:
                            blockData += 4;
                            break;
                          case 3:
                            blockData += 8;
                            break;
                          case 4:
                            blockData += 12;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'wooden_trapdoor':
                      case 'iron_trapdoor':
                      case 'spruce_trapdoor':
                      case 'birch_trapdoor':
                      case 'jungle_trapdoor':
                      case 'acacia_trapdoor':
                      case 'dark_oak_trapdoor':
                        facing = prop.facing.value;
                        half = prop.half.value;
                        switch (facing) {
                          case 'south':
                            break;
                          case 'north':
                            blockData = 1;
                            break;
                          case 'east':
                            blockData = 2;
                            break;
                          case 'west':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (half == 'top') {
                          blockData += 8;
                        };
                        break;
                      case 'stonebrick':
                        variant = prop.variant.value;
                        switch (variant) {
                          case 'stonebrick':
                            break;
                          case 'cracked_stonebrick':
                            blockData = 1;
                            break;
                          case 'mossy_stonebrick':
                            blockData = 2;
                            break;
                          case 'chiseled_stonebrick':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'fence_gate':
                      case 'spruce_fence_gate':
                      case 'birch_fence_gate':
                      case 'jungle_fence_gate':
                      case 'acacia_fence_gate':
                      case 'dark_oak_fence_gate':
                      case 'end_portal_frame':
                      case 'tripwire_hook':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'south':
                            blockData = 0;
                            break;
                          case 'west':
                            blockData = 1;
                            break;
                          case 'north':
                            blockData = 2;
                            break;
                          case 'east':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'command_block':
                      case 'chain_command_block':
                      case 'repeating_command_block':
                        facing = prop.facing.value;
                        let conditional = prop.conditional.value;
                        switch (facing) {
                          case 'down':
                            break;
                          case 'up':
                            blockData = 1;
                            break;
                          case 'north':
                            blockData = 2;
                            break;
                          case 'south':
                            blockData = 3;
                            break;
                          case 'west':
                            blockData = 4;
                            break;
                          case 'east':
                            blockData = 5;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (conditional == 'true') {
                          blockData += 8;
                        };
                        break;
                      case 'anvil':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'north':
                          case 'south':
                            break;
                          case 'west':
                          case 'east':
                            blockData = 1;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;
                      case 'powered_comparator':
                      case 'unpowered_comparator':
                        facing = prop.facing.value;
                        let mode = prop.mode.value;
                        switch (facing) {
                          case 'north':
                            break;
                          case 'east':
                            blockData = 1;
                            break;
                          case 'south':
                            blockData = 2;
                            break;
                          case 'west':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        if (mode == 'subtract') {
                          blockData += 4;
                        };
                        break;
                      case 'hay_block':
                        axis = prop.axis.value;
                        switch (axis) {
                          case 'y':
                            break;
                          case 'x':
                            blockData += 4;
                            break;
                          case 'z':
                            blockData += 8;
                            break;
                          default:
                            print(blockName, prop);
                        }
                        break;
                      case 'white_glazed_terracotta':
                      case 'orange_glazed_terracotta':
                      case 'magenta_glazed_terracotta':
                      case 'light_blue_glazed_terracotta':
                      case 'yellow_glazed_terracotta':
                      case 'lime_glazed_terracotta':
                      case 'pink_glazed_terracotta':
                      case 'gray_glazed_terracotta':
                      case 'silver_glazed_terracotta':
                      case 'cyan_glazed_terracotta':
                      case 'purple_glazed_terracotta':
                      case 'blue_glazed_terracotta':
                      case 'brown_glazed_terracotta':
                      case 'green_glazed_terracotta':
                      case 'red_glazed_terracotta':
                      case 'black_glazed_terracotta':
                        facing = prop.facing.value;
                        switch (facing) {
                          case 'south':
                            break;
                          case 'west':
                            blockData = 1;
                            break;
                          case 'east':
                            blockData = 2;
                            break;
                          case 'north':
                            blockData = 3;
                            break;
                          default:
                            print(blockName, prop);
                        };
                        break;


                      default:
                    }
                  } catch (err) {
                    print('Error', err);
                  }
                }
                palette.push(blockName + ' ' + blockData);
              }

              for (let blk of blockList) {
                let [x, y, z] = blk.pos.value.value;
                let state = +blk.state.value;
                let detail = palette[state];
                if (!detail.startsWith('air')) {
                  this.push(`setblock ${px+x} ${py+y} ${pz+z} ${palette[state]}`);
                };
              };

            });
          }
        })
      } else {
        this.tellraw(`${font.pink}Error: file doesn't exist`)
      };
    };
  };
}

nbt.helpStr = `${font.green}${font.italic}nbt${font.clear} : ${font.blue}Load a NBT file\n${font.yellow}Usage: \n    ${font.blue}nbt list \n    nbt -z <path>`;
module.exports = nbt;
