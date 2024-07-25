#!/usr/bin/env zx
import {jamrunParsArg , getCargs, getJargs} from './parser.mjs'
import { fileURLToPath } from 'url';
import { cleanByPortNumber } from './cleanUp.mjs';
import {fileDirectorySetUp, isValidExecutable, fileDirectoryMqtt, getPaths, getappid, getFolder , cleanExecutables, getJamFolder} from './fileDirectory.mjs'
const { spawn,spawnSync } = require('child_process');

/***\
 * ///MAIN SCRIPT AND MY SCRIPT HAS A DEFAULT VALUE WHICH IS 127.0.0.1:6379. WHy? shouldn't it be undefinced?
 * ///DOES NOT CONNECT TO THE MAIN CLOSEST ONE
 * QUESTION:
 * 1----> WHEN TO KILL MQTT? WHY and who and how to kill it? (don't use others mqtt)
 * 2----> logging system needs improvementm
 * 3----> same name can't connect to reddis(two instances of shahin12 running as device is going to be problamatic)
 * 5---->.jamruns/ports/port# : ls ->>>apps using port number
 * 6---->keep track of num of workers
 * 7---->log directory
 * 8---> don't like the idea of using other mqtt servers, what if the one that started them closes them?''''''''''''''av    
 * 9 ----> app             appid          program         tmuxid we do not need
 * 10 ---> do not use mqtt of another file
 * 11 ---> kill reddiss on cleaning
 * DONOT FORGET TO: discuss about the temp broker topic. with the new ports dir we don't necessarily need the temp_broker no more cuz that would not make the decison of when to remove and when not to.
 * NOTES
    TOCHANGE: 
              categtorize the log files.
              remove portDir on kill.

 
   
ADD PAUSE UNPAUSE
ADD GIT LOG


 */
//
//global variables
let app, tmux, num, edge, data, local_registry, bg, NOVERBOSE, log, old, local, valgrind, long, lat, Type, tags, file, resume;
const tmuxIds = [];
let removablePort

//SETUP CLEANING
process.on('SIGINT', () => {cleanByPortNumber(file,app,removablePort,NOVERBOSE); process.exit();});
process.on('SIGTERM', () =>  {cleanByPortNumber(file,app,removablePort,NOVERBOSE);  process.exit();});


//MOVE HOME TO CONST FILE
let mqttProcesse;
//SET REDIS PATH UP
const filePath = fileURLToPath(import.meta.url);
const IDIR = path.dirname(filePath);
const REDISFUNCS = fs.realpathSync(`${IDIR}/../deps/lua/jredlib.lua`);
const SHELLPID = process.pid;


//setup
//tested.working
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

