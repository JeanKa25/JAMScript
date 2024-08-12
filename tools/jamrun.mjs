#!/usr/bin/env zx

import { jamrunParsArg, getCargs, getJargs, getRemoteArgs } from "./parser.mjs";
import { fileURLToPath } from "url";
import { cleanByPortNumber } from "./cleanUp.mjs";
import { dirname, resolve } from "path";
import {
    fileDirectorySetUp,
    isValidExecutable,
    fileDirectoryMqtt,
    getPaths,
    getappid,
    getFolder,
    cleanExecutables,
    getJamFolder,
    getFileNoext,
} from "./fileDirectory.mjs";
const { spawn, spawnSync } = require("child_process");
import { Client } from "ssh2";
import {
    body_1,
    header_1,
    header_2,
    body_sec,
    keyWord,
    bodyBold,
    body_2,
    body_2_bold,
    body_2_line,
} from "./chalk.mjs";

let app,
    tmux,
    num,
    edge,
    data,
    local_registry,
    bg,
    NOVERBOSE,
    log,
    old,
    local,
    valgrind,
    long,
    lat,
    Type,
    tags,
    file,
    port,
    remote,
    root;
const tmuxIds = [];
let removablePort;

process.on("SIGINT", () => {
    if (removablePort) {
        const fileNoext = getFileNoext(file);
        cleanByPortNumber(
            `${fileNoext}.jxe`,
            app,
            removablePort,
            NOVERBOSE
        );
        process.exit();
    } else {
        process.exit();
    }
});

process.on("SIGTERM", () => {
    if (removablePort) {

        const fileNoext = getFileNoext(file);
        cleanByPortNumber(
            `${fileNoext}.jxe`,
            app,
            removablePort,
            NOVERBOSE
        );
        process.exit();
        
    } else {
        process.exit();
    }
});

const filePath = fileURLToPath(import.meta.url);
const IDIR = path.dirname(filePath);
const REDISFUNCS = fs.realpathSync(`${IDIR}/../deps/lua/jredlib.lua`);
const SHELLPID = process.pid;

const [MOSQUITTO, MOSQUITTO_PUB, TMUX] = await Promise.all(
    ["mosquitto", "mosquitto_pub", "tmux"].map(async (entry) => {
        try {
            const p = await $`which ${entry}`;
            return p.stdout.trim();
        } catch (error) {
            switch (entry) {
                case "tmux":
                    throw new Error("tmux not installed. Quitting.");
                case "mosquitto_pub":
                    throw new Error(
                        "mosquitto_pub (MQTT tools) not installed. Quitting."
                    );
                case "mosquitto":
                    throw new Error(
                        "mosquitto (MQTT broker) not installed. Quitting."
                    );
            }
        }
    })
);

