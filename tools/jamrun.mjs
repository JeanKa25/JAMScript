#!/usr/bin/env zx
import { fileURLToPath } from 'url';
import { dirname, basename, extname} from 'path';
import { homedir, type } from 'os';
import { fs } from 'zx';
const { spawn,spawnSync } = require('child_process');

//REPLACE $RANDOM WITH MORE REAL VALUES
//PORT IMPLEMENTATIONS SEEMS NOT TO BE WORKING -> PORT ID IS NOT BNEONG incremented as expected
//ABSTRACT ALL THE WRITES AWAAAAYYY
//QUESTION: WE ONLY CREATE ONE MQTT BROKER?!?!?!
//HOW TO REPLACE THE RANDOM VARIABLE IN BASH SCRIPTING??
/**
 * trap cleanup SIGTERM SIGINT SIGKILL
 * QUESTION: I do not thing the SIGKILL is being trapped at all
 */

process.on('SIGINT', () => {cleanup(), cleanuptmux()});
process.on('SIGTERM', () => cleanup());

function die(error){
    process.stderr.write(`${error}\n`);
    process.exit(1);
};
let HOME = os.homedir();
let jappid;
let VALGRIND;
let iflow;
let oflow;
const childs =[]
//NOTE: don't need to check if the directory exists
//NODE: ABSOLUTE PATH INSTEAD OF RELATIVE
//source "$IDIR/inc/misc_tools.sh" (IMPORT THE FUNCTIONS ONE BY ONE WHEN IT IS NEEDED)
const mqttPromiseProcesses= [];
const filePath = fileURLToPath(import.meta.url);
const IDIR = dirname(filePath);
const REDISFUNCS = fs.realpathSync(`${IDIR}/../deps/lua/jredlib.lua`);
//we run on node not shell(this is not shellPID but node PID)
const SHELLPID = process.pid;
const VALGRIND_OPTS = 'valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --log-file=log_valgrind -s';
let NOVERBOSE=1
let tmuxapp;
let RANDOM;
let appfolder;
let DISABLE_STDOUT_REDIRECT;

// const Machine = (() =>{
//     switch (type().toLowerCase()) {
//         case "linux":
//             return "Linux";
//         case "darwin":
//             return "Mac";
//         default:
//             return `UNKNOWN:${type()}`
//       }
// })();

const [MOSQUITTO, MOSQUITTO_PUB, TMUX] = await Promise.all(
    ["mosquitto","mosquitto_pub", "tmux"].map(
        async (entry)=> {
            try{
                const p = await $`which ${entry}`;
                return p.stdout.trim();
            }
            catch(error){
                switch(entry){
                    case "tmux":
                        die("tmux not installed. Quitting.")
                    case "mosquitto_pub":
                        die("mosquitto_pub (MQTT tools) not installed. Quitting.")
                    case "mosquitto":
                        die("mosquitto (MQTT broker) not installed. Quitting.")
                }
            }
        }
    )
)

function show_usage(){
    const usageMessage = 
    `
    jamrun program.jxe
    Runs J and C node, one each, of a device with program.jxe
    under a default application name 'app-N'. To run under a different
    app name X, use the --app=X option.
    
    jamrun program.jxe --fog
    Runs a fog node (only J node) with program.jxe. Similarly, the --cloud
    flag runs a cloud node.
    
    By default, jamrun uses a Redis server running at 127.0.0.1:6379 as the
    data store. The Redis server needs to be started before launching the
    application. To use a different Redis server use the --data option.
    
    jamrun program.jxe --data=127.0.0.1:7000
    Runs program.jxe and connects it to an already running Redis server at
    port 7000 of the local host. Redis server can run outside the
    local host (Redis needs to the configured to accept outside
    connections).
    
    To start more than one C node at a device use the following command.
    jamrun program.jxe --num=4
    
    To provide a set of tags to the program, use the following command.
    jamrun program.jxe --tag="param1, param2"
    
    Use the --bg option to run a command in the background.fr
    
    Use the --old option to run the previous version in .jamruns folder.
    You can edit that version and rerun a custom version of a file.
    
    Use the --log option to turn on logging. This is useful for programs where
    the C side is crashing at the startup. The tmux console would not run when
    the program crash at startup. So the --log option allows us to see the
    program error messages.
    
    Use the --verb option to turn on verbose messaging.
    
    Use --valgrind to run the cside with valgrind for leak checking.
    
    Use --local to disable multicast discovery of the J node. The C node assumes that the J node in the local loopback.
    
    Usage: jamrun file.jxe
                    [--app=appl_name]
                    [--fog|--cloud]
                    [--num=num_c_devs]
                    [--data=data-url]
                    [--tags=quoted_list_of_tags]
                    [--bg]
                    [--old]
                    [--iflow=flow_name]
                    [--oflow=flow_name]
                    [--log]
                    [--verb]
                    [--loc=long,lat]
                    [--edge=num_edge_connections]
                    [--valgrind]
                    [--local]
    
    The jamrun command creates a run state in the $HOME/.jamruns folder.
    `;

    console.log(usageMessage);
    
}


