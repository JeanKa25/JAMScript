#!/usr/bin/env zx
import commandLineArgs from "command-line-args";
import { error } from "console";
import { type } from "os";
import { string } from "random-js";
import { fs } from "zx";

const path = require("path");
const VALGRIND_OPTS =
    "valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --log-file=log_valgrind -s";

function generatelonglat() {
    const a = Math.floor(Math.random() * 180);
    const b = Math.floor(Math.random() * 10000);
    const long = `${a}.${b}`;
    const c = Math.floor(Math.random() * 90);
    const d = Math.floor(Math.random() * 10000);
    const lat = `${c}.${d}`;
    return [long, lat];
}
let [long, lat] = generatelonglat();

const jamrunOptionDefinitions = [
    { name: "help", type: Boolean, defaultValue: false },
    { name: "app", type: String, defaultValue: undefined },
    { name: "tags", type: String, defaultValue: undefined },
    {
        name: "tmux",
        type: String,
        defaultValue: `tg-${Math.floor(Math.random() * 32768)}`,
    },
    { name: "num", type: Number, defaultValue: 1 },
    { name: "loc", type: String, defaultValue: `${long},${lat}` },
    { name: "edge", type: Number, defaultValue: 1 },
    { name: "data", type: String, defaultValue: undefined },
    { name: "fog", type: Boolean, defaultValue: false },
    { name: "cloud", type: Boolean, defaultValue: false },
    { name: "device", type: Boolean, defaultValue: false },
    { name: "local_registry", type: Boolean, defaultValue: false },
    { name: "bg", type: Boolean, defaultValue: false },
    { name: "verb", type: Boolean, defaultValue: false },
    { name: "log", type: Boolean, defaultValue: false },
    { name: "old", type: Boolean, defaultValue: false },
    { name: "local", type: Boolean, defaultValue: false },
    { name: "valgrind", type: Boolean, defaultValue: false },
    { name: "port", type: Number, defaultValue: undefined },
    { name: "remote", type: String, defaultValue: undefined }, //the IP ADDRESS YOU WANT TO CONNECT TO
    { name: "root", type: String, defaultValue: undefined }, //THE IP ADRRESS OF THE MACHINE making the remote call
];

const jamlistOptionDefinition = [
    { name: "help", type: Boolean, defaultValue: false },
    { name: "all", type: Boolean, defaultValue: false },
    { name: "monitor", type: Boolean, defaultValue: false },
    { name: "type", type: String, defaultValue: undefined },
    { name: "dataStore", type: String, defaultValue: undefined },
    { name: "tmuxid", type: String, defaultValue: undefined },
    { name: "port", type: String, defaultValue: undefined },
    { name: "app", type: String, defaultValue: undefined },
    { name: "prog", type: String, defaultValue: undefined },
    { name: "remote", type: Boolean, defaultValue: false }, //the IP ADDRESS YOU WANT TO CONNECT TO
    { name: "root", type: String, defaultValue: undefined }, //THE IP ADRRESS OF THE MACHINE making the remote call
];

const jamkillOptionDefinition = [
    { name: "help", type: Boolean, defaultValue: false },
    { name: "all", type: Boolean, defaultValue: false },
    { name: "reset", type: Boolean, defaultValue: false },
    { name: "app", type: String, defaultValue: false },
    { name: "prog", type: String, defaultValue: false },
    { name: "port", type: String, defaultValue: false },
    { name: "verb", type: Boolean, defaultValue: false},
    { name: "remote", type: Boolean, defaultValue: false }, //the IP ADDRESS YOU WANT TO CONNECT TO
    { name: "root", type: String, defaultValue: undefined }, //THE IP ADRRESS OF THE MACHINE making the remote call
];

const jamtermOptionDefinition = [
    { name: "help", type: Boolean, defaultValue: false },
    { name: "all", type: Boolean, defaultValue: false },
    { name: "app", type: String, defaultValue: false },
    { name: "prog", type: String, defaultValue: false },
    { name: "port", type: String, defaultValue: false },
    { name: "pane", type: Number, defaultValue: 16 },
    { name: "separate", type: Boolean, defaultValue: false },
    { name: "remote", type: Boolean, defaultValue: false }, //the IP ADDRESS YOU WANT TO CONNECT TO 
    { name: "root", type: String, defaultValue: undefined }, //THE IP ADRRESS OF THE MACHINE making the remote call
];

