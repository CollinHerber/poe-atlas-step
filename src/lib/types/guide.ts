export type TodoPhase = 'during' | 'before-next';

export type GuideTodo = {
	id: string;
	text: string;
	phase: TodoPhase;
	done: boolean;
};

export type GuideStep = {
	id: string;
	title: string;
	eyebrow: string;
	description: string;
	todos: GuideTodo[];
};

export type BuildGuide = {
	id: string;
	name: string;
	buildVersion: string;
	className: string;
	level: number;
	sourceUrl: string;
	steps: GuideStep[];
};
