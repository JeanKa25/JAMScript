#!/usr/bin/env zx
import commandLineArgs from 'command-line-args';
import { fs } from 'zx';
const path = require('path');
const VALGRIND_OPTS = 'valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --log-file=log_valgrind -s';

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
  {name : 'disable_stdout_redirect', type: Boolean, defaultValue: false},
  {name : 'resume', type: Boolean, defaultValue: false},
];

const jamlistOptionDefinition = [
        {name : "help", alias : "h", type: Boolean, defaultValue : false },
        {name : "monitor", alias : "m", type: Boolean, defaultValue : false },
        {name : 'type', type: String , defaultValue: undefined },
        {name : 'dataStore', type: String , defaultValue: undefined },
        {name : 'tmuxid', type: String , defaultValue: undefined },
        {name : 'portNum', type: String , defaultValue: undefined },
        {name : 'appName', type: String , defaultValue: undefined },
        {name : 'programName', type: String , defaultValue: undefined },

  ];
  
const jamkillOptionDefinition = [
    {name : "help", alias : "h", type: Boolean, defaultValue : false },
    {name : 'all', type: Boolean , defaultValue: false },
    {name : 'app', type: Boolean , defaultValue: false },
    {name : 'program', type: Boolean , defaultValue: false },
    {name : 'dir', type: Boolean , defaultValue: false },
    {name : 'port', type: Boolean , defaultValue: false },
    {name: "portDir", type: Boolean, defaultValue: false },
    {name : 'name', alias : "n" , type: String , defaultValue: false },

];
const jamcleanOptionDefinition = [
    {name : "help", alias : "h", type: Boolean, defaultValue : false },
    {name : "reset", alias: "r", type: Boolean, defaultValue : false }

];


function retrieveType(device, fog, cloud){
    if(!fog && !device && !cloud){
        return "device";
    }

    else if( ((fog?1:0) + (device?1:0) + (cloud?1:0)) > 1){
        throw Error("Only one of fog, device, cloud flag can be true")
        
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
function retrieveLongLat(loc){
    return [long, lat] = loc.split(",");
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
        { 
            throw new Error(`Extension on ${file} is not .jxe`)
        }
    }
    const absolutePath = path.resolve(file);
    if(!fs.existsSync(absolutePath)){
        throw new Error(`File: ${file} not found`)
    }
    
    return file;
}
function SetJamrunVar(options){
    const Type = retrieveType(options.device , options.fog, options.cloud);
    if(Type !== "device"){
        options.num = undefined;
        options.edge = undefined;
     }
    const NOVERBOSE = !options.verb
    const valgrid = options.valgrid? VALGRIND_OPTS : false
    const [long, lat] = retrieveLongLat(options.loc)
        
    const toAdd = {"valgrind" : valgrid,"long" : long,"lat" : lat, "NOVERBOSE":NOVERBOSE , "Type" : Type }
    const skip = ["help","fog","cloud","device","loc", "verb"]
    const AssignedVar ={}
    for(let option of Object.keys(options)){
        if(skip.includes(option)){
            continue
        }
        AssignedVar[option]= options[option]
        
    }
    for(let option of Object.keys(toAdd)){
        AssignedVar[option]= toAdd[option]
    }

    if(!("tags" in AssignedVar)){
        AssignedVar["tags"] = undefined;
    }
    return AssignedVar;
    
}

//question one on remNote

export function jamrunParsArg(argv){
    
    const arg = argv.filter((entry) => (!entry.includes('node') && !entry.includes('zx') && !entry.includes('jamrun.mjs')))
    
    const file = checkJXEfile(arg)
   

    let proccessedArgs = arg.filter((_,index) => (index !== 0 ));
    const options = getJamrunArgs(proccessedArgs);
    if(!options || options.help){
        const error = new Error('SHOW USAGE');
        error.type = 'UsageError';
        throw error;

    }

    for(let optionDefinition of jamrunOptionDefinitions ){
        if(options[optionDefinition.name] === null && optionDefinition.type != Boolean){
            throw new Error(`--${optionDefinition.name} requires a non-empty option argument`);
           
        }
    }
    const varsObject = SetJamrunVar(options);
    varsObject["file"] = file;
   
    return varsObject;
}
//ASK wHAT VARIABLES ARE OPTIONAL
//TO BE TESTED
export function getCargs(argObject){

    let args = ""
    for(let key of Object.keys(argObject)){


        if(argObject[key] != undefined ){

            args=args+` ${key} ${argObject[key]}`
        }
    }
  
    return args;
}
export function getJargs(argObject){
    const args = []
    for(let key of Object.keys(argObject)){

        if(argObject[key] != undefined){
            if(key === "--type")
                args.push(`--${argObject[key]}`)
            else
                args.push(`${key}=${argObject[key]}`)
        }
    }

    return args;
    
}

export function getJamListArgs(argv){
    const args = argv.filter((entry) => (!entry.includes('node') && !entry.includes('zx') && !entry.includes('jamlist.mjs')))
    let options
    try{
        options = commandLineArgs(jamlistOptionDefinition, {argv: args});
    }
    catch(error){
    }
    if(options?.help || !options){
        console.log("DON")
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }
    if(Object.keys(options).length === 1){
        return "all"
    }

    const filters = {}
    for(let key of Object.keys(options)){
        if(key === "help" || key === "monitor")
            continue;
        
        if(key=== "type"){
            const deviceType = options[key]
            if(deviceType !== "device" && deviceType !== "fog" && deviceType !== "cloud"){
                throw new Error("wrong device type")
            }
            filters["machType"] = deviceType 

        }
        else{
            filters[key] = options[key]

        }

    }



    return {filters : filters, monitor: options.monitor}

    
}


export function getKilltArgs(argv){
    const args = argv.filter((entry) => (!entry.includes('node') && !entry.includes('zx') && !entry.includes('jamkill.mjs')))
    let options
    
    try{
        options = commandLineArgs(jamkillOptionDefinition, {argv: args});
    }
    catch(error){
    }

    console.log(options, "these are my options")
    if(options === undefined || options.help){
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }
    const flagCheck = ((options.all?1:0) + (options.app?1:0) + (options.dir?1:0) + (options.program?1:0) + (options.port? 1: 0) + (options.portDir? 1: 0) );
    if( flagCheck !== 1 ){
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }
    let flag;
    if(!options.name && !options.all){
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }

    if(options.all){
        flag = "all";
    }
    else if(options.app){
        flag = "app";
    }
    else if(options.dir){
        flag = "dir";
    }
    else if(options.port){
        flag = "port"
    }
    else if(options.portDir){
        flag = "portDir"
    }
    else{
        flag = "program";
    }
    console.log()
    return {"flag": flag, "name" : options.name}
    
}

export function getcleanArgs(argv){
    const args = argv.filter((entry) => (!entry.includes('node') && !entry.includes('zx') && !entry.includes('jamclean.mjs') && !entry.includes('jamlist.mjs')))
    let options

    try{
        options = commandLineArgs(jamcleanOptionDefinition, {argv: args});
    }
    catch(error){
    }


    if(options === undefined || options.help){
        const error = new Error("SHOW USAGE")
        error.type = "ShowUsage"
        throw error;
    }
    return "reset"
     
}




