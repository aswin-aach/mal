import {read_str} from './reader';
import {Mal, Fn, Env, Types, TType, HashMap} from './types';
import {Envir} from './env';
import {pr_str} from './printer';
import {ns} from './core';
import {argv, exit} from 'process';

let readline = require('readline');
process.stdin.setEncoding('utf-8');

const repl_env = Envir();
for (let i in ns) {
	repl_env.set_data(i, ns[i]);
}
repl_env.set_data('eval', {
	value: function (ast: Mal): Mal {
		return EVAL(ast, repl_env);
	},
	tipo: Types.FUNCTION
});

function READ(input: string): Mal {
	return read_str(input);
}

function quasiquote(ast: Mal): Mal {
	if ([Types.VECTOR, Types.LIST].includes(ast.tipo)) {
		const mal_list = ast.value as Mal[];
		if (ast.tipo === Types.LIST && mal_list[0]?.value === 'unquote') {
			return mal_list[1];
		}
		const result = [...mal_list].reverse().reduce((acc: Mal[], list_element) => {
			if ([Types.LIST].includes(list_element.tipo) && (list_element.value as Mal[])[0]?.value === 'splice-unquote') {
				return [
					{
						value: 'concat',
						tipo: Types.SYMBOL
					},
					(list_element.value as Mal[])[1],
					{
						value: acc,
						tipo: Types.LIST
					}
				];
			}
			return [
				{
					value: 'cons',
					tipo: Types.SYMBOL
				},
				quasiquote(list_element),
				{
					value: acc,
					tipo: Types.LIST
				}
			];
		}, []);

		if (ast.tipo === Types.VECTOR) {
			return {
				value: [
					{
						value: 'vec',
						tipo: Types.SYMBOL
					},
					{
						value: result,
						tipo: Types.LIST
					}
				],
				tipo: Types.LIST
			}
		}
		return {
			value: result,
			tipo: Types.LIST
		}
	}
	if ([Types.SYMBOL, Types.HASHMAP].includes(ast.tipo)) {
		return {
			value: [
				{
					value: 'quote',
					tipo: Types.SYMBOL
				},
				ast
			],
			tipo: Types.LIST
		};
	}
	return ast;
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
	while (true) {
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
				input = third; env = new_env;
				break;
			case 'do':
				const nil: Mal = {value: 'nil', tipo: Types.NIL};
				const evallist = (input.value as Mal[]).slice(1, -1);
				for (let element of evallist) {
					EVAL(element, env);
				}
				input = (input.value as Mal[]).pop() || nil;
				break;
			case 'if':
				const cond = EVAL(second, env);
				if ((cond.tipo === Types.FALSE) || (cond.tipo === Types.NIL)) {
					if (rest && rest[0]) {
						input = rest[0];
					} else
						input = {value: 'nil', tipo: Types.NIL};
				} else 
					input = third;
				break;
			case 'fn*':
				const arg_names = second as { value: Array<{value: string; tipo: TType}>; tipo: TType};
				return {
					value: {
						fn: function (...args: Mal[]): Mal {
							const closed_env = Envir(env);
							for (let i = 0; i < arg_names.value.length; i += 1) {
								if (arg_names.value[i].value === '&') {
									closed_env.set_data(arg_names.value[i+1].value, {value: args.slice(i), tipo: Types.LIST});
									break;
								}
								closed_env.set_data(arg_names.value[i].value, args[i]);
							}
							return EVAL(third, closed_env);
						},
						params: arg_names.value,
						env,
						body: third
					},
					tipo: Types.FN
				};
			case 'quote':
				return second;
			case 'quasiquote':
				input = quasiquote(second);
				break;
			case 'quasiquoteexpand':
				return quasiquote(second);
			default:
				const [f, ...args] = eval_ast(input, env).value as Mal[];
				if (f.tipo === Types.FN) {
					const fn_obj: Fn = f.value as Fn;
					const closed_env = Envir(fn_obj.env);
					for (let i = 0; i < fn_obj.params.length; i += 1) {
						if (fn_obj.params[i].value === '&') {
							closed_env.set_data(fn_obj.params[i+1].value, {value: args.slice(i), tipo: Types.LIST});
							break;
						}
						closed_env.set_data(fn_obj.params[i].value, args[i]);
					}
					input = fn_obj.body;
					env = closed_env;
					break;
				}
					
				return (f.value as Function).apply(null, args);
		}
	}
}

function PRINT(input: Mal): string {
	return pr_str(input, true);
}

function rep(input: string): string {
	return PRINT(EVAL(READ(input), repl_env));
}

rep('(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))');
rep('(def! not (fn* (a) (if a false true)))');

repl_env.set_data('*ARGV*', {
	value: argv.slice(3).map(arg => ({value: arg, tipo: Types.STRING})),
	tipo: Types.LIST
});

if (argv.length > 2) {
	const file_path: string = argv[2];
	rep(`(load-file "${file_path}")`);
	exit(0);
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
