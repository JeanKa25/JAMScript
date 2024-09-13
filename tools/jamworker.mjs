#!/usr/bin/env zx
import { jamrunParsArg, getWorkerArgs } from "./parser.mjs";
import { fileURLToPath } from "url";
import { cleanByPortNumber } from "./cleanUp.mjs";
import { dirname, resolve } from "path";
import { getCargs } from "./parser.mjs";

import {
    fileDirectorySetUp,
    isValidExecutable,
    fileDirectoryMqtt,
    getPaths,
    getAppFolder,
    getappid,
    getFolder,
    cleanExecutables,
    getJamFolder,
    getFileNoext,
} from "./fileDirectory.mjs";
const { spawn } = require("child_process");
import { Client } from "ssh2";
import {
    body_1,
    header_1,
    header_2,
    body_sec,
    keyWord,
    bodyBold,
    body_2,
    body_2_bold,
    body_sec_warning,
} from "./chalk.mjs";


const { spawnSync } = require('child_process');
const p = spawnSync('which', ['tmux']);
const TMUX = p.stdout.toString().trim()

function show_usage(){
    const usageMessage = 
    `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jamWorker`)}${body_1(` --  a tool to modify workers on the fly.`)}

    ${header_1(`SYNOPSIS`)}

    Usage: jamWorker 
                [--help]
                [--remove=${body_sec(`tmuxTagToRemove`)}]
                [--add=${body_sec(`numWorkerToAdd`)}]
                [--removeBatch=${body_sec(`numWorkerToRemove`)}]
                [--app=${body_sec(`appName`)}]
                [--prog=${body_sec(`programName`)}]
                [--port=${body_sec(`portNum`)}]
                [--verb]
                [--log]

    ${header_1(`DESCRIPTION`)}

    --- ${keyWord('jamWorker')} needs to have at least one of --add, --remove, --removeBatch.

    --- jamWorker --add=3 --app=X --prog=jt2 --port=1883 [--verb] [--log]
    ${body_2(`The command above adds three workers to the running app with the given criteria.`)}
    ${body_2_bold(`NOTE: 
    Using --add without any of --app, --prog, --port will cause a graceful termination with no modification to workers.`)}

    --- jamWorker --remove=tg-34583-2 [--verb]
    ${body_2(`The command above removes the worker running on tmux with such tmuxID if it exists.`)}
    
    --- jamWorker --removeBatch=4 [--verb]
    ${body_2(`The command above removes the last 4 added workers. If there are fewer than 4 workers running, they will all be removed.`)}
    ${body_2_bold(`NOTE: 
    Using --removeBatch without any of --app, --prog, --port will cause a graceful termination with no modification to workers.`)}

    `;
   
    console.log(usageMessage)
}

function isFileActive(args){
    const port = args.port;
    const app = args.app;
    const prog = args. prog;
    const appFolder = getJamFolder();
    if(fs.existsSync(`${appFolder}/ports/${port}`)){
        const activeApps = fs.readFileSync(`${appFolder}/ports/${port}`).toString().trim().split('\n')
        if(activeApps.includes(`${prog}_${app}`)){
            return true;
        }
        else{
            return false;
        }

        
    }
    else{
        return false
    }
}


function isFileDirectoryCorrupted(args){
    const appFolder = getFolder(args.prog , args.app);
    if(!fs.existsSync(`${appFolder}/${port}`)){
        return true
    }
    return false

}

function isDevice(args){
    const appFolder = getFolder(args.prog , args.app)
    const type = fs.readFileSync(`${appFolder}/${args.port}/machType`).toString().trim()
    if(type === "device"){
        return true
    }
    else{
        return false
    }
}

// function getTmuxIds(portNum, appName , programName){
//     const [jamfolder,appfolder,folder] = getPaths(programName,appName);
//     if(fs.existsSync(`${folder}/${portNum}/tmuxid`)){
//         const tmuxID = fs.readFileSync(`${folder}/${portNum}/tmuxid`).toString().trim();
//         const p = spawnSync(TMUX, ['ls', '-F', '#S']);
//         const runningTMUXS = p.stdout.toString().trim().split("\n");
//         const currTmuxids = runningTMUXS.filter((entry) => entry.includes(tmuxID));
//         return currTmuxids;

//     }
//     else{
//         console.log(`${body_sec_warning(`appName: ${appName}, programName: ${programName} on port ${portNum} has no tmux`)}`)
//     }
// }

async function getRunningTmux(args){
    const app = args.app;
    const prog = args.prog;
    const port = args.port;
    const [jamfolder, appfolder, folder] = getPaths(prog,app);
    if(fs.existsSync(`${folder}/${port}/tmuxid`)){
        const tmuxID = fs.readFileSync(`${folder}/${port}/tmuxid`).toString().trim();
        const process = await $`${TMUX} ls | grep ${tmuxID}`
        const activeCfiles = ((process.stdout.toString().trim().split('\n'))).map((entry) => (entry.split(":")[0])).filter((entry) => !entry.includes(`${tmuxID}-j`))
        return activeCfiles;
    }
    else{
        if(args.verb){
            console.log(`${body_sec_warning(`appName: ${app}, programName: ${prog} on port ${port} has no tmux tag`)}`)
        }
    }

}

function getGenericTag(args){
    const appFolder = getFolder(args.prog, args.app);
    if(fs.existsSync(`${appFolder}/${args.port}/tmuxid`)){
        return fs.readFileSync(`${appFolder}/${args.port}/tmuxid`).toString().trim();
    }
    else{
        if(args.verb){
            console.log(`${body_sec_warning(`appName: ${args.app}, programName: ${args.prog} on port ${args.port} has no tmux tag`)}`)
            console.log(`${body_sec_warning(`script is terminating. No worker modification applied.`)}`)

        }
        process.exit(0)
    }
}

function getLastTagNum(args){
    const appFolder = getFolder(args.prog, args.app);
    if(fs.existsSync(`${appFolder}/${args.port}`)){
        const cfilesNum = (((fs.readdirSync(`${appFolder}/${args.port}`)).filter((entry) => entry.includes("cdevProcessId"))).map((entry) => entry.split(".")[1]))
        if(cfilesNum.length === 0 ){
            return 0;
        }
        return Math.max(...cfilesNum);
    }
    else{
        if(args.verb){
            console.log(`${body_sec_warning(`no cfile is running for appName: ${args.app}, programName: ${args.prog} on port ${args.port}`)}`)
            console.log(`${body_sec_warning(`script is terminating. No worker modification applied.`)}`)
        }
        process.exit(0)

    }
}
function getLastTag(args){
    const genericTag = getGenericTag(args)
    const lastNum = getLastTagNum(args)
    return {genericTag: genericTag, lastNum: lastNum }
}
async function addWorker(args){
    const [jamfolder, appfolder, folder] = getPaths(args.prog, args.app);
    const {genericTag,lastNum} = getLastTag(args)
    console.log(lastNum, "lst num")
    console.log("this is my generic tag", genericTag)
    let workerNum = lastNum+1;
    const toAdd = args.add;
    const jappid = getappid(jamfolder, `${folder}/${args.port}`, args.app, appfolder);
    const dataStorePort = args.port + 20000
    const group = fs.readFileSync(`${folder}/${args.port}/group`).toString().trim()
    
    if (fs.existsSync(`${folder}/a.out`)) {
        await $`cd ${folder} && chmod +x a.out`;
    }
    else{
        if(args.verb){
            console.log(`${body_sec_warning(`a.out does not exist for appName: ${args.app}, programName: ${args.prog} on port ${args.port}`)}`)
            console.log(`${body_sec_warning(`file directory is corrupted.`)}`)
            console.log(`${body_sec_warning(`script terminated with no worker adjustment`)}`)
        }
        process.exit(0)
    }
    let counter = 0
    while (counter < toAdd) {
        if (fs.existsSync(`${folder}/a.out`)) {
            const argObject = {
                "-a": jappid.toString(),
                "-p": args.port,
                "-n": workerNum,
                "-g": group,
                "-t": genericTag,
                "-o": dataStorePort,
            };
            let cargs = getCargs(argObject);
            if (args.verb) {
                console.log(`${body_sec(
                    `C node args: ${cargs}`
                )}`);
            }
            await $`${TMUX} new-session -s ${genericTag}-${workerNum} -c ${folder} -d`;
            if (!args.log) {

                    await $`${TMUX} send-keys -t ${genericTag}-${workerNum} ./a.out ${cargs} C-m`;
            } else {
 
                    await $`${TMUX} send-keys -t ${genericTag}-${workerNum} "script -a -t 1 ${folder}/${args.port}/log.${workerNum} ./a.out" ${cargs} C-m`;
            }
            workerNum++
            counter++;
            if(args.verb){
                console.log(`${body_sec(`new worker was, tmux id:${genericTag}-${workerNum}`)}`)
            }
        }
        else{
            if(args.verb){
                console.log(`${body_sec_warning(`a.out removed mid operation`)}`)
                console.log(`${body_sec_warning(`file directory is corrupted.`)}`)
                console.log(`${body_sec_warning(`only ${counter} worker was added`)}`)
            }
            process.exit(1)
        }

    }
}
async function removeWorker(args){
    const p = await $`${TMUX} ls`
    const exists = (((p.stdout.toString().trim().split('\n'))).map((entry) => (entry.split(":")[0])).filter((entry) => entry === args.remove)).length === 0 ? false : true
    if(!exists){
        if(args.verb){
            console.log(`${body_sec_warning(`there is no worker running on TMUXID : ${args.remove}`)}`)
        }
        process.exit(1)
    }
    spawnSync(TMUX, ['kill-session', '-t', args.remove]);
    if(args.verb){
        console.log(`${body_sec(`worker removed. tmuxID: ${args.remove}`)}`)
    }

}

async function removeWorkerBatch(args){
    const workersTmux = await getRunningTmux(args)
    if(workersTmux.length === 0 ){
        console.log(`${body_sec_warning(`No running worker available`)}`)
        process.exit(0);

    }
    if(args.verb){
        if(workersTmux.length < args.removeBatch){
            console.log(`${body_sec_warning(`cant't remove ${args.removeBatch} workers. there is only ${workersTmux.length} active worker`)}`)
            console.log(`${body_sec(`all workers will be removed`)}`)
        }
        else{
            console.log(`${body_sec(`${args.removeBatch} workers will be removed`)}`)

        }
    }
    const counter = workersTmux.length < args.removeBatch ? workersTmux.length:args.removeBatch
    for(let i = 0; i<counter; i++){
        const toRemove =workersTmux.pop();
        spawnSync(TMUX, ['kill-session', '-t', toRemove]);
        if(args.verb){
            console.log(`${body_sec(`worker removed. tmuxID: ${toRemove}`)}`)
        }
    }
}

async function main(){
    let args;

    try {
        args = getWorkerArgs(process.argv);
    } catch (error) {
        console.log(error)
        error.message === "SHOW USAGE" ? show_usage() : console.log(error.message);
        process.exit(1);
    }

    if(!isFileActive(args)){
        if(args.verb){
            console.log(`${body_sec_warning(`appName: ${args.app}, programName: ${args.prog} is not running on port ${args.port}`)}`)
            console.log(`${body_sec_warning("new worker was not added")}`)
        }
        process.exit(1)
    }

    if(!isFileDirectoryCorrupted){
        if(args.verb){
            console.log(`${body_sec_warning(`appName: ${args.app}, programName: ${args.prog} is not running on port ${args.port}`)}`)
            console.log(`${body_sec_warning("port file is corrupted")}`)
            console.log(`${body_sec_warning("worker is not added")}`)
            console.log(`${body_sec_warning("RUN: jamkill.mjs --reset")}`)
        }
        process.exit(1)
    }
    if(!isDevice(args)){
        if(args.verb){
            console.log(`${body_sec_warning(`appName: ${args.app}, programName: ${args.prog} is on port ${args.port} is not a device`)}`)
            console.log(`${body_sec_warning(`No worker modification applied`)}`)
        }
        process.exit(1)

    }

    if(args.mode === "add"){
        await addWorker(args)
    }
    if(args.mode === "remove"){
        await removeWorker(args)
    }
    if(args.mode === "removeBatch"){
        await removeWorkerBatch(args)
    }

    
}
main()