//TOBE TESTED
async function startmqtt(port, cFile){
    // console.log(cFile, "this is my cfile")
    //Check whether the MQTT server is running.. if not start it
    //QUESTION : why aren't we throwing an error?SHAHIN: what if it is running on another server??
    //how does the error hanfling work over here?
    //what ensures tht it is waiting for the mqtt to actually run ?
    try{
        await $`${MOSQUITTO_PUB} -p ${port} -t "test" -m "hello"`.quiet();
    }
    catch(error){
        if(!NOVERBOSE)
            console.log(`MQTT is not running at ${port}\nAttempting to start MQTT at ${port}`);
        const mqttPromiseProcess = $`${MOSQUITTO} -c ${cFile}`.stdio('ignore', 'pipe', 'pipe').quiet().nothrow();
        mqttPromiseProcesses.push(mqttPromiseProcess)
        return;
    }
}
//missing argument for dojamOut_p2 querion what is happeing
async function dojamout(iport, folder, group=null) {
    await dojamout_p1 (iport ,folder)
    await dojamout_p2 (iport ,folder)
}

async function dojamout_p1(pnum ,floc) {
    
    await startmqtt(pnum , `${floc}/${pnum}/mqtt.conf`, data)
    //just writing the string?

    fs.writeFileSync(`${floc}/${pnum}/dataStore`, `${data}\n`);


    fs.writeFileSync(`${floc}/${pnum}/class`, "process\n");


    //SHELL PID CAN BE PROCESS ID IN NODE WHAT DO WE EXACTLY WANT OVER HERE< CAN THEU BE USED INTERCHANGABLY?
    fs.writeFileSync(`${floc}/${pnum}/shellpid`,SHELLPID.toString()+"\n" );
    //just writing string?//WE can do more
    fs.writeFileSync(`${floc}/${pnum}/processId`, "new"+"\n");
}


async function dojamout_p2(type, iport, folder, group=null){
    if(!bg)

        await dojamout_p2_fg(type, iport, folder, group)
    else

        dojamout_p2_bg(type, iport, folder, group)
}

function cleanup(){
    if(killbroker === 1){
        // console.log(`Killing broker with PID: ${mqttPromiseProcess}`)
        mqttPromiseProcesses.kill("SIGTERM");
    }
    if(childs.length!=0){
        for(let p of childs){
            p.kill("SIGTERM")
        }
    }
    /**
     * ADD TMUX HERE IF IT CAN"T BE DONE WITHOUT TMUX
     **/
    // cleanuptmux();
    process.exit(1)
}

