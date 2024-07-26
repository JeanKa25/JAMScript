#!/usr/bin/env zx
import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
const { spawnSync } = require('child_process');
import { cleanByPortNumber } from "./cleanUp.mjs";
////////////////// //////// /////// //////// ////// ////// ///
/////////////what should we do when we see new? linger there? wait/force. what to do exactly?. it is for broken apps.MAKE THE JT@ FILES BREAK.
///////Shopuld we check of reddis is running or not like we do for mqtt, JFile, Cfiles


/**
 * //use later(ABSTRACT AWAAY)
 *  //WE SHOULD KEEP JAMRUN ALIVE UNTIL THE VALUE ASSIGNED TO THE PROCESSID
 *  while(true){
        if(!fs.existsSync(`${processId}`)){
            return false;
        }
        const pid = fs.readFileSync(`${processId}`).toString().trim();
        if(pid === "new"){
            if(!flag){
                flag = true;
                await sleep(500);
                continue;
            }
        }
        break;
    
    }
 * 
 * 
 */
////////////////// //////// /////// //////// ////// ////// ///


// async function getJobsSubDirMap(){
//     const subDirMap = new Map()
//     const subdirs = (((await fs.readdir(process.cwd())).map(entry => entry.split("_"))).filter(entry => entry.length > 1))
//     for(let dir of subdirs){
//         if(dir.length > 2){

//             const head = dir[0]
//             const tail =(dir.filter((_,index) => index !== 0)).join("_")
//             const dirName = dir.join("_")



//             subDirMap.set(tail, dirName)

//         }
//         else{
//             const head = dir[0]
//             const tail = dir[1];
//             const dirName = dir.join("_")
//             subDirMap.set(tail, dirName)
//         }
//     }
//     return subDirMap;
// }
// async function getPortSubDir(){
//     const ports = (((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name))
//     if(ports.length !== 0){
//         return ports
//     }
// }

// export async function cleanUp(){
//     try{
//         getcleanArgs(process.argv)
       
//       }
//       catch(error){
//         if(error.type === "ShowUsage"){
//             console.log(
//         `

//         Usage: jamclean
//         Purges inactive JAMScript programs from the listing.

//         `
//             )
//         }
//         process.exit(1);
//     }
//     const jamfolder = getJamFolder();
//     if(!fs.existsSync(jamfolder)){
//         process.exit(0)
//     }
//     process.chdir(`${jamfolder}/apps`);
//     const appsMap = await getJobsSubDirMap();
//     for(let app of appsMap.keys()){
       
//         process.chdir(`${appsMap.get(app)}`);
//         console.log(process.cwd(), "this is my app dir")
//         const ports  = await getPortSubDir();
//         console.log(process.cwd(), "this is my portDir dir")
//         if(ports){
//             console.log(process.cwd(), "this is my portDir dir")
//             for(let port of ports){
//                 console.log(process.cwd(), "this is my portDir dir")
//                 let isRunning
//                 console.log(port, "this is my port")
//                 console.log(process.cwd(), "this is my portDir dir")
//                 process.chdir(`${port}`);
//                 const toCheck = (fs.existsSync("processId")) ? fs.readFileSync("processId") : fs.readFileSync("shellpid")
//                 try{
//                     const p = await $`ps -p ${toCheck} | grep node | wc -l | tr -d '[:space:]'` 
//                     isRunning = true
//                 }
//                 catch(error){
//                     isRunning = false;
//                 }
//                 process.chdir("..")
//                 if(!isRunning){
//                     await $`rm -rf ./${port}`
//                 }
//             }
//         }
//         process.chdir("..")
//     }
// }

//////////////////////////////////////////////////////////////////////////
const p = spawnSync('which', ['mosquitto_pub']);
const MOSQUITTO_PUB = p.stdout.toString().trim()