async function executeScript(client, command) {
    console.log("Execute Script cmd ", command);
    command = "echo $PATH";

    return await new Promise((resolve, reject) => {
        client.exec(command, (err, stream) => {
            if (err) {
                console.log("Rejected....");
                reject(err);
            }
            let result;
            stream.on("close", () => {
                console.log("Closing...");
                resolve(result);
            });
            stream.on("data", async (data) => {
                console.log("hi --------------- ", data.toString());
                if (data.includes("MY PORT IS:")) {
                    result = data.toString().trim().split(":")[1];
                }
                if (data.includes("EXIT BG")) {
                    resolve(result);
                }
            });
        });
    });
}
//tested.working
function show_usage() {
    const usageMessage = `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`jamrun`)}${body_1(
        ` --  a tool to run JXE files with a given name`
    )}

    ${header_1(`SYNOPSIS`)}

    Usage: jamrun file.jxe

                --app = ${body_sec(`app_name`)}
                [--help]
                [--fog | --cloud | --device]
                [--num = ${body_sec(`num_c_devs`)}]
                [--data = ${body_sec(`data-url`)}]
                [--tags = ${body_sec(`quoted_list_of_tags`)}]
                [--bg]
                [--old]
                [--log]
                [--verb]
                [--loc = ${body_sec(`long,lat`)}]
                [--edge= ${body_sec(`num_edge_connections`)}]
                [--valgrind]
                [--local]
                [--remote = ${body_sec(`IPAddress`)}]

    ${header_1(`DESCRIPTION`)}

    --- ${keyWord(
        "jamrun"
    )} Runs J node and C nodes, one each, of a device with ${keyWord(
        "program.jxe"
    )}
    under a app name X, use the ${keyWord("--app")}=${keyWord(
        `X`
    )} option. ${bodyBold(`It is mandatory to set the app name.`)}.
    
    --- jamrun --help
    ${body_2("--help : use this flag to display this usage message.")}

    --- jamrun program.jxe --app=X [ --fog || --device || --cloud ]
    ${body_2_bold(`Among the flags above only one of them can be used`)}
    ${body_2_bold(
        `If none of the flags are set the program will run as device by default`
    )}
    ${body_2("--fog : runs a fog node (only J node) with program.jxe.")}
    ${body_2("--cloud : runs a cloud node (only J node). ")}
    ${body_2("--device : runs a device node (J node and C node).")}
    
    --- jamrun program.jxe --app=X [ --data=127.0.0.1:7000 ]
    ${body_2_bold(`By default, jamrun uses a Redis server running at 127.0.0.1:(20000+porttaken) as the
    data store. To use a different Redis server use the --data option.`)}
    ${body_2(`--data: Runs program.jxe and connects it to an already running Redis server at
    port 7000 of the local host. Redis server can run outside the
    local host (Redis needs to the configured to accept outside
    connections).`)}
    
    --- jamrun program.jxe --app=X [ --num=4 ]
    ${body_2_bold(`By default, jamrun runs one c node.`)}
    ${body_2(`--num: use this option to start more than one C node at a device.
    the command abouve starts the program with 4 C nodes`)}
    
    --- jamrun program.jxe --app=X [ --tag="param1, param2" ]
    ${body_2_bold(`By default, no tag is assigned.`)}
    ${body_2(`--tag: use this option to provide a set of tags to the program.`)}

    --- jamrun program.jxe --app=X [ --bg ]
    ${body_2_bold(`By default, the program is running on the foreground.`)}
    ${body_2(`--bg: use this flag to run a command in the background. the --bg is mandatory for the cases
    that program is running on a remote machine.`)}
   
    --- jamrun program.jxe --app=X [ --old ]
    ${body_2_bold(
        `By default, the program is using the latest version in .jamruns folder.`
    )}
    ${body_2(`--old: use this flag to run the previous version in .jamruns folder.
    You can edit that version and rerun a custom version of a file.`)}

    --- jamrun program.jxe --app=X [ --log ]
    ${body_2_bold(`By default, the C node output is never stored and J node output stored only when
    the program is running in the background.`)}
    ${body_2(`--log: use this flag to turn on logging, capturing the output of C file and J file and
    adding them to the archive when the program stops running.
    This is useful for programs where the C side is crashing at the startup. 
    The tmux console would not run when the program crash at startup.
    So the --log option allows us to see the program error messages.`)}
  
    --- jamrun program.jxe --app=X [ --verb ]
    ${body_2(`--verb : use this flag to turn on verbose messaging.`)}
    
    --- jamrun program.jxe --app=X [ --valgrind ]
    ${body_2(
        `--verb : use this flag to run the cside with valgrind for leak checking.`
    )}

    --- jamrun program.jxe --app=X [ --local ]
    ${body_2(
        `--verb : use this flag to disable multicast discovery of the J node. The C node assumes that the J node in the local loopback.`
    )}

    --- jamrun program.jxe --app=X [ --remote=IPAddress ] [ --bg ]
    ${body_2_bold(`the --remote and --bg flag should always be used together. 
    remote programs can only run on the background`)}
    ${body_2(
        `--remote: use this option to run the program on remote machine and in the background`
    )}

    --- jamrun program.jxe --app=X [ --loc=long,lat ]
    ${body_2_bold(
        `By default, a random long and lat will be assigned to the running program`
    )}
    ${body_2(
        `--loc: use this option to run the program with and specific long and lat value`
    )}
    
    ${header_2(
        `The jamrun command creates a run state in the $HOME/.jamruns folder.`
    )}
    `;
    console.log(usageMessage);
}

