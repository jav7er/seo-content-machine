import 'dotenv/config';
import { fetchPosts, deletePost } from '../lib/wordpress';
import { fetchBulkGSCData } from '../lib/gsc';
import { fetchBulkGA4Data } from '../lib/ga4';

async function cleanup() {
  console.log("Starting cleanup process...");

  const gscEndDate = new Date().toISOString().split("T")[0];
  const gscStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const siteUrl = process.env.GSC_SITE_URL || "";
  const propertyId = process.env.GA4_PROPERTY_ID || "";
  const now = new Date();
  const modifiedThreshold = 120 * 24 * 60 * 60 * 1000; // 120 days in ms

  if (!siteUrl || !propertyId) {
    console.error("Missing GSC_SITE_URL or GA4_PROPERTY_ID in .env");
    return;
  }

  console.log(`Fetching data for range: ${gscStartDate} to ${gscEndDate}`);
  console.log(`Modified threshold: ${modifiedThreshold / (24 * 60 * 60 * 1000)} days`);

  try {
    let allPosts: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { posts, total } = await fetchPosts(page, 100);
      allPosts = allPosts.concat(posts);
      console.log(`Fetched page ${page} (${posts.length} posts). Progress: ${allPosts.length}/${total}`);
      if (posts.length < 100 || allPosts.length >= total) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`Total posts fetched: ${allPosts.length}`);

    // 2. Fetch GSC and GA4 bulk data (Fetching larger limit for GSC/GA4)
    const [gscBulk, ga4Bulk] = await Promise.all([
      fetchBulkGSCData(siteUrl, gscStartDate, gscEndDate),
      fetchBulkGA4Data(propertyId, "60daysAgo", "today")
    ]);

    const toDelete: any[] = [];

    allPosts.forEach(post => {
      const url = post.link;
      let path = "/";
      try { path = new URL(url).pathname; } catch { }

      const gsc = gscBulk[url] || gscBulk[url.replace(/\/$/, "")] || { clicks: 0, impressions: 0 };
      const ga4 = ga4Bulk[path] || ga4Bulk[path.replace(/\/$/, "")] || { activeUsers: 0, pageViews: 0 };
      
      const modifiedDate = new Date(post.modified);
      const timeSinceModified = now.getTime() - modifiedDate.getTime();
      const isOldEnough = timeSinceModified > modifiedThreshold;

      if (gsc.clicks === 0 && gsc.impressions === 0 && ga4.pageViews === 0 && isOldEnough) {
        toDelete.push({
          id: post.id,
          title: post.title.rendered,
          url: post.link,
          clicks: gsc.clicks,
          impressions: gsc.impressions,
          pageViews: ga4.pageViews,
          modified: post.modified
        });
      }
    });

    console.log(`\nPosts identified for deletion (${toDelete.length}):`);
    toDelete.forEach(p => {
      console.log(`- [ID: ${p.id}] ${p.title} (${p.url})`);
    });

    if (toDelete.length === 0) {
      console.log("No posts found matching the criteria.");
      return;
    }

    console.log(`\nProceeding to delete ${toDelete.length} posts...`);

    for (const post of toDelete) {
      try {
        await deletePost(post.id);
        console.log(`Successfully deleted: ${post.title}`);
      } catch (err) {
        console.error(`Failed to delete post ${post.id}:`, err);
      }
    }

    console.log("\nCleanup completed.");

  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

cleanup();
