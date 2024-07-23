#!/usr/bin/env zx
import {getJamFolder, getPaths} from './fileDirectory.mjs'
const { spawnSync } = require('child_process');
const p = spawnSync('which', ['tmux']);
const TMUX = p.stdout.toString().trim()

function getTmuxIds(PortNumber,appName , programName){
    const [jamfolder,appfolder,folder] = getPaths(programName,appName);
    console.log(`${folder}/${PortNumber}/tmuxid`)
    console.log()
    if(fs.existsSync(`${folder}/${PortNumber}/tmuxid`)){

        const tmuxID = fs.readFileSync(`${folder}/${PortNumber}/tmuxid`).toString().trim();
        console.log(tmuxID, "this is my tmux id")
        const p = spawnSync(TMUX, ['ls', '-F', '#S']);
        const runningTMUXS = p.stdout.toString().trim().split("\n");
        console.log(runningTMUXS, "this is my alllllll tmux running")
        const currTmuxids = runningTMUXS.filter((entry) => entry.includes(tmuxID));
        console.log(currTmuxids, "this is my curr tmux running")
        return currTmuxids;

    }

}
function killtmux(PortNumber,appName , programName){
    const tmuxIds = getTmuxIds(PortNumber,appName , programName)
    if(!tmuxIds){
        return
    }
    for(let id of tmuxIds){
        spawnSync(TMUX, ['kill-session', '-t', id]);
    }
    return tmuxIds
}

function stalePort(removablePort,app,programName){
    const jamfolder = getJamFolder()
    if(!removablePort){
        return false;
    };
    if(!fs.existsSync(`${jamfolder}/ports/${removablePort}`)){
        return false;
    }
   
    const appNames = fs.readFileSync(`${jamfolder}/ports/${removablePort}`).toString().trim().split("\n");
    console.log("this is my program name :  ", programName)
    const dirName = (programName.split(".")[0])+"_"+app
    if(appNames.includes(dirName)){
        if(appNames.length === 1){
            fs.rmSync(`${jamfolder}/ports/${removablePort}`, { recursive: true, force: true });
            return true;

        }
        else{
            const newAppNames =  appNames.filter((appName) => appName !== dirName)
            console.log( newAppNames.join("\n"))
            fs.writeFileSync(`${jamfolder}/ports/${removablePort}`, newAppNames.join("\n"))
            return false;
        }
    }
    else{
        console.log("PORT DIR IS CORRUPTED")
        return false;
    }
}

function killMosquitto(removablePort){

    const result = spawnSync('lsof', ['-i', `tcp:${Number(removablePort)}`, '-sTCP:LISTEN', '-t']);
    if(result.error){
        return
    }
    const pid = result.stdout.toString().trim();
    spawnSync('kill', ['-9' ,pid]);

}

function killRedis(removablePort){
    const dport =  Number(removablePort)+20000
    spawnSync('redis-cli', ['-p', dport, 'shutdown']);
    console.log("REDIS CLEANED")
}

function cleanPort(removablePort,app,programName){
    const isPortStale = stalePort(removablePort,app,programName);
    if(isPortStale){
        killMosquitto(removablePort);
        killRedis(removablePort);
        return true
    }
    return false
    

}
function ArchiveLog(removablePort, appName, programName){
    const [jamfolder,appfolder,folder] = getPaths(programName,appName)
    console.log("CLEAN UP, PORT NUMBER:" ,  removablePort);
    console.log("CLEAN UP, app number" ,  appName);
    console.log("CLEAN UP, program NUMBER:" ,  programName);


    console.log(folder)
    if(fs.existsSync(`${folder}/${removablePort}`)){
        process.chdir(`${folder}/${removablePort}`);
        const logs = fs.readdirSync('.').filter( (entry) => entry.includes("log"))
        fs.writeFileSync(`${folder}/log`, "logs\n-------------\n" )
        console.log(logs)
        for(const log of logs){
            if(log.includes("j")){
                console.log("THIS NEEDS TO BE TESTE IN THE BG MODE")
                const data = fs.readFileSync(log)
                fs.appendFileSync(`${folder}/log`, `:\n-------------\n J Log:\n-------------\n`);
                fs.appendFileSync(`${folder}/log`, data);
            }
            else{
                console.log("WRITING WORKER LOG")
                const workerNumber = log.split(".")[1];
                const data = fs.readFileSync(log)
                fs.appendFileSync(`${folder}/log`, `\n-------------\n woker number ${workerNumber} Log:\n-------------\n`);
                fs.appendFileSync(`${folder}/log`, data);

            }
        }

    }
    process.chdir(`..`);
}
function cleanAppDir(removablePort,appName, programName){
    const [jamfolder,appfolder,folder] = getPaths(programName,appName)
    console.log(folder, "this is my folder")
    if(fs.existsSync(`${folder}/${removablePort}`)){
        try {
            console.log("removing")
            console.log(removablePort)
            fs.rmSync(`${folder}/${removablePort}`, { recursive: true, force: true });
            console.log("removedz")
        } catch (error) {
            console.log(error)
        }
        return true;
    }
    return false;
}

export function cleanup(removablePort, tmuxIds,app,TMUX){
    cleanPort(removablePort,app);
    ArchiveLog(removablePort);
    console.log("LOGS ARE ARCHIVED");
    cleanAppDir(removablePort);
    console.log("STOPPED PORT IS REMOVED GROM APP DIR");
    killtmux(tmuxIds,TMUX);
    console.log("STOPPED TMUX");
}

export function cleanByPortNumber(programName, appName, PortNumber, NOVERBOSE=true){
    if(!programName || !appName || !PortNumber){
        if(!NOVERBOSE)
            console.log("NO NEED FOR CLEANING")
        return;
    }

    console.log("LOGS ARE ARCHIVED");
    const tmuxIds = killtmux(PortNumber,appName ,programName);
    if(!NOVERBOSE &&  tmuxIds)
        console.log("Killed :", tmuxIds)

    const isPortCleaned = cleanPort(PortNumber,appName,programName);
    if(!NOVERBOSE && isPortCleaned ){
        console.log("Redis and mosquitto on port ",PortNumber, "are removed" )
    }
    ArchiveLog(PortNumber, appName, programName);
    if(!NOVERBOSE ){
        console.log("All logs are archived for", `${programName.split(".")[0]}_${appName} on port:${PortNumber}` )
    }
    const isDirCleaned = cleanAppDir(PortNumber, appName, programName);
    if(!NOVERBOSE && isDirCleaned ){
        console.log(`port ${PortNumber} is cleaned for ${programName.split(".")[0]}_${appName}`)
    }
};
