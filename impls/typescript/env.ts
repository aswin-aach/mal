import {Env, Mal} from './types'

function Envir(outer?: Env): Env {
	return {
		outer: outer || null,
		data: {},
		set_data: function (key: string, value: Mal): void {
			this.data[key] = value;
		},
		find: function (key: string): Mal | undefined {
			const value = this.data[key];
			if (value)
				return value;
			if (!this.outer)
				return undefined;
			return this.outer.find(key);
		},
		get_data: function (key: string): Mal {
			const value = this.find(key);
			if (!value)
				throw new ReferenceError(`'${key}' not found`);
			return value;
		}
	};
}


export {Envir};
