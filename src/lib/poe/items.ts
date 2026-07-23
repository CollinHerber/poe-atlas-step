import type { GuideUnique } from '$lib/types/guide';

export const uniquePriceKey = (name: string, baseType: string) => `${name}|${baseType}`;

export const buildTradeUrl = (item: GuideUnique, league: string) => {
	const query = {
		query: {
			status: { option: 'online' },
			name: item.name,
			type: item.baseType,
			stats: [{ type: 'and', filters: [] }]
		},
		sort: { price: 'asc' }
	};

	return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(query))}`;
};
