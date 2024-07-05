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

export function isValidExecutable(){
    if(!fs.existsSync(`./jstart.js`))
        throw new Error("jstart.js is missing")

    if(!fs.existsSync(`jamout.js`))
        throw new Error("jamout.js is missing")

    if(!fs.existsSync(`a.out`))
        throw new Error("a.out is missing")
    if(!fs.existsSync(`./MANIFEST.txt`))
        throw new Error("./MANIFEST.txt is missing")

}

export function fileDirectoryMqtt(folder, iport){
    fs.writeFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "allow_anonymous true\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, "#\n");
    fs.appendFileSync(`${folder}/${iport}/mqtt.conf`, `listener  ${iport}\n`);
   
}