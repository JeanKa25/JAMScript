const express = require('express');
const { exec } = require('child_process');
const app = express();

const port = 3000;
const host = '0.0.0.0';


/// TO UPDATE IN FUNCTION OF WHERE THE TOOLS ARE ON YOUR LOCAL COPY ///
let cwd = '/Users/andreisandor/Desktop/McGill/Capstone/newServer/JAMScript/tools';
const childProcessExport1 = exec('export JAM_HOME=/Users/andreisandor/Desktop/McGill/Capstone/newServer/JAMScript',  
                                  {cwd} );

const childProcessExport2 = exec('export JAMHOME=/Users/andreisandor/Desktop/McGill/Capstone/newServer/JAMScript',  
                                  {cwd});
const childProcessExport3 = exec('export PATH=$JAM_HOME/tools:$PATH',  
                                  {cwd});
const childProcessExport4 = exec('export JAMDATA=/Users/andreisandor/Desktop/McGill/Capstone/newServer/JAMScript/data', {cwd});


const childProcess1 = exec('djam init --ideal',  {cwd} );
const childProcess2 = exec('djam pull mahes25/jamscript',  {cwd});
////////////////////////////////////////////////////////////////////////////


// Middleware to parse JSON requests
app.use(express.json());

// Define a simple route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Utility function to handle command execution and streaming response
function executeCommand(req, res, command, cwd = '/root/capstone/JAMScript/tools/') {
  console.log(`Executing command: ${command}`);
  const childProcess = exec(command, { cwd });

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Stream stdout data to the client
  childProcess.stdout.on('data', (data) => {
    res.write(data);
  });

  // Stream stderr data to the client (for debugging or error messages)
  childProcess.stderr.on('data', (data) => {
    res.write(`Error: ${data}`);
  });

  // When the process completes, close the response
  childProcess.on('close', (code) => {
    res.end(`\nProcess completed with code ${code}`);
  });

  // Handle any execution errors
  childProcess.on('error', (error) => {
    res.end(`\nFailed to start process: ${error.message}`);
  });

  // If the client disconnects, terminate the child process
  // req.on('close', () => {
  //   if (childProcess.exitCode === null) { // If process is still running
  //     console.log('Client disconnected, terminating process');
  //     childProcess.kill(); // Terminate the process
  //   }
  // });
}

// Define the /jamrun endpoint
app.post('/jamrun', (req, res) => {
  const {
    file = 'file.jxe',
    app_name,
    fog,
    cloud,
    device,
    num,
    data,
    tags,
    bg,
    old,
    log,
    verb,
    loc,
    edge,
    valgrind,
    local,
    remote,
  } = req.body;

  if (!app_name) {
    return res.status(400).json({ error: 'The "app_name" field is required.' });
  }

  let command = `djam run ${file} --app=${app_name}`;
  if (fog) command += ' --fog';
  if (cloud) command += ' --cloud';
  if (device) command += ' --device';
  if (num) command += ` --num=${num}`;
  if (data) command += ` --data=${data}`;
  if (tags) command += ` --tags="${tags}"`;
  if (bg) command += ' --bg';
  if (old) command += ' --old';
  if (log) command += ' --log';
  if (verb) command += ' --verb';
  if (loc) command += ` --loc=${loc}`;
  if (edge) command += ` --edge=${edge}`;
  if (valgrind) command += ' --valgrind';
  if (local) command += ' --local';
  if (remote) command += ` --remote=${remote}`;

  executeCommand(req, res, command);
});

// Define the /jambatch endpoint
// app.post('/jambatch', (req, res) => {
//   const {
//     fog, device, cloud, cFile, fFile, dFile, num, cLoc, fLoc, dLoc, cEdge, fEdge, dEdge
//   } = req.body;

//   let command = `zx jambatch.mjs`;
//   if (fog) command += ` --fog=${fog}`;
//   if (device) command += ` --device=${device}`;
//   if (cloud) command += ` --cloud=${cloud}`;
//   if (cFile) command += ` --cFile=${cFile}`;
//   if (fFile) command += ` --fFile=${fFile}`;
//   if (dFile) command += ` --dFile=${dFile}`;
//   if (num) command += ` --num=${num}`;
//   if (cLoc) command += ` --cLoc=${cLoc}`;
//   if (fLoc) command += ` --fLoc=${fLoc}`;
//   if (dLoc) command += ` --dLoc=${dLoc}`;
//   if (cEdge) command += ` --cEdge=${cEdge}`;
//   if (fEdge) command += ` --fEdge=${fEdge}`;
//   if (dEdge) command += ` --dEdge=${dEdge}`;

//   executeCommand(req, res, command);
// });

// Define the /jamlog endpoint
app.post('/jamlog', (req, res) => {
  const { help, program, app, port, remote, tail, c, j } = req.body;

  // Default command without arguments if none are specified
  let command = `djam log`;
  if (help) command += ` --help`;
  if (program) command += ` --program=${program}`;
  if (app) command += ` --app=${app}`;
  if (port) command += ` --port=${port}`;
  if (remote) command += ` --remote=${remote}`;
  if (tail) command += ` --tail=${tail}`;

  if (c) command += ` --c`;
  if (j) command += ` --j`;

  executeCommand(req, res, command);
  
});

app.post('/jamlist', (req, res) => {
  const { help, all, monitor, type, dataStore, tmuxid, port, app, prog, remote } = req.body;

  // Default command without arguments if none are specified
  let command = `djam list`;
  if (help) command += ` --help`;
  if (all) command += ` --all`;
  if (monitor) command += ` --monitor`;
  if (type) command += ` --type==${type}`;
  if (dataStore) command += ` --dataStore==${dataStore}`;
  if (tmuxid) command += ` --tmuxid==${tmuxid}`;
  if (port) command += ` --port==${port}`;
  if (app) command += ` --app==${app}`;
  if (prog) command += ` --prog==${prog}`;
  if (remote) command += ` --remote`;

  executeCommand(req, res, command);
});

// Define the /jamkill endpoint
app.post('/jamkill', (req, res) => {
  const { reset, all, remote, app, prog, port } = req.body;

  let command = 'djam kill';
  if (reset) command += ' --reset';
  if (all) command += ' --all';
  if (remote) command += ` --remote=${remote}`;
  if (app) command += ` --app==${app}`;
  if (prog) command += ` --prog==${prog}`;
  if (port) command += ` --port==${port}`;

  executeCommand(req, res, command);
});

// Define the /jamterm endpoint
app.post("/jamterm", (req, res) => {
  const { all, app, prog, port, pane } = req.body;

  let command = `djam term`;
  if (all) command += ' --all';
  if (app) command += ` --app==${app}`;
  if (prog) command += ` --prog==${prog}`;
  if (port) command += ` --port==${port}`;
  if (pane) command += ` --pane=${pane}`;

  executeCommand(req, res, command);
});

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

