import { google } from "googleapis";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import * as dotenv from "dotenv";

dotenv.config();

async function testGA4() {
    console.log("🔍 Testing GA4 Connection...");

    if (!process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY || !process.env.GA4_PROPERTY_ID) {
        console.error("❌ Missing GA4 credentials in .env");
        return;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
            client_email: process.env.GA4_CLIENT_EMAIL,
            private_key: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
    });

    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${process.env.GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
            dimensions: [{ name: "pagePath" }],
            limit: 5,
        });

        console.log("✅ GA4 Success! Sample data:");
        response.rows?.forEach(row => {
            console.log(`- ${row.dimensionValues?.[0]?.value}: ${row.metricValues?.[0]?.value} users`);
        });
    } catch (error: any) {
        console.error("❌ GA4 Error:", error.message);
        if (error.message.includes("403")) {
            console.log("💡 Tip: Verify that the API is enabled and the service account has 'Viewer' access to the Property.");
        }
    }
}

testGA4();
