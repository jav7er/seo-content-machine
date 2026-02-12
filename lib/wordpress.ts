import { Post } from "@/types/wordpress";

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://newemage.com.mx/wp-json";
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64")}`;
}

/**
 * Validates WordPress credentials and connection
 */
export async function validateWordPressConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
      headers: { Authorization: getAuthHeader() },
    });
    return res.ok;
  } catch (error) {
    console.error("WordPress connection validation failed:", error);
    return false;
  }
}

/**
 * Fetches a single post by ID (includes meta for Rank Math)
 */
export async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts/${id}?_embed`, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) throw new Error(`Failed to fetch post with id ${id}`);
  return res.json();
}

/**
 * Fetches multiple posts with pagination
 */
export async function fetchPosts(page = 1, perPage = 10): Promise<{ posts: Post[], total: number }> {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!res.ok) {
    return { posts: [], total: 0 };
  }

  const total = parseInt(res.headers.get('X-WP-Total') || '0');
  const posts = await res.json();
  return { posts, total };
}

/**
 * Deletes (trashes) a post by ID
 */
export async function deletePost(id: number): Promise<void> {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) throw new Error(`Failed to delete post with id ${id}`);
}

/**
 * Calculates word count from HTML content
 */
export function getWordCount(html: string): number {
  const text = html.replace(/<[^>]*>?/gm, '');
  return text.trim().split(/\s+/).length;
}

/**
 * Updates a WordPress post (title, slug, content, and Rank Math meta)
 */
export async function updatePost(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    meta?: {
      rank_math_title?: string;
      rank_math_description?: string;
      rank_math_focus_keyword?: string;
    };
  }
): Promise<Post> {
  const body: Record<string, any> = {};
  if (data.title) body.title = data.title;
  if (data.slug) body.slug = data.slug;
  if (data.content) body.content = data.content;
  if (data.meta) body.meta = data.meta;

  const res = await fetch(`${WP_API_URL}/wp/v2/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update post ${id}: ${res.status} - ${errorText}`);
  }

  return res.json();
}
/**
 * Creates a new WordPress post
 */
export async function createPost(data: {
  title: string;
  content: string;
  status?: "publish" | "draft" | "pending" | "private";
  slug?: string;
  categories?: number[];
  featured_media?: number;
  meta?: {
    rank_math_title?: string;
    rank_math_description?: string;
    rank_math_focus_keyword?: string;
  };
}): Promise<Post> {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create post: ${res.status} - ${errorText}`);
  }

  return res.json();
}

/**
 * Fetches all categories
 */
export async function fetchCategories(): Promise<Array<{ id: number; name: string; count: number }>> {
  const res = await fetch(`${WP_API_URL}/wp/v2/categories?per_page=100`, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetches recent media items
 */
export async function fetchMedia(): Promise<Array<{ id: number; source_url: string; title: { rendered: string } }>> {
  const res = await fetch(`${WP_API_URL}/wp/v2/media?per_page=50`, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Uploads a media file to WordPress
 */
export async function uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<any> {
  const res = await fetch(`${WP_API_URL}/wp/v2/media`, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      Authorization: getAuthHeader(),
    },
    body: file as any,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload media: ${res.status} - ${errorText}`);
  }

  return res.json();
}

/**
 * Fetches a simplified inventory of all posts
 */
export async function fetchPostInventory(): Promise<Array<{ title: string; url: string; focus_keyword: string }>> {
  const { posts } = await fetchPosts(1, 100); // Fetch last 100 posts for inventory context
  return posts.map(post => ({
    title: typeof post.title === 'string' ? post.title : post.title.rendered,
    url: post.link,
    focus_keyword: post.meta?.rank_math_focus_keyword || ""
  }));
}
