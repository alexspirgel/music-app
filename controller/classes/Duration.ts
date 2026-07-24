import {extendOptions} from '@controller/utilities/utilities';

// Types

export type Unit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years';
export type UnitDefinition = {
	name: Unit;
	factor: number;
};
export type UnitSelection = Partial<Record<Unit, boolean>>;
export type ValueByUnits = Partial<Record<Unit, number>>;
export type FormattingUnitOptions = {
	minimumIntegerDigits?:number;
	minimumDecimalDigits?:number;
	maximumDecimalDigits?:number;
	suffix?:string;
	displayThousandsDelimiter?:boolean
}
export type FormattingOptions = {
	years?:FormattingUnitOptions;
	months?:FormattingUnitOptions;
	days?:FormattingUnitOptions;
	hours?:FormattingUnitOptions;
	minutes?:FormattingUnitOptions;
	seconds?:FormattingUnitOptions;
	milliseconds?:FormattingUnitOptions;
	separators?:{
		years?:{
			months?:string | null;
			days?:string | null;
			hours?:string | null;
			minutes?:string | null;
			seconds?:string | null;
			milliseconds?:string | null;
		};
		months?:{
			days?:string | null;
			hours?:string | null;
			minutes?:string | null;
			seconds?:string | null;
			milliseconds?:string | null;
		};
		days?:{
			hours?:string | null;
			minutes?:string | null;
			seconds?:string | null;
			milliseconds?:string | null;
		};
		hours?:{
			minutes?:string | null;
			seconds?:string | null;
			milliseconds?:string | null;
		};
		minutes?:{
			seconds?:string | null;
			milliseconds?:string | null;
		};
		seconds?:{
			milliseconds?:string | null;
		};
	};
	delimiters?:{
		thousands?:string;
		decimals?:string;
	};
};
export type OutputItems = (OutputUnitItem | OutputSeparatorItem)[];
export type OutputUnitItem = {
	type:Unit;
	value:OutputUnitItemPart[];
};
export type OutputUnitItemPart = {
	type:'decimal' | 'decimalDelimiter' | 'integer' | 'integerDelimiter' | 'suffix';
	value:string;
};
export type OutputSeparatorItem = {
	type:'separator';
	value:string;
};

// Class

export default class Duration {

	/**
	 * Each definition includes the name and factor difference of the next smallest unit.
	 */
	static units:UnitDefinition[] = [
		{
			name: 'years',
			factor: 12,
		},
		{
			name: 'months',
			factor: 30.436875,
		},
		{
			name: 'days',
			factor: 24,
		},
		{
			name: 'hours',
			factor: 60,
		},
		{
			name: 'minutes',
			factor: 60,
		},
		{
			name: 'seconds',
			factor: 1000,
		},
		{
			name: 'milliseconds',
			factor: 1,
		},
	];