//teste.working.
async function startmqtt(port, cFile) {
    const jamfolder = getJamFolder();
    try {
        await $`${MOSQUITTO_PUB} -p ${port} -t "test" -m "hello"`.quiet();
    } catch (error) {
        if (!NOVERBOSE) {
            console.log(
                `MQTT is not running at ${port}\nAttempting to start MQTT at ${port}`
            );
        }
        const command = MOSQUITTO;
        const args = ["-c", cFile];
        const options = {
            stdio: ["ignore", "ignore", "ignore"],
            detached: true,
        };
        const mqttProcesse = spawn(command, args, options);

        fs.writeFileSync(`${jamfolder}/mqttpid/${port}`, `${mqttProcesse.pid}`);
        mqttProcesse.unref();

        return;
    }
}

async function dojamout(iport, folder, jappid) {
    await dojamout_p1(iport, folder);
    await dojamout_p2(iport, folder, jappid);
}

//tested.working
async function dojamout_p1(pnum, floc) {
    await startmqtt(pnum, `${floc}/${pnum}/mqtt.conf`, data);
    if (data) {
        fs.writeFileSync(`${floc}/${pnum}/dataStore`, `${data}\n`);
    }
    fs.writeFileSync(`${floc}/${pnum}/class`, "process\n");
    fs.writeFileSync(`${floc}/${pnum}/shellpid`, SHELLPID.toString() + "\n");
    fs.writeFileSync(`${floc}/${pnum}/processId`, "new" + "\n");
    fs.writeFileSync(`${floc}/${pnum}/startStamp`, `${Date.now()}` + "\n");

    if (Type === "device") {
        fs.writeFileSync(`${floc}/${pnum}/numCnodes`, `${num}`);
    }
    if (root) {
        fs.writeFileSync(`${floc}/${pnum}/root`, root);
    }
}

async function dojamout_p2(iport, folder, jappid, group = null) {
    if (!bg) {
        await dojamout_p2_fg(iport, folder, jappid, group);
    } else {
        dojamout_p2_bg(iport, folder, jappid, group);
    }
}

//tested, working
async function dojamout_p2_fg(pnum, floc, jappid, group = null) {
    let argObject = {
        "--app": jappid,
        "--port": pnum,
        "--group": group,
        "--data": data,
        "--tags": tags,
        "--edge": edge,
        "--long": long,
        "--lat": lat,
        "--localregistryhost": local_registry,
        "--type": Type,
    };

    let jargs = getJargs(argObject);
    const command = "node";
    const args = ["jstart.js", ...jargs];

    if (log) {
        const options = {
            cwd: floc,
            stdio: ["pipe", "pipe", "pipe"],
        };
        const stream = fs.createWriteStream(`${floc}/${pnum}/log.j`, {
            flags: "a",
        });
        const child = spawn(command, args, options);
        child.stdout.on("data", (data) => {
            process.stdout.write(data);
            stream.write(data);
        });

        child.stderr.on("data", (data) => {
            process.stderr.write(data);
            stream.write(data);
        });

        child.on("exit", () => {
            process.kill(process.pid, "SIGTERM");
        });
    } else {
        const options = {
            cwd: floc,
            stdio: "inherit",
        };
        const child = spawn(command, args, options);
        child.on("exit", () => {
            process.kill(process.pid, "SIGTERM");
        });
    }
}