async function dojamout_p2_fg(type, pnum, floc, group=null){

    //why shouldn't I do this in place?
    // let jargs = `--app=${jappid} --port=${pnum} --group=${group} --data=${data} --tags=${tags} --iflow=${iflow} --oflow=${oflow} --edge=${edge} --long=${long} --lat=${lat} --localregistryhost=${localregistryhost} --${type}`
    //what if it is not?
    // let jargs = `--app=${jappid} --port=${pnum} --group=${group} --data=${data}  --edge=${edge} --long=${long} --lat=${lat} --localregistryhost=${localregistryhost} --${type}`
    let jargs = [`--app=${jappid}`, `--port=${pnum}`, `--group=${group}`, `--data=${data}`, `--edge=${edge}`, `--long=${long}`, `--lat=${lat}`, `--localregistryhost=${localregistryhost}`, `--${type}`];


    
    if(type === "cloud" || type === "fog" || type === "device"){
        //not really running in the fg. we just await so it's blockking(maybe use the current approch in bash script)
        // console.log("STARTING THE JS FILE")
        // console.log(floc)
        // const p =await $`cd ${floc} && node jstart.js ${jargs}`
        // const p =await $`node jstart.js ${jargs}`

        const command = 'node';
        const args = ['jstart.js', ...jargs];
        const options = {
          cwd: floc,
          stdio: 'inherit'
        };
        
        // const child = spawn(command, args, options);
        spawnSync(command, args, options);

    }

    cleanup()
}
//don't forget to address the missmatching argument
function dojamout_p2_bg(type, pnum, floc, group=null){
    // const jargs = `--app=${jappid} --port=${pnum} --group=${group} --data=${data} --tags=${tags} --iflow=${iflow} --oflow=${oflow} --edge=${edge} --long=${long} --lat=${lat} --${type}`
    
    // if(Machine === "Linux"){
    //     //NOT TRUE BG .SEE IF IT CAUSES ERROR OR NOT(make sure to check if it is terminated or not before existing )
    //    const p = $`script -a -c "node jstart.js ${args}" -f log.j > /dev/null`.stdio('ignore', 'pipe', 'pipe')
    // }
    
    // else{
    //     const p = $`script -a -t 1 log.j node jstart.js $args > /dev/null`
    // }
    //I don't think it needs to be machine specific
    // const p = $`node jstart.js ${args}`.stdio('ignore', 'pipe', 'pipe');
    let jargs = [`--app=${jappid}`, `--port=${pnum}`, `--group=${group}`, `--data=${data}`, `--edge=${edge}`, `--long=${long}`, `--lat=${lat}`, `--localregistryhost=${localregistryhost}`, `--${type}`];
    const command = 'node';
    const args = ['jstart.js', ...jargs];
    const options = {
      cwd: floc,
      stdio: ['ignore', 'pipe', 'pipe']
    };

    const p = spawn(command, args, options);
    childs.push(p);
    p.stdout.pipe(fs.createWriteStream(`${floc}/log.j`), { flags: 'a' });
    p.stderr.pipe(fs.createWriteStream(`${floc}/log.j`), { flags: 'a' });
    p.on('error', (error) => {
        console.error(`Error: ${error.message}`);
      });
      
    p.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
    

    if(!NOVERBOSE){
        console.log("Started the J node in background")
    }
}

//how to check this?SHAHIN
async function doaout(num,port,group,datap,myf){
    let counter=1
    if (fs.existsSync('a.out')) {
        await $`chmod +x a.out`
    }
    while(counter <= num){
        if(fs.existsSync('a.out')){
            // let cargs = ` -a ${jappid} -p ${port} -n ${counter} -g ${group} -t ${tags} -o ${datap}`
            let cargs = ` -a ${jappid} -p ${port} -n ${counter} -g ${group} -o ${datap}`
            if(!DISABLE_STDOUT_REDIRECT){
                if (!log)
                    {

                        await $`${TMUX} new-session -s ${tmuxapp}-${counter} -d`;
                        //HOW DO WE DEAL WITH THE CASES WITHOUT VALGRID IN AN OK WAY?
                        if(VALGRIND)
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmuxapp}-${counter} ${VALGRIND} ./a.out ${cargs} C-m`;
                        else
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmuxapp}-${counter} ./a.out ${cargs} C-m`;
                    }
            
                else{
                    if(Machine === "Linux"){
                        //TO BE FIXE
                        let p = await $`${TMUX} new-session -s ${tmuxapp}-${counter} -d  script -a -c "${VALGRIND} ./a.out ${cargs}" -f log`.stdio("pipe","pipe","pipe")

                    }
                    
                    else{
                        //TO BE FIXE
                        let p = await $`${TMUX} new-session -s ${tmuxapp}-${counter} -d  "script -a -t 1 log ./a.out ${cargs}"`.stdio("pipe","pipe","pipe")

                    }
                }
            }
            else{
                let p = await $`./a.out ${cargs}`.stdio("pipe","pipe","pipe")

            }
    }
    counter++;
    if(!NOVERBOSE)
    console.log("Started a C node")
    }
}
//THIS IS VERY HARD TO TEST FOR ME
async function portavailable(folder,port) {
    let pid;
    if(fs.existsSync(`./${folder}/${port}`)){
        // console.log("folder exist")
        if(fs.existsSync(`${folder}/${port}/processId`)){
            // console.log("process ID exists")
            try{
                pid = fs.readFileSync(`${folder}/${port}/processId`)
            }
            catch(error){
                pid = null;
            }

            if(pid === "new"){
                // console.log("PID is new")
                porttaken=1;
            }
            else if(pid){
                // console.log("pid is in the folder")
                //this can be imporved by keeping track of the proccessesPromise directly(why do we do all this writes?)
                porttaken= await $`ps -o pid= -p $pid | wc -l | tr -d '[:space:]'`
            }
            else{
                // console.log("pid is not in the folder")
                porttaken=0;
            }
        }
        else{
            // console.log("process ID Not exists")
            porttaken=0;
        }
    }
    else{
        // console.log("folder NOT exist")
        porttaken=0;
    }
    if(porttaken === 0){
        // console.log("port taken is zero")
        const p = await $`netstat -an -p tcp 2>/dev/null | grep ${port} | wc -l`.nothrow().quiet()
        // console.log(p.stdout.trim(), "this is my stdout")
        porttaken= p.stdout.trim()
    }
}

