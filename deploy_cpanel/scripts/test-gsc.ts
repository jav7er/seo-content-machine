import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

async function testGSC() {
    console.log("\n=== TESTING GOOGLE SEARCH CONSOLE (Fixed) ===");

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GSC_CLIENT_EMAIL,
                private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });

        const searchconsole = google.searchconsole({ version: "v1", auth });

        // Use sc-domain format (from env)
        const siteUrl = process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx";
        console.log(`📊 Querying GSC data for: ${siteUrl}`);

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        console.log(`Date range: ${startDate} to ${endDate}`);

        const response = await searchconsole.searchanalytics.query({
            siteUrl: siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ["page"],
                rowLimit: 10,
            },
        });

        console.log(`✅ Rows returned: ${response.data.rows?.length || 0}`);
        response.data.rows?.forEach((row, i) => {
            console.log(`  [${i}] ${row.keys?.[0]} => clicks=${row.clicks}, impressions=${row.impressions}`);
        });

        if (!response.data.rows?.length) {
            console.log("⚠️ No data returned - this could mean the site has very little traffic.");
        }

    } catch (error: any) {
        console.error("❌ GSC Error:", error.message);
        if (error.code) console.error("   Error code:", error.code);
    }
}

testGSC().catch(console.error);
