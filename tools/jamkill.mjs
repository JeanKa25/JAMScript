#!/usr/bin/env zx
import { getAppFolder, getJamFolder } from "./fileDirectory.mjs";
import {getKilltArgs} from "./parser.mjs"

/*
 * 1)shouldn't kill last kill the last running job in the packground instead of the last job itself?
    2) we kill based on app name but not the program name for some reason(ex. jt2,jt3 with appname shahin will both be killed and no way to seperate them apart from each others)(we can use the pattern)
    3)discuss the new kill app appriach
    4)what id the app is not found?
    5)what if you run jamKill with no args back to back?
    6)what is app_id exactly?
    7)app and appId concept is mixed up in my head I don't think it is what it should  be()
    8) how does the default name works?
 */


async function killtmux(tmuxid){
    try{
        console.log("curr address", process.cwd())
        console.log(`${tmuxid}`)
        const p = await $`tmux ls | grep ${tmuxid} | cut -d ':' -f 1`;
        const tmuxList = p.stdout.toString().trim().split("\n")
        for(let tmux of tmuxList){
                console.log("list of tmuxes" , tmuxList)
                await $`tmux kill-session -t ${tmux}`
        }
    }
    catch(error){
    }
}


async function killprocess(){
    if(fs.existsSync("./shellpid")){
        const pid = fs.readFileSync("./shellpid").toString().trim();
        let exists;
        try {
            const p = await $`ps -p ${pid} | grep jamrun | wc -l | tr -d '[:space:]'`
            exists = Number(p.stdout.trim());
        } catch (error) {
            exists = 0 
        }
        if(exists){
            console.log(`Killing process ${pid}`)
            process.kill(pid);
        }
    }
    if(fs.existsSync("./processId")){
        const pid = fs.readFileSync("./processId").toString().trim();
        let exists;
        try {
            const p = await $`ps -p ${pid} | grep node | wc -l | tr -d '[:space:]'`
            exists = Number(p.stdout.trim());
        } catch (error) {
            exists = 0 
        }
        if(exists){
            console.log(`Killing process ${pid}`)
            process.kill(pid);
        }
        try {
            const port = process.cwd().split("/").pop()
            const p = await $`ps ax | grep node | grep ${port} | cut -d ' ' -f 2 | tr -d '[:space:]'`
            exists = Number(p.stdout.trim());
        } catch (error) {
            exists = 0 
        }
        if(exists){
            console.log(`Killing process ${pid}`)
            process.kill(pid);
        }


    }
}
async function getJobsSubDirMap(){
    const subDirMap = new Map()
    const subdirs = (((await fs.readdir(process.cwd())).map(entry => entry.split("_"))).filter(entry => entry.length > 1))
    for(let dir of subdirs){
        if(dir.length > 2){

            const head = dir[0]
            const tail =(dir.filter((_,index) => index !== 0)).join("_")
            const dirName = dir.join("_")



            subDirMap.set(tail, dirName)

        }
        else{
            const head = dir[0]
            const tail = dir[1];
            const dirName = dir.join("_")
            subDirMap.set(tail, dirName)
        }
    }
    return subDirMap;
}

