#!/usr/bin/env zx

import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
import {getKilltArgs} from "./parser.mjs"
import { cleanByPortNumber , pauseByPortNumber} from "./cleanUp.mjs";
import { Client } from 'ssh2';
import { header_1,header_2 , body_1, body_sec, keyWord, body_2,body_2_bold } from "./chalk.mjs";

let currIP;
if (os.platform() === 'win32') {
    currIP = (await $`powershell (Get-NetIPAddress -AddressFamily IPv4).IPAddress`.catch(() => '')).toString().trim();
  } else if (os.platform() === 'darwin') {
    currIP = (await $`ipconfig getifaddr en0`.catch(() => '')).toString().trim();
  } else if (os.platform() === 'linux') {
    currIP =( await $`hostname -I`.catch(() => '')).toString().trim();
  }

function show_usage(){
    const usageMessage = 
    `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jamkill`)}${body_1(` --  a tool to kill or pause the running JXE files.`)}

    ${header_1(`SYNOPSIS`)}

    Usage: jamkill 
                [--reset]
                [--help]
                [--all]
                [--remote = ${body_sec(`IPAddress`)}]
                [--pause]
                [--appName = ${body_sec(`appName`)}]
                [--programName = ${body_sec(`programName`)}]
                [--portNum = ${body_sec(`portNum`)}]

    ${header_1(`DESCRIPTION`)}

    --- ${keyWord('jamkill')} by default kills all the running local apps.

    --- jamkill [--reset]
    ${body_2(`Use this flag to kill all the running programs and remove appfolder, port directory and mqttPID directory.
    it's useful for the cases that either the file directory is corrupted or a fresh start is required.`)}
    ${body_2_bold(`NOTE: 
    The only usable flag is next to --reset flag is --remote otherwise,
    --reset flag will dissable all the other flags and do a hard reset.`)}

    --- jamkill [--help]
    ${body_2(`Use this flag to display this usage msg.`)}
    
    --- jamkill [--all]
    ${body_2(`Use this flag to kill all the running apps.`)}
    ${body_2_bold(`NOTE: 
    1) if using --all next to the --reset flag. --all will be dissabled. 
    2) if using --all flag --appName, --programName, --appName will be dissabled.`)}

    --- jamkill [--pause]
    ${body_2(`Use this flag to pause the running programs instead of killing them.`)}

    --- jamkill [--remote]
    ${body_2(`Use this flag to kill the remote files as well as local ones.`)}
    ${body_2_bold(`NOTE: 
    jamkill --remote is only allowed to kill the remote programs which are started by thesame local machine which is running the jamkill.`)}

    --- jamkill [--appName=X]
    ${body_2(`Use this flag to kill or pause a program with a scpecific appName.`)}

    --- jamkill [--programName=X]
    ${body_2(`Use this flag to kill or pause a program with a specific programName.`)}

    --- jamkill [--portNum=X]
    ${body_2(`Use this flag to kill or pause a program with running on a certain port.`)}
    
    NOTE: 
    ${body_2(`--appName & --programName & --portNumber can be used all togeather or two by two to select the programs to be killed or paused.`)}

    RESTRICTIONS: 
    ${body_2(`can't use multiple --appName , --programName and --portNumber flags hoping to kill apps with different appNames, 
    programNames and portNumbers in one shot.`)}


    `;
   
    console.log(usageMessage)
 
    
}
export function getRunningDirs(){
    const jamFolder = getJamFolder()
    const appToPort = new Map()
    let activePorts
    try{
        activePorts = fs.readdirSync(`${jamFolder}/ports`)
    }
    catch(error){
        return appToPort
    }
    for(let port of activePorts){
        let apps;
        try{
            apps = fs.readFileSync(`${jamFolder}/ports/${port}`).toString().trim().split("\n");
        }
        catch(error){
            continue
        }
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

function killDataForAll(root){
    const toClean=[];
    const activeDirs = getRunningDirs();
    const appfolder = getAppFolder()

    for(let dir of activeDirs.keys()){
        for(let port of activeDirs.get(dir)){
            if(root){
                try{
                    const rootIP = fs.readFileSync(`${appfolder}/${dir}/${port}/root`).toString().trim();
                    if(rootIP === root){
                        const info ={
                            programName : dirNameToProgramName(dir)+".jxe",
                            appName : dirNameToAppName(dir),
                            portNumber : port
                        }
                        toClean.push(info)
                    }
                }
                catch(error){
                    continue;
                }
            }
            else{

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
async function killJamRun(data){
    const appName = data.appName;
    const programName = data.programName
    const portNumber = data.portNumber
    const dirName = ((programName.split('.'))[0]) +"_"+ appName;
    const appfolder = getAppFolder()
    try{
        const pid = fs.readFileSync(`${appfolder}/${dirName}/${portNumber}/shellpid`).toString().trim();
        const p = await $`ps -p ${pid} | grep jamrun | wc -l | tr -d '[:space:]'`
        const exists = Number(p.stdout.toString().trim());
        if(exists){
            process.kill(pid);
            return
        }
    }
    catch(error){
        return 
    }
}

async function killJFile(data){
    const appName = data.appName;
    const programName = data.programName
    const portNumber = data.portNumber
    const dirName = ((programName.split('.'))[0]) +"_"+ appName;
    const appfolder = getAppFolder()
    try{
        const pid = fs.readFileSync(`${appfolder}/${dirName}/${portNumber}/processId`).toString().trim();
        const p = await $`ps -p ${pid} | grep node | wc -l | tr -d '[:space:]'`
        const exists = Number(p.stdout.toString().trim());
        if(exists){
            process.kill(pid);
            return;
        }
    }
    catch(error){
        return
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

function filter(data, filters){
    console.log("filter", filters)
    console.log("data", data)
    const filteredInfo =[];
    for(let info of data){
        let isPassing = true
        for(let filter of Object.keys(filters)){
            if(!(filters[filter] === info[filter])){
                isPassing = false
                break;
            }
        }
        if(isPassing){
            filteredInfo.push(info)
        }
    }
    return filteredInfo;
}

async function jamKill(args)
{   

    let pause = args.pause
    let root = args.root
    let jamData = killDataForAll(root)
    console.log(jamData, "this is my jam data")
    let toKill;
    if(args.all){
        toKill = jamData
    }
    else{
        let Filter ={}
        if(args.programName){
            Filter["programName"] = `${args.programName}.jxe`
        }
        if(args.appName){
            Filter["appName"] = args.appName
        }
        if(args.portNum){
            Filter["portNumber"] =  args.portNum
        }
        
        toKill = filter(jamData,Filter )
    }
    console.log(toKill, "this is my to kill")

    if(toKill.length === 0 ){
        if(args.all){
            console.log("no running app on local")
        }
        else{
            console.log("no such running app on local")
        }
        
    }

    if(pause){
        for(let data of toKill){
            let appfolder = getAppFolder()
            const appName = data.appName;
            const programName = data.programName
            const portNumber = data.portNumber
            try{
                fs.existsSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/machType`)
                if(fs.readFileSync(`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}/processId`).toString().trim() === "new"){
                    console.log("CAN'T PAUSE",`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}. TRY LATER` )
                }
            }
            catch(error){
                console.log("CAN'T PAUSE",`${appfolder}/${programName.split(".")[0]}_${appName}/${portNumber}. TRY LATER` )
            }
            pauseByPortNumber(programName,appName,portNumber)
            await pauseProcess(data);
        }
    }
    else{
        for(let data of toKill){
            const appName = data.appName;
            const programName = data.programName
            const portNumber = data.portNumber
            await killProcess(data);
            cleanByPortNumber(programName,appName,portNumber)
        }
    }
    //keep this LOG
    console.log("KILLING IS OVER")

}

