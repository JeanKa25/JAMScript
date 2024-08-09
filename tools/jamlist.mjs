#!/usr/bin/env zx

import { getJamListArgs } from "./parser.mjs";
import {getAppFolder,getJamFolder} from "./fileDirectory.mjs"
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

const { debounce } = require('lodash');
const chokidar = require('chokidar');
const jamFolder = getJamFolder()
let watcher;
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);
const jamcleanPath = resolve(__dirname, 'jamclean.mjs');
let NODESINFO = []
let currIP ;
if (os.platform() === 'win32') {
currIP = (await $`powershell (Get-NetIPAddress -AddressFamily IPv4).IPAddress`.catch(() => '')).toString().trim();
} else if (os.platform() === 'darwin') {
currIP = (await $`ipconfig getifaddr en0`.catch(() => '')).toString().trim();
} else if (os.platform() === 'linux') {
currIP = (await $`hostname -I`.catch(() => '')).toString().trim();
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
                console.log("---------");

                console.log("There is no program running");
            } else {
                console.log("---------");

                printHeader();
                printNodeInfo(info);
                if(filters.remote){
                    printNodeInfo(NODESINFO);
                }
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
                console.log("---------");

                console.log("There is no such program running");
            } else {
                console.log("---------");
  
                printHeader();
                printNodeInfo(filtered);
            if(filters.remote){
                printNodeInfo(NODESINFO);
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
                        const fileNames ={"machType": "-", "dataStore": "-" ,"tmuxid": "-", "parentId":"-", "numCnodes": "-"}
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
                        fileNames["portNum"] = String(port)
                        fileNames["appName"] = appName
                        fileNames["programName"] = programName
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
                const fileNames ={"machType": "-", "dataStore": "-" ,"tmuxid": "-", "parentId":"-", "numCnodes": "-" }
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
                fileNames["portNum"] = String(port)
                fileNames["appName"] = appName
                fileNames["programName"] = programName
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
        const headerString = `   ${row["appName"].padEnd(10)} ${row["programName"].padEnd(10)} ${("Local:"+row["portNum"]).padEnd(10)} ${row["parentId"].padEnd(10)} ${row["dataStore"].padEnd(20)} ${row["machType"].padEnd(10)} ${row["numCnodes"].padEnd(10)} ${row["tmuxid"].padEnd(10)} ${row["status"].padEnd(10)} ${row["host"].padEnd(10)}`;
        console.log(headerString)
    }
}


function printHeader(){
    const headerString = `   ${"NAME".padEnd(10)} ${"PROGRAM".padEnd(10)} ${"HOST".padEnd(10)} ${"PARENT".padEnd(10)} ${"D-STORE".padEnd(20)} ${"TYPE".padEnd(10)} ${"C-NODES".padEnd(10)} ${"TMUX-ID".padEnd(10)} ${"STATUS".padEnd(10)} ${"HOST".padEnd(10)}`;
    console.log(headerString)
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
       

            console.log(

                `

                Usage: 
                jamlist --help: show this usage msg.
                
                jamlist has two made modes. the default is just printing the list of requested programs but if it's required to monitor the apps and update upon changes,
                the --monitor should be used. it prints the list of requested programs, and keeps montoring them, if there is any change it will be updated.

                by default jamlist only monitors or prints out locally running programs yet if it's required to monitor or list none local programs as well, --remote
                flag should be used.

                by passing the --all flag jamlist is going to list all the running apps. if there is certain restriction needs to be applied the following filters can be used:
                [type=<type> | dataStore=<dataStore> | tmuxid=<tmux> | portNum=<portNum> | appName=<appName> | programName=<programName> ]
                NOTE: all the abouve arguments can be used togeather but using --all will dissable them all and removes all the filters 


                `
                
            )
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
                port: port,
                username: 'admin',
                password: 'admin' 
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


            const script = `zx jamlist.mjs ${args} --root=${currIP}`
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
            printHeader();
            printNodeInfo(info);
            printNodeInfo(NODESINFO)
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
            printHeader();
            printNodeInfo(filtered);
            printNodeInfo(NODESINFO)
        }
        if(monitor){
            watch(filters);
        }
    }

}

(async () => { 
     await main()
})();