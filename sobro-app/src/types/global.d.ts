import React from "react";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			distortMaterialImpl?: any;
		}

		type Element = React.ReactNode;
	}
}