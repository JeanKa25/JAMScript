#!/usr/bin/env zx
import commandLineArgs from 'command-line-args';
import { fs } from 'zx';
const path = require('path');

function generatelonglat() {
    const a = Math.floor(Math.random() * 180);
    const b = Math.floor(Math.random() * 10000);
    const long=`${a}.${b}`
    const c= Math.floor(Math.random() * 90);
    const d = Math.floor(Math.random() * 10000);
    const lat=`${c}.${d}`
    return  [long,lat]

}
let [long, lat] = generatelonglat();

const jamrunOptionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean, defaultValue: false},
  {name : 'app', type: String , defaultValue: "app-n"},
  {name : 'tags', type: String , defaultValue: undefined},
  {name : 'iflow', type: String , defaultValue: undefined},
  {name : 'oflow', type: String , defaultValue: undefined},
  {name : 'tmux', type: String , defaultValue: `tg-${Math.floor(Math.random() * 32768)}`},
  {name : 'num', type: Number , defaultValue: 1},
  {name : 'loc', type: String , defaultValue: `${long},${lat}`},
  {name : 'edge', type: Number , defaultValue: 1},
  {name : 'data', type: String , defaultValue: "127.0.0.1:6379"},
  {name : 'fog', type: Boolean, defaultValue: false},
  {name : 'cloud', type: Boolean, defaultValue: false},
  {name : 'device', type: Boolean, defaultValue: false},
  {name : 'local_registry', type: Boolean, defaultValue: false},
  {name : 'temp_broker', type: Boolean, defaultValue: false},
  {name : 'bg', type: Boolean, defaultValue: false},
  {name : 'verb', type: Boolean, defaultValue: false},
  {name : 'log', type: Boolean, defaultValue: false},
  {name : 'old', type: Boolean, defaultValue: false},
  {name : 'local', type: Boolean, defaultValue: false},
  {name : 'valgrind', type: Boolean, defaultValue: false},
  {name : 'disable-stdout-redirect', type: Boolean, defaultValue: false},
];

const OptionToVarMap =new Map(
    ["tmux","tmuxid"],
    ["loc",["long","lat"]]
)


function retrieveType(device, fog, cloud){
    if(!fog && !device && !cloud){
        return "device";
    }

    else if( ((fog?1:0) + (device?1:0) + (cloud?1:0)) > 1){
        const error = new Error("Only one fog, device, cloud flag can be true")
        error.type = 'MultiTypeFlag'
        throw error;
    }

    else{
        if(fog)
            return "fog"
        if(device)
            return "device"
        if(cloud)
            return "cloud"
    }

}

function getJamrunArgs(args){

    let options
    try{
        options = commandLineArgs(jamrunOptionDefinitions, {argv: args});
    }
    catch(error){
    }
    return options;

}

function checkJXEfile(arg){
    
    if(arg.length === 0 || arg[0].toLowerCase() === "-h" ||  arg[0].toLowerCase() === "--help"){
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }
    const file = `${arg[0]}`;
    const fext = file.split(".").pop()
    if(fext !== "jxe"){
        if(!fext)
            throw new Error(`${file} is not file name or missing extention`)
        else
            throw new Error(`Extension on ${file} is not .jxe`)
    }
    const absolutePath = path.resolve(file);
    if(!fs.existsSync(absolutePath)){
        throw new Error(`File: ${file} not found`)
    }
}

//question one on remNote

export function jamrunParsArg(argv){
    //remove redundent arfs
    const arg = argv.filter((entry) => (!entry.includes('node') && !entry.includes('zx') && !entry.includes('jamrun.mjs')))
    checkJXEfile(arg)
    let proccessedArgs = arg.filter((_,index) => (index !== 0 ));
    const options = getJamrunArgs(proccessedArgs);
    if(!options || options.help){
        const error = new Error('SHOW USAGE');
        error.type = 'UsageError';
        throw error;

    }
    for(let optionDefinition of jamrunOptionDefinitions ){
        if(options[optionDefinition.name] === null && optionDefinition.type != Boolean){
            const error =  new Error(`--${optionDefinition.name} requires a non-empty option argument`);
            error.type = 'OptionError';
            throw error;
        }
    }

    
}




