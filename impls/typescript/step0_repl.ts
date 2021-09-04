let readline = require('readline');
process.stdin.setEncoding('utf-8');

function READ(input: string) {
	return input;
}

function EVAL(input: string) {
	return input;
}

function PRINT(input: string) {
	return input;
}

function rep(input: string) {
	return PRINT(EVAL(READ(input)));
}

let input: string;
let  rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: false});

rl.setPrompt('user> ');
rl.prompt();
rl.on('line' ,function(textin: string)  { console.log(rep(textin)); rl.prompt(); });
rl.on('close',function()  { console.log('input is closed'); /* ... */ });
