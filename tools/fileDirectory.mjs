#!/usr/bin/env zx

let HOME = os.homedir();

export function fileDirectorySetUp(file,app){
    console.log(file)
    console.log(app)
    const jamfolder=`${HOME}/.jamruns`
    if(!fs.existsSync(jamfolder,{ recursive: true })){
        fs.mkdirSync(jamfolder)
    }
    if(!fs.existsSync(`${jamfolder}/ports`,{ recursive: true })){
        fs.mkdirSync(`${jamfolder}/ports`)
    }
    const appfolder=`${jamfolder}/apps`;
    if(!fs.existsSync(appfolder,{ recursive: true })){
        fs.mkdirSync(appfolder)
    }
    const filenoext = path.basename(file, path.extname(file));
    const folder=`${appfolder}/${filenoext}_${app}`
    if(!fs.existsSync(folder,{ recursive: true })){
        fs.mkdirSync(folder)
    }
    
    fs.writeFileSync(`${appfolder}/program`, `${filenoext}\n`)
    fs.writeFileSync(`${appfolder}/app`, `${app}\n`)
    return [jamfolder,appfolder,folder,filenoext ]
}

export function getJamFolder(){
    return `${HOME}/.jamruns`
}

export function getAppFolder(){
    return `${HOME}/.jamruns/apps`
}

export function getPaths(file,app){
    
    const jamfolder=`${HOME}/.jamruns`
    const appfolder=`${jamfolder}/apps`;
     const filenoext = path.basename(file, path.extname(file));
    const folder=`${appfolder}/${filenoext}_${app}`
    
    return [jamfolder,appfolder,folder]
}

export function getFolder(file,app){
    const jamfolder=`${HOME}/.jamruns`
    const appfolder=`${jamfolder}/apps`;
    const filenoext = path.basename(file, path.extname(file));
    const folder=`${appfolder}/${filenoext}_${app}`
    
    return folder;
}

export function getFileNoext(file){
    return path.basename(file, path.extname(file));
}

export async function getAppFolderAndSubDir(){
    const jamfolder=`${HOME}/.jamruns`
    const appfolder=`${jamfolder}/apps`;
    if(!fs.existsSync(appfolder)){
        throw new Error("No running instances of JAMScript")
    }
    const subDirs = ((await fs.readdir(appfolder, { withFileTypes: true })).filter((entry) => entry.isDirectory()))
    if(!subDirs || subDirs.lenth === 0 ){
        throw new Error("No running instances of JAMScript")
    }
    const subDirsName = subDirs.map(entry => entry.name )
    
    return [subDirsName, appfolder]
}


export function getappid(mainf, localf, appid,appfolder){
    if(appid === "app-n"){
        //TODO: can be imporved by a try catch instead
        let result;
        if(fs.existsSync(`${mainf}/counter`)){
            let value = fs.readFileSync(`${mainf}/counter`);
            result = Number(value.toString().trim()) + 1;
        }
        else{
            result = 1;
        }
        fs.writeFileSync(`${mainf}/counter`, `${result}\n`)
        fs.writeFileSync(`${localf}/appid`, `app-${result}\n`)
    }
    else{
        fs.writeFileSync(`${localf}/appid`,`${appid}`)
    }
    const jappid = fs.readFileSync(`${localf}/appid`)
    fs.writeFileSync(`${appfolder}/appid`,`${jappid}`)
    return jappid;
}

export function isValidExecutable(){
    if(!fs.existsSync(`jstart.js`))
        throw new Error("jstart.js is missing")

    if(!fs.existsSync(`jamout.js`))
        throw new Error("jamout.js is missing")

    if(!fs.existsSync(`a.out`))
        throw new Error("a.out is missing")

    if(!fs.existsSync(`MANIFEST.txt`))
        throw new Error("MANIFEST.txt is missing")

}

export async function cleanExecutables(){
    if(fs.existsSync(`jstart.js`))
        await fs.unlink("jstart.js")

    if(fs.existsSync(`jamout.js`))
        await fs.unlink("jamout.js")

    if(fs.existsSync(`a.out`))
        await fs.unlink("a.out")


}

export function fileDirectoryMqtt(folder, iport,jamfolder,app){
    if(!fs.existsSync(`${jamfolder}/mqttpid`)){
        fs.mkdirSync(`${jamfolder}/mqttpid`);
    }
    fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
    const dirName = folder.split("/").pop()
    if(fs.existsSync(`${jamfolder}/ports/${iport}`)){
        const dirNames = fs.readFileSync(`${jamfolder}/ports/${iport}`).toString().trim().split("\n")
        if(!dirNames.includes(dirName)){
            fs.appendFileSync(`${jamfolder}/ports/${iport}`, `${dirName}\n`)
        }

    }
    else{
        fs.writeFileSync(`${jamfolder}/ports/${iport}`, `${dirName}\n`)
    }
    
   
}

// export function getJamlistPaths(appToPortMap){
//     const fileNames =["machType","appid", "dataStore","tmuxid", "parentId", "numCnodes" ]
//     const paths = [];
//     for(let app of appToPortMap.key()){
//         for(let port of appToPortMap.get(app)){
//             info = {}
//         }
//     }
// }



// async function printNodeInfo(dirName, programName){
//     const path = `${process.cwd()}/${dirName}`
//     let mType,appid,dstore,tmuxid,parid

//     if(fs.existsSync(`${path}/machType`)){
//         mType= fs.readFileSync(`${path}/machType`).toString().trim()
//     }
//     else{
//         mType = "-";

//     }
//     if(fs.existsSync(`${path}/appid`)){
//         appid= fs.readFileSync(`${path}/appid`).toString().trim()
//     }
//     else{
//         appid = "-"
//     }
//     if(fs.existsSync(`${path}/dataStore`)){
//         dstore= fs.readFileSync(`${path}/dataStore`).toString().trim()
//     }
//     else{
//         dstore = "-"
//     }
//     if(fs.existsSync(`${path}/tmuxid`)){
//         tmuxid= fs.readFileSync(`${path}/tmuxid`).toString().trim()
//     }
//     else{
//         tmuxid = "-"
//     }
//     if(fs.existsSync(`${path}/parentId`)){
//         parid= fs.readFileSync(`${path}/parentId`).toString().trim()
//     }
//     else{
//         parid = "-"
//     }
//     let cdevs = 0;
    
//     if(mType === "device"){
        
//         if(fs.existsSync(`${path}/numCnodes`)){
//             cdevs= fs.readFileSync(`${path}/numCnodes`).toString().trim()
//         }
//         else{
//             cdevs = "-"
//         }
        
//         const headerString = `   ${appid.padEnd(15)} ${appid.padEnd(15)} ${programName.padEnd(15)} ${("Local:"+dirName).padEnd(15)} ${parid.padEnd(15)} ${dstore.padEnd(15)} ${mType.padEnd(15)} ${(cdevs.toString()).padEnd(15)} ${tmuxid.padEnd(15)}`;
//         console.log(headerString)

//     }
//     else{
//         const headerString = `   ${appid.padEnd(15)} ${appid.padEnd(15)} ${programName.padEnd(15)} ${("Local:"+dirName).padEnd(15)} ${parid.padEnd(15)} ${dstore.padEnd(15)} ${mType.padEnd(15)} ${("--").padEnd(15)} ${tmuxid.padEnd(15)}`;
//         console.log(headerString)
//     }
    

// }