function getRunningDirs(){
    const appFolder = getAppFolder()
    const appToPort = new Map()
    const activePorts = fs.readdirSync(`${appFolder}`)
    for(let port of activePorts){
        const apps = fs.readFileSync(`${appFolder}/${port}`).toString().trim().split("\n");
        for(let app of apps){
            if(appToPort.has(app)){
                const portList = appToPort.get(app);
                portList.push(port)
                appToPort.set(app,portList)
            }
            else{
                appToPort.set(app,[port])
            }
        }
    }
    return appToPort;
}

function dirNameToAppName(dirName){
    const dir = dirName.split('_')
    if(dir.length > 2){
        return (dir.filter((_,index) => index !== 0)).join("_")
    }
    else{
        return dir[1];
    }
    
}
function dirNameToProgramName(dirName){
    return (dirName.split('_'))[0]
}


async function isJamrunRunning(dir,portNum){
    const appFolder = getAppFolder()
    const myAppDir = dir;
    //should be string.
    const myAppPortNum = portNum;
    const shellPIDpath = `${appFolder}/${myAppDir}/${myAppPortNum}/shellpid`
    
    if(!fs.existsSync(`${shellPIDpath}`)){
        return false;
    }
    const pid = fs.readFileSync(`${shellPIDpath}`).toString().trim();
    let running;
    try{
        const p = await $`ps -p ${pid} | grep jamrun | wc -l | tr -d '[:space:]'`
        running = Number(p.stdout.toString().trim())
    }
    catch(error){
        return false
    }
    if(!running){
        return false
    } 
    return pid;
}
 
async function isJfileRunning(dir,portNum){
    const appFolder = getAppFolder()
    const myAppDir = dir;
    const myAppPortNum = portNum;
    const processId = `${appFolder}/${myAppDir}/${myAppPortNum}/processId`

    //make sure j file is getting the time to write to filedirectory
   
    if(!fs.existsSync(`${processId}`)){
        return false;
    }
    const pid = fs.readFileSync(`${processId}`).toString().trim();

    
    let running;
    try{
        const p = await $`ps -p ${pid} | grep node | wc -l | tr -d '[:space:]'`
        running = Number(p.stdout.toString().trim());
    }
    catch(error){
        return false;
    }
    if(!running){
        return false;
    }
    return pid;
}


async function isMosquittoRunning(port){
    try{
        await $`${MOSQUITTO_PUB} -p ${port} -t "test" -m "hello"`.quiet();
        return true;
    }
    catch(error){
        return false;
    }
}

async function isCfileRunning(Dir,port,num){
    const myAppDir = Dir;
    const portNum = port;
    const workerNum = num;
    const appFolder = getAppFolder()
    const cdevID = `${appFolder}/${myAppDir}/${portNum}/cdevProcessId.${workerNum}`

    if(!fs.existsSync(`${cdevID}`)){
        return false;
    }
    const pid = fs.readFileSync(`${cdevID}`).toString().trim();
    let running;
    try{
        const p = await $`ps -p ${pid} | grep ./a.out |  wc -l | tr -d '[:space:]'`
        running = Number(p.stdout.toString().trim());
    }
    catch(error){
        return false;
    }
    if(!running){
        return false;
    }
    return pid;
}
async function isDevice(Dir,port){
    const appFolder = getAppFolder();
    const appDir = Dir;
    const portNum = port;
    const machType = `${appFolder}/${appDir}/${portNum}/machType`
    if(!fs.existsSync(`${machType}`)){
        return false;
    }
    const type = fs.readFileSync(`${machType}`).toString().trim()
    if(type === "device"){
        return true
    }
    return false;
}

async function getRunningCfiles(Dir,port){
    const appFolder = getAppFolder();
    const appDir = Dir;
    const portNum = port;
    const runningCfiles = []
    const portDir = `${appFolder}/${appDir}/${portNum}`
    if(!fs.existsSync(portDir)){
        return;
    }
    const cfilesNum = ((fs.readdirSync(portDir)).filter((entry) => entry.includes("cdevProcessId"))).map((entry) => entry.split(".")[1])
    for(let cfileNum of cfilesNum){
       if(await isCfileRunning(appDir,portNum,cfileNum)){
            runningCfiles.push(`${cfileNum}`)
       }
    }
    return runningCfiles;
}