function setuptmux(path) {
    if(!tmuxid){
        tmuxapp=`tg-${Math.floor(Math.random() * 32768)}`
    }
    else{
        tmuxapp=tmuxid;
    }
   
    //is it fine if this is blocking (the save is not synchroness in misc_tools.sh and why we use Save helper insted of doing it here)
    fs.writeFileSync(`${path}/tmuxid`,tmuxapp.toString()+"\n");
    fs.writeFileSync(`${appfolder}/tmuxid`,tmuxapp.toString()+"\n");

}



function getappid(mainf, localf, appid){
    if(appid === "app-n"){
        // console.log(appid, "this is my app id")
        //can be imporved by a try catch instead
        let result;
        if(fs.existsSync(`${mainf}/counter`)){
            // console.log("it's a main f")
            let value = fs.readFileSync(`${mainf}/counter`);
            result = Number(value.toString().trim()) + 1;
        }
        else{
            result = 1;
        }
        fs.writeFileSync(`${mainf}/counter`, `${result}\n`)
        fs.writeFileSync(`${localf}/appid`, `app-${result}\n`)
    }
    else{
        fs.writeFileSync(`${localf}/appid`,`${appid}`)
    }
    jappid = fs.readFileSync(`${localf}/appid`)
    // console.log("this is my jappid", jappid)
    fs.writeFileSync(`${appfolder}/appid`,`${jappid}`)
}

async function killtmux(sesh){
    const result = await $`tmux ls | grep ${sesh} | cut -d ':' -f 1`;
    for (const q of result.stdout.trim().split('\n')) {
        console.log(q);
        await $`tmux kill-session -t ${q}`;
    }
}
// ASK about this function logic specially how it exists
function cleanuptmux() {

    process.exit(1);

}
//there should be better ways to do this(CHECK THIS STEP)
function startredis(port) {
    //should it throw an error if it does not work? now are the input/output/err is ignored.(DIVE DEEPER IN THIS)

    $`redis-server  --port ${port}`.stdio('ignore', 'ignore', 'inherit').quiet().nothrow();


}
//there should be better ways to do this(CHECK THIS STEP)
async function waitforredis(port){
    while (true) {
        console.log("this is the port we have", port)
        let p
        try{
        // const p = await $`redis-cli -p ${port} -c PING`.stdio('ignore', 'pipe', 'ignore').quiet()
        p = await $`redis-cli -p ${port} -c PING`
        if (p.stdout.trim() === "PONG") {
            break;
          }
        
        }
        catch(error){
        }

   
        if (!NOVERBOSE) {
          console.log("Trying to find Redis server...");
        }
        await sleep(1000)
      }
    
      if (!NOVERBOSE) {
        console.log(`Redis running at port: ${port}`);
      }
}
//HOW TO CHECK IF RADIS IS ACTUALLY SET(WHAT IT IS EXACTLY USED FOR?)
async function setupredis(port) {
    await $`cat ${REDISFUNCS} | redis-cli -p ${port} -x FUNCTION LOAD REPLACE > /dev/null`
    await $`echo "set protected-mode no" | redis-cli -p ${port} > /dev/null`
    //I feel like the syntacs is off//spacing Added MODIFICATION
    await $`echo 'config set save "" protected-mode no' | redis-cli -p ${port} > /dev/null`

    

}