const jamclogOptionDefinition = [
    { name: "help", type: Boolean, defaultValue: false },
    { name: "program", type: String, defaultValue: undefined },
    { name: "app", type: String, defaultValue: undefined },
    { name: "port", type: String, defaultValue: undefined },
    { name: "j", type: Boolean, defaultValue: false },
    { name: "c", type: Boolean, defaultValue: false },
    { name: "tail", type: Number, defaultValue: undefined },
    { name: "remote", type: String, defaultValue: undefined },
];

const jamBatchOptionDefinition = [
    { name: "fog", type: String, defaultValue: undefined },
    { name: "cloud", type: String, defaultValue: undefined },
    { name: "device", type: String, defaultValue: undefined },
    { name: "dFile", type: String, defaultValue: undefined },
    { name: "cFile", type: String, defaultValue: undefined },
    { name: "fFile", type: String, defaultValue: undefined },
    { name: "num", type: String, defaultValue: undefined },
    { name: "cLoc",  type: String, defaultValue: undefined},
    { name: "fLoc",  type: String, defaultValue: undefined},
    { name: "dLoc",  type: String, defaultValue: undefined},
    { name: "dEdge",  type: String, defaultValue: undefined},
    { name: "cEdge",  type: String, defaultValue: undefined},
    { name: "fEdge",  type: String, defaultValue: undefined},
    { name: "config",  type: String, defaultValue: undefined},
    {name: "verb", type:Boolean, defaultValue: false}
];
//no extention for the prog name ex) jt2
const jamWorkerOptionDefinition = [
    { name: "help", type: Boolean, defaultValue: false },
    {name: "add", type: Number, defaultValue: undefined },
    {name: "removeBatch", type: Number , defaultValue: undefined},
    {name: "remove", type: String , defaultValue: undefined},
    {name: "port", type:Number , defaultValue: undefined},
    {name: "prog", type:String, defaultValue: undefined},
    {name: "app", type:String, defaultValue: undefined},
    {name: "verb", type:Boolean, defaultValur: false},
    {name:"log",type:Boolean, defaultValur: false}

];

function retrieveType(device, fog, cloud) {
    if (!fog && !device && !cloud) {
        return "device";
    } else if ((fog ? 1 : 0) + (device ? 1 : 0) + (cloud ? 1 : 0) > 1) {
        throw Error("Only one of fog, device, cloud flag can be true");
    } else {
        if (fog) return "fog";
        if (device) return "device";
        if (cloud) return "cloud";
    }
}
function retrieveLongLat(loc) {
    return ([long, lat] = loc.split(","));
}

function getJamrunArgs(args) {
    let options;
    try {
        options = commandLineArgs(jamrunOptionDefinitions, { argv: args });
    } catch (error) {}

    return options;
}

function checkJXEfile(arg) {
    if (
        arg.length === 0 ||
        arg[0].toLowerCase() === "-h" ||
        arg[0].toLowerCase() === "--help"
    ) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    }

    const file = `${arg[0]}`;
    const fext = file.split(".").pop();

    if (fext !== "jxe") {
        if (!fext)
            throw new Error(`${file} is not file name or missing extention`);
        else {
            throw new Error(`Extension on ${file} is not .jxe`);
        }
    }
    const absolutePath = path.resolve(file);
    if (
        !fs.existsSync(absolutePath) &&
        !arg.some((item) => item.startsWith("--remote="))
    ) {
        throw new Error(`File: ${file} not found`);
    }

    return file;
}
function SetJamrunVar(options) {
    const Type = retrieveType(options.device, options.fog, options.cloud);
    if (Type !== "device") {
        options.num = undefined;
        options.edge = undefined;
    }
    const NOVERBOSE = !options.verb;
    const valgrid = options.valgrid ? VALGRIND_OPTS : false;
    const [long, lat] = retrieveLongLat(options.loc);

    const toAdd = {
        valgrind: valgrid,
        long: long,
        lat: lat,
        NOVERBOSE: NOVERBOSE,
        Type: Type,
    };
    const skip = ["help", "fog", "cloud", "device", "loc", "verb"];
    const AssignedVar = {};
    for (let option of Object.keys(options)) {
        if (skip.includes(option)) {
            continue;
        }
        AssignedVar[option] = options[option];
    }
    for (let option of Object.keys(toAdd)) {
        AssignedVar[option] = toAdd[option];
    }

    if (!("tags" in AssignedVar)) {
        AssignedVar["tags"] = undefined;
    }

    return AssignedVar;
}

