#!/usr/bin/env zx

let HOME = os.homedir();

export function fileDirectorySetUp(file,app){
    const jamfolder=`${HOME}/.jamruns`
    if(!fs.existsSync(jamfolder,{ recursive: true })){
        fs.mkdirSync(jamfolder)
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

export function getPaths(file=null,app=null){
    
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

export function fileDirectoryMqtt(folder, iport){
    fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
   
}