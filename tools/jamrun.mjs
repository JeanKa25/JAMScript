#!/usr/bin/env zx
import {jamrunParsArg , getCargs, getJargs} from './parser.mjs'
import { fileURLToPath } from 'url';
import {fileDirectorySetUp, isValidExecutable, fileDirectoryMqtt, getPaths, getappid, getFolder} from './fileDirectory.mjs'
const { spawn,spawnSync } = require('child_process');

/***
 * NOTES
 * 1) PORT IMPLEMENTATIONS SEEMS NOT TO BE WORKING -> PORT ID IS NOT BNEONG incremented as expected(TO BE INVESTIGATED)
 * 2)SHOULDE FILE DIRECTORY BE A CLASS
 * 2)GLOBAL VARIABLE SITUATION
 * 2) ABSTRACT ALL THE WRITES AWAY
 * 3)  the SIGKILL is being trapped at all
 * 4) iFlow , oflow NOT BEING SET, I ADDED THEM. MAKE SURE IT'S NEEDED AND IT'S STRING
 * 5) TODO: MAKE SURE ALL THE DIRECTORIES WE USE EXIST
 * 6) TAKE CARE OF THE RELATIVE PATHS
 * 7) abstract waiting for mqtt and redis
 * 8) CLEAR FILES ONCLOSE(EX: LOG FILE)
 * 9)if [ -e jstart.js ]; then Search this up in the js file. this does not make sence to me. it should check if the jxe has the jStart or not
 * 10) why aren't we checking the content of the jxe file?
 * 11) verify this error is true
 * 12) we set edge equal undefined the check if it is defined or not. makes no sense (Type !== "device")(those checks are simply not working)
 * 13) discuss what fields should be undefinecd and what fields should not be undefined
 * 14) error check for cArg ad jArg?
 * 15) a.out 
 * 17) abstracting the wait
 * 16) directly throw error insted of die function
 * 17) if device no tg
 * 19) WHY DOES VALGRID NOT USED?
 * 17) file directory manager
 *  --valgrind in jamScript
 * height is not used\
 * Is it ok if you kill all the tmux servers?
 * 16) ---------------- message-to-j [
   0,  4,  6, 10, 12, 16,
  18, 22, 26, 28, 32, 34,
  38, 40, 44
] J arg does not clearup

 */
//
//global variables
let app, tmux, num, edge, data, local_registry, temp_broker, bg, NOVERBOSE, log, old, local, valgrind, disable_stdout_redirect, long, lat, Type, iflow, oflow, tags, file;


//SETUP CLEANING
process.on('SIGINT', async () =>  await cleanup());
process.on('SIGTERM', async () => await cleanup());

//MOVE HOME TO CONST FILE
const childs =[]
let mqttPromiseProcesses;
//SET REDIS PATH UP
const filePath = fileURLToPath(import.meta.url);
const IDIR = path.dirname(filePath);
const REDISFUNCS = fs.realpathSync(`${IDIR}/../deps/lua/jredlib.lua`);
const SHELLPID = process.pid;


//setup
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
                        throw new Error("tmux not installed. Quitting.")
                    case "mosquitto_pub":
                        throw new Error("mosquitto_pub (MQTT tools) not installed. Quitting.")
                    case "mosquitto":
                        throw new Error("mosquitto (MQTT broker) not installed. Quitting.")
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


async function startmqtt(port, cFile){
    try{
        await $`${MOSQUITTO_PUB} -p ${port} -t "test" -m "hello"`.quiet();
    }
    catch(error){
        if(!NOVERBOSE)
            console.log(`MQTT is not running at ${port}\nAttempting to start MQTT at ${port}`);
        mqttPromiseProcesses = $`${MOSQUITTO} -c ${cFile}`.stdio('ignore', 'pipe', 'pipe').quiet().nothrow();
        
        return;
    }
}

async function dojamout(iport, folder,jappid) {
    await dojamout_p1 (iport ,folder)
    await dojamout_p2 (iport ,folder, jappid)
}

async function dojamout_p1(pnum ,floc) {
    
    await startmqtt(pnum , `${floc}/${pnum}/mqtt.conf`, data)
    fs.writeFileSync(`${floc}/${pnum}/dataStore`, `${data}\n`);
    fs.writeFileSync(`${floc}/${pnum}/class`, "process\n");
    fs.writeFileSync(`${floc}/${pnum}/shellpid`,SHELLPID.toString()+"\n" );
    fs.writeFileSync(`${floc}/${pnum}/processId`, "new"+"\n");
}


async function dojamout_p2(type, iport, folder, jappid, group=null){
    if(!bg)

        await dojamout_p2_fg(type, iport, folder,jappid, group)
    else

        dojamout_p2_bg(type, iport, folder,jappid, group)
}