async function resolvedata(Name) {
    const [host, port] = Name.split(':');
    // console.log(port, "redis port is this ")
    startredis(Number(port));
    await waitforredis(port);
    await setupredis(port);
    
    if(host === "docker"){
        const ipaddr= `hostname -I`
        Name = `${ipaddr}:${port}`
    }
    
    //trim space left behind by hostname -I
    data = Name.split(/\s+/).join('');
    // console.log(data)
}
async function unpack(pfile, folder){
    const file = pfile
    if(!old){
        let p;
        if(!fs.existsSync("./MANIFEST.txt")){
            try{
                p = await $`cd ${folder} && unzip -o ${file}`.quiet()
            }
            catch(error){
                die(`Problem reading file: ${file}\n${error}`)
            } 
                       
        }
        else{
            const p1  = await $`cd ${folder} && zipgrep CREATE ${file} | awk 'NR==1{split($0,a, " "); print a[3]}'`;
            const p2 = await $`cd ${folder} && grep CREATE MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`;
            const ntime = p1.stdout.trim();
            const ontime = p2.stdout.trim();
            let p3;
            if(ntime > ontime){
                try{
                    p3 = await $`cd ${folder} && unzip -oq ${file}`.quiet()
                }
                catch(error){
                    die(`Problem reading file: ${file}\n${error}`)
                } 
            }
        }
    }
}

async function getheight(folder) {
    
    const p = await $`cd ${folder} && grep MAX-HEIGHT MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`.nothrow().quiet()
    return p.stdout.trim()
}

async function getjdata(folder) {
    const p = await $`cd ${folder} && grep JDATA MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`.nothrow().quiet()
    return p.stdout.trim()
}

function getlonglat(loc) {
    return [long, lat] = loc.split(",");
}

function generatelonglat() {
    const a = Math.floor(Math.random() * 180);
    const b = Math.floor(Math.random() * 10000);
    const long=`${a}.${b}`
    const c= Math.floor(Math.random() * 90);
    const d = Math.floor(Math.random() * 10000);
    const lat=`${c}.${d}`
    return  [long,lat]

}

let app="app-n"
//note: the key word has changed
let Type="device"
let data = "127.0.0.1:6379"
let num=1
let tags;
let bg;
let old;
let local;
let porttaken=0;
let tmuxid;
let log;
let edge=1
let localregistryhost=0
let killbroker=0

let [long, lat] = generatelonglat();

//processing the args to 
//bad bad bad
let args = process.argv.filter((entry) => (entry != 'jamrun.mjs' && !entry.includes('node') && !entry.includes('zx') && !entry.includes('jamrun.mjs')))
// this step can be abstracted away and improved to be more detailed
if(args.length === 0 || args[0].toLowerCase() === "-h" ||  args[0].toLowerCase() === "--help"){
    show_usage();
    process.exit(1);
}
const file = `${args[0]}`;
const fext = file.split(".").pop()
args = args.filter((_,index) => (index !== 0 ));