async function getPortSubDir(){
    const ports = (((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name))
    if(ports.length !== 0){
        return ports
    }
}

async function killAll(){
    const appsMap = await getJobsSubDirMap();
    for(let app of appsMap.keys()){
        process.chdir(`./${appsMap.get(app)}`);
        const ports  =await  getPortSubDir();
        if(ports){
            for(let port of ports){
                process.chdir(`./${port}`);
                await killprocess()
                if(fs.existsSync("./tmuxid")){
                    await killtmux(fs.readFileSync("./tmuxid").toString().trim());
                }
                process.chdir("..")
            }
        }
        process.chdir("..")
    }
}
//brute force approach(safest but not best)
async function killjob(jobName){
    const appsMap = await getJobsSubDirMap();
    for(let app of appsMap.keys()){

        process.chdir(`./${appsMap.get(app)}`);
        const ports  = await getPortSubDir();
        if(ports){
            for(let port of ports){
                process.chdir(`./${port}`);
                if(fs.existsSync("./appid")){
                    const appId = fs.readFileSync("./appid").toString().trim()
                    if(appId === jobName){
                        await killprocess()
                        if(fs.existsSync("./tmuxid")){
                            await killtmux(fs.readFileSync("./tmuxid").toString().trim());
                        }
                        
                    }
                }
                process.chdir("..")
            }
        }
        process.chdir("..")
    }
}
//More effiecent in time but vonurable to problems
// async function killjob_V2(lastRunningJob){
//     const jobId = lastRunningJob;
//     const subdirs = (((await fs.readdir(process.cwd())).map(entry => entry.split("_"))).filter(entry => entry.length > 1))
//     let jobFolder;
//     for(let dir of subdirs){
//         if(dir.length > 2){
//             const head = dir[0];
//             const tail =(dir.filter((_,index) => index !== 0)).join("_")
//             if(tail === jobId){
//                 jobFolder = `${head}`+"_"+`${tail}`
//                 process.chdir(`./${jobFolder}`)
//                 const dirs = ((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name);
//                 await killprocess()
//                 if(fs.existsSync("./tmuxid")){
//                     const tmuxid = fs.readFileSync("./tmuxid").toString().trim()
//                     await killtmux(tmuxid)
//                 }

//             }
//         }
//         else{
//             const head = dir[0];
//             const tail = dir[1];
//             if(tail === jobId){
//                 jobFolder = `${head}`+"_"+`${tail}`
//                 await killprocess()
//                 if(fs.existsSync("./tmuxid")){
//                     const tmuxid = fs.readFileSync("./tmuxid").toString().trim()
//                     await killtmux(tmuxid)
//                 }
//             }
//             else if( tail === "app-n" ){
//                 process.chdir("./app-n")
//                     const dirs = ((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name);
//                     for(let dir of dirs){
//                         process.chdir(`./${dir}`)
//                         if(fs.existsSync('./appid')){
//                             const id = fs.readFileSync('./appid').toString().trim()
//                             if(id === jobId ){
//                                 await killprocess()
//                                 if(fs.existsSync("./tmuxid")){
//                                     const tmuxid = fs.readFileSync("./tmuxid").toString().trim();
//                                     await killtmux(tmuxid);
//                                 }
//                             }
//                         }
//                         process.chdir('..')
//                     }
//                 process.chdir('..')
//             }
//         }
//     }


// }
async function main(){

  let arg;

  try{
    arg = getKilltArgs(process.argv)
   
  }
  catch(error){
    if(error.type === "ShowUsage"){
        console.log(
    `
    Kill running instances of the application.

    Usage: jamkill [--all|app_id|--help]

    jamkill
    kill the program started last among the currently running ones

    jamkill --help
    displays this help messages

    jamkill --all
    kills all running instances

    jamkill app_id
    kills all running instances that were started under app-id

    `
        )
    }
    process.exit(1);
  }
  console.log(arg, "this is my arg")
  const jamfolder = getJamFolder();
  const appfolder = getAppFolder();
  if( !fs.existsSync(jamfolder) ){
    throw new Error('.jamruns folder missing. JAMScript tools not setup?')
  };

  if( !fs.existsSync(appfolder) ){
    throw new Error('.jamruns/apps folder missing. JAMScript tools not setup?')
  };
  
  process.chdir(appfolder);

  if(arg === "last"){
    const lastRunningJob = fs.readFileSync("./appid").toString().trim()
    console.log(lastRunningJob, "JOB TO KILL")
    await killjob(lastRunningJob)
  }
  if(arg === "all"){
    await killAll();
  }

  else{
    console.log("IM KILLING JOBS")
    await killjob(arg);
  }
    

    
}

(async() => {
    await main()
})()