function cleanCfiles(portDir, currCfile){
    const oldCdevs = (fs.readdirSync(portDir)).filter((entry) => entry.includes("cdev"))
    if( (oldCdevs.length)*2 === currCfile.length){
        return;
    }
    for(let oldCdev of oldCdevs){
        const cNum = oldCdev.split(".")[1];
        if(!currCfile.includes(cNum)){
            fs.unlinkSync(`${portDir}/${oldCdev}`);
        }
    }
}
function cleanPorts(AppToRemove){
    const jamFolder = getJamFolder()
    for(let port of AppToRemove.keys()){
        if(!fs.existsSync(`${jamFolder}/ports/${port}`)){
            continue;
        }
        const oldApss = fs.readFileSync(`${jamFolder}/ports/${port}`).toString().trim().split("\n")
        const toRemove = AppToRemove.get(port)
        const newApps = oldApss.filter((entry) => !toRemove.includes(entry))
        fs.writeFileSync(`${jamFolder}/ports/${port}`, newApps.join("\n"))
    }
}

async function clean(){
    //port --> dir 
    const AppToRemove = new Map();
    const jamFolder = getJamFolder()
    const portsDir = `${jamFolder}/ports`
    const appFolder = getAppFolder()
    if(!fs.existsSync(portsDir)){
        return;
    }
    const ports = fs.readdirSync(portsDir)
    if(ports.length === 0 ){
        return
    }
    portLoop:
    for(let port of ports){
        if(!fs.existsSync(`${portsDir}/${port}`)){
            continue;
        }
        const dirs = fs.readFileSync(`${portsDir}/${port}`).toString().trim().split("\n")
        for(let dir of dirs){
            const isPaused = ((fs.readFileSync(`${appFolder}/${dir}/${port}/paused`).toString().trim()) !== "false") ? true : false
            if(isPaused){
                continue;
            }
            //mosquitto not running kill 
            if(!await isMosquittoRunning(port)){
                console.log("gotHERE")
                await $`zx jamkill.mjs --port --name=${port}`
                continue portLoop;
            }
            //jFile is not running. to remove fromport list
            if(!(await isJamrunRunning(dir,port)) && !(await isJfileRunning(dir,port))){
                const programName = dirNameToProgramName(dir)+".jxe";
                const appName =  dirNameToAppName(dir);
                cleanByPortNumber(programName, appName, port);
                if(AppToRemove.has(port)){
                    const dummy = AppToRemove.get(port);
                    dummy.push(dir);
                    AppToRemove.set(port,dummy)
                }
                else{
                    AppToRemove.set(port,dir)
                }
            }
            //It's running and files are uptodate, update Cnum and clean cdevs
            if( (await isJfileRunning(dir,port)) && (await isDevice(dir,port))){
                const Cfiles = await getRunningCfiles(dir,port);
                const numCnodes = Cfiles.length
                if(!fs.existsSync(`${appFolder}/${dir}/${port}/numCnodes`)){
                    fs.writeFileSync(`${appFolder}/${dir}/${port}/numCnodes`,`${numCnodes}`)
                    continue;
                }
                const numCnodeFile = Number(fs.readFileSync(`${appFolder}/${dir}/${port}/numCnodes`).toString().trim())
                if(numCnodeFile !== numCnodes){
                    fs.writeFileSync(`${appFolder}/${dir}/${port}/numCnodes`,`${numCnodes}`)
                }
                cleanCfiles(`${appFolder}/${dir}/${port}`, Cfiles)
            }

        }
    }
    cleanPorts(AppToRemove)
}








// main()

(async () =>{
    await clean()
})();