if(fext !== "jxe"){
    if(!fext)
        die(`${file} is not file name or missing extention`);
    else
        die(`Extension on ${file} is not .jxe`);
}
//////this is really bad fix it ASAP
//arg processing is very poorly design for a js script
while(true){
        //pooorly handled
        if(args.length === 0){
            break;
        }

        if( "--help" === args[0].toLowerCase()|| "-h" === args[0].toLowerCase()){
            show_usage();
            process.exit(1);
        }
        else if("--app"=== args[0].toLowerCase()){
            if(args.length > 1){
                //can be imporove --app =
                app = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
                
            }
            else
                die('ERROR: "--app" requires a non-empty option argument.')
        }
        

        else if(args[0].toLowerCase() === "--app=")
            //--app= 3 -> error
            die( 'ERROR: "--args" requires a non-empty option argument.')
        
        else if(args[0].includes("--app=") || args[0].includes("--App=")) {
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            app = value;
            args = args.filter((_,index) => (index !== 0));
        }
        else if(args[0].toLowerCase() === "--tags"){

            if(args.length > 1){
                tags = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--tags" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--tags=")
             die('ERROR: "--tags" requires a non-empty option argument.')

        else if(args[0].includes("--Tags=") || args[0].includes("--tags=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            tags = value;
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--tmux"){

            if(args.length > 1){
                tmuxid = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--tmux" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--tmux=")
             die('ERROR: "--tmux" requires a non-empty option argument.')

        else if(args[0].includes("--tmux=") || args[0].includes("--Tmux=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            tmuxid = value;
            args = args.filter((_,index) => (index !== 0));
        }


        else if(args[0].toLowerCase() === "--num"){

            if(args.length > 1){
                num = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--num" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--num=")
             die('ERROR: "--num" requires a non-empty option argument.')

        else if(args[0].includes("--num=") || args[0].includes("--Num=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            num = value;
            args = args.filter((_,index) => (index !== 0));
        }




        else if(args[0].toLowerCase() === "--loc"){

            if(args.length > 1){
                //this shpuld not be a getter but a setter
                [long, lat] = getlonglat(args[1])
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--loc" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--loc=")
             die('ERROR: "--loc" requires a non-empty option argument.')

        else if(args[0].includes("--Loc=") || args[0].includes("--loc=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            //this shpuld not be a getter but a setter
            [long, lat] = getlonglat(value)
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase()=== "--edge"){

            if(args.length > 1){
                edge = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--edge" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--edge=")
             die('ERROR: "--edge" requires a non-empty option argument.')

        else if(args[0].includes("--edge=") || args[0].includes("--Edge=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            edge = value;
            args = args.filter((_,index) => (index !== 0));
        }



        else if(args[0].toLowerCase() === "--data="){

            if(args.length > 1){
                data = args[1];
                args = args.filter((_,index) => (index !== 0 && index !== 1));
            }
            else
                die('ERROR: "--data" requires a non-empty option argument.')
        }

        else if(args[0].toLowerCase() === "--data")
             die('ERROR: "--data" requires a non-empty option argument.')

        else if(args[0].includes("--data=") || args[0].includes("--Data=")){
            const [_, ...rest] = args[0].split("=");
            const value = rest.join('');
            data = value;
            args = args.filter((_,index) => (index !== 0));
        }


        else if(args[0].toLowerCase() === "--fog"){
            //Do we mean == device
            if( Type != "device"){
                die( 'ERROR: "type" cannot be reassigned.')
            }
            else{
                Type = "fog"
                num = undefined;
                args = args.filter((_,index) => (index !== 0));
            }
        }

        else if(args[0].toLowerCase() === "--cloud"){
            //Do we mean == device
            if( Type != "device"){
                die( 'ERROR: "type" cannot be reassigned.')
            }
            else{
                Type = "cloud"
                num = undefined;
                args = args.filter((_,index) => (index !== 0));
            }
        }

        else if(args[0].toLowerCase() === "--cloud"){
            //Do we mean == device
            if( Type != "device"){
                die( 'ERROR: "type" cannot be reassigned.')
            }
            else{
                Type = "cloud"
                num = undefined;
                args = args.filter((_,index) => (index !== 0));
            }
        }

        else if(args[0].toLowerCase() === "--device"){
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--local_registry"){
            localregistryhost=1;
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--temp_broker"){
            killbroker=1;
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--bg"){
            bg=1;
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--verb"){
            NOVERBOSE=undefined;
            args = args.filter((_,index) => (index !== 0));
        }

        else if(args[0].toLowerCase() === "--log"){
            log=1
            args = args.filter((_,index) => (index !== 0));
        }
        else if(args[0].toLowerCase() === "--old"){
            old=1
            args = args.filter((_,index) => (index !== 0));
        }
        else if(args[0].toLowerCase() === "--local"){
            local=1
            args = args.filter((_,index) => (index !== 0));
        }
        else if(args[0].toLowerCase() === "--valgrind"){
            VALGRIND="$VALGRIND_OPTS"
            args = args.filter((_,index) => (index !== 0));
        }
        else if(args[0].toLowerCase() === "--disable-stdout-redirect"){
            DISABLE_STDOUT_REDIRECT=1
            args = args.filter((_,index) => (index !== 0));
        }
        else{
            //fix this to err instead of stdout
            // console.log(`WARN: Unknown option (ignored):${ args[0]}`)
            args = args.filter((_,index) => (index !== 0));
        }
}



if(Type !== "device"){
    edge = undefined;
    if(num){
        die("number of devices can't be speciied for fog/cloud")
    }
    if(edge){
        die( "number of edge connections can't be specified for fog/cloud")
    }

}

if(fs.existsSync(`./${file}`)){
    /**
     * replace by try catch
     */
    const jamfolder=`${HOME}/.jamruns`
    if(!fs.existsSync(jamfolder,{ recursive: true })){
        fs.mkdirSync(jamfolder)
    }
    /**
     * replace by try catch
     */
    //FileManager for all the scripts
    appfolder=`${jamfolder}/apps`;
    /**
     * replace by try catch
     */
    if(!fs.existsSync(appfolder,{ recursive: true })){
        fs.mkdirSync(appfolder)
    }
    /**
     * replace by try catch
     */
    const filenoext = path.basename(file, path.extname(file));
    const folder=`${appfolder}/${filenoext}_${app}`
    if(!fs.existsSync(folder,{ recursive: true })){

        fs.mkdirSync(folder)
    }
    //Be careful about changing the file directory
    const ifile = path.resolve(file);
    // console.log(ifile)
    //NOTE THIS CHANGE THE CWD BUT NOT PWD AND THIS NEEDS TO BE CONSIDERED THATS WHY FOLDER IS PASSED TO UNPACK
    process.chdir(folder);
    await unpack(ifile, folder)
    const height = await getheight(folder);
    const jdata = await getjdata(folder);
    let dport;
    if(fs.existsSync(`./jstart.js`)){
        let group;
        //soppused to overwrite?
        fs.writeFileSync(`${appfolder}/program`, `${filenoext}\n`)
        fs.writeFileSync(`${appfolder}/app`, `${app}\n`)
        let iport;
        switch(Type){
            
            case "cloud":
                iport=9883
                while(true){
                    await portavailable(folder ,iport)
                    if(porttaken !== 1){
                        break;
                    }
                    iport++;
                }
                if(jdata){
                    // console.log("data is true")
                    dport=iport + 20000;
                    await resolvedata(`127.0.0.1:${dport}`)
                }
                if(!fs.existsSync(`${folder}/${iport}`,{ recursive: true })){
                    fs.mkdirSync(`${folder}/${iport}`)
                }
                fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
                
                getappid(jamfolder, `${folder}/${iport}` ,app)
                await dojamout(iport, folder)
            
            case "fog":
                iport=5883
                while(true){
                    await portavailable(folder ,iport)
                    if(porttaken !== 1){
                        break;
                    }
                    iport++;
                }
                if(jdata){
                    // console.log("data is true")
                    dport=iport + 20000;
                    await resolvedata(`127.0.0.1:${dport}`)
                }
                if(!fs.existsSync(`${folder}/${iport}`,{ recursive: true })){
                    fs.mkdirSync(`${folder}/${iport}`)
                }
                fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
                
                getappid(jamfolder, `${folder}/${iport}` ,app)
                await dojamout(iport, folder)

            case "device":
                //SHAHIN: EVEN WHEN IT IS RUNNING I'M FACING NO AN JUST GET ANOTHER PORTISSUES
                iport=1883;
                while(true){
                    await portavailable(folder ,iport)
                    if(porttaken !== 1){
                        break;
                    }
                    iport++;
                    // console.log(iport , "this is my port")
                }
                // console.log(porttaken, "this is my port takken")

                if(!local){
                    //what is exactly happening here?
                    group= iport-1882
                    // console.log(group, "this is group")
                }
                else
                    group = 0;
                if(jdata){
                    // console.log("data is true")
                    dport=iport + 20000;
                    await resolvedata(`127.0.0.1:${dport}`)
                }
                //teird
                if(!fs.existsSync(`${folder}/${iport}`,{ recursive: true })){
                    fs.mkdirSync(`${folder}/${iport}`)
                }
                fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
                fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
                
                getappid(jamfolder, `${folder}/${iport}` ,app)
                // console.log("data before jamout", data)
                await dojamout_p1(iport,folder)
                setuptmux(`${folder}/${iport}`)
                await doaout(num,iport, group, dport,folder)
                // const p = await $`redis-cli -p ${iport} -c PING`.stdio('ignore', 'pipe', 'ignore').quiet()
                const p = await $`redis-cli -p ${dport} -c PING`
                const p2 = await $`redis-cli -p ${dport} CONFIG GET protected-mode`.quiet();
                console.log(p2.stdout.trim()) 
                console.log(p.stdout)
                // console.log("jsfile port is this : ", iport)
                await dojamout_p2(Type, iport, folder, group)

        }

    }
    else{
        die(`File: ${file} is not a valid JAMScript executable`)
    }


    

}
else{
    die( `File: ${file} not found`)
}