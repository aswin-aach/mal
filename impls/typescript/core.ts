import {Mal, Types, TType} from './types';
import {pr_str} from './printer';

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
				console.log(rendered);
				if ([Types.STRING].includes(element.tipo))
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
	}
};


export {ns};
