import {Mal, Types, TType, Fn, HashMap} from './types';
import {pr_str} from './printer';
import {read_str} from './reader';
import {readFileSync} from 'fs';
import {MalError} from './utils';


const fail = {
	value: 'false',
	tipo: Types.FALSE
};
const success = {
	value: 'true',
	tipo: Types.TRUE
};
const nil = {
	value: 'nil',
	tipo: Types.NIL
};

const ns: {[symbol: string]: Mal} = {
	'+': {
	value: (a: {value: number, tipo: Types.NUMBER}, b: {value: number, tipo: Types.NUMBER}): Mal => ({
			value: a.value+b.value,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
	},
	'-': {
		value: (a: {value: number, tipo: Types.NUMBER}, b: {value: number, tipo: Types.NUMBER}): Mal => ({
			value: a.value-b.value,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
	},
	'*': {
		value: (a: {value: number, tipo: Types.NUMBER}, b: {value: number, tipo: Types.NUMBER}): Mal => ({
			value: a.value*b.value,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
	},
	'/': {
		value: (a: {value: number, tipo: Types.NUMBER}, b: {value: number, tipo: Types.NUMBER}): Mal => ({
			value: a.value/b.value,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
	},
	'prn': {
		value: (...elements: Mal[]): Mal => {
			console.log(elements.map((element) => pr_str(element, true)).join(' '));
			return nil;
		},
		tipo: Types.FUNCTION
	},
	'list': {
		value: (...elements: Mal[]): Mal => ({
			value: elements,
			tipo: Types.LIST
		}),
		tipo: Types.FUNCTION
	},
	'list?': {
		value: (test_element: Mal): Mal => {
			const is_list = (test_element.tipo === Types.LIST) && (Array.isArray(test_element.value));
			return is_list ? success : fail;
		},
		tipo: Types.FUNCTION
	},
	'empty?': {
		value: (test_list: Mal): Mal => {
			const is_not_empty = Array.isArray(test_list.value) && test_list.value.length;
			return is_not_empty ? fail : success;
		},
		tipo: Types.FUNCTION
	},
	'count': {
		value: (list: {value: Mal[], tipo: TType}): Mal => ({
			value: (Array.isArray(list.value) && list.value.length) || 0,
			tipo: Types.NUMBER
		}),
		tipo: Types.FUNCTION
	},
	'=': {
		value: function is_equal(ast1: Mal, ast2: Mal): Mal {
			if (ast1.tipo !== ast2.tipo) {
				if (!([Types.LIST, Types.VECTOR].includes(ast1.tipo) && [Types.LIST, Types.VECTOR].includes(ast2.tipo)))
				return fail;
			}
			if (ast1.tipo === Types.LIST || ast1.tipo === Types.VECTOR) {
				const first_array = ast1.value as Mal[];
				const second_array = ast2.value as Mal[];
				if (first_array.length !== second_array.length)
					return fail;
				for (let index = 0; index < first_array.length; index += 1) {
					if (is_equal(first_array[index], second_array[index]) === fail)
						return fail;
				}
				return success;
			}
			if (ast1.tipo === Types.HASHMAP) {
				const left_map = ast1.value as HashMap;
				const right_map = ast2.value as HashMap;
				const left_keys = Object.keys(left_map);
				const right_keys = Object.keys(right_map);
				if (left_keys.length !== right_keys.length)
					return fail;
				for(let key of left_keys) {
					if (is_equal(left_map[`${key}`], right_map[`${key}`]) === fail)
						return fail;
				}
				return success;
			}

			if (ast1.value === ast2.value)
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'<': {
		value: (a: {value: number; tipo: TType}, b: {value: number; tipo: TType}): Mal => {
			return a.value < b.value ? success : fail;
		},
		tipo: Types.FUNCTION
	},
	'<=': {
		value: (a: {value: number; tipo: TType}, b: {value: number; tipo: TType}): Mal => {
			return a.value <= b.value ? success : fail;
		},
		tipo: Types.FUNCTION
	},
	'>': {
		value: (a: {value: number; tipo: TType}, b: {value: number; tipo: TType}): Mal => {
			return a.value > b.value ? success : fail;
		},
		tipo: Types.FUNCTION
	},
	'>=': {
		value: (a: {value: number; tipo: TType}, b: {value: number; tipo: TType}): Mal => {
			return a.value >= b.value ? success : fail;
		},
		tipo: Types.FUNCTION
	},
	'pr-str': {
		value: (...elements: Mal[]): {value: string; tipo: TType} => ({
			value: elements.map((element) => pr_str(element, true)).join(' '),
			tipo: Types.STRING
		}),
		tipo: Types.FUNCTION
	},
	'str': {
		value: (...elements: Mal[]): {value: string; tipo: TType} => ({
			value: elements.map((element) => {
				const rendered = pr_str(element, false);
				if ([Types.STRING].includes(element.tipo) && (element.value as string).slice(0, 1) !== '\u{29E}')
					return rendered.slice(1, -1);
				return rendered;
			}).join(''),
			tipo: Types.STRING
		}),
		tipo: Types.FUNCTION
	},
	'println': {
		value: (...elements: Mal[]): Mal => {
			console.log(elements.map((element) => {
				const rendered = pr_str(element, false);
				if (element.tipo === Types.STRING)
					return rendered.slice(1, -1);
				return rendered;
			}).join(' '));
			return nil;
		},
		tipo: Types.FUNCTION
	},
	'read-string': {
		value: (str: {value: string; tipo: TType}) => 
			read_str(str.value),
		tipo: Types.FUNCTION
	},
	'slurp': {
		value: (filename: {value: string; tipo: TType}): {value: string; tipo: TType} => {
			const contents = readFileSync(filename.value);
			return {
				value: contents.toString(),
				tipo: Types.STRING
			};
		},
		tipo: Types.FUNCTION
	},
	'atom': {
		value: (ast: Mal): {value: Mal; tipo: TType} => ({
			value: ast,
			tipo: Types.ATOM
		}),
		tipo: Types.FUNCTION
	},
	'atom?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.ATOM)
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'deref': {
		value: (ast: {value: Mal; tipo: TType}) => ast.value,
		tipo: Types.FUNCTION
	},
	'reset!': {
		value: (atom: {value: Mal; tipo: TType}, new_value: Mal): Mal => {
			atom.value = new_value;
			return new_value;
		},
		tipo: Types.FUNCTION
	},
	'swap!': {
		value: (atom: {value: Mal; tipo: TType}, lambda: {value: Function | Fn; tipo: TType}, ...args: Mal[]): Mal => {
			let function_obj: Function;
			if (lambda.tipo === Types.FUNCTION) {
				function_obj = lambda.value as Function;
			} else {
				function_obj = (lambda.value as Fn).fn;
			}
			const result: Mal = function_obj.apply(null, [atom.value, ...args]);
			atom.value = result;
			return result;
		},
		tipo: Types.FUNCTION
	},
	'cons': {
		value: (pre: Mal, list: {value: Mal[], tipo: TType}) => ({
			value: [pre, ...list.value],
			tipo: Types.LIST
		}),
		tipo: Types.FUNCTION
	},
	'concat': {
		value: (...elements: Array<{value: Mal[]; tipo: TType}>) => ({
			value: elements.reduce((acc: Mal[], element) => [...acc, ...element.value], []),
			tipo: Types.LIST
		}),
		tipo: Types.FUNCTION
	},
	'vec': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.VECTOR)
				return ast;
			if (!Array.isArray(ast.value)) {
				return {
					value: [ast],
					tipo: Types.VECTOR
				};
			}
			return {
				...ast,
				tipo: Types.VECTOR
			}


		},
		tipo: Types.FUNCTION
	},
	'nth': {
		value: (list: {value: Mal[], tipo: TType}, index: {value: number; tipo: TType}) => {
			if (index.value >= list.value.length)
				throw new Error(`Index ${index.value} out of bounds for list`);
			return list.value[index.value];
		},
		tipo: Types.FUNCTION
	},
	'first': {
		value: (ast: Mal) => {
			if (![Types.LIST, Types.VECTOR].includes(ast.tipo))
				return nil;
			const list = ast.value as Mal[];
			if (list.length) {
				return list[0];
			}
			return nil;
		},
		tipo: Types.FUNCTION
	},
	'rest': {
		value: (ast: Mal): Mal => {
			const empty_list = {value: [], tipo: Types.LIST};
			if (![Types.LIST, Types.VECTOR].includes(ast.tipo))
				return empty_list;
			const list = ast.value as Mal[];
			if (list.length) {
				return {
					value: list.slice(1),
					tipo: Types.LIST
				};
			}
			return empty_list;
		},
		tipo: Types.FUNCTION
	},
	'throw': {
		value: (message: Mal) => {
			throw new MalError(pr_str(message, true));
		},
		tipo: Types.FUNCTION
	},
	'apply': {
		value: (func: {value: Function | Fn, tipo: TType}, ...args_list: Mal[]) => {
			const list = args_list.pop() as {value: Mal[], tipo: TType};
			const args = [...args_list, ...list.value];
			if (func.tipo === Types.FUNCTION) {
				return (func.value as Function).apply(null, args);
			}
			return (func.value as Fn).fn.apply(null, args);
		},
		tipo: Types.FUNCTION
	},
	'map': {
		value: (func: {value: Function | Fn, tipo: TType}, list: {value: Mal[], tipo: TType}) => {
			let fn: Function;
			if (func.tipo === Types.FUNCTION) {
				fn = func.value as Function;
			} else {
				fn = (func.value as Fn).fn;
			}
			return {
				tipo: Types.LIST,
				value: list.value.map((element) => fn(element))
			};
		},
		tipo: Types.FUNCTION
	},
	'nil?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.NIL)
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'true?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.TRUE) {
				return success;
			}
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'false?': {
		value: (ast: Mal) => {
			if ([Types.NIL, Types.FALSE].includes(ast.tipo)) {
				return success;
			}
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'symbol?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.SYMBOL) {
				return success;
			}
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'symbol': {
		value: (ast: {value: string; tipo: TType}) => ({
			...ast,
			tipo: Types.SYMBOL
		}),
		tipo: Types.FUNCTION
	},
	'keyword': {
		value: (ast: {value: string; tipo: TType}) => {
			if (ast.value.slice(0, 1) === '\u{29E}')
				return ast;
			return {
				...ast,
				value: `\u{29E}${ast.value}`
			};
		},
		tipo: Types.FUNCTION
	},
	'keyword?': {
		value: (ast: {value: string; tipo: TType}) => {
			if (ast.value.slice(0, 1) === '\u{29E}')
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'vector': {
		value: (...args: Mal[]) => ({
			value: args,
			tipo: Types.VECTOR
		}),
		tipo: Types.FUNCTION
	},
	'vector?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.VECTOR)
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'sequential?': {
		value: (ast: Mal) => {
			if([Types.LIST, Types.VECTOR].includes(ast.tipo))
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'hash-map': {
		value: (...args: Mal[]) => {
			const map: HashMap = {};
			merge_to_map(args, map);
			return {
				value: map,
				tipo: Types.HASHMAP
			};
		},
		tipo: Types.FUNCTION
	},
	'map?': {
		value: (ast: Mal) => {
			if (ast.tipo === Types.HASHMAP)
				return success;
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'assoc': {
		value: (originalmap: {value: HashMap, tipo: TType}, ...args: Mal[]) => {
			const {...resultmap} = originalmap.value;
			merge_to_map(args, resultmap);
			return {
				value: resultmap,
				tipo: Types.HASHMAP
			};
		},
		tipo: Types.FUNCTION
	},
	'dissoc': {
		value: (originalmap: {value: HashMap, tipo: TType}, ...args: Array<{value: string; tipo: TType}>) => {
			const {...resultmap} = originalmap.value;
			for (let symbol_to_remove of args) {
				delete resultmap[symbol_to_remove.value];
			}
			return {
				value: resultmap,
				tipo: Types.HASHMAP
			};
		},
		tipo: Types.FUNCTION
	},
	'get': {
		value: (map: {value: HashMap, tipo: TType}, key: {value: string; tipo: TType}) => {
			return map.value[key.value] || nil;
		},
		tipo: Types.FUNCTION
	},
	'contains?': {
		value: (map: {value: HashMap, tipo: TType}, key: {value: string; tipo: TType}) => {
			if (map.value[key.value]) {
				return success;
			}
			return fail;
		},
		tipo: Types.FUNCTION
	},
	'keys': {
		value: (map: {value: HashMap, tipo: TType}): {value: Mal[], tipo: TType} => ({
			value: Object.keys(map.value).map(key => ({value: key, tipo: Types.STRING})),
			tipo: Types.LIST
		}),
		tipo: Types.FUNCTION
	},
	'vals': {
		value: (map: {value: HashMap, tipo: TType}): {value: Mal[], tipo: TType} => ({
			value: Object.values(map.value),
			tipo: Types.LIST
		}),
		tipo: Types.FUNCTION
	}
};

function merge_to_map(args: Mal[], map: HashMap) {
	if (args.length % 2)
			throw new SyntaxError('unbalanced');
	for (let index = 0; index < args.length; index += 2) {
		if (args[index].tipo !== Types.STRING || typeof args[index].value !== 'string')
			throw new SyntaxError('hashmap key wrong');
		map[args[index].value as string] = args[index + 1];
	}
}

export {ns};

