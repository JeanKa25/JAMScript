#!/usr/bin/env zx
/**
 * 1)The option to limit the search to the impprted app variable is not working
 * 2)Fix the usage msg
 * 3) when can /machType` be empty?!
 * 4)if device is _ then it is not running (true or false)
 * 5)can we have a jNode without a CNode?
 * 6)discuss strategies for jamlist
 * 7) what is the cleanUp exactly?
 * 
 * 
 * 
 */
import { getJamListArgs } from "./parser.mjs";
import {getAppFolderAndSubDir} from "./fileDirectory.mjs"
import { cleanUp } from "./jamclean.mjs";




async function printNodeInfo(dirName, programName){
    const path = `${process.cwd()}/${dirName}`
    let mType,appid,dstore,tmuxid,parid

    if(fs.existsSync(`${path}/machType`)){
        mType= fs.readFileSync(`${path}/machType`).toString().trim()
    }
    else{
        mType = "-";

    }
    if(fs.existsSync(`${path}/appid`)){
        appid= fs.readFileSync(`${path}/appid`).toString().trim()
    }
    else{
        appid = "-"
    }
    if(fs.existsSync(`${path}/dataStore`)){
        dstore= fs.readFileSync(`${path}/dataStore`).toString().trim()
    }
    else{
        dstore = "-"
    }
    if(fs.existsSync(`${path}/tmuxid`)){
        tmuxid= fs.readFileSync(`${path}/tmuxid`).toString().trim()
    }
    else{
        tmuxid = "-"
    }
    if(fs.existsSync(`${path}/parentId`)){
        parid= fs.readFileSync(`${path}/parentId`).toString().trim()
    }
    else{
        parid = "-"
    }
    let cdevs = 0;
    
    if(mType == "device"){
        
        let cdevProcesses = (await fs.readdir(path)).filter(entry => entry.includes("cdevProcessId"));
        for(let cdevProcess of cdevProcesses){
            let pid = fs.readFileSync(`${path}/${cdevProcess}`).toString().trim();
            const process = await $`ps -p ${pid} | grep a.out | wc -l | tr -d '[:space:]'`.nothrow()
            const isOk = process.stdout.trim()
            if(isOk){
                cdevs++
            }   
        }
        const headerString = `   ${appid.padEnd(15)} ${appid.padEnd(15)} ${programName.padEnd(15)} ${("Local:"+dirName).padEnd(15)} ${parid.padEnd(15)} ${dstore.padEnd(15)} ${mType.padEnd(15)} ${(cdevs.toString()).padEnd(15)} ${tmuxid.padEnd(15)}`;
        console.log(headerString)

    }
    else{
        const headerString = `   ${appid.padEnd(15)} ${appid.padEnd(15)} ${programName.padEnd(15)} ${("Local:"+dirName).padEnd(15)} ${parid.padEnd(15)} ${dstore.padEnd(15)} ${mType.padEnd(15)} ${("--").padEnd(15)} ${tmuxid.padEnd(15)}`;
        console.log(headerString)
    }
    

}

async function main(){
    let subDirs;
    let appfolder;
    let app;
    try{
        app = getJamListArgs(process.argv)
    }
    catch(error){
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
    try{
    
        [subDirs, appfolder] =await getAppFolderAndSubDir();
    }
    catch(error){
        console.log("No running instances of JAMScript.")
    }
    await cleanUp()
    process.chdir(appfolder)
    const headerString = `   ${"ID".padEnd(15)} ${"NAME".padEnd(15)} ${"PROGRAM".padEnd(15)} ${"HOST".padEnd(15)} ${"PARENT".padEnd(15)} ${"D-STORE".padEnd(15)} ${"TYPE".padEnd(15)} ${"C-NODES".padEnd(15)} ${"TMUX-ID".padEnd(15)}`;
    console.log(headerString);
    for(let subDir of subDirs ){
        const [programName, appName] = subDir.split("_");
        process.chdir(`${subDir}`)
        const jexs = ((await fs.readdir(process.cwd(),{ withFileTypes: true })).filter( entry => entry.isDirectory())).map(entry => entry.name)
        if(!jexs || jexs.length === 0){
            break;
        }
    
        for(let jex of jexs){
            let running;
            if(fs.existsSync(`${appfolder}/${subDir}/${jex}/processId`)){
                const pid = fs.readFileSync(`${appfolder}/${subDir}/${jex}/processId`).toString().trim();
                if(pid === "new")
                    running = "new";
                else if(!pid){
                    running = "none"
                }
                else{
                    
                    const p = await $`ps -p ${pid} | grep node | wc -l | tr -d '[:space:]'`.nothrow()
                    const present = p.stdout.trim()
                    if (present == "1")
                        running="ps"
                    else
                        running="none"
                }
            }
            else{
                running = "none"
            }
            if(running === "ps" || running === "new"){
                if(!app)
                    printNodeInfo(jex,programName)
                
                else
                    if(appName.includes(app))
                        printNodeInfo(jex,programName) 
                    
                
            }        
        }
    

        process.chdir(`./..`)



    }

    
}
(async () => {
    await main()
})();