async function cleanup(){
    
    await killtmux()

    if(temp_broker === 1){
        console.log(`Killing broker with PID: ${mqttPromiseProcesses}`)
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

    process.exit(1)
}

async function dojamout_p2_fg(type, pnum, floc,jappid, group=null){

    let argObject = {
        "--app":jappid,
        "--port":pnum,
        "--group":group,
        "--data":data,
        "--tags":tags,
        "--iflow":iflow,
        "--oflow":oflow,
        "--edge":edge,
        "--long":long,
        "--lat":lat,
        "--localregistryhost":local_registry,
        "--type": type
    }

    let jargs = getJargs(argObject)

    const command = 'node';
    const args = ['jstart.js', ...jargs];
    const options = {
        cwd: floc,
        stdio: 'inherit'
    };
    spawnSync(command, args, options);
    
    await cleanup()
}
function dojamout_p2_bg(type, pnum, floc, jappid, group=null){
    
    let argObject = {
        "--app":jappid,
        "--port":pnum,
        "--group":group,
        "--data":data,
        "--tags":tags,
        "--iflow":iflow,
        "--oflow":oflow,
        "--edge":edge,
        "--long":long,
        "--lat":lat,
        "--localregistryhost":local_registry,
        "--type": type
    }
    let jargs = getJargs(argObject)

    
    const command = 'node';
    const args = ['jstart.js', ...jargs];
    const options = {
      cwd: floc,
      stdio: ['ignore', 'pipe', 'pipe']
    };

    const p = spawn(command, args, options);
    childs.push(p);
    //QUESTION: overwrite if it already exists 
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

async function doaout(num,port,group,datap,myf,jappid){
    let counter=1
    //TODO: make sure it is checking the folder
    if (fs.existsSync('a.out')) {
        await $`chmod +x a.out`
    }
    while(counter <= num){
        //
        if(fs.existsSync('a.out')){

            const argObject = 
            {
                "-a": jappid.toString(),
                "-p": port,
                "-n": counter,
                "-g": group,
                "-t": tags,
                "-o": datap

            }
            let cargs = getCargs(argObject)
            await $`${TMUX} new-session -s ${tmux}-${counter} -d`;
            if(!disable_stdout_redirect){
                if (!log)

                    {

                        if(valgrind)
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} C-m`;
                        else
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} C-m`;
                    }
            
                else{
                    if(Machine === "Linux"){
                        //TO BE FIXE
                        
                        if(valgrind)
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} -f log C-m`;
                        else
                            await $`cd ${myf} && ${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} -f log C-m`;
                        // let p = await $`${TMUX} new-session -s ${tmux}-${counter} -d  script -a -c "${valgrind} ./a.out ${cargs}" -f log`.stdio("pipe","pipe","pipe")

                    }
                    
                    else{
                        //TO BE FIXE
                        //none linix machines does not have this?
                        // let p = await $`${TMUX} new-session -s ${tmux}-${counter} -d  "script -a -t 1 log ./a.out ${cargs}"`.stdio("pipe","pipe","pipe")
                        await $`cd ${myf} && ${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} -f log C-m`;
                    }
                }
            }
            else{
                //check if this works. if it does. Investigate what is going on with j file
                let p = await $`./a.out ${cargs}`.stdio("pipe","pipe","pipe")

            }
    }
    counter++;
    if(!NOVERBOSE)
    console.log("Started a C node")
    }
}


async function portavailable(folder,port) {
    let pid;
    let porttaken;
    if(fs.existsSync(`./${folder}/${port}`)){
        if(fs.existsSync(`${folder}/${port}/processId`)){
            try{
                pid = fs.readFileSync(`${folder}/${port}/processId`)
            }
            catch(error){
                pid = null;
            }

            if(pid === "new"){
                porttaken=1;
            }
            else if(pid){
                porttaken= await $`ps -o pid= -p $pid | wc -l | tr -d '[:space:]'`
            }
            else{
                porttaken=0;
            }
        }
        else{
            porttaken=0;
        }
    }
    else{
        porttaken=0;
    }
    if(porttaken === 0){
        const p = await $`netstat -an -p tcp 2>/dev/null | grep ${port} | wc -l`.nothrow().quiet()
        porttaken= p.stdout.trim()
    }
    return porttaken;
}

function setuptmux(path, appfolder) {

   
    //TODO: ABSTRACT THE TMUX SETUP.
    fs.writeFileSync(`${path}/tmuxid`,tmux.toString()+"\n");
    fs.writeFileSync(`${appfolder}/tmuxid`,tmux.toString()+"\n");

}


//MAYBE USED LATER
async function killtmux(){
    await $`pkill tmux`.stdio('ignore', 'ignore', 'ignore').quiet().nothrow();
}


function startredis(port) {

    //QUESTION: should it throw an error if it does not work? now are the input/output/err is ignored.(DIVE DEEPER IN THIS)
    $`redis-server  --port ${port}`.stdio('ignore', 'ignore', 'inherit').quiet().nothrow();

}

async function waitforredis(port){
    while (true) {
        console.log("this is the port we have", port)
        try{
            const p = await $`redis-cli -p ${port} -c PING`
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

async function setupredis(port) {

    await $`cat ${REDISFUNCS} | redis-cli -p ${port} -x FUNCTION LOAD REPLACE > /dev/null`
    await $`echo "set protected-mode no" | redis-cli -p ${port} > /dev/null`
    await $`echo 'config set save "" protected-mode no' | redis-cli -p ${port} > /dev/null`

}

async function resolvedata(Name) {
    const [host, port] = Name.split(':');
    startredis(Number(port));
    await waitforredis(port);
    await setupredis(port);
    
    if(host === "docker"){
        const ipaddr= `hostname -I`
        Name = `${ipaddr}:${port}`
    }
    
    //trim space left behind by hostname -I
    data = Name.split(/\s+/).join('');
}

async function unpack(file,folder){

    
    if(!old){

        if(!fs.existsSync("./MANIFEST.txt")){
            try{
                await $`cd ${folder} && unzip -o ${file}`.quiet()
            }
            catch(error){
                throw new Error(`Problem reading file: ${file}\n${error}`)
            } 
                       
        }
        else{
            const p1  = await $`cd ${folder} && zipgrep CREATE ${file} | awk 'NR==1{split($0,a, " "); print a[3]}'`;
            const p2 = await $`cd ${folder} && grep CREATE MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`;
            const ntime = p1.stdout.trim();
            const ontime = p2.stdout.trim();
            if(ntime > ontime){
                try{
                    await $`cd ${folder} && unzip -oq ${file}`.quiet()
                }
                catch(error){

                    throw new Error(`Problem reading file: ${file}\n${error}`)

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

async function runNoneDevice(iport){
    const [jamfolder,appfolder,folder] = getPaths(file,app)
    fileDirectoryMqtt(folder,iport)
    const jappid = getappid(jamfolder, `${folder}/${iport}`,app,appfolder)
    await dojamout(iport, folder, jappid)
}

async function runDevice(iport,dport,group){
    const [jamfolder,appfolder,folder] = getPaths(file,app)
    fileDirectoryMqtt(folder,iport)
    const jappid = getappid(jamfolder, `${folder}/${iport}` ,app,appfolder)
    await dojamout_p1(iport,folder)
    setuptmux(`${folder}/${iport}`, appfolder)
    await doaout(num,iport, group, dport,folder,jappid)
    await dojamout_p2(Type, iport, folder,jappid,group )
}


async function main(){
    let iport;
    let dport;
    let group;
    try{    
        ({
            app,
            tmux,
            num,
            edge,
            data,
            local_registry,
            temp_broker,
            bg,
            NOVERBOSE,
            log,
            old,
            local,
            valgrind,
            disable_stdout_redirect,
            long,
            lat,
            Type,
            iflow,
            oflow,
            tags,
            file
        } = jamrunParsArg(process.argv))
    }
    catch(error){
        if(error.type === "UsageError"){
            show_usage()
            process.exit(1)
        }
        else{
            throw new Error(error.message)
        }
    }
    fileDirectorySetUp(file,app)
    const folder = getFolder(file,app)

    const ifile = path.resolve(file);
    process.chdir(folder);
    await unpack(ifile, folder)
    isValidExecutable()
    //Question: height is not used
    const height = await getheight(folder);
    const jdata = await getjdata(folder);
    let isDevice;

    switch(Type){
        case "cloud":
            iport=9883
            isDevice = false;

        case "fog":
            iport=5883
            isDevice = false

        case "device":
            iport=1883;
            isDevice = true;
            if(!local){
                group= iport-1882
            }
            else
                group = 0; 
    }

    while(true){
        const porttaken = await portavailable(folder ,iport)
        if(porttaken !== 1){
            break;
        }
        iport++;
    }
    //QUESTION: what if jdata is wrong?
    if(jdata){
        dport=iport + 20000;
        await resolvedata(`127.0.0.1:${dport}`)
    }
    if(!fs.existsSync(`${folder}/${iport}`,{ recursive: true })){
        fs.mkdirSync(`${folder}/${iport}`)
    }
    if(isDevice)
        await runDevice(iport,dport,group)
    else
        await runNoneDevice(iport)
}


await main()

