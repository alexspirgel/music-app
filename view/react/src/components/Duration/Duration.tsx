import type * as DurationControllerTypes from '@controller-classes/Duration';
import DurationController from '@controller-classes/Duration';
import React from 'react';

type Properties = {
	controllerDuration:DurationController;
	unitSelection:DurationControllerTypes.UnitSelection;
	formattingOptionsOverrides?:DurationControllerTypes.FormattingOptions;
	className?:string;
};

const arePropsEqual = (oldProps:Properties, newProps:Properties) => {
	const oldFormattedOutput = oldProps.controllerDuration.format(oldProps.unitSelection, oldProps.formattingOptionsOverrides);
	const newFormattedOutput = newProps.controllerDuration.format(newProps.unitSelection, newProps.formattingOptionsOverrides);
	return (JSON.stringify(oldFormattedOutput) === JSON.stringify(newFormattedOutput) && oldProps.className === newProps.className);
};

const Duration = ({controllerDuration, unitSelection, formattingOptionsOverrides, className}:Properties) => {

	className = className ? className : 'duration';

	const formattedOutput:DurationControllerTypes.OutputItems = controllerDuration.format(unitSelection, formattingOptionsOverrides);

	const itemElements:React.JSX.Element[] = [];
	for (const [outputItemIndex, outputItem] of formattedOutput.entries()) {
		if (outputItem.type === 'separator') {
			itemElements.push(<span key={outputItemIndex} className='separator'>{outputItem.value}</span>);
		}
		else {
			const itemSubElements:React.JSX.Element[] = [];
			for (const [itemSubItemIndex, itemSubItem] of outputItem.value.entries()) {
				let itemSubType:string = itemSubItem.type;
				if (itemSubType === 'decimalDelimiter') {
					itemSubType = 'decimal-delimiter';
				}
				else if (itemSubType === 'integerDelimiter') {
					itemSubType = 'integer-delimiter';
				}
				itemSubElements.push(<span key={itemSubItemIndex} className={itemSubType}>{itemSubItem.value}</span>);
			}
			itemElements.push(<span key={outputItemIndex} className={'unit ' + outputItem.type}>{itemSubElements}</span>);
		}
	}

	return (
		<div className={className}>{itemElements}</div>
	);

};
export default React.memo(Duration, arePropsEqual);