//question one on remNote

export function jamrunParsArg(argv) {
    const arg = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamrun.mjs")
    );

    const file = checkJXEfile(arg);

    let proccessedArgs = arg.filter((_, index) => index !== 0);
    const options = getJamrunArgs(proccessedArgs);
    if (!options || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "UsageError";
        throw error;
    }

    for (let optionDefinition of jamrunOptionDefinitions) {
        if (
            options[optionDefinition.name] === null &&
            optionDefinition.type != Boolean
        ) {
            throw new Error(
                `--${optionDefinition.name} requires a non-empty option argument`
            );
        }
    }
    const varsObject = SetJamrunVar(options);
    varsObject["file"] = file;
    if (!varsObject.app) {
        throw new Error("MISSING APP NAME");
    }

    return varsObject;
}
//ASK wHAT VARIABLES ARE OPTIONAL
//TO BE TESTED
export function getCargs(argObject) {
    let args = "";
    for (let key of Object.keys(argObject)) {
        if (argObject[key] != undefined) {
            args = args + ` ${key} ${argObject[key]}`;
        }
    }

    return args;
}
export function getJargs(argObject) {
    const args = [];
    for (let key of Object.keys(argObject)) {
        if (argObject[key] != undefined) {
            if (key === "--type") args.push(`--${argObject[key]}`);
            else args.push(`${key}=${argObject[key]}`);
        }
    }

    return args;
}

export function getJamListArgs(argv) {
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamlist.mjs")
    );
    let options;
    try {
        options = commandLineArgs(jamlistOptionDefinition, { argv: args });
    } catch (error) {}

    if (options.help || !options) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    }
    if (Object.keys(options).length === 1) {
        return "all";
    }

    const filters = {};
    for (let key of Object.keys(options)) {
        if (key === "help" || key === "monitor") continue;

        if (key === "type") {
            const deviceType = options[key];
            if (
                deviceType !== "device" &&
                deviceType !== "fog" &&
                deviceType !== "cloud"
            ) {
                throw new Error("wrong device type");
            }
            filters["machType"] = deviceType;
        } else {

            if (
                key === "prog" ||
                key === "app" ||
                key === "port" ||
                key === "type" ||
                key === "tmuxid" ||
                key === "dataStore"
            ) {
                if (options[key].includes("="))
                    filters[key] = options[key]
                        .split("=")
                        .slice(1)
                        .map((entry) => {
                            if (entry === "") {
                                return "=";
                            } else {
                                return entry;
                            }
                        })
                        .join("");
                else throw new Error(`${key} is missing '='`);
            } else {
                filters[key] = options[key];
            }
        }
    }

    return { filters: filters, monitor: options.monitor };
}