	/**
	 * Formatting options default values.
	 */
	static #formattingDefaultOptions:FormattingOptions = {
		years: {
			minimumIntegerDigits: 0,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 1,
			suffix: ' years',
			displayThousandsDelimiter: true,
		},
		months: {
			minimumIntegerDigits: 0,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 1,
			suffix: ' months',
			displayThousandsDelimiter: true,
		},
		days: {
			minimumIntegerDigits: 0,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 1,
			suffix: ' days',
			displayThousandsDelimiter: true,
		},
		hours: {
			minimumIntegerDigits: 1,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 2,
			suffix: '',
			displayThousandsDelimiter: true,
		},
		minutes: {
			minimumIntegerDigits: 2,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 2,
			suffix: '',
			displayThousandsDelimiter: true,
		},
		seconds: {
			minimumIntegerDigits: 2,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 2,
			suffix: '',
			displayThousandsDelimiter: true,
		},
		milliseconds: {
			minimumIntegerDigits: 3,
			minimumDecimalDigits: 0,
			maximumDecimalDigits: 0,
			suffix: '',
			displayThousandsDelimiter: true,
		},
		separators: {
			years: {
				months: ', ',
				days:  ', ',
				hours:  ' ',
				minutes:  ' ',
				seconds: ' ',
				milliseconds: ' ',
			},
			months: {
				days:  ', ',
				hours:  ' ',
				minutes:  ' ',
				seconds: ' ',
				milliseconds: ' ',
			},
			days: {
				hours: ', ',
				minutes: ', ',
				seconds: ', ',
				milliseconds: ', ',
			},
			hours: {
				minutes: ':',
				seconds: ' ',
				milliseconds: ' ',
			},
			minutes: {
				seconds: ':',
				milliseconds: ':',
			},
			seconds: {
				milliseconds: ':',
			},
		},
		delimiters: {
			thousands: ',',
			decimals: '.',
		},
	};

	/**
	 * Converts a number value from one duration unit to another duration unit. 
	 * @param value - The duration value to convert.
	 * @param from - The duration unit of the input value.
	 * @param to - The desired duration unit of the output value.
	 * @returns The converted value.
	 */
	static convert = (value:number, from:Unit, to:Unit):number => {
		if (from === to) {
			return value;
		}
		const fromIndex:number = this.units.findIndex((item) => item.name === from);
		const toIndex:number = this.units.findIndex((item) => item.name === to);
		const unitDifference:number = this.units.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex)).reduce((accumulator:number, currentValue:UnitDefinition) => accumulator * currentValue.factor, 1);
		if (fromIndex < toIndex) {
			return value * unitDifference;
		}
		else {
			return value / unitDifference;
		}
	}

	/**
	 * Converts a value by units into milliseconds.
	 * @param valueByUnits - The duration value by units to convert.
	 * @returns The converted milliseconds amount.
	 */
	static valueByUnitsToMilliseconds(valueByUnits:ValueByUnits):number {
		return Object.entries(valueByUnits).reduce((accumulator:number, [key, value]) => {
			if (typeof value === 'number') {
				return accumulator + Duration.convert(value, key as Unit, 'milliseconds');
			}
			return accumulator;
		}, 0);
	}

	/**
	 * Remove false values from a unit selection object so only true values remain.
	 * @param unitSelection - The unit selection to normalize.
	 * @returns A unit selection with only true values.
	 */
	static normalizeUnitSelection(unitSelection:UnitSelection):UnitSelection {
		return Object.fromEntries(Object.entries(unitSelection).filter((item) => {
			return item[1];
		}));
	}

	#duration:number;
	#formattingOptions:FormattingOptions;

	/**
	 * Constructs a new Duration instance.
	 * @param valueByUnits - An initial duration value, broken down by units.
	 * @param formattingOptions - An options object to define the formatting settings.
	 * @returns A new Duration instance.
	 */
	constructor(valueByUnits:ValueByUnits = {'milliseconds': 0}, formattingOptions?:FormattingOptions) {
		this.#duration = Duration.valueByUnitsToMilliseconds(valueByUnits);
		this.#formattingOptions = extendOptions({}, this.typedConstructor.#formattingDefaultOptions);
		if (formattingOptions) {
			this.formattingOptions = formattingOptions;
		}
	}

	/**
	 * Get the constructor typed correctly for typescript linting.
	 */
	get typedConstructor():typeof Duration {
		return this.constructor as typeof Duration;
	}

	/**
	 * Gets the duration value converted into the specified units.
	 * @param unitSelection - Select which unit(s) the return value should be. 
	 * @returns The duration converted into the specified units.
	 */
	get(unitSelection:UnitSelection):ValueByUnits {
		unitSelection = Duration.normalizeUnitSelection(unitSelection);
		const output:ValueByUnits = {};
		let temporaryDuration = this.#duration;
		for (const unitDefinition of Duration.units) {
			const unit = unitDefinition.name;
			if (unitSelection[unit]) {
				const unitValue = Duration.convert(temporaryDuration, 'milliseconds', unit);
				if (Object.entries(output).length < (Object.entries(unitSelection).length - 1)) {
					const unitIntegerValue = Math.trunc(unitValue);
					output[unit] = unitIntegerValue;
					temporaryDuration = temporaryDuration - Duration.convert(unitIntegerValue, unit, 'milliseconds');
				}
				else {
					output[unit] = unitValue;
					break;
				}
			}
		}
		return output;
	}

	/**
	 * Sets the duration value.
	 * @param valueByUnits - A duration value, broken down by units.
	 */
	set(valueByUnits:ValueByUnits) {
		this.#duration = Duration.valueByUnitsToMilliseconds(valueByUnits);
	}

	/**
	 * Adds to the duration.
	 * @param valueByUnits - The value to add to the duration.
	 * @returns The updated duration represented in milliseconds.
	 */
	add(valueByUnits:ValueByUnits):number {
		this.#duration = this.#duration + Duration.valueByUnitsToMilliseconds(valueByUnits);
		return this.#duration;
	}

	/**
	 * Removes from the duration.
	 * @param valueByUnits - The value to remove from the duration.
	 * @returns The updated duration represented in milliseconds.
	 */
	remove(valueByUnits:ValueByUnits):number {
		this.#duration = this.#duration - Duration.valueByUnitsToMilliseconds(valueByUnits);
		return this.#duration;
	}

	/**
	 * Gets the formatting options.
	 * @returns The formatting options.
	 */
	get formattingOptions():FormattingOptions {
		return this.#formattingOptions;
	}

	/**
	 * Sets the formatting options.
	 * @param formattingOptions - The formatting options to set.
	 */
	set formattingOptions(formattingOptions:FormattingOptions) {
		this.#formattingOptions = extendOptions({}, this.typedConstructor.#formattingDefaultOptions, formattingOptions);
	}

	/**
	 * Formats the duration into an organized data structure of display strings.
	 * @param unitSelection - Select which units to display in the formatted duration.
	 * @param formattingOptionsOverrides - Optional formatting options overrides.
	 * @returns An organized array of objects containing strings.
	 */
	format(unitSelection:UnitSelection, formattingOptionsOverrides?:FormattingOptions):OutputItems {
		const output:OutputItems = [];
		unitSelection = Duration.normalizeUnitSelection(unitSelection);
		const formattingOptions:FormattingOptions = extendOptions({}, this.#formattingOptions, formattingOptionsOverrides);
		const durationObject:ValueByUnits = this.get(unitSelection);
		for (const unitDefinition of Duration.units) {
			const unit:Unit = unitDefinition.name;
			if (typeof durationObject[unit] === 'number') {
				let value:number = Math.abs(durationObject[unit]);
				let valueString:string = String(value);
				let displayInteger:string = valueString;
				let displayDecimal:string = '';
				if (valueString.includes('.')) {
					const valueStringParts:string[] = valueString.split('.');
					if (valueStringParts.length === 2) {
						displayInteger = valueStringParts[0];
						displayDecimal = valueStringParts[1];
					}
				}
				// Option: minimumDecimalDigits
				if (typeof formattingOptions[unit]?.minimumDecimalDigits === 'number') {
					const minimumDecimalDigits:number = formattingOptions[unit].minimumDecimalDigits;
					if (displayDecimal.length < minimumDecimalDigits) {
						displayDecimal = Number.parseFloat('0.' + displayDecimal).toFixed(minimumDecimalDigits).slice(2);
					}
				}
				// Option: maximumDecimalDigits
				if (typeof formattingOptions[unit]?.maximumDecimalDigits === 'number') {
					const maximumDecimalDigits:number = formattingOptions[unit].maximumDecimalDigits;
					if (displayDecimal.length > maximumDecimalDigits) {
						if (maximumDecimalDigits === 0) {
							value = Math.round(value);
							valueString = String(value);
							displayInteger = valueString;
							displayDecimal = '';
						}
						else {
							displayDecimal = Number.parseFloat('0.' + displayDecimal).toFixed(maximumDecimalDigits).slice(2);
						}
					}
				}
				// Option: minimumIntegerDigits
				if (typeof formattingOptions[unit]?.minimumIntegerDigits === 'number') {
					const minimumIntegerDigits:number = formattingOptions[unit].minimumIntegerDigits;
					if (displayInteger.length < minimumIntegerDigits) {
						for (let character = displayInteger.length; character < minimumIntegerDigits; character++) {
							displayInteger = '0' + displayInteger;
						}
					}
				}
				// Adjust integer zeros
				if (displayInteger.length > 0 && [...displayInteger].every(char => char === '0')) {
					if (typeof formattingOptions[unit]?.minimumIntegerDigits === 'number' && formattingOptions[unit].minimumIntegerDigits > 0) {
						if (displayInteger.length > formattingOptions[unit].minimumIntegerDigits) {
							displayInteger = displayInteger.slice(0, formattingOptions[unit].minimumIntegerDigits); 
						}
					}
					else if (displayDecimal.length > 0) {
						displayInteger = '0';
					}
					else {
						displayInteger = '';
					}
				}
				// Begin building the output
				if (displayInteger.length > 0 || displayDecimal.length > 0) {
					const previousOutputItem:OutputUnitItem | OutputSeparatorItem | undefined = output.at(-1);
					if (previousOutputItem && previousOutputItem.type !== 'separator' && previousOutputItem.type !== 'milliseconds') {
						const previousOutputItemType:Unit = previousOutputItem.type;
						const separatorOptionValue:string | undefined = (formattingOptions.separators?.[previousOutputItemType] as any)[unit];
						if (typeof separatorOptionValue === 'string' && separatorOptionValue.length > 0) {
							const outputSeparatorItem:OutputSeparatorItem = {
								type: 'separator',
								value: separatorOptionValue,
							};
							output.push(outputSeparatorItem);
						}
					}
					const outputUnitItem:OutputUnitItem = {
						type: unit,
						value: [],
					};
					if (displayInteger.length > 0) {
						// Option: displayThousandsDelimiter
						if (displayInteger.length > 3 && formattingOptions[unit]?.displayThousandsDelimiter && typeof formattingOptions.delimiters?.thousands === 'string') {
							for (let i = displayInteger.length; i > 0; i-= 3) {
								if (i !== displayInteger.length) {
									outputUnitItem.value.unshift({
										type: 'integerDelimiter',
										value: formattingOptions.delimiters.thousands,
									});
								}
								outputUnitItem.value.unshift({
									type: 'integer',
									value: displayInteger.substring((i - 3), i),
								});
							}
						}
						else {
							outputUnitItem.value.push({
								type: 'integer',
								value: displayInteger,
							});
						}
					}
					if (displayDecimal.length > 0) {
						let decimalDelimiter:string = '.';
						if (typeof formattingOptions.delimiters?.decimals === 'string') {
							decimalDelimiter = formattingOptions.delimiters.decimals;
						}
						outputUnitItem.value.push({
							type: 'decimalDelimiter',
							value: decimalDelimiter,
						});
						outputUnitItem.value.push({
							type: 'decimal',
							value: displayDecimal,
						});
					}
					if (typeof formattingOptions[unit]?.suffix === 'string' && formattingOptions[unit].suffix.length > 0) {
						outputUnitItem.value.unshift({
							type: 'suffix',
							value: formattingOptions[unit].suffix,
						});
					}
					output.push(outputUnitItem);
				}
			}
		}
		return output;
	}

}