#!/usr/bin/env zx
import {getBatchArgs} from './parser.mjs'
import { spawnSync } from 'child_process';


import {
    body_1,
    header_1,
    header_2,
    body_sec,
    body_2,
    body_2_bold,
} from "./chalk.mjs";
let args;

function show_usage() {
    const usageMessage = `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jambatch`)}${body_1(
        ` --  a tool to run JXE files in batch`
    )}

    ${header_1(`SYNOPSIS`)}

    Usage: jambatch 

                [--help]
                [--fog = ${body_sec(`numProgram1-programName1,numProgram2-programName2`)}]
                [--device] = ${body_sec(`numProgram1-programName1,numProgram2-programName2`)}]
                [--cloud] = ${body_sec(`numProgram1-programName1,numProgram2-programName2`)}]
                [--cFile = ${body_sec(`cloudProg1File,cloudProg2File`)}]
                [--fFile = ${body_sec(`fogProg1File,fogProg2File`)}]
                [--dFile = ${body_sec(`deviceProg1File,deviceProg2File`)}]
                [--num = ${body_sec(`cNumProg1,CnumProg2`)}]
                [--cLoc = ${body_sec(`longCloudProg1,latCloudProg1-longCloudProg2-latCloudProg2`)}]
                [--fLoc = ${body_sec(`longFogProg1,latFogProg1-longFogProg2-latFogProg2`)}]
                [--dLoc = ${body_sec(`longDeviceProg1,latDeviceProg1-longDeviceProg2-latDeviceProg2`)}]
                [--cEdge= ${body_sec(`numEdgeCloudProg1,numEdgeCloudProg2`)}]
                [--fEdge= ${body_sec(`numEdgeFogProg1,numEdgeFogProg2`)}]
                [--dEdge= ${body_sec(`numEdgeDeviceProg1,numEdgeDeviceProg2`)}]

    ${header_1(`DESCRIPTION`)}
  
    
    --- jambatch.mjs --help
    ${body_2("--help : use this flag to display this usage message.")}

    --- jambatch.mjs program.jxe --fog=2-XX,3-X --fFile=1-jt2.jxe,2-jt3.jxe,2-jt4.jxe [--fLoc=300,300-400,400] [fEdge=1]
    ${body_2_bold(`note: --fog and fFilen prefix numbers should add up to the same number. ex)2+3 = 1+2+2.`)}
    ${body_2("the command abouve executes the following commands synchronously:")}
    ${body_2(`jamrun.mjs jt2.jxe --app=XX --loc=300,300 --edge=1 --bg --log --fog`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=XX --loc=400,400 --bg --log --fog`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=X  --bg --log --fog`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --fog`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --fog`)}


    --- jambatch.mjs program.jxe --cloud=2-XX,3-X --cFile=1-jt2.jxe,2-jt3.jxe,2-jt4.jxe [--cLoc=300,300-400,400] [cEdge=1]
    ${body_2_bold(`note: --cloud and cFilen prefix numbers should add up to the same number.ex) 2+3 = 1+2+2.`)}
    ${body_2("the command abouve executes the following commands synchronously:")}
    ${body_2(`jamrun.mjs jt2.jxe --app=XX --loc=300,300 --edge=1 --bg --log --cloud`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=XX --loc=400,400 --bg --log --cloud`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=X  --bg --log --cloud`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --cloud`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --cloud`)}
    
    --- jambatch.mjs program.jxe --device=2-XX,3-X --dFile=1-jt2.jxe,2-jt3.jxe,2-jt4.jxe [--dLoc=300,300-400,400] [dEdge=1] [num=2,3,1]
    ${body_2_bold(`note: --cloud and cFilen prefix numbers should add up to the same number.ex) 2+3 = 1+2+2.`)}
    ${body_2("the command abouve executes the following commands synchronously:")}
    ${body_2(`jamrun.mjs jt2.jxe --app=XX --loc=300,300 --edge=1 --bg --log --device --num=2`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=XX --loc=400,400 --bg --log --device --num=3`)}
    ${body_2(`jamrun.mjs jt3.jxe --app=X  --bg --log --device --num=1`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --device`)}
    ${body_2(`jamrun.mjs jt4.jxe --app=X  --bg --log --device`)}
    

    ${header_2(
        `1) The --bg and --log flags are always set using jambatch.mjs.`
    )}
    ${header_2(
        `2) No possibility running remote jobs using batch mode.`
    )}
    `;
    
    console.log(usageMessage);
}

try {
    args = getBatchArgs(process.argv);
} catch (error) {
    console.log(show_usage())
    error.message === "SHOW USAGE" ? null : console.log(error);
    process.exit(1);
}
if(args.config){

    const jsonString = fs.readFileSync(args.config);
    const jobs = JSON.parse(jsonString).jobs;
    let spawnPipe = 'inherit'
    console.log(args.verb)
    if(!args.verb){
        spawnPipe = ['ignore', 'ignore', 'inherit']

    }
    for(let i = 0 ; i < jobs.length ; i++){
        if(!jobs[i].name){
            console.log(`job number ${i+1} is missing name, it will be skipped`)
            continue;
        }
        if(!jobs[i].file){
            console.log(`job number ${i+1} is missing file name, it will be skipped`)
            continue;
        }
        if(!jobs[i].type){
            console.log(`job type missing, it will be skipped`)
            continue;
        }

        const exec = `jamrun.mjs ${jobs[i].file} --app=${jobs[i].name} --bg --log --${jobs[i].type}`
        console.log(jobs.verb)
        if(jobs.num)
            exec + ` --num=${jobs.num}`  
        if(jobs.loc)
            exec + ` --num=${jobs.loc}`  
        if(jobs.edge)
            exec + ` --num=${jobs.edge}`  
        if(jobs.verb)
            exec + ` --verb`  
            

        if(args.verb){
            console.log(`${body_sec(`Starting job number: ${i+1} - ${exec}`)}`)
        }
        spawnSync('zx', [exec], {
            stdio: spawnPipe, 
            shell: true       
        });
    }
    process.exit(0)
}
for(let arg of args){
    if(args.verb){
        console.log(`${body_sec(`Starting new job number: jamrun.mjs ${arg}`)}`)
    }
    spawnSync('zx', ['jamrun.mjs'].concat(arg), {
        stdio: spawnPipe, 
        shell: true       
    });
}