export function getKilltArgs(argv) {
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamkill.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamkillOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    }
    if (options["app"]) {
        if (options["app"].includes("=")) {
            let newOption = options["app"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");

            options["app"] = newOption;
        } else {
            throw new Error("app argument missing '=' ");
        }
    }
    if (options["prog"]) {
        if (options["prog"].includes("=")) {
            let newOption = options["prog"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");
            options["prog"] = newOption;
        } else {
            throw new Error("program argument missing '=' ");
        }
    }
    if (options["port"]) {
        if (options["port"].includes("=")) {
            let newOption = options["port"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");
            options["port"] = newOption;
        } else {
            throw new Error("port argument missing '=' ");
        }
    }
    return options;
}


export function getTermArgs(argv) {
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamterm.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamtermOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    }
    if (options["app"]) {
        if (options["app"].includes("=")) {
            let newOption = options["app"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");

            options["app"] = newOption;
        } else {
            throw new Error("app argument missing '=' ");
        }
    }
    if (options["prog"]) {
        if (options["prog"].includes("=")) {
            let newOption = options["prog"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");
            options["prog"] = newOption;
        } else {
            throw new Error("program argument missing '=' ");
        }
    }
    if (options["port"]) {
        if (options["port"].includes("=")) {
            let newOption = options["port"]
                .split("=")
                .slice(1)
                .map((entry) => {
                    if (entry === "") {
                        return "=";
                    } else {
                        return entry;
                    }
                })
                .join("");
            options["port"] = newOption;
        } else {
            throw new Error("port argument missing '=' ");
        }
    }

    return options;
}

export function getRemoteArgs(argObject) {
    const args = [];
    args.push(argObject.file);
    for (let arg of Object.keys(argObject)) {
        if (argObject[arg] === false || argObject[arg] === undefined) {
            continue;
        }
        if (
            arg === "long" ||
            arg === "lat" ||
            arg === "Type" ||
            arg === "NOVERBOSE" ||
            arg === "remote" ||
            arg == "file"
        ) {
            continue;
        }
        if (argObject[arg] === true) {
            args.push(`--${arg}`);
        } else {
            args.push(`--${arg}=${argObject[arg]}`);
        }
    }
    args.push(`--loc=${long},${lat}`);
    if (argObject["NOVERBOSE"]) args.push(`--verb`);
    args.push(`--${argObject["Type"]}`);
    return args.join(" ");
}


export function getLogArgs(argv) {
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamlog.mjs")
    );
    let options;
    let file;
    let flag;
    try {
        options = commandLineArgs(jamclogOptionDefinition, { argv: args });
    } catch (error) {

    }

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    } else if (!options.program || !options.app || !options.port) {
        throw new Error("Missing programName or appName or port");
    } else if (options.port && options.app && options.program) {
        file = `${options.program}_${options.app}/${options.port}`;
    } else {
        file = `${options.program}_${options.app}`;
    }

    if ((options.j && options.c) || (!options.c && !options.j)) {
        flag = "all";
    } else {
        flag = options.j ? "j" : "c";
    }
    return {
        file: file,
        flag: flag,
        tail: options.tail,
        remote: options.remote,
    };
}


function getJobs(names, files, locs, edges, type, cNums=null){
    const appNames = []
    const fileNames = []
    let Cnum = []
    let loc = []
    let edge = []
    const jobs = []


    for( let dev of names.split(",")){
        const Cnum = dev.split("-")[0];
        const appName = dev.split("-")[1];
        for(let num = 0 ; num<Cnum; num++ ){
            appNames.push(appName)
        }
    }

    for( let file of files.split(",")){
        const fileNum = file.split("-")[0];
        const fileName = file.split("-")[1];
        for(let num = 0 ; num<fileNum; num++ ){
            fileNames.push(fileName)
        }
    }

    if(appNames.length !== fileNames.length){
        throw new Error(`FILE and APP missmatch, having ${appNames.length} appNames and ${fileNames.length}`)
    }
    if(cNums){
        Cnum = cNums.split(",");
    }

    if(locs){
        loc =  locs.split('-'); 
    }
 
    if(edges){
        edge =  edges.split(",")
    }


    for( let i = 0 ; i <appNames.length; i++){
        const job = []
        job.push(`${fileNames[i]}`);
        job.push(`--app=${appNames[i]}`);
        if(i < Cnum.length){
            job.push(`--num=${Cnum[i]}`);
        }
        if(i< loc.length){
            job.push(`--loc=${loc[i]}`);
        }
        if(i< edge.length){
            job.push(`--edge=${loc[i]}`);
        }
        job.push("--bg");
        job.push(`--${type}`);
        job.push("--log");
        jobs.push(job)
    }
    return jobs;
}

export function getBatchArgs(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jambatch.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamBatchOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };
    if(options.config){
        return {"config":options.config , "verb" : options.verb}
    }
    let deviceJobs = [];
    let fogJobs = [];
    let cloudJobs = [];
    if(!options.device && !options.fog && !options.cloud){
        throw new Error("TYPE IS NOT DEFINED")
    }
    if(options.device){
        deviceJobs = getJobs(options.device, options.dFile, options.dLoc, options.dEdge, "device" ,options.num);
    }
    if(options.fog){
        fogJobs = getJobs(options.fog, options.fFile,options.fLoc,options.fEdge,"fog");
    }
    if(options.cloud){
        cloudJobs = getJobs(options.cloud, options.cFile,options.cLoc,options.cEdge,"cloud")
    }
    return ((deviceJobs.concat(fogJobs)).concat(cloudJobs)).concat([options.verb]);
}

