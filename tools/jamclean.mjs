#!/usr/bin/env zx
import {getcleanArgs} from "./parser.mjs"
import { getJamFolder } from "./fileDirectory.mjs";



// async function getJobsSubDirMap(){
//     const subDirMap = new Map()
//     const subdirs = (((await fs.readdir(process.cwd())).map(entry => entry.split("_"))).filter(entry => entry.length > 1))
//     for(let dir of subdirs){
//         if(dir.length > 2){

//             const head = dir[0]
//             const tail =(dir.filter((_,index) => index !== 0)).join("_")
//             const dirName = dir.join("_")



//             subDirMap.set(tail, dirName)

//         }
//         else{
//             const head = dir[0]
//             const tail = dir[1];
//             const dirName = dir.join("_")
//             subDirMap.set(tail, dirName)
//         }
//     }
//     return subDirMap;
// }
// async function getPortSubDir(){
//     const ports = (((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name))
//     if(ports.length !== 0){
//         return ports
//     }
// }

// export async function cleanUp(){
//     try{
//         getcleanArgs(process.argv)
       
//       }
//       catch(error){
//         if(error.type === "ShowUsage"){
//             console.log(
//         `

//         Usage: jamclean
//         Purges inactive JAMScript programs from the listing.

//         `
//             )
//         }
//         process.exit(1);
//     }
//     const jamfolder = getJamFolder();
//     if(!fs.existsSync(jamfolder)){
//         process.exit(0)
//     }
//     process.chdir(`${jamfolder}/apps`);
//     const appsMap = await getJobsSubDirMap();
//     for(let app of appsMap.keys()){
       
//         process.chdir(`${appsMap.get(app)}`);
//         console.log(process.cwd(), "this is my app dir")
//         const ports  = await getPortSubDir();
//         console.log(process.cwd(), "this is my portDir dir")
//         if(ports){
//             console.log(process.cwd(), "this is my portDir dir")
//             for(let port of ports){
//                 console.log(process.cwd(), "this is my portDir dir")
//                 let isRunning
//                 console.log(port, "this is my port")
//                 console.log(process.cwd(), "this is my portDir dir")
//                 process.chdir(`${port}`);
//                 const toCheck = (fs.existsSync("processId")) ? fs.readFileSync("processId") : fs.readFileSync("shellpid")
//                 try{
//                     const p = await $`ps -p ${toCheck} | grep node | wc -l | tr -d '[:space:]'` 
//                     isRunning = true
//                 }
//                 catch(error){
//                     isRunning = false;
//                 }
//                 process.chdir("..")
//                 if(!isRunning){
//                     await $`rm -rf ./${port}`
//                 }
//             }
//         }
//         process.chdir("..")
//     }
// }


function hardReset(){
    const jamFolder = getJamFolder()
    fs.rmSync(`${jamFolder}/apps`, { recursive: true, force: true });
    fs.rmSync(`${jamFolder}/ports`, { recursive: true, force: true });
}3

function main(){
    let arg;
    try{
        arg = getcleanArgs(process.argv)
    }
    catch(error){
        throw error
    }
    if(arg === "reset"){
        hardReset()
    }
}

main()