//tested.working
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
                    [--log]
                    [--verb]
                    [--loc=long,lat]
                    [--edge=num_edge_connections]
                    [--valgrind]
                    [--local]
                    [--resume]
    
    The jamrun command creates a run state in the $HOME/.jamruns folder.
    `;

    
}

//teste.working.
async function startmqtt(port, cFile){

    try{ 
        await $`${MOSQUITTO_PUB} -p ${port} -t "test" -m "hello"`.quiet();

    }
    catch(error){
        
        if(!NOVERBOSE){
            console.log(`MQTT is not running at ${port}\nAttempting to start MQTT at ${port}`);
        }
        const command = MOSQUITTO;
        const args = ['-c', cFile];
        const options = {
            stdio: ['ignore', 'ignore', 'ignore'],
            detached: true,
        };
        mqttProcesse =  spawn(command, args, options);
        mqttProcesse.unref();
            
        return;
    }
}

async function dojamout(iport, folder,jappid) {
    await dojamout_p1 (iport ,folder)
    await dojamout_p2 (iport ,folder, jappid)
    
}

//tested.working
async function dojamout_p1(pnum ,floc) {
    await startmqtt(pnum , `${floc}/${pnum}/mqtt.conf`, data)
    if(data){
        fs.writeFileSync(`${floc}/${pnum}/dataStore`, `${data}\n`);
    }
    fs.writeFileSync(`${floc}/${pnum}/class`, "process\n");
    fs.writeFileSync(`${floc}/${pnum}/shellpid`,SHELLPID.toString()+"\n" );
    fs.writeFileSync(`${floc}/${pnum}/processId`, "new"+"\n");
    if(Type === "device"){
        fs.writeFileSync(`${floc}/${pnum}/numCnodes`, `${num}`); 
    }
}


async function dojamout_p2(iport, folder, jappid, group=null){
    if(!bg){
        await dojamout_p2_fg(iport, folder,jappid, group)
    }
    else
    {
        dojamout_p2_bg(iport, folder,jappid, group)
    }
}

//tested, working
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

    const child = spawn(command, args, options);
    child.on('exit', () => {
        process.kill(process.pid, 'SIGTERM');
    });
}


function dojamout_p2_bg(pnum, floc, jappid, group=null){
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

    const logFile = fs.openSync(`${floc}/${pnum}/log.j`, 'a');
    if(resume){
        fs.writeFileSync(`${floc}/${pnum}/log.j`,"############## RESUME ##############")
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

    if(!NOVERBOSE){
        console.log("Started the J node in background")
    }
    process.exit(0)
}

//linux test left, rest working
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
                "-o": datap,
            }
            let cargs = getCargs(argObject)
            await $`${TMUX} new-session -s ${tmux}-${counter} -c ${myf} -d`;
            if (!log){

                    if(valgrind)
                            await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} C-m`;
                        
                    else
                            await $`${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} C-m`;
                    
                }
        
            else{
       
                    //check if it works on linux or nor
                    if(valgrind)
                        await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} -f log C-m`;
                    else
                        await $`${TMUX} send-keys -t ${tmux}-${counter} "script -a -t 1 ${myf}/${port}/log.${counter} ./a.out" ${cargs} C-m`;
    
                }
            }
            tmuxIds.push(`${tmux}-${counter}`)
            counter++;

    }

    if(!NOVERBOSE)
        console.log("Started a C node")
    }


//tested. working
async function portavailable(folder,port) {
    let pid;
    let porttaken;
    const jamFolder = getJamFolder()
    if(fs.existsSync(`${folder}/${port}`)){

        if(fs.existsSync(`${folder}/${port}/processId`)){
    
            try{
                pid = Number(fs.readFileSync(`${folder}/${port}/processId`).toString().trim())
            }
            catch(error){
                pid = null;
            }

            if(pid === "new"){
               
                porttaken=1;
            }
            else if(pid){

                const p = await $`ps -o pid= -p ${pid} | wc -l | tr -d '[:space:]'`.nothrow()
                porttaken = Number(p.stdout.toString().trim())
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
        if(!fs.existsSync(`${jamFolder}/ports`)){
            const p = await $`netstat -lan -p tcp -f inet | grep ${port} | wc -l`.nothrow().quiet()
            porttaken = Number(p.stdout.trim()) === 0 ? 0 : 1;
        }
    }
    return porttaken;
}

//tested and working
function setuptmux(path, appfolder) {
    fs.writeFileSync(`${path}/tmuxid`,tmux.toString()+"\n");
    fs.writeFileSync(`${appfolder}/tmuxid`,tmux.toString()+"\n");

}


//patially tested, hopefullt works
async function startredis(port) {
    try{
        const p =$`redis-server --port ${port}`.stdio('ignore', 'ignore', 'inherit').nothrow().quiet();
    }
    catch(error){
        console.log(error)
    }
 
}

//tested, works
async function waitforredis(port){
    while (true) {
        try{

            const p = await $`redis-cli -p ${port} -c PING`.quiet()


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

//tested, works
async function setupredis(port) {

    
    await $`cat ${REDISFUNCS} | redis-cli -p ${port} -x FUNCTION LOAD REPLACE > /dev/null`
    await $`echo "set protected-mode no" | redis-cli -p ${port} > /dev/null`
    await $`echo 'config set save "" protected-mode no' | redis-cli -p ${port} > /dev/null`
    if(!resume){
        await $`redis-cli -p ${port} FLUSHALL`;
    }

}

//tested, works
async function resolvedata(Name) {
    const [host, port] = Name.split(':');

    await startredis(Number(port));
    await waitforredis(port);

    await setupredis(port);

    //trim space left behind by hostname -I
    data = Name.split(/\s+/).join('');


}
//tested working
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
            let forceRedo = false;
            try{
                isValidExecutable()
            }
            catch(error){
                forceRedo = true;
            }
            if(!forceRedo){
                const p1  = await $`cd ${folder} && zipgrep CREATE ${file} | awk 'NR==1{split($0,a, " "); print a[3]}'`;
                const p2 = await $`cd ${folder} && grep CREATE MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`;
                const ntime = Number(p1.stdout.toString().trim());
                const ontime = Number(p2.stdout.toString().trim());
                if(ntime > ontime){
                    try{
                        console.log("outdated, unzippping again")
                        await $`cd ${folder} && unzip -oq ${file}`.quiet()
                    }
                    catch(error){

                        throw new Error(`Problem reading file: ${file}\n${error}`)

                    } 
                }
            }
            else{
                if(!NOVERBOSE)
                    console.log("The corrupted unziped files. files will be unziped again based on the existing MANIFEST.txt")
                await cleanExecutables()
                await $`cd ${folder} && unzip -oq ${file}`.quiet()


            }


            

        }
    }
    else{
        if(!NOVERBOSE){
            console.log("WARNING: Unziped files might be outdated")
        }
        isValidExecutable()
    }
}
//tested.working
async function getjdata(folder) {

    const p = await $`cd ${folder} && grep JDATA MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`.nothrow().quiet()
    return p.stdout.trim()
    

}

async function runNoneDevice(iport){
    const [jamfolder,appfolder,folder] = getPaths(file,app)
    fileDirectoryMqtt(folder,iport,jamfolder,app)
    const jappid = getappid(jamfolder, `${folder}/${iport}`,app,appfolder)
    await dojamout(iport, folder, jappid)
}

async function runDevice(iport,dport,group){
    const [jamfolder,appfolder,folder] = getPaths(file,app)
    fileDirectoryMqtt(folder,iport,jamfolder,app)
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
            bg,
            NOVERBOSE,
            log,
            old,
            local,
            valgrind,
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
    const ifile = path.resolve(file);
    process.chdir(folder);
    await unpack(ifile, folder)
    isValidExecutable()
    const jdata = await getjdata(folder);
    let isDevice;
    switch(Type){
        case "cloud":
            iport=9883
            isDevice = false;
            while(true){
                const porttaken = Number(await portavailable(folder ,iport))
                if(porttaken !== 1){
                    break;
                }
                iport++;
            }
            removablePort = iport;
            break;
            
        case "fog":
            iport=5883
            isDevice = false
            while(true){
                const porttaken = Number(await portavailable(folder ,iport))
                if(porttaken !== 1){
                    break;
                }
                iport++;
            }
            removablePort = iport;
            break;

        case "device":
            iport=1883;
            isDevice = true;
            while(true){
                const porttaken = Number(await portavailable(folder ,iport))
                if(porttaken !== 1){
                    break;
                }
                iport++;
            }
            removablePort = iport;
            if(!local){
                group= iport-1882
            }
            else
                group = 0; 
    }


    if(jdata.toLowerCase() === "true"){
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
await $`zx jamclean.mjs`
await main()

