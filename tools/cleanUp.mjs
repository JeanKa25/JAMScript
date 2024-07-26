#!/usr/bin/env zx
import {getJamFolder,getAppFolder, getPaths} from './fileDirectory.mjs'
const { spawnSync } = require('child_process');
const p = spawnSync('which', ['tmux']);
const TMUX = p.stdout.toString().trim()

function getTmuxIds(PortNumber,appName , programName){
    const [jamfolder,appfolder,folder] = getPaths(programName,appName);
    if(fs.existsSync(`${folder}/${PortNumber}/tmuxid`)){

        const tmuxID = fs.readFileSync(`${folder}/${PortNumber}/tmuxid`).toString().trim();
        const p = spawnSync(TMUX, ['ls', '-F', '#S']);
        const runningTMUXS = p.stdout.toString().trim().split("\n");
        const currTmuxids = runningTMUXS.filter((entry) => entry.includes(tmuxID));
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
    const dirName = (programName.split(".")[0])+"_"+app
    if(appNames.includes(dirName)){
        if(appNames.length === 1){
            fs.rmSync(`${jamfolder}/ports/${removablePort}`, { recursive: true, force: true });
            return true;

        }
        else{
            const newAppNames =  appNames.filter((appName) => appName !== dirName)
            fs.writeFileSync(`${jamfolder}/ports/${removablePort}`, newAppNames.join("\n"))
            return false;
        }
    }
    else{
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
    console.log(folder)
    if(fs.existsSync(`${folder}/${removablePort}`)){
        process.chdir(`${folder}/${removablePort}`);
        const logs = fs.readdirSync('.').filter( (entry) => entry.includes("log"))

        if(!logs || logs.length === 0 ){
            return
        }     
        if(!fs.existsSync(`${folder}/log/${removablePort}`,{recursive: true})){
            fs.mkdirSync(`${folder}/log/${removablePort}`,{recursive: true});
        }
        fs.writeFileSync(`${folder}/log/${removablePort}/log.c`,"----")
        fs.writeFileSync(`${folder}/log/${removablePort}/log.j`,"----")   
        for(const log of logs){
            if(log.includes("j")){
                const data = fs.readFileSync(log)
                fs.appendFileSync(`${folder}/log/${removablePort}/\n-------------\nlog.j`, data);
            }
            else{
                const workerNumber = log.split(".")[1];
                const data = fs.readFileSync(log)
                fs.appendFileSync(`${folder}/log/${removablePort}/log.c`, `\n-------------\nworker number ${workerNumber}:`);
                fs.appendFileSync(`${folder}/log/${removablePort}/log.c`, data);

            }
        }

    }
    process.chdir(`..`);
}
function cleanAppDir(removablePort,appName, programName){
    const [jamfolder,appfolder,folder] = getPaths(programName,appName)
    if(fs.existsSync(`${folder}/${removablePort}`)){
        try {
            fs.rmSync(`${folder}/${removablePort}`, { recursive: true, force: true });
        } catch (error) {
        }
        return true;
    }
    return false;
}

function markPause(PortNumber,appName ,programName){
    const appfolder = getAppFolder()
    const pName = programName.split(".")[0]
    fs.writeFileSync(`${appfolder}/${pName}_${appName}/${PortNumber}/paused`, `${PortNumber}`)
}
export function cleanup(removablePort, tmuxIds,app,TMUX){
    cleanPort(removablePort,app);
    ArchiveLog(removablePort);
    cleanAppDir(removablePort);
    killtmux(tmuxIds,TMUX);
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

export function pauseByPortNumber(programName, appName, PortNumber, NOVERBOSE=true){
    if(!programName || !appName || !PortNumber){
        if(!NOVERBOSE)
            console.log("NO NEED FOR CLEANING")
        return;
    }
    const tmuxIds = killtmux(PortNumber,appName ,programName);
    if(!NOVERBOSE &&  tmuxIds)
        console.log("Killed :", tmuxIds)
    markPause(PortNumber,appName ,programName)

};