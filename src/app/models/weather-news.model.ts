export interface NewsArticle {
    title: string;
    description: string;
    source: string;
    publishedAt: Date;
    imageUrl: string;
    url: string;
}

export type NewsFilter = 'All India Weather News' | 'Monsoon Updates' | 'Cyclone Alerts' | 'Rain Alerts' | 'Heatwave Alerts';
