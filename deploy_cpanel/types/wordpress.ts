export interface PostMeta {
    rank_math_title?: string;
    rank_math_description?: string;
    rank_math_focus_keyword?: string;
    rank_math_seo_score?: string;
    rank_math_canonical_url?: string;
    footnotes?: string;
}

export interface Post {
    id: number;
    date: string;
    date_gmt: string;
    guid: {
        rendered: string;
    };
    modified: string;
    modified_gmt: string;
    slug: string;
    status: "publish" | "future" | "draft" | "pending" | "private";
    type: string;
    link: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    comment_status: "open" | "closed";
    ping_status: "open" | "closed";
    sticky: boolean;
    template: string;
    format: string;
    meta: PostMeta;
    categories: number[];
    tags: number[];
    _embedded?: {
        "wp:featuredmedia"?: Array<{
            source_url: string;
            alt_text: string;
        }>;
        author?: Array<{
            name: string;
            avatar_urls: Record<string, string>;
        }>;
    };
}
