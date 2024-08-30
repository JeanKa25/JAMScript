#!/usr/bin/env zx  

import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
import { Client } from 'ssh2';
import { getTermArgs } from "./parser.mjs";
import { header_1,header_2 , body_1, body_sec, keyWord, body_2,body_2_bold } from "./chalk.mjs";
const { spawnSync } = require('child_process');
const MAIN_SESH_NAME = "main"
const p = spawnSync('which', ['tmux']);
const MYTMUX = p.stdout.toString().trim()

function show_usage(){
    const usageMessage = 
    `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jamterm`)}${body_1(` --  a tool to display multiple C node outputs live`)}

    ${header_1(`SYNOPSIS`)}

    Usage: jamterm 
                [--help]
                [--all]
                [--remote=${body_sec(`IPAddress`)}] //NOT IMPEMENTED YET
                [--app==${body_sec(`appName`)}]
                [--prog==${body_sec(`programName`)}]
                [--port==${body_sec(`portNum`)}]
                [--pane]=${body_sec(`maxNumPane`)}]


    ${header_1(`DESCRIPTION`)}

    --- ${keyWord('jamterm')} by default displays all the running C node and J nodes outputs in the different panes.


    ${keyWord('restrictions')}:

    ${body_2(`2) various factors like the size of screen, terminal and resolution effects the number of
    possible tmuxes to display.Maybe try a bigger screen `)}

    --- jamterm [--help]
    ${body_2(`Use this flag to display this usage msg.`)}
    
    --- jamterm [--all]
    ${body_2(`Use this flag to display all running C nodes.`)}
    ${body_2_bold(`NOTE: 
    2) If --all used with --all flag --app, --prog, --port, they will be disabled.`)}

    --- jamterm [--remote]
    ${body_2(`NOT IMPLEMENTED YET`)}
    
    --- jamterm [--app==X]
    ${body_2(`Use this flag to display C nodes of programs with a specific appName.`)}

    --- jamterm [--prog==X]
    ${body_2(`Use this flag to display C nodes of programs with a specific programName.`)}

    --- jamterm [--port=3]
    ${body_2(`Use this flag to display C nodes of programs running on a certain port.`)}

    --- jamterm [--pane=3]

    
    NOTE: 
    ${body_2(`1) --app & --prog & --port can be used all together or two by two to which programs to display. `)}
    ${body_2(`2) To set --app , --prog and --port options two equal signs has to be used.`)}


    RESTRICTIONS: 
    ${body_2(`single command cannot have multiple --app , --prog and --port conditions to kill apps with different appNames, 
    programNames and portNumbers in one shot.`)}

    `;
   
    console.log(usageMessage)
}

function getRunningDirs(){
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
function dirNameToProgramName(dirName){
    return (dirName.split('_'))[0]
}
function dirNameToAppName(dirName){
    const dir = dirName.split('_')
    if(dir.length > 2){
        return (dir.filter((_,index) => index !== 0)).join("_")
    }
    else{
        return dir[1];
    }
    
}

function getPrograms(root=null){
    const toGet=[];
    const activeDirs = getRunningDirs();
    const appfolder = getAppFolder()

    for(let dir of activeDirs.keys()){
        for(let port of activeDirs.get(dir)){
            if(root){
                try{
                    const rootIP = fs.readFileSync(`${appfolder}/${dir}/${port}/root`).toString().trim();
                    if(rootIP === root){
                        const info = 
                        {
                            path: `${appfolder}/${dir}/${port}`,
                            prog : dirNameToProgramName(dir),
                            app : dirNameToAppName(dir),
                            port : port
                        }
                        toGet.push(info)
                    }
                }
                catch(error){
                    continue;
                }
            }
            else{
                const info = 
                {
                    path: `${appfolder}/${dir}/${port}`,
                    prog : dirNameToProgramName(dir),
                    app : dirNameToAppName(dir),
                    port : port

                }

                toGet.push(info)
            }
        }
    }

    return toGet
}
function filter(data, filters){
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
async function getTmuxSessions(filteredData){
    const tmux_sesh = new Map()

    for(let data of filteredData){
        if(!fs.existsSync(`${data.path}/tmuxid`)){
            continue;
        }
        const tmuxID = fs.readFileSync(`${data.path}/tmuxid`).toString().trim()
        
        const p = await $`${MYTMUX} ls | grep ${tmuxID}`.nothrow().quiet()
        if(p.stdout.toString() === ""){
            continue;
        }
        const tmuxSessions = (p.stdout.toString().trim().split("\n")).map((entry) => entry.split(":")[0])
        let counter = 1;
        for(let tmuxSession of tmuxSessions){
            const tag  = data.prog+"_"+data.app+"_"+data.port+"_"+(tmuxSession.includes("j") ? "J" : `C.${counter}`);
            tmux_sesh.set(tag, tmuxSession)
            counter++
        }
    }
    return tmux_sesh
}


async function split(number) {

    const targetSesh = `${MAIN_SESH_NAME}`;
    let counter=1;
    let splitDir = "-v"
    let currPane=0
    let NexFlag = false
    while(counter < number){
        try{
            if(NexFlag){
                currPane++;
                NexFlag = false;
            }



            await $`${MYTMUX} split-window ${splitDir} -t ${targetSesh}.${currPane}`.quiet()

            counter++;
        }
        catch(error){




            if(error.stderr.toString().trim() === "no space for new pane"){
                if(currPane >= counter){
                    throw new Error("Screan or terminal to small for displaying the tmux sessions")
                }
                if(splitDir === "-v"){

                    splitDir = "-h"
                }
                else{


                     splitDir = "-v"
                     NexFlag = true
                }

            }
            else{
                throw error;
            }

        }
    }


}



function parsArgs(){
    let args;

    try {
        args = getTermArgs(process.argv);
    } catch (error) {
        show_usage();
        error.message === "SHOW USAGE" ? null : console.log(error.message);
        process.exit(1);

    }
    return args
}
async function creatMainSesh(){
    try{
        await $`${MYTMUX} new-session -d -s ${MAIN_SESH_NAME}`.quiet();
        return;
    }
    catch(error){
        if((error.stderr.toString().trim()).includes("duplicate session")){
            await $`${MYTMUX} kill-session -t ${MAIN_SESH_NAME}`;
        }
        else{
           throw error
        }
    }
    await $`${MYTMUX} new-session -d -s ${MAIN_SESH_NAME}`;
}

async function setUpTmux(sessionMap, number){

    await split(number)
    await $`${MYTMUX} select-layout -t ${MAIN_SESH_NAME} tiled`;
    let counter = 0



    for(let tag of sessionMap.keys()){
        if(counter === number){
            break;
        }


        await $`unset TMUX;${MYTMUX} select-pane -t ${MAIN_SESH_NAME}.${counter}`;

        await $`${MYTMUX} select-pane -T ${tag}`;
        counter++;
        
    }



    counter = 0;
  
    for(let tag of sessionMap.keys()){

        const tmuxID = sessionMap.get(tag)
        const myTag = `${tag}`

        await $`${MYTMUX} select-pane -t ${tmuxID}:0 -T ${myTag}`;
        counter++;
        
    }

    counter = 0;


    for(let tag of sessionMap.keys()){
        if(counter === number){
            break;
        }
        const tmuxID = sessionMap.get(tag)
        await $`${MYTMUX} send-keys -t ${MAIN_SESH_NAME}.${counter} 'unset TMUX; ${MYTMUX} attach -t ${tmuxID}' C-m`;
        counter++;
        
    }
}

async function main(){
    const args = parsArgs()
    const data = getPrograms()
    let filters ={}
    if(args.prog){
        filters["prog"] = `${args.prog}`
    }
    if(args.app){
        filters["app"] = args.app
    }
    if(args.port){
        filters["port"] =  args.port
    }
    const filteredData= args.all ? data : filter(data,filters);
    if(filteredData.length === 0){
        console.log("NO TMUX TO DISPLAY")
        process.exit(0)
    }
    const sessionMap = await getTmuxSessions(filteredData);
    if(sessionMap.size === 0 ){
        console.log("NO TMUX TO DISPLAY")
        process.exit(0)
    }

    const MAX_TMUX_NUM = args.pane > sessionMap.size ? sessionMap.size : args.pane;
    await creatMainSesh();
    await setUpTmux(sessionMap,MAX_TMUX_NUM );
    await $`${MYTMUX} a -t ${MAIN_SESH_NAME}`;
}

(async()=>{main()})()

