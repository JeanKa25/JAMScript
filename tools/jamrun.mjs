#!/usr/bin/env zx
import {jamrunParsArg , getCargs, getJargs} from './parser.mjs'
import { fileURLToPath } from 'url';
import {fileDirectorySetUp, isValidExecutable, fileDirectoryMqtt, getPaths, getappid, getFolder} from './fileDirectory.mjs'
import { inherits } from 'util';
const { spawn,spawnSync } = require('child_process');

/***
 * NOTES
 * num Error(HAVE IN MIND)
 * handle log seperation in close();
 * new command:
 
 * add a new command as an indication of the continuity of jamrun app and if it's false clean the redis
    3) REDIS THROWS unexpected ERROR IN SOME CASES FOR SOME REASON
    4) CHECK THE NUM ISSUE. WE DON"T SEE THAT CLEARLY in the jamrun
    6)add arg to check if the app is 
    5)add the tag
    6)running shahin with 3 tmux then inxreas it to 4 and then decirese it to 2
    7)tmux is not being cleaned up
 
 * 1) PORT IMPLEMENTATIONS SEEMS NOT TO BE WORKING -> PORT ID IS NOT BNEONG incremented as expected(TO BE INVESTIGATED)


QUESTION:
writing to dflow... [ 0, 4, 8, 10, 14 ]
await $`redis-cli -p ${port} FLUSHALL`;the count the count is  17 message-to-c-local-node
the count the count is  18 message-to-c-local-node
---------------- message-to-j [ 0, 4, 8, 10, 14, 16 ]
---------------- message-to-j [ 0, 4, 8, 10, 14, 16 ]
in resume writing to dflow changes and restarts but 
---------------- message-to-j [ 0, 4, 8, 10, 14, 16 ]
---------------- message-to-j [ 0, 4, 8, 10, 14, 16 ]
stays the same
 *
Question: HOW IS THIS EXPECTED TO WOR? await $`./a.out ${cargs}`.stdio("pipe","pipe","pipe") bg/fg/pipe/nonePipe? what is the logic, having hard time to comprehend

] J arg does not clearup

running the same bg task

 */
//
//global variables
let app, tmux, num, edge, data, local_registry, temp_broker, bg, NOVERBOSE, log, old, local, valgrind, disable_stdout_redirect, long, lat, Type, tags, file, resume;


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
console.log(REDISFUNCS)
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
    
    Use --resume to avoid reseting the reddis and resume the ongoing task

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
                    [--resume]
    
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
    console.log("P1 is over")
    await dojamout_p2 (iport ,folder, jappid)
    console.log("P2 is over")

}

async function dojamout_p1(pnum ,floc) {


    
    await startmqtt(pnum , `${floc}/${pnum}/mqtt.conf`, data)


    fs.writeFileSync(`${floc}/${pnum}/dataStore`, `${data}\n`);
    fs.writeFileSync(`${floc}/${pnum}/class`, "process\n");
    fs.writeFileSync(`${floc}/${pnum}/shellpid`,SHELLPID.toString()+"\n" );
    fs.writeFileSync(`${floc}/${pnum}/{processId}`, "new"+"\n");
}


async function dojamout_p2(iport, folder, jappid, group=null){
    if(!bg){
        console.log("running on fg")
        await dojamout_p2_fg(iport, folder,jappid, group)
    }
    else
    {
        console.log("running on bg")
        dojamout_p2_bg(iport, folder,jappid, group)
    }
}

async function cleanup(){
    if(bg){
        process.exit(0);
    }
    else{
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
        process.exit(0)
    }

}

async function dojamout_p2_fg(pnum, floc,jappid, group=null){
    let argObject = {
        "--app":jappid,
        "--port":pnum,
        "--group":group,
        "--data":data,
        "--tags":tags,
        "--edge":edge,
        "--long":long,
        "--lat":lat,
        "--localregistryhost":local_registry,
        "--type": Type
    }

    let jargs = getJargs(argObject)

    const command = 'node';
    const args = ['jstart.js', ...jargs];
    const options = {
        cwd: floc,
        stdio: 'inherit'
    };
    if(resume){
        console.log("############## RESUME ##############")
    }

    spawnSync(command, args, options);
    console.log("gettinf to the cleanUp")
    await cleanup()
}

function dojamout_p2_bg(pnum, floc, jappid, group=null){
    console.log("THE EXECUTION IS ON THE BG")
    let argObject = {
        "--app":jappid,
        "--port":pnum,
        "--group":group,
        "--data":data,
        "--tags":tags,
        "--edge":edge,
        "--long":long,
        "--lat":lat,
        "--localregistryhost":local_registry,
        "--type": Type
    }
    let jargs = getJargs(argObject)

    console.log(floc)
    const logFile = fs.openSync(`${floc}/log.j`, 'a');
    if(resume){
        fs.writeFileSync(`${floc}/log.j`,"############## RESUME ##############")
    }
 
    const command = 'node';
    const args = ['jstart.js', ...jargs];
    const options = {
      cwd: floc,
      stdio: ['ignore', logFile, logFile],
      detached: true,
    };

    const p =  spawn(command, args, options);
    p.unref();

    childs.push(p);

    

    if(!NOVERBOSE){
        console.log("Started the J node in background")
    }
    process.exit(0)
}

