#!/usr/bin/env zx
import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
import {getKilltArgs} from "./parser.mjs"
import { cleanByPortNumber , pauseByPortNumber} from "./cleanUp.mjs";


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

async function pauseProcess(data){
    await killJamRun(data);
    await killJFile(data);
}

async function jamKill(flag, name, pause)
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
    console.log(pause)
    if(pause){
        console.log("Pausing from jam kill")
        for(let data of jamData){
            console.log(data)
            let appfolder = getAppFolder()
            const appName = data.appName;
            const programName = data.programName
            const portNumber = data.portNumber
            if(
                (!fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/machType`)) ||
                (!fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/numCnodes`)) ||
                (!fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/mqtt.conf`)) ||
                (!fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/dataStore`)) ||
                (!fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/processId`))
            ){
                console.log("CAN'T PAUSE",`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}. TRY LATER` )
            }
            if(fs.readFileSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/processId`).toString().trim() === "new"){
                console.log("CAN'T PAUSE",`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}. TRY LATER` )
            }
            pauseByPortNumber(programName,appName,portNumber)
            await pauseProcess(data);
        }
    }
    else{
        console.log("KILL,KILL")
        for(let data of jamData){
            console.log("I GET HERE")
            console.log(data)
            const appName = data.appName;
            const programName = data.programName
            const portNumber = data.portNumber
            await killProcess(data);
            cleanByPortNumber(programName,appName,portNumber)
        }
    }


}

async function jamKillBruteForce(){
    await $`pkill node`.nothrow().quiet();
    await $`pkill mosquitto`.nothrow().quiet();
    await $`pkill tmux`.nothrow().quiet();
    await $`ps aux | grep redis-server | grep -v grep | awk '{print $2}' | xargs kill`.nothrow().quiet();
    const jamfolder = getJamFolder();
    //should I remove the apps as well or that is not required
    if(fs.existsSync(`${jamfolder}/ports`))
        fs.rmSync(`${jamfolder}/ports`, { recursive: true, force: true })
    if(fs.existsSync(`${jamfolder}/apps`))
        fs.rmSync(`${jamfolder}/apps`, { recursive: true, force: true })
            
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
    /**
     {name : "help", alias : "h", type: Boolean, defaultValue : false },
    {name : 'all', type: Boolean , defaultValue: false },
    {name : 'reset', type: Boolean , defaultValue: false },
    {name : 'app', type: Boolean , defaultValue: false },
    {name : 'program', type: Boolean , defaultValue: false },
    {name : 'dir', type: Boolean , defaultValue: false },
    {name : 'port', type: Boolean , defaultValue: false },
    {name: "portDir", type: Boolean, defaultValue: false },
    {name: "pause", type: Boolean, defaultValue: false },
    {name : 'name', alias : "n" , type: String , defaultValue: undefined },
     */
    `
    Kill running instances of the application.

    Usage: jamkill [--all|app_id|--help]

    jamkill
    kill the program started last among the currently running ones

    jamkill --help
    displays this help messages

    jamkill --all
    kills all running instances

    [--name && (--app=<appName> || --program=<jt2>(without ext)|| --dir=<jt2_shahin> || --port=<portNum> || --portDir<jt2_shahin/1883>)] 
    the --name is used to set the name and the other flags are used to mention what the name associates to

    [--pause] is used to pause the running program 

    [--reset] is the hard reset. it closes all the running nodes, mosquito,tmux,reddis and remove all the directories including ports and apps

    `
        )
    }
    process.exit(1);
  }
  const jamfolder = getJamFolder();
  const appfolder = getAppFolder();
  if(args.flag === "reset"){
    console.log("kill reset")
    await jamKillBruteForce()
  }
  else if( !fs.existsSync(jamfolder) ){
    throw new Error('.jamruns folder missing. JAMScript tools not setup?')
  }
  else if( !fs.existsSync(appfolder) ){
    throw new Error('.jamruns/apps folder missing. JAMScript tools not setup?')
  }
  else{
    await jamKill(args.flag , args.name, args.pause);
  }
  
}

(async() => {
    await main()

})()
