import type {ComponentType, ReactNode} from 'react';
import React from 'react';

type ProviderComponent = ComponentType<{children:ReactNode}>;
type CombineContextProvidersProperties = {
	contextProviders:ProviderComponent[];
	children:ReactNode;
};

export default function CombineContextProviders({contextProviders, children}:CombineContextProvidersProperties):React.JSX.Element {
	return (
		<>
			{contextProviders.reduceRight((accumulatedChildren, ContextProvider) => {
				return <ContextProvider>{accumulatedChildren}</ContextProvider>;
			}, children)}
		</>
	);
};