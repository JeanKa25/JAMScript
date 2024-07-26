#!/usr/bin/env zx
import { getAppFolder } from "./fileDirectory.mjs";
import { getLogArgs } from "./parser.mjs";
const readline = require('readline');


function printlog(path,tail){
    
    if (tail) {
        const fileName = path.split("/").pop();

        if (fileName.includes("j")) {
            return new Promise((resolve) =>{
                console.log(`\nLast ${tail} lines of J-File\n------`);
                const myLineJ = readline.createInterface({
                    input: fs.createReadStream(path),
                });
        
                const linesJ = [];
                myLineJ.on('line', (line) => {
                    linesJ.push(line);
                    if (linesJ.length > tail) {
                        linesJ.shift();
                    }
                });
                console.log("GOT HERER 2")
           
                myLineJ.on('close', () => {
                    console.log(linesJ.join('\n'));
                    resolve()
                });
            })

            
        } else {
            return new Promise((resolve) =>{
                console.log(`Last ${tail} lines of C-NODES`);
                const myLineC = readline.createInterface({
                    input: fs.createReadStream(path),
                });
        
                const linesC = [];
                let header;
                let cNode = [];
                myLineC.on('line', (line) => {
                    if (line.includes('worker number')) {
                        if (cNode.length !== 0) {
                            linesC.push(header)
                            linesC.push(cNode.join("\n"));
                            header = line;
                        }
                    }
                    cNode.push(line);
                    if (cNode.length > tail) {
                        cNode.shift();
                    }
                });
        
                myLineC.on('close', () => {
                        console.log(linesC.join('\n'));
                        resolve()
                });
            })

        }
    
    }

    else{
        const data = fs.readFileSync(path, 'utf8');
        console.log(data);
    }
}

async function main(){
    let arg;
    try{
        arg = getLogArgs(process.argv)
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
    }
    const flag = arg.flag;
    const port =Number(arg.file.split("/")[ arg.file.split("/").length-1]);
    const logFiles =arg.file.split("/")[0]+"/log";
    const tail = arg.tail
    const appFolder = getAppFolder()
    const path = `${appFolder}/${logFiles}/${port}`

    if(port){

        if(!fs.existsSync(path)){
            console.log(`THERE IS NO LOG ON ${port} for ${logFiles.split("/")[0]}`)
        }

        if(flag === "all"){
            if(!fs.existsSync(`${path}/log.j`)){
                console.log(`There is no log for C files on port ${port} for ${logFiles.split("/")[0]}`)
            }
            else{
                
                await printlog(`${path}/log.j`,tail)
                
            }
            if(!fs.existsSync(`${path}/log.c`)){
                console.log(`There is no log for C files on port ${port} for ${logFiles.split("/")[0]}`)
            }
            else{
                await printlog(`${path}/log.c`,tail)
            }
        }   
        else if(flag === "j"){
            if(!fs.existsSync(`${path}/log.j`)){
                console.log(`There is no log for C files on port ${port} for ${logFiles.split("/")[0]}`)
            }
            else{
                await printlog(`${path}/log.j`,tail)
            }
        }
        else if(flag === "c"){
            if(!fs.existsSync(`${path}/log.c`)){
                console.log(`There is no log for C files on port ${port} for ${logFiles.split("/")[0]}`)
            }
            else{
                await printlog(`${path}/log.c`,tail)
            }
        }
    }
 
}


(async () =>{
    await main()

})()