export function getWorkerArgs(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamworker.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamWorkerOptionDefinition, { argv: args });
    } catch (error) {}
    const rawMode = [options?.remove ? "remove" : undefined , options?.add ? "add" : undefined, options?.removeBatch ? "removeBatch" : undefined]
    const mode = rawMode.filter((entry) => entry !== undefined)
    if (options === undefined || options.help) {
        throw new Error("SHOW USAGE");
    };
    if((!options?.app || !options?.prog || !options?.port) && mode[0] !=="remove"){
        throw new Error("appName, programName and portNumber should be defined");
    }
    if(mode.length !== 1){
        throw new Error("the mode should be either one of remove, add, removeBatch");
    };
    options["mode"] = mode[0]
    return options
   

}

/// Wrapper Parser.mjs ///
export function getJamrunArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamrun")
    );
    let options;

    try {
        options = commandLineArgs(jamrunOptionDefinitions, { argv: args });
        console.log(options);
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = '{ "file": "jt1.jxe", '
    if(options.app)
    {
        command += ` "app_name": "${options.app}"`;
    }

    if(options.fog)
    {
        command += ',';
        command += ` "fog": "${options.fog}"`;
    }

    if(options.cloud)
    {
        command += ',';
        command += ` "cloud": "${options.cloud}"`;
    }

    if(options.device)
    {
        command += ',';
        command += ` "device": "${options.device}"`;
    }

    if(options.num)
    {
        command += ',';
        command += ` "num": "${options.num}"`;
    }

    if(options.data)
    {
        command += ',';
        command += ` "data": "${options.data}"`;
    }

    if(options.tags)
    {
        command += ',';
        command += ` "tags": "${options.tags}"`;
    }
    if(options.bg)
    {
        command += ',';
        command += ` "bg": "${options.bg}"`;
    }

    if(options.old)
    {
        command += ',';
        command += ` "old": "${options.old}"`;
    }

    if(options.log)
    {
        command += ',';
        command += ` "log": "${options.log}"`;
    }

    if(options.verb)
    {
        command += ',';
        command += ` "verb": "${options.verb}"`;
    }

    if(options.loc)
    {
        command += ',';
        command += ` "loc": "${options.loc}"`;
    }

    if(options.edge)
    {
        command += ',';
        command += ` "edge": "${options.edge}"`;
    }

    if(options.valgrind)
    {
        command += ',';
        command += ` "valgrind": "${options.valgrind}"`;
    }

    if(options.local)
    {
        command += ',';
        command += ` "local": "${options.local}"`;
    }

    if(options.remote)
    {
        command += ',';
        command += ` "remote": "${options.remote}"`;
    }

    command += ' }';

    return command;
}