async function jamKillBruteForce(){

    await $`pkill node`.nothrow().quiet();
    await $`pkill mosquitto`.nothrow().quiet();
    await $`pkill tmux`.nothrow().quiet();
    await $`ps aux | grep redis-server | grep -v grep | awk '{print $2}' | xargs kill`.nothrow().quiet();
    const jamfolder = getJamFolder();
    if(fs.existsSync(`${jamfolder}/ports`))
        fs.rmSync(`${jamfolder}/ports`, { recursive: true, force: true })
    if(fs.existsSync(`${jamfolder}/apps`))
        fs.rmSync(`${jamfolder}/apps`, { recursive: true, force: true })
    if(fs.existsSync(`${jamfolder}/mqttpid`))
        fs.rmSync(`${jamfolder}/mqttpid`, { recursive: true, force: true })
            
}
async function executeScript(client, command){
    return (await new Promise((resolve, reject) =>{
        client.exec(command, (err,stream) =>{

            if (err) throw err;
            let result = ''
            stream.on("close", () => {
                resolve(result)
            })
            stream.on("data" , (data) =>{

                if(data.includes("KILLING IS OVER"))
                    {
                        resolve(data.toString())
                    }

            })
        })
    }))
}

async function main(){

  let args;

  try{
    args = getKilltArgs(process.argv)
   
  }
  catch(error){
  
        show_usage()
        process.exit(1);

  }
  const jamfolder = getJamFolder();
  const appfolder = getAppFolder();
  if(fs.existsSync(`${jamfolder}/remote`) && args.remote && !args.root){
    const remotes = fs.readdirSync(`${jamfolder}/remote`)
    for(let remote of remotes){
        const [host,port] =  remote.split("_");
        const config = {
            host: host,
            port: port,
            username: 'admin',
            password: 'admin' 
          };          
        let client = await new Promise((resolve, reject) => {
            const client = new Client();

            client.on('ready', () => {
                resolve(client);
            });

            client.on('error', (error) => {
                reject(error);
            });

            client.connect(config);
        });
        const pathExport ="export PATH=$PATH:/home/admin/JAMScript/node_modules/.bin"
        const changeDir= "cd JAMScript/tools"
        let toExecute;
        let filters =``;
        if(args.programName){
            filters = filters+`--programName=${programName} `
        }
        if(args.appName){
            filters = filters+`--appName=${appName} `
        }
        if(args.portNum){
            filters = filters+`--portNum=${portNum} `
        }
        filters = filters.trim()

        if(args.flag == "reset"){
                toExecute = `zx jamkill.mjs --reset --root=${currIP}`
        }
        
       
        else if(args.flag == "all"){
            if(!args.pause)
                toExecute = `zx jamkill.mjs ${filters} --root=${currIP}`
            else
                toExecute = `zx jamkill.mjs ${filters} --pause --root=${currIP}`
        }
        else{
            if(!args.pause)
                toExecute = `zx jamkill.mjs ${filters} --name=${args.name} --root=${currIP}`
            else
                toExecute = `zx jamkill.mjs ${filters} --name=${args.name} --pause --root=${currIP}`
        }


        const command=`${pathExport} && ${changeDir} && ${toExecute}`
        await executeScript(client, command);
    }
  }
  if(args.reset){
    if(args.root){
        throw new Error("DOES NOT HAVE THE PERMISSION TO RESET A REMOTE MACHINE")
    }

    await jamKillBruteForce()
  }
  else if( !fs.existsSync(jamfolder) ){
    throw new Error('.jamruns folder missing. JAMScript tools not setup?')
  }
  else if( !fs.existsSync(appfolder) ){
    throw new Error('.jamruns/apps folder missing. JAMScript tools not setup?')
  }
  else{
    await jamKill(args);
  }


  process.exit(0);
  
}


(async() => {

    await main()

})()