async function doaout(num,port,group,datap,myf,jappid){
    let counter=1
    
    if (fs.existsSync('a.out')) {
        await $`cd ${myf} && chmod +x a.out`
    }
    while(counter <= num){
        
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

            console.log(cargs, "this is my carg pre")
            await $`${TMUX} new-session -s ${tmux}-${counter} -c ${myf} -d`;


            if(!disable_stdout_redirect){

                if (!log)
                    {

                        if(valgrind)
                                await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} C-m`;
                            
                        else
                                await $`${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} C-m`;
                        
                    }
            
                else{
                    if(Machine === "Linux"){
                        //TO BE FIXE
                        if(valgrind)
                            await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} -f log C-m`;
                        else
                            await $`${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} -f log C-m`;
                    }
                    
                    else{
                        //TO BE FIXE
                        await $`${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} -f log C-m`;
                    }
                }
            }
            else{
                //for some reson that I'm strugling to figure out this does not work(TO BE FIXE)
                const command = './a.out';

                const args = cargs.split('-').filter(entry => entry !== " ").map((entry => "-"+entry.trim()));
                console.log(args)
                console.log(myf)
                const options = {
                  cwd: myf,
                  stdio: ['ignore', 'ignore', 'ignore'],
                  detached: true,
                };
                const p1 = spawn(command,args,options);
                p1.unref()
                await sleep(200)


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


    
    $`redis-server --port ${port}`.stdio('ignore', 'ignore', 'inherit').quiet().nothrow()


 
}

async function waitforredis(port){
    while (true) {
        console.log("this is the port we have", port)
        try{

            const p = await $`redis-cli -p ${port} -c PING`
            console.log(p.stdout)

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
    if(!resume){
        await $`redis-cli -p ${port} FLUSHALL`;
    }

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

async function getjdata(folder) {

    const p = await $`cd ${folder} && grep JDATA MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`.nothrow().quiet()
    return p.stdout.trim()
}

async function runNoneDevice(iport){
    const [jamfolder,appfolder,folder] = getPaths(file,app)
    fileDirectoryMqtt(folder,iport)
    const jappid = getappid(jamfolder, `${folder}/${iport}`,app,appfolder)
    console.log("doing dojamout")
    await dojamout(iport, folder, jappid)
}

async function runDevice(iport,dport,group){
    const [jamfolder,appfolder,folder] = getPaths(file,app)

    fileDirectoryMqtt(folder,iport)
    const jappid = getappid(jamfolder, `${folder}/${iport}` ,app,appfolder)
    await dojamout_p1(iport,folder)
    setuptmux(`${folder}/${iport}`, appfolder)
    await doaout(num,iport, group, dport,folder,jappid)
    await dojamout_p2(iport, folder,jappid,group )
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
            tags,
            file,
            resume,
        } = jamrunParsArg(process.argv))

    }
    
   
    catch(error){
        if(error.type === "ShowUsage"){
            show_usage()
            process.exit(1)
        }
        else{
            show_usage()
            process.exit(1)
        }
    }

    fileDirectorySetUp(file,app)
    const folder = getFolder(file,app)
    console.log(num)
    const ifile = path.resolve(file);
    process.chdir(folder);
    await unpack(ifile, folder)
    isValidExecutable()
    const jdata = await getjdata(folder);
    let isDevice;
    switch(Type){
        case "cloud":
            console.log("got in cloud")
            iport=9883
            isDevice = false;
            break;
            
        case "fog":
            console.log("got in fog")
            iport=5883
            isDevice = false
            break;

        case "device":
            console.log("got in device")

            iport=1883;
            isDevice = true;
            if(!local){
                group= iport-1882
            }
            else
                group = 0; 
    }
    console.log(isDevice, ": if true it is a device")
    while(true){
        const porttaken = await portavailable(folder ,iport)
        if(porttaken !== 1){
            break;
        }
        iport++;
    }
    if(jdata){
        dport=iport + 20000;
        await resolvedata(`127.0.0.1:${dport}`)

    }
    
    if(!fs.existsSync(`${folder}/${iport}`,{ recursive: true })){
        fs.mkdirSync(`${folder}/${iport}`)
    }
    console.log("this is my port", iport)
    if(isDevice)
        {
        console.log("is here running device")
        await runDevice(iport,dport,group)
        
        }
    else
        {
            console.log("is here running noneDevice")
            await runNoneDevice(iport)
        }    

}


await main()

