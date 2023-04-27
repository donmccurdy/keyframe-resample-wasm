export type Interpolation = 'step' | 'lerp' | 'slerp';

export enum InterpolationInternal {
	STEP = 0,
	LERP = 1,
	SLERP = 2,
}

export const TO_INTERPOLATION_INTERNAL: Record<Interpolation, InterpolationInternal> = {
	step: InterpolationInternal.STEP,
	lerp: InterpolationInternal.LERP,
	slerp: InterpolationInternal.SLERP,
};

export const EPSILON = 0.000001;
