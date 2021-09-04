import {read_str} from './reader';
import {Mal} from './types';
import {pr_str} from './printer';

let readline = require('readline');
process.stdin.setEncoding('utf-8');

function READ(input: string): Mal {
	return read_str(input);
}

function EVAL(input: Mal): Mal{
	return input;
}

function PRINT(input: Mal): string {
	return pr_str(input, true);
}

function rep(input: string): string {
	return PRINT(EVAL(READ(input)));
}

let  rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: false});

rl.setPrompt('user> ');
rl.prompt();
rl.on('line' ,function(textin: string) {
	try{
		console.log(rep(textin));
	} catch(e) {
		console.error(e.message);
	}
	rl.prompt();
});
rl.on('close',function()  { console.log('input is closed'); /* ... */ });
