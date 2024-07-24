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


function watch(filters) {
    const updateInfo = debounce(async () => {
        await sleep(500); 
        if (!filters || filters === "all" || Object.keys(filters).length === 0) {
            const info = getNodeInfo();
            lastInfo = info;

            if (info.length === 0) {
                console.log("---------");
                console.log("---------");
                console.log("---------");
                console.log("There is no program running");
            } else {
                console.log("---------");
                console.log("---------");
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
                console.log("---------");
                console.log("---------");
                console.log("There is no such program running");
            } else {
                console.log("---------");
                console.log("---------");
                console.log("---------");
                printHeader();
                printNodeInfo(filtered);
            }
        }
    }, 500); 
    chokidar.watch(`${jamFolder}/ports`, { persistent: true, ignoreInitial: true }).on('all', () => {
        updateInfo();
    });
}


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

            nodeInfo.push(fileNames)
        }
    }

    return nodeInfo;
}

function printNodeInfo(info){
   
    for (let row of info){
     
        const headerString = `   ${row["appName"].padEnd(15)} ${row["programName"].padEnd(15)} ${("Local:"+row["portNum"]).padEnd(15)} ${row["parentId"].padEnd(15)} ${row["dataStore"].padEnd(20)} ${row["machType"].padEnd(15)} ${row["numCnodes"].padEnd(15)} ${row["tmuxid"].padEnd(15)}`;
        console.log(headerString)
    }
}


function printHeader(){
    const headerString = `   ${"NAME".padEnd(15)} ${"PROGRAM".padEnd(15)} ${"HOST".padEnd(15)} ${"PARENT".padEnd(15)} ${"D-STORE".padEnd(20)} ${"TYPE".padEnd(15)} ${"C-NODES".padEnd(15)} ${"TMUX-ID".padEnd(15)}`;
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


function main(){
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
    if(monitor){
        watch(filters);
    }
    if(!filters || filters === "all" || Object.keys(filter) === 0){
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



}

(async () => { 
     main()
})();