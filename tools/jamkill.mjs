#!/usr/bin/env zx
import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
import {getKilltArgs} from "./parser.mjs"
import { cleanByPortNumber } from "./cleanUp.mjs";

/*
    IMPORTANT: fix it for the default name such as app_n
 */


export function getRunningDirs(){
    const jamFolder = getJamFolder()
    const appToPort = new Map()
    const activePorts = fs.readdirSync(`${jamFolder}/ports`)
    for(let port of activePorts){
        const apps = fs.readFileSync(`${jamFolder}/ports/${port}`).toString().trim().split("\n");
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

export function dirNameToAppName(dirName){
    const dir = dirName.split('_')
    if(dir.length > 2){
        return (dir.filter((_,index) => index !== 0)).join("_")
    }
    else{
        return dir[1];
    }
    
}
export function dirNameToProgramName(dirName){
    return (dirName.split('_'))[0]
    
}
function killDataByPortDir(portDir){
    const jamFolder = getJamFolder()
    const infoList = portDir.split("/")
    if(infoList.length !== 2){
        throw new Error("Wrong Path input")
0   }
    const dirName = infoList[0]
    const portName = infoList[1]

    if(!fs.existsSync(`${jamFolder}/ports/${portName}`)){
        return[]
    }
    const dirsRunning = fs.readFileSync(`${jamFolder}/ports/${portName}`).toString().trim().split("\n")
    if(!dirsRunning.includes(dirName)){
        return []
    }
    const info ={
        programName :  dirNameToProgramName(dirName)+".jxe",
        appName : dirNameToAppName(dirName),
        portNumber : portName
    }
    return [info]


}
function killDataByPortNum(portNum){
    const jamFolder = getJamFolder()
    const toClean=[];
    const activePorts = (fs.readdirSync(`${jamFolder}/ports`)).map((entry) => Number(entry))
    if(!activePorts.includes(Number(portNum))){
        return [];
    }
    const dirsRunning = fs.readFileSync(`${jamFolder}/ports/${portNum}`).toString().trim().split("\n")
    for(let dir of dirsRunning){
        const info ={
            programName :  dirNameToProgramName(dir)+".jxe",
            appName : dirNameToAppName(dir),
            portNumber : portNum
        }
        toClean.push(info)
    }
    return toClean;

}

function killDataByAppName(appName){
    const toClean=[];
    const activeDirs = getRunningDirs();
    for(let dir of activeDirs.keys()){
        const currApp = dirNameToAppName(dir)
        if(currApp === appName){
            for(let port of activeDirs.get(dir)){
                const info ={
                    programName :  dirNameToProgramName(dir)+".jxe",
                    appName : currApp,
                    portNumber : port
                }
                toClean.push(info)
            }
        }
    }
    return toClean
}

function killDataByProgramName(programName){
    const toClean=[];
    const activeDirs = getRunningDirs();
    for(let dir of activeDirs.keys()){
        const currProgram = dirNameToProgramName(dir)
        if(currProgram === programName){
            for(let port of activeDirs.get(dir)){
                const info ={
                    programName : currProgram+".jxe",
                    appName : dirNameToAppName(dir),
                    portNumber : port
                }
                toClean.push(info)
            }
        }
    }
    return toClean
}


function killDataByDirName(dirName){
    const toClean=[];
    const activeDirs = getRunningDirs();
    for(let dir of activeDirs.keys()){
        if(dir === dirName){
            for(let port of activeDirs.get(dir)){
                const info ={
                    programName : dirNameToProgramName(dir)+".jxe",
                    appName : dirNameToAppName(dir),
                    portNumber : port
                }
                toClean.push(info)
            }
        }
    }
    return toClean
}

function killDataForAll(){
    const toClean=[];
    const activeDirs = getRunningDirs();
    for(let dir of activeDirs.keys()){
        for(let port of activeDirs.get(dir)){
            const info ={
                programName : dirNameToProgramName(dir)+".jxe",
                appName : dirNameToAppName(dir),
                portNumber : port
            }
            toClean.push(info)
        }
    }
    return toClean
}
async function killJamRun(data){
    const appName = data.appName;
    const programName = data.programName
    const portNumber = data.portNumber
    const dirName = ((programName.split('.'))[0]) +"_"+ appName;
    const appfolder = getAppFolder()
    if(fs.existsSync(`${appfolder}/${dirName}/${portNumber}/shellpid`)){
        const pid = fs.readFileSync(`${appfolder}/${dirName}/${portNumber}/shellpid`).toString().trim();
        let exists;
        try {
            const cwd = process.cwd()
            const p = await $`ps -p ${pid} | grep jamrun | wc -l | tr -d '[:space:]'`
            exists = Number(p.stdout.toString().trim());
        } catch (error) {
            exists = 0 
     
        }

        if(exists){
            process.kill(pid);
        }
    }
}

async function killJFile(data){
    const appName = data.appName;
    const programName = data.programName
    const portNumber = data.portNumber
    const dirName = ((programName.split('.'))[0]) +"_"+ appName;
    const appfolder = getAppFolder()
    if(fs.existsSync(`${appfolder}/${dirName}/${portNumber}/processId`)){
        const pid = fs.readFileSync(`${appfolder}/${dirName}/${portNumber}/processId`).toString().trim();
        let exists;
        try {
            const p = await $`ps -p ${pid} | grep node | wc -l | tr -d '[:space:]'`
            exists = Number(p.stdout.toString().trim());
        } catch (error) {
            exists = 0 
        }
        if(exists){
            process.kill(pid);
            return;
        }
    }
}

async function killProcess(data){
    await killJamRun(data);
    await killJFile(data);
}

async function jamKill(flag, name)
{   
    console.log("KILLING PROCESS STARTING")
    let jamData;
    if(flag === "dir"){
        jamData = killDataByDirName(name)
    }
    else if(flag === "app"){
        jamData = killDataByAppName(name)
        
    }
    else if(flag === "program"){
        console.log("killing by program name")
        jamData = killDataByProgramName(name)
    }
    else if(flag === "port"){
        console.log("USING PORT TO CLEAN")
        jamData = killDataByPortNum(name)
    }
    else if(flag === "portDir"){
        jamData = killDataByPortDir(name)
    }
    else{
        jamData = killDataForAll()
    }

    console.log(jamData)
    if(jamData.length === 0 ){
        if(flag === "all"){
            console.log("no running app")
        }
        else{
            console.log("no such running app")
        }
        
    }
    for(let data of jamData){
        console.log(data)
        const appName = data.appName;
        const programName = data.programName
        const portNumber = data.portNumber
        console.log("got here1")
        await killProcess(data);
        console.log("got here2")
        cleanByPortNumber(programName,appName,portNumber)
    }

}

async function jamKillBruteForce(){
    await $`pkill node`.nothrow().quiet();
    await $`pkill mosquitto`.nothrow().quiet();
    await $`pkill tmux`.nothrow().quiet();
    await $`ps aux | grep redis-server | grep -v grep | awk '{print $2}' | xargs kill`.nothrow().quiet();
    const jamfolder = getJamFolder();
    //should I remove the apps as well or that is not required
    try{
        fs.rmSync(`${jamfolder}/ports`, { recursive: true, force: true })
    }
    catch(error){

    }
}

async function main(){

  let args;

  try{
    args = getKilltArgs(process.argv)
   
  }
  catch(error){
    console.log(error)
    if(error.type === "ShowUsage"){
        console.log(
    `
    Kill running instances of the application.

    Usage: jamkill [--all|app_id|--help]

    jamkill
    kill the program started last among the currently running ones

    jamkill --help
    displays this help messages

    jamkill --all
    kills all running instances

    jamkill app_id
    kills all running instances that were started under app-id

    `
        )
    }
    process.exit(1);
  }
  const jamfolder = getJamFolder();
  const appfolder = getAppFolder();
  if( !fs.existsSync(jamfolder) ){
    throw new Error('.jamruns folder missing. JAMScript tools not setup?')
  };
  if( !fs.existsSync(appfolder) ){
    throw new Error('.jamruns/apps folder missing. JAMScript tools not setup?')
  };
  if(args.flag === "reset"){
    await jamKillBruteForce()
  }
  else{
    await jamKill(args.flag , args.name);
  }
  
}

(async() => {
    await main()

})()
