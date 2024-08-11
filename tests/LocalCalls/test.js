const { readFileSync } = require('fs');

const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Stream :: close');
      conn.end();
    }).on('data', (data) => {
      console.log('OUTPUT: ' + data);
    });
      stream.end('export PATH=$PATH:$HOME/Programs/JAMScript/tools\n which jamrun.mjs \nexit\n');
  });
}).connect({
  host: '10.0.1.9',
  port: 22,
  username: 'maheswar',
    password: 'pass4des'
});

