#!/usr/bin/env zx

import { getJamListArgs } from "./parser.mjs";
import {getAppFolder,getJamFolder} from "./fileDirectory.mjs"
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';
import { header_1,header_2 , body_1, body_sec, keyWord, body_2,body_2_bold } from "./chalk.mjs";
import { chalk } from "zx";


const { debounce } = require('lodash');
const chokidar = require('chokidar');
const jamFolder = getJamFolder()
let watcher;
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);
const jamcleanPath = resolve(__dirname, 'jamclean.mjs');
let NODESINFO = []
let cachedInfo = []
let currIP ;
if (os.platform() === 'win32') {
currIP = (await $`powershell (Get-NetIPAddress -AddressFamily IPv4).IPAddress`.catch(() => '')).toString().trim();
} else if (os.platform() === 'darwin') {
currIP = (await $`ipconfig getifaddr en0`.catch(() => '')).toString().trim();
} else if (os.platform() === 'linux') {
currIP = (await $`hostname -I`.catch(() => '')).toString().trim();
}

function show_usage(){

    const usageMessage = 
    `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jamlist`)}${body_1(` --  a tool to display the active programs and their attributes.`)}

    ${header_1(`SYNOPSIS`)}

    Usage: jamlist 
                [--help]
                [--all]
                [--monitor]
                [--type==${body_sec(`program type`)}]
                [--dataStore==${body_sec(`dataStore address`)}]
                [--tmuxid==${body_sec(`tmuxid`)}]
                [--port==${body_sec(`portNum`)}]
                [--app==${body_sec(`appName`)}]
                [--prog==${body_sec(`programName`)}]
                [--remote]




    ${header_1(`DESCRIPTION`)}

    ${keyWord('Note: By default jamlist lists all the active local programs and print it before terminating.')} 

    --- ${keyWord('jamlist displays the folloing attribute of the running apps:')} 

        1) NAME: ${body_2("program's app name.")}
        2) PROGRAM: ${body_2("program's program name.")}
        3) PORT: ${body_2("the MQTT port used by program.")}
        4) D-STORE: ${body_2("the dataStore used by the program.")}
        5) TYPE: ${body_2("either one of fog, device or cloud depending on the program's type.")}
        7) TMUX-ID: ${body_2("the generic tmux ID used by the program (not including the tag).")}
        8) STATUS: ${body_2("either running or paused based on the program status.")}
        9) HOST: ${body_2("localHost if program is running locally or IPAddress of the remote machine running the program.")}
        10) UP-TIME: ${body_2("the duration of the program running in the format of hour-minute-sec.")}


    --- jamlist [--help]
    ${body_2("use this flag to dispaly this usage msg.")}

    --- jamlist [--all]
    ${body_2("use this flag to dispaly all the Active programs.")}
    ${body_2_bold(`NOTE:
    1) This is same as using jamlist with no option and flags.
    2) Using --all disable all the filtering flags (the ones with "==").`)}
    
    --- jamlist [--monitor]
    ${body_2(`monitor flag keeps the jamlist alive after priniting the list of programs.
    as the program stays alive it re-paints the console with new info on any chnages.`)}

    --- jamlist [--remote]
    ${body_2(`Use this flag to include the remote active apps started by the local machine running the jamlist.`)}

    --- jamlist [--type==fog]
    ${body_2(`Use --type to list only active programs with a certain type. 
    The command above lists all the fog programs. 
    The valid values for type are:`)}
    ${body_2_bold(`1) device
    2) cloud
    3) fog`)}

    --- jamlist [--dataStore==127.0.0.1:21883]
    ${body_2(`used --dataStore option to list all the active apps with the given dataStore address.`)}

    --- jamlist [--tmuxid==tg-25165]
    ${body_2(`used ---tmuxid option to list all the active apps with the given tmuxid.`)}

    --- jamlist [--port=3]
    ${body_2(`used --port option to list all the active apps running on the given port.`)}
    
    --- jamlist [--app==XX3]
    ${body_2(`used --app option to list all the active apps with the given app name.`)}

    --- jamlist [--prog==X]
    ${body_2(`used --prog option to list all the active apps with the given program name.`)}
    
    NOTE:
    --type, --dataStore, --tmuxid, --port, --app and --prog are filters and can be used together.

    `;
   
    console.log(usageMessage)
 
    
}

function getUpTime(startStamp){
    const now = Date.now();
    const Diff = now - startStamp;
    const hours = Math.floor(Diff / (1000 * 60 * 60));
    const minutes = Math.floor((Diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((Diff % (1000 * 60)) / 1000);
    
    let result = '';
    
    if (hours !== 0) {
        result = result + `${hours}h `;
    }
    if (minutes !== 0) {
        result = result + `${minutes}min `;
    }
    if (seconds !== 0) {
        result = result + `${seconds}sec`;
    }
    if (result === '') {
        result = Diff + "ms";
    }
    
    return result;


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
function getWatchList(filters){
    const watchList = []
    const appFolder = getAppFolder()
    watchList.push(`${jamFolder}/ports`)
    if(filters.remote){
        watchList.push(`${jamFolder}/remote`)

    }
    const dirs = getRunningDirs()
    for(let dir of dirs.keys()){
        for(let port of dirs.get(dir)){
            watchList.push(`${appFolder}/${dir}/${port}/numCnodes`)
            watchList.push(`${appFolder}/${dir}/${port}/paused`)
        }
    }
    return watchList

}




function watch(filters) {
    setInterval(async () => {
        await $`zx ${jamcleanPath}`
        if(cachedInfo){
            console.clear()
            printHeader();
            printNodeInfo(cachedInfo);
        }
    }, 1000);
    function updateWatchList(watchList){

        const newWatchList = getWatchList(filters);
        for(let item of newWatchList){
            if(!watchList.includes(item)){
                watcher.add(item)
            }
        }
        for(let item of watchList){
            if(!newWatchList.includes(item)){
                watcher.unwatch(item)
            }
        }
        return newWatchList;
    }
    const updateInfo = debounce(async () => {
        await sleep(500); 
        if (!filters || filters.all === true || Object.keys(filters).length === 0) {
            const info = getNodeInfo();
            if(filters.remote){
                NODESINFO = []
                await main(true)
            }



            if (info.length + NODESINFO.length === 0) {

                console.clear()
                console.log("There is no program running");
            } else {

                console.clear()
                printHeader();
                printNodeInfo(info);
                if(filters.remote){
                    printNodeInfo(NODESINFO);
                }
                cachedInfo = info.concat(NODESINFO)
            }
        } else {
            const nodeinfo = getNodeInfo();
            let keysToRemove = ["root","remote","help","all" ];
            let filteredObj = Object.keys(filters).filter(key => !keysToRemove.includes(key)).reduce((acc, key) => {acc[key] = filters[key]; return acc;}, {});
            const filtered = filter(nodeinfo, filteredObj);

            if(filters.remote){
                NODESINFO = []
                await main(true)
            }

            if (filtered.length + NODESINFO.length === 0) {
                console.clear()
                console.log("There is no such program running");
            } else {
                console.clear()
                printHeader();
                printNodeInfo(filtered);
            if(filters.remote){
                printNodeInfo(NODESINFO);
                cachedInfo = filtered.concat(NODESINFO)
            }

            }
        }
    }, 500); 
    let watchList = getWatchList(filters)
    watcher = chokidar.watch(watchList, { persistent: true, ignoreInitial: true }).on('all', (event, path) => {

        watchList = updateWatchList(watchList)
        updateInfo();
    });
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

function getNodeInfo(root=null){
    const appToPortMap = getRunningDirs()
    const jamfolder = getJamFolder()
    const appfolder  = getAppFolder();
    const nodeInfo =[]
    if( (!fs.existsSync(`${jamfolder}/ports`)) || (!fs.existsSync(`${jamfolder}/apps`)) ){
        return []
    }

    for(let app of appToPortMap.keys()){
        const appName = dirNameToAppName(app)
        const programName = dirNameToProgramName(app)
        for(let port of appToPortMap.get(app)){
            if(root){
                if(fs.existsSync(`${appfolder}/${app}/${port}/root`)){
                    const rootIP = fs.readFileSync(`${appfolder}/${app}/${port}/root`).toString().trim();
                    if(rootIP === root){
                        const fileNames ={"machType": "-", "dataStore": "-" ,"tmuxid": "-", "parentId":"-", "numCnodes": "-", "startStamp": '-'}
                        const dirPath = `${appfolder}/${app}/${port}`
                        if(!fs.existsSync( `${appfolder}/${app}/${port}`)){
                            throw new Error("FileDirectory is corrupted. TAKE REQUIRED ACTION")
                        }
                        for(let fileName of Object.keys(fileNames)){
                            if(fs.existsSync(`${dirPath}/${fileName}`)){
                                const data = fs.readFileSync(`${dirPath}/${fileName}`).toString().trim();
                                fileNames[fileName] = data;
                            }
                        }
                        fileNames["port"] = String(port)
                        fileNames["app"] = appName
                        fileNames["prog"] = programName
                        if(fs.readFileSync(`${appfolder}/${app}/${port}/paused`).toString().trim() !== "false"){
                            fileNames["status"] = "paused"
                        }
                        else{
                            fileNames["status"] = "running"
                            
                        }
                        
                        fileNames["host"] = currIP
                        
                    
            
                        nodeInfo.push(fileNames)
                    
                    }
                }
            }
            else{
                const fileNames ={"machType": "-", "dataStore": "-" ,"tmuxid": "-", "parentId":"-", "numCnodes": "-" , "startStamp": "-"}
                const dirPath = `${appfolder}/${app}/${port}`
                if(!fs.existsSync( `${appfolder}/${app}/${port}`)){
                    throw new Error("FileDirectory is corrupted. TAKE REQUIRED ACTION")
                }
                for(let fileName of Object.keys(fileNames)){
                    if(fs.existsSync(`${dirPath}/${fileName}`)){
                        const data = fs.readFileSync(`${dirPath}/${fileName}`).toString().trim();
                        fileNames[fileName] = data;
                    }
                }
                fileNames["port"] = String(port)
                fileNames["app"] = appName
                fileNames["prog"] = programName
                if(fs.readFileSync(`${appfolder}/${app}/${port}/paused`).toString().trim() !== "false"){
                    fileNames["status"] = "paused"
                }
                else{
                    fileNames["status"] = "running"
                    
                }
                fileNames["host"] = "localHost"

    
                nodeInfo.push(fileNames)
            }

        }
    }

    return nodeInfo;
}

function printNodeInfo(info){
   
    for (let row of info){
        if(row["host"] === currIP){
            row["host"] = "localHost"
        }

        let UPTIME;
        if(row["status"]!=="paused"){
             UPTIME = getUpTime(row["startStamp"])
        }
        else{
            UPTIME = "-"
        }
        const headerString = `   ${row["app"].padEnd(10)} ${row["prog"].padEnd(10)} ${("Local:"+row["port"]).padEnd(10)} ${row["dataStore"].padEnd(20)} ${row["machType"].padEnd(10)} ${row["numCnodes"].padEnd(10)} ${row["tmuxid"].padEnd(10)} ${row["status"].padEnd(10)} ${row["host"].padEnd(10)} ${UPTIME.padEnd(10)}`;
        console.log(headerString)
    }
}


function printHeader(){
    const headerString = `   ${chalk.bold.italic("NAME".padEnd(10))} ${chalk.bold.italic("PROGRAM".padEnd(10))} ${chalk.bold.italic("PORT".padEnd(10))} ${chalk.bold.italic("D-STORE".padEnd(20))} ${chalk.bold.italic("TYPE".padEnd(10))} ${chalk.bold.italic("C-NODES".padEnd(10))} ${chalk.bold.italic("TMUX-ID".padEnd(10))} ${chalk.bold.italic("STATUS".padEnd(10))} ${chalk.bold.italic("HOST".padEnd(10))} ${chalk.bold.italic("UP-TIME".padEnd(10))}`;
    console.log(headerString)
    // console.log(`${chalk.black.cyan("--------------------------------------------------------------------------------------------------------------")}`)
    console.log(`${chalk.cyan("=========================================================================================================================")}`)




}

function filter(nodeinfo, filters){
    const filteredInfo =[];
    for(let info of nodeinfo){
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

function getRemoteMachines(){
    const jamfolder = getJamFolder()
    if(!fs.existsSync(`${jamfolder}/remote`)){
        return []
    }
    return (fs.readdirSync(`${jamfolder}/remote`))

}

async function makeConnection(config){
    return await new Promise((resolve, reject) => {
        const client = new Client();
        client.on('ready', () => {
            resolve(client);
        });

        client.on('error', (error) => {
            reject(error);
        });

        client.connect(config);
    });
}

async function executeScript(client, command){
    return (await new Promise((resolve, reject) =>{
        client.exec(command, (err,stream) =>{
            if (err) console.log(error);
            stream.on("close", () => {
                resolve("closed")
            })
            stream.on("data" , (data) =>{
                if(data.includes("NODEINFO##")){
                    let JSONrow = data.toString().trim().split("##")[1]
                    let row;
                    try{
                        row = JSON.parse(JSONrow)
                    }
                    catch(error){
                        console.log(error)
                    }

         


                    NODESINFO.push(row)
                }
            })
        })
    }))
}

async function main(update=null){
    NODESINFO = []

    let args;
    try{
        args = getJamListArgs(process.argv)
    }
    catch(error){
       

        show_usage()
        console.log(error.message);
        process.exit(1);

    }
    const filters = args.filters;
    const monitor = args.monitor;

    const jamfolder = getJamFolder()
    if(filters.remote || update){


        const map = getRemoteMachines();

        for(let machines of map){

            const [host,port] =  machines.split("_");
            const config = {
                host: host,
                port: 22,
                username: 'maheswar',
                password: 'pass4des' 
            };
            const client = await makeConnection(config);
            const pathExport ="export PATH=$PATH:/home/admin/JAMScript/node_modules/.bin"
            const changeDir= "cd JAMScript/tools"
            let args= ""
            for(let filter of Object.keys(filters)){
                if(filter === "remote"){
                    continue
                }
                if(filter === "all" || filter === "help"  ){
                    if(filters.filter)
                        {
                            args = args + `--${filter} `

                        }
                        continue
       
                }
                  args = args + `--${filter}=${filters[filter]} `
            } 
            args =args.trim() 


            const script = `jamlist.mjs ${args} --root=${currIP}`
            await executeScript(client,`${pathExport} && ${changeDir} && ${script}`)
   
        }  
    }

    if(filters.root){


        if(filters.all){

            await $`zx ${jamcleanPath}`


            const info = getNodeInfo(filters.root);



            for(let row of info){

                const jsonRow = JSON.stringify(row)

                await sleep(50)
            }
        }
        else{

            await $`zx ${jamcleanPath}`
            const nodeinfo = getNodeInfo(filters.root)


            let keysToRemove = ["root","remote","help","all" ];
            let filteredObj = Object.keys(filters).filter(key => !keysToRemove.includes(key)).reduce((acc, key) => {acc[key] = filters[key]; return acc;}, {});
            const filtered = filter(nodeinfo, filteredObj)

            if(filtered.length === 0 ){
                process.exit(0)  
            }
            for(let row of filtered){
                const jsonRow = JSON.stringify(row)
                console.log(`NODEINFO##${jsonRow}`)
                await sleep(50)
            }
        }
    }
    else if(!update){

        if(filters.all){
            await $`zx ${jamcleanPath}`
            const info = getNodeInfo();
            if(info.length + NODESINFO.length === 0 ){

                if(!monitor){
                    process.exit(0)
                }
            }
            console.clear();
            printHeader();
            printNodeInfo(info);
            printNodeInfo(NODESINFO)
            cachedInfo = info.concat(NODESINFO)
        }

        else{
            
            await $`zx ${jamcleanPath}`
            const nodeinfo = getNodeInfo()
            let keysToRemove = ["root","remote","help","all" ];
            let filteredObj = Object.keys(filters).filter(key => !keysToRemove.includes(key)).reduce((acc, key) => {acc[key] = filters[key]; return acc;}, {});

            const filtered = filter(nodeinfo, filteredObj)
            if(filtered.length + NODESINFO.length === 0 ){
                console.log("there is No such program running")
                if(!monitor){
                    process.exit(0)
                }
            }
            console.clear();
            printHeader();
            printNodeInfo(filtered);
            printNodeInfo(NODESINFO)
            cachedInfo = filtered.concat(NODESINFO)
        }
        if(monitor){
            watch(filters);
        }
    }

}

(async () => { 
     await main()
})();