function dojamout_p2_bg(pnum, floc, jappid, group = null) {
    let argObject = {
        "--app": jappid,
        "--port": pnum,
        "--group": group,
        "--data": data,
        "--tags": tags,
        "--edge": edge,
        "--long": long,
        "--lat": lat,
        "--localregistryhost": local_registry,
        "--type": Type,
    };
    let jargs = getJargs(argObject);

    const logFile = fs.openSync(`${floc}/${pnum}/log.j`, "a");

    const command = "node";
    const args = ["jstart.js", ...jargs];
    const options = {
        cwd: floc,
        stdio: ["ignore", logFile, logFile],
        detached: true,
    };

    const p = spawn(command, args, options);
    p.unref();

    if (!NOVERBOSE) {
        console.log("Started the J node in background");
    }
    //keep this log file
    console.log("EXIT BG");
    process.exit(0);
}

async function doaout(num, port, group, datap, myf, jappid) {
    let counter = 1;
    if (fs.existsSync("a.out")) {
        await $`cd ${myf} && chmod +x a.out`;
    }
    while (counter <= num) {
        if (fs.existsSync("a.out")) {
            const argObject = {
                "-a": jappid.toString(),
                "-p": port,
                "-n": counter,
                "-g": group,
                "-t": tags,
                "-o": datap,
            };
            let cargs = getCargs(argObject);

            await $`${TMUX} new-session -s ${tmux}-${counter} -c ${myf} -d`;
            if (!log) {
                if (valgrind)
                    await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} C-m`;
                else
                    await $`${TMUX} send-keys -t ${tmux}-${counter} ./a.out ${cargs} C-m`;
            } else {
                if (valgrind)
                    await $`${TMUX} send-keys -t ${tmux}-${counter} ${valgrind} ./a.out ${cargs} -f log C-m`;
                //TMUX DOES NOT WORK FOR DOCKER CONTAINER(SCRIPT IS THE ISSUE)
                else
                    await $`${TMUX} send-keys -t ${tmux}-${counter} "script -a -t 1 ${myf}/${port}/log.${counter} ./a.out" ${cargs} C-m`;
            }
        }
        tmuxIds.push(`${tmux}-${counter}`);
        counter++;
    }
    if (!NOVERBOSE) console.log("Started a C node");
}

async function portavailable(folder, port) {
    let porttaken;
    const jamFolder = getJamFolder();
    if (fs.existsSync(`${folder}/${port}`)) {
        porttaken = 1;
    } else {
        porttaken = 0;
    }

    if (porttaken === 0) {
        if (!fs.existsSync(`${jamFolder}/ports/${port}`)) {
            const p =
                await $`netstat -lan -p tcp -f inet | grep ${port} | wc -l`
                    .nothrow()
                    .quiet();
            porttaken = Number(p.stdout.trim()) === 0 ? 0 : 1;
        } else {
            const runningApps = fs
                .readFileSync(`${jamFolder}/ports/${port}`)
                .toString()
                .trim()
                .split();
            const fileNoExt = getFileNoext(file);
            if (runningApps.includes(`${fileNoExt}_${app}`)) {
                porttaken = 1;
            } else {
                porttaken = 0;
            }
        }
    }
    return porttaken;
}

function setuptmux(path, appfolder) {
    fs.writeFileSync(`${path}/tmuxid`, tmux.toString() + "\n");
    fs.writeFileSync(`${appfolder}/tmuxid`, tmux.toString() + "\n");
}

async function startredis(port) {
    try {
        const p = $`redis-server --port ${port}`
            .stdio("ignore", "ignore", "inherit")
            .nothrow()
            .quiet();
    } catch (error) {}
}

async function waitforredis(port) {
    while (true) {
        try {
            const p = await $`redis-cli -p ${port} -c PING`.quiet();
            if (p.stdout.trim() === "PONG") {
                break;
            }
        } catch (error) {}
        if (!NOVERBOSE) {
            console.log("Trying to find Redis server...");
        }
        await sleep(1000);
    }

    if (!NOVERBOSE) {
        console.log(`Redis running at port: ${port}`);
    }
}

async function setupredis(port) {
    await $`cat ${REDISFUNCS} | redis-cli -p ${port} -x FUNCTION LOAD REPLACE > /dev/null`;
    await $`echo "set protected-mode no" | redis-cli -p ${port} > /dev/null`;
    await $`echo 'config set save "" protected-mode no' | redis-cli -p ${port} > /dev/null`;
    //IMPORTANT: flushing redis
    //USE FLUSH DB TO ONLY FLUSH THE CURRENT DB FOR THE APP
    //DB NUMBER
    //FOR NOW KEEP AS IT IS
    await $`redis-cli -p ${port} FLUSHALL`;
}

async function resolvedata(Name) {
    const [host, port] = Name.split(":");

    await startredis(Number(port));
    await waitforredis(port);
    await setupredis(port);
    data = Name.split(/\s+/).join("");
}

async function unpack(file, folder) {
    if (!old) {
        if (!fs.existsSync("./MANIFEST.txt")) {
            try {
                await $`cd ${folder} && unzip -o ${file}`.quiet();
            } catch (error) {
                throw new Error(`Problem reading file: ${file}\n${error}`);
            }
        } else {
            let forceRedo = false;
            try {
                isValidExecutable();
            } catch (error) {
                forceRedo = true;
            }
            if (!forceRedo) {
                const p1 =
                    await $`cd ${folder} && zipgrep CREATE ${file} | awk 'NR==1{split($0,a, " "); print a[3]}'`;
                const p2 =
                    await $`cd ${folder} && grep CREATE MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`;
                const ntime = Number(p1.stdout.toString().trim());
                const ontime = Number(p2.stdout.toString().trim());
                if (ntime > ontime) {
                    try {
                        if (!NOVERBOSE)
                            console.log("outdated, unzippping again");
                        await $`cd ${folder} && unzip -oq ${file}`.quiet();
                    } catch (error) {
                        throw new Error(
                            `Problem reading file: ${file}\n${error}`
                        );
                    }
                }
            } else {
                if (!NOVERBOSE)
                    console.log(
                        "The corrupted unziped files. files will be unziped again based on the existing MANIFEST.txt"
                    );
                await cleanExecutables();
                await $`cd ${folder} && unzip -oq ${file}`.quiet();
            }
        }
    } else {
        if (!NOVERBOSE) {
            console.log("WARNING: Unziped files might be outdated");
        }
        isValidExecutable();
    }
}

async function getjdata(folder) {
    const p =
        await $`cd ${folder} && grep JDATA MANIFEST.txt | awk '{split($0,a, " "); print a[3]}'`
            .nothrow()
            .quiet();
    return p.stdout.trim();
}

async function runNoneDevice(iport) {
    const [jamfolder, appfolder, folder] = getPaths(file, app);
    fileDirectoryMqtt(folder, iport, jamfolder, app);
    const jappid = getappid(jamfolder, `${folder}/${iport}`, app, appfolder);
    await dojamout(iport, folder, jappid);
}

async function runDevice(iport, dport, group) {
    const [jamfolder, appfolder, folder] = getPaths(file, app);
    fileDirectoryMqtt(folder, iport, jamfolder, app);
    const jappid = getappid(jamfolder, `${folder}/${iport}`, app, appfolder);
    await dojamout_p1(iport, folder);
    setuptmux(`${folder}/${iport}`, appfolder);
    await doaout(num, iport, group, dport, folder, jappid);
    await dojamout_p2(iport, folder, jappid, group);
}

async function main() {
    let iport;
    let dport;
    let group;
    try {
        ({
            app,
            tmux,
            num,
            edge,
            data,
            local_registry,
            bg,
            NOVERBOSE,
            log,
            old,
            local,
            valgrind,
            long,
            lat,
            Type,
            tags,
            port,
            file,
            remote,
            root,
        } = jamrunParsArg(process.argv));
    } catch (error) {
        show_usage();
        error.message === "SHOW USAGE" ? null : console.log(error.message);
        process.exit(1);
    }
    let folder;
    let ifile;
    let jdata;
    let client;

    console.log("Remote ..", remote);

    if (remote) {
        const config = {
            host: remote,
            port: 22,
            username: "maheswar",
            password: "pass4des",
        };

        client = await new Promise((resolve, reject) => {
            const client = new Client();

            client.on("ready", () => {
                resolve(client);
            });

            client.on("error", (error) => {
                reject(error);
            });

            console.log("Initiating connection to ....", config);
            client.connect(config);
        });
        const remoteArgs = getRemoteArgs(jamrunParsArg(process.argv));
        // const pathExport ="export PATH=$PATH:/home/admin/JAMScript/node_modules/.bin"
        const changeDir = "cd JAMScript/tools";
        let currIP;
        if (os.platform() === "win32") {
            currIP = (
                await $`powershell (Get-NetIPAddress -AddressFamily IPv4).IPAddress`.catch(
                    () => ""
                )
            )
                .toString()
                .trim();
        } else if (os.platform() === "darwin") {
            currIP = (await $`ipconfig getifaddr en0`.catch(() => ""))
                .toString()
                .trim();
        } else if (os.platform() === "linux") {
            currIP = (await $`hostname -I`.catch(() => "")).toString().trim();
        }
        const myPort = await executeScript(
            client,
            `${changeDir} && jamrun.mjs ${remoteArgs} --root=${currIP}`
        );

        console.log("IP ", currIP, " port ", myPort);

        const jamfolder = getJamFolder();
        const fileNoext = getFileNoext(file);
        if (!fs.existsSync(`${jamfolder}/remote`)) {
            fs.mkdirSync(`${jamfolder}/remote`);
        }
        if (
            !fs.existsSync(
                `${jamfolder}/remote/${config.host}_${config.port}`
            )
        ) {
            fs.mkdirSync(
                `${jamfolder}/remote/${config.host}_${config.port}`
            );
        }
        if (
            fs.existsSync(
                `${jamfolder}/remote/${config.host}_${config.port}/${myPort}`
            )
        ) {
            const remoteApps = fs
                .readFileSync(
                    `${jamfolder}/remote/${config.host}_${config.port}/${myPort}`
                )
                .toString()
                .trim()
                .split("\n");
            if (!remoteApps.includes(`${fileNoext}_${app}`)) {
                fs.appendFileSync(
                    `${jamfolder}/remote/${config.host}_${config.port}/${myPort}`,
                    `${fileNoext}_${app}\n`
                );
            }
        } else {
            fs.writeFileSync(
                `${jamfolder}/remote/${config.host}_${config.port}/${myPort}`,
                `${fileNoext}_${app}\n`
            );
        }
        process.exit(0);
    }

    fileDirectorySetUp(file, app);
    folder = getFolder(file, app);
    ifile = path.resolve(file);
    process.chdir(folder);
    await unpack(ifile, folder);
    isValidExecutable();
    jdata = await getjdata(folder);

    let isDevice;
    switch (Type) {
        case "cloud":
            iport = 9883;
            isDevice = false;

            while (true) {
                const porttaken = Number(
                    await portavailable(folder, iport)
                );
                if (porttaken !== 1) {
                    break;
                }
                iport++;
            }
            removablePort = iport;
            break;

        case "fog":
            iport = 5883;
            isDevice = false;
            while (true) {
                const porttaken = Number(
                    await portavailable(folder, iport)
                );
                if (porttaken !== 1) {
                    break;
                }
                iport++;
            }
            removablePort = iport;
            break;

        case "device":

            iport = 1883;
            isDevice = true;
            while (true) {
                const porttaken = Number(
                    await portavailable(folder, iport)
                );
                if (porttaken !== 1) {
                    break;
                }
                iport++;
            }
            removablePort = iport;
            if (!local) {
                group = iport - 1882;
            } else group = 0;
    }

    if (jdata.toLowerCase() === "true") {
        dport = iport + 20000;
        await resolvedata(`127.0.0.1:${dport}`);
    }

    if (!fs.existsSync(`${folder}/${iport}`, { recursive: true })) {
        fs.mkdirSync(`${folder}/${iport}`);
    }
    if (isDevice) await runDevice(iport, dport, group);
    else await runNoneDevice(iport);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jamcleanPath = resolve(__dirname, "jamclean.mjs");
await $`zx ${jamcleanPath}`;
await main();
