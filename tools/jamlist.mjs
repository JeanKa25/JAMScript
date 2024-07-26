#!/usr/bin/env zx
/**

 * //DISCUSS PASUING AND THE INFO WE NEED HERE +++++ TAKE CARE OF THE DEFAULT APP NAME 

 */
import { getJamListArgs } from "./parser.mjs";
import {getAppFolder,getJamFolder} from "./fileDirectory.mjs"
const { debounce } = require('lodash');
const chokidar = require('chokidar');
const jamFolder = getJamFolder()
let lastInfo;
let watcher;




function getRunningDirs(){
    const jamFolder = getJamFolder()
    const appToPort = new Map()
    if(!fs.existsSync(`${jamFolder}/ports`)){
        return appToPort;
    }
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
function getWatchList(){
    const watchList = []
    const appFolder = getAppFolder()
    watchList.push(`${jamFolder}/ports`)
    const dirs = getRunningDirs()
    for(let dir of dirs.keys()){
        for(let port of dirs.get(dir)){
            watchList.push(`${appFolder}/${dir}/${port}/numCnodes`)
        }
    }
    return watchList

}



function watch(filters) {
    setInterval(async () => {
        await $`zx jamclean.mjs`
    }, 1000);
    function updateWatchList(watchList){
        const newWatchList = getWatchList();

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
        if (!filters || filters === "all" || Object.keys(filters).length === 0) {
            const info = getNodeInfo();
            lastInfo = info;

            if (info.length === 0) {
                console.log("---------");

                console.log("There is no program running");
            } else {
                console.log("---------");

                printHeader();
                printNodeInfo(info);
            }
        } else {
            const nodeinfo = getNodeInfo();
            const filtered = filter(nodeinfo, filters);
            lastInfo = nodeinfo;

            if (filtered.length === 0) {
                console.log("---------");

                console.log("There is no such program running");
            } else {
                console.log("---------");
  
                printHeader();
                printNodeInfo(filtered);
            }
        }
    }, 500); 
    let watchList = getWatchList()
    watcher = chokidar.watch(watchList, { persistent: true, ignoreInitial: true }).on('all', () => {
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


function getNodeInfo(){
    const appToPortMap = getRunningDirs()
    // console.log(appToPortMap)
    const appfolder  = getAppFolder();
    const nodeInfo= [];
    for(let app of appToPortMap.keys()){
        const appName = dirNameToAppName(app)
        const programName = dirNameToProgramName(app)
        for(let port of appToPortMap.get(app)){
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
            if(fs.readFileSync(`${appfolder}/${app}/${port}/paused`).toString().trim() === "true"){
                fileNames["status"] = "paused"
            }
            else{
                fileNames["status"] = "running"
                
            }

            nodeInfo.push(fileNames)
        }
    }

    return nodeInfo;
}

function printNodeInfo(info){
   
    for (let row of info){
     
        const headerString = `   ${row["appName"].padEnd(10)} ${row["programName"].padEnd(10)} ${("Local:"+row["portNum"]).padEnd(10)} ${row["parentId"].padEnd(10)} ${row["dataStore"].padEnd(20)} ${row["machType"].padEnd(10)} ${row["numCnodes"].padEnd(10)} ${row["tmuxid"].padEnd(10)} ${row["status"].padEnd(10)}`;
        console.log(headerString)
    }
}


function printHeader(){
    const headerString = `   ${"NAME".padEnd(10)} ${"PROGRAM".padEnd(10)} ${"HOST".padEnd(10)} ${"PARENT".padEnd(10)} ${"D-STORE".padEnd(20)} ${"TYPE".padEnd(10)} ${"C-NODES".padEnd(10)} ${"TMUX-ID".padEnd(10)} ${"STATUS".padEnd(10)}`;
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


async function main(){
    let args;
    try{
        args = getJamListArgs(process.argv)
    }
    catch(error){
        console.log(error)
       
        if(error.type = "ShowUsage"){
            console.log(
                `
        Usage: jamlist [--app=appl_name]

        Lists details about all activated instances of JAMScript programs. Use the --app=X
        option to limit the listing to programs that match the given name (i.e., X).
                `
                
            )
        process.exit(1);
        }

        throw error;
    }
    const filters = args.filters;
    const monitor = args.monitor;

    const jamfolder = getJamFolder()
        
   if( (!fs.existsSync(`${jamfolder}/ports`)) || (!fs.existsSync(`${jamfolder}/apps`)) ){
        console.log("there is No program running")
        if(!monitor){
            process.exit(0)
        }

        
    }


    else if(!filters || filters === "all" || Object.keys(filter) === 0){
        await $`zx jamclean.mjs`
        const info = getNodeInfo();
        lastInfo = info;
        if(info.length === 0 ){
            console.log("there is No program running")
            if(!monitor){
                process.exit(0)
            }

        }
        printHeader();
        printNodeInfo(info);
    }

    else{
        await $`zx jamclean.mjs`
        const nodeinfo = getNodeInfo()
        const filtered = filter(nodeinfo, filters)
        lastInfo = filtered;
        if(filtered.length === 0 ){
            console.log("there is No such program running")
            if(!monitor){
                process.exit(0)
            }
        }
        printHeader();
        printNodeInfo(filtered);
    }
    if(monitor){
        watch(filters);
    }



}

(async () => { 
     await main()
})();