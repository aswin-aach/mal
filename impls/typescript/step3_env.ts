import {read_str} from './reader';
import {Mal, Env, Types, HashMap} from './types';
import {Envir} from './env';
import {pr_str} from './printer';

let readline = require('readline');
process.stdin.setEncoding('utf-8');

const repl_env = Envir();
repl_env.set_data('+', {
		value: (a: number, b: number): Mal => ({
			value: a+b,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
});
repl_env.set_data('-',{
		value: (a: number, b: number): Mal => ({
			value: a-b,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
});
repl_env.set_data('*', {
		value: (a: number, b: number): Mal => ({
			value: a*b,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
});
repl_env.set_data('/', {
		value: (a: number, b: number): Mal => ({
			value: a/b,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
});


function READ(input: string): Mal {
	return read_str(input);
}

function eval_ast(ast: Mal, env: Env): Mal {
	switch(ast.tipo) {
		case Types.SYMBOL:
			return env.get_data(ast.value as string);
		case Types.LIST:
			return {
				value: (ast.value as Mal[]).map((item: Mal) => EVAL(item, env)),
				tipo: Types.LIST
			};
		case Types.VECTOR:
			return {
				value: (ast.value as Mal[]).map((item: Mal) => EVAL(item, env)),
				tipo: Types.VECTOR
			};
		case Types.HASHMAP:
			let evaledMap: HashMap = {};
			Object.entries(ast.value as HashMap).forEach(([key, value]) => {
				evaledMap[key] = EVAL(value, env);
			});
			return {
				value: evaledMap,
				tipo: Types.HASHMAP
			};
		default:
			return ast;
	}
}
	

function EVAL(input: Mal, env: Env): Mal {
	if (input.tipo !== Types.LIST) {
		return eval_ast(input, env);
	}
	if ((input.value as Mal[]).length < 1)
		return input;
	const [first, second, third, ...rest] = input.value as Mal[];
	switch(first.value) {
		case 'def!':
			const result = EVAL(third, env);
			env.set_data(second.value as string, result);
			return result;
		case 'let*':
			const new_env = Envir(env);
			const def_list = second.value as Mal[];
			for (let index = 0; index < def_list.length; index += 2) {
				const def_key = def_list[index].value as string;
				const def_value = EVAL(def_list[index+1], new_env);
				new_env.set_data(def_key, def_value);
			}
			return EVAL(third, new_env);
		default:
			const [f, ...args] = eval_ast(input, env).value as Mal[];
			return (f.value as Function).apply(null, args.map((arg) => arg.value));
	}
}

function PRINT(input: Mal): string {
	return pr_str(input, true);
}

function rep(input: string): string {
	return PRINT(EVAL(READ(input), repl_env));
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