export function getBatchArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jambatch.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamBatchOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = '{ "file": "jt1.jxe" '
    if(options.fog)
    {
        command += ',';
        command += ` "fog": "${options.fog}"`;
    }

    if(options.device)
    {
        command += ',';
        command += ` "device": "${options.device}"`;
    }
    if(options.cloud)
    {
        command += ',';
        command += ` "cloud": "${options.cloud}"`;
    }

    if(options.cFile)
    {
        command += ',';
        command += ` "cFile": "${options.cFile}"`;
    }

    if(options.fFile)
    {
        command += ',';
        command += ` "fFile": "${options.fFile}"`;
    }

    if(options.dFile)
    {
        command += ',';
        command += ` "dFile": "${options.dFile}"`;
    }
    if(options.num)
    {
        command += ',';
        command += ` "num": "${options.num}"`;
    }
    if(options.cLoc)
    {
        command += ',';
        command += ` "cLoc": "${options.cLoc}"`;
    }

    if(options.fLoc)
    {
        command += ',';
        command += ` "fLoc": "${options.fLoc}"`;
    }

    if(options.dLoc)
    {
        command += ',';
        command += ` "dLoc": "${options.dLoc}"`;
    }

    if(options.cEdge)
    {
        command += ',';
        command += ` "cEdge": "${options.cEdge}"`;
    }

    if(options.fEdge)
    {
        command += ',';
        command += ` "fEdge": "${options.fEdge}"`;
    }

    if(options.fEdge)
    {
        command += ',';
        command += ` "dEdge": "${options.dEdge}"`;
    }

    command += ' }';

    return command;
}

export function getLogArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamlog")
    );
    let options;

    try {
        console.log(argv);
        options = commandLineArgs(jamclogOptionDefinition, { argv: args });
        console.log(options);
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = `{ "program": "${options.program}", "app": "${options.app}", "port": "${options.port} `;

    if(options.remote){
        command += ',';
        command += ` "remote": "${options.remote}"`;
    }

    if(options.tail){
        command += ',';
        command += ` "tail": "${options.tail}"`;
    }
    command += ` } `;

    return command;
}

export function getJamListArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamlist.mjs")
    );
    let options;

    try {
        options = commandLineArgs(jamlistOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = '{'
    if(options.help)
    {
        command += ` "help": "${options.help}"`;
    }

    if(options.all)
    {
        command += ` "all": "${options.all}"`;
    }
    if(options.monitor)
    {
        command += ` "monitor": "${options.monitor}"`;
    }

    if(options.type)
    {
        command += ` "type": "${options.type}"`;
    }

    if(options.dataStore)
    {
        command += ',';
        command += ` "dataStore": "${options.dataStore}"`;
    }

    if(options.tmuxid)
    {
        command += ',';
        command += ` "tmuxid": "${options.tmuxid}"`;
    }
    if(options.port)
    {
        command += ',';
        command += ` "port": "${options.port}"`;
    }
    if(options.app)
    {
        command += ',';
        command += ` "app": "${options.app}"`;
    }

    if(options.remote)
    {
        command += ',';
        command += ` "remote": "${options.remote}"`;
    }

    command += ' }';

    return command;
}

export function getJamKillArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamkill")
    );
    let options;

    try {
        options = commandLineArgs(jamkillOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = '{'
    if(options.reset)
    {
        command += ` "reset": "${options.reset}"`;
    }

    if(options.all)
    {
        command += ` "all": "${options.all}"`;
    }
    if(options.remote)
    {
        command += ` "remote": "${options.remote}"`;
    }

    if(options.app)
    {
        command += ` "app": "${options.app}"`;
    }

    if(options.prog)
    {
        command += ` "prog": "${options.prog}"`;
    }

    if(options.port)
    {
        command += ` "port": "${options.port}"`;
    }

    command += ' }';

    return command;
}

export function getJamTermArgsWrapper(argv){
    const args = argv.filter(
        (entry) =>
            !entry.includes("node") &&
            !entry.includes("zx") &&
            !entry.includes("jamterm")
    );
    let options;

    try {
        options = commandLineArgs(jamtermOptionDefinition, { argv: args });
    } catch (error) {}

    if (options === undefined || options.help) {
        const error = new Error("SHOW USAGE");
        error.type = "ShowUsage";
        throw error;
    };

    let command = '{'

    if(options.help)
    {
        command += ` "help": "${options.help}"`;
    }
    if(options.all)
    {
        command += ` "all": "${options.all}"`;
    }

    if(options.app)
    {
        command += ` "app": "${options.app}"`;
    }
    if(options.prog)
    {
        command += ` "prog": "${options.prog}"`;
    }

    if(options.port)
    {
        command += ` "port": "${options.port}"`;
    }

    if(options.pane)
    {
        command += ` "pane": "${options.pane}"`;
    }

    command += ' }';

    return command;
}