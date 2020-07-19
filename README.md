# MCWSE
A simple websocket server for MineCraft Bedrock Edition (1.2+)

Require: Node.js(12+)

## Usage:
```bash
git clone https://github.com/MCWS/MCWSE
cd MCWSE
npm i
node Main
```
Then you'll see something like this on your console
```
...
[12:00:00] Server is running at xxx.xxx.xxx.xxx:8080
[12:00:00] Loaded script func
[12:00:00] Loaded script nbt
[12:00:00] Loaded script sche
```
Remember this ip and port the server running at, then open your Minecraft Bedrock Edition, type this 
```
/connect xxx.xxx.xxx.xxx:8080
```
Inside the game, use ```getpos``` (chat command) to get your position

There are 3 preset scripts you are aviable to use: ```func nbt sche```

Type the script name to see the usage of each command

Eg: 
```
getpos
nbt
nbt list
nbt -z ./nbt/maincity.nbt
```
This will show you :

1. Usage of ```nbt```
2. A list of nbt in the nbt folder

And then the server will parse and build the **maincity.nbt** at your position.

## All avilable commands:
### Base commands:
```
pos
```
Show the generate position
```
getpos
```
Get your standing position
```
setpos <x> <y> <z>
```
Set the generate position
```
exit
```
Close the websocket connection
```
speed <0/1/2/3>
```
Modify the generate speed (default is 0)
```
./<Minecraft Command>
```
Execute a MC Command and display the response
```
$<Bash Command>
```
Execute a Bash Command inside the MC and display the response
```
%<JavaScript>
```
Evaluates JavaScript code and executes it (like `eval()`)
```
+<Player Event>
```
Subscribe a Player Event (eg. PlayerMessage)
```
-<Player Event>
```
Unsubscribe a Player Event
### Extend Sctipt Commands:
```
func
func list
func -z <path>
```
Execute a mcfunction file at your position (by using `execute @s x y z command`)
```
sche
sche list
sche -z <path>
```
Generate a schematic file at your position
```
nbt
nbt list
nbt -z <path>
```
Generate a nbt file at your position

You can also write your own script to run command in MCPE via our APIs (comming soon)

---

If you have any problem while using this program, email me at 2033161737@qq.com (or using QQ:2033161737(Sparks))
