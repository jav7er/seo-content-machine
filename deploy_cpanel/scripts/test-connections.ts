import { google } from "googleapis";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import * as dotenv from "dotenv";

dotenv.config();

async function testGSC() {
    console.log("\n=== TESTING GOOGLE SEARCH CONSOLE ===");
    console.log("GSC_CLIENT_EMAIL:", process.env.GSC_CLIENT_EMAIL ? "✅ Set" : "❌ Missing");
    console.log("GSC_PRIVATE_KEY:", process.env.GSC_PRIVATE_KEY ? `✅ Set (${process.env.GSC_PRIVATE_KEY.length} chars)` : "❌ Missing");

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GSC_CLIENT_EMAIL,
                private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });

        const searchconsole = google.searchconsole({ version: "v1", auth });

        // Test 1: List sites
        console.log("\n📋 Listing available sites...");
        const sites = await searchconsole.sites.list();
        console.log("Sites found:", sites.data.siteEntry?.map(s => s.siteUrl) || "None");

        // Test 2: Query data
        const siteUrl = "https://newemage.com.mx";
        console.log(`\n📊 Querying GSC data for ${siteUrl}...`);

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        console.log(`Date range: ${startDate} to ${endDate}`);

        const response = await searchconsole.searchanalytics.query({
            siteUrl: siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ["page"],
                rowLimit: 5,
            },
        });

        console.log("Rows returned:", response.data.rows?.length || 0);
        response.data.rows?.forEach((row, i) => {
            console.log(`  [${i}] ${row.keys?.[0]} => clicks=${row.clicks}, impressions=${row.impressions}`);
        });

    } catch (error: any) {
        console.error("❌ GSC Error:", error.message);
        if (error.code) console.error("   Error code:", error.code);
        if (error.errors) console.error("   Details:", JSON.stringify(error.errors, null, 2));
    }
}

async function testGA4() {
    console.log("\n=== TESTING GOOGLE ANALYTICS 4 ===");
    console.log("GA4_PROPERTY_ID:", process.env.GA4_PROPERTY_ID || "❌ Missing");
    console.log("GA4_CLIENT_EMAIL:", process.env.GA4_CLIENT_EMAIL ? "✅ Set" : "❌ Missing");
    console.log("GA4_PRIVATE_KEY:", process.env.GA4_PRIVATE_KEY ? `✅ Set (${process.env.GA4_PRIVATE_KEY.length} chars)` : "❌ Missing");

    try {
        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: {
                client_email: process.env.GA4_CLIENT_EMAIL,
                private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
        });

        const propertyId = process.env.GA4_PROPERTY_ID;
        console.log(`\n📊 Querying GA4 property ${propertyId}...`);

        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
            limit: 10,
        });

        console.log("Rows returned:", response.rows?.length || 0);
        response.rows?.forEach((row, i) => {
            const path = row.dimensionValues?.[0]?.value;
            const users = row.metricValues?.[0]?.value;
            const views = row.metricValues?.[1]?.value;
            console.log(`  [${i}] ${path} => activeUsers=${users}, pageViews=${views}`);
        });

    } catch (error: any) {
        console.error("❌ GA4 Error:", error.message);
        if (error.code) console.error("   Error code:", error.code);
        if (error.details) console.error("   Details:", error.details);
    }
}

async function main() {
    console.log("🔍 SEO Content Machine - Connection Diagnostics");
    console.log("================================================");
    await testGSC();
    await testGA4();
    console.log("\n================================================");
    console.log("✅ Diagnostics complete.");
}

main().catch(console.error);
