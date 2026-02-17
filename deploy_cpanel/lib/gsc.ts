import { google } from "googleapis";

export interface GSCData {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: Array<{
        keys: string[];
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }>;
}

export async function fetchGSCData(
    siteUrl: string,
    startDate: string,
    endDate: string,
    pageUrl?: string
): Promise<GSCData> {
    // Mock Data Fallback if credentials are missing
    if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) {
        console.warn("Missing GSC credentials, returning mock data.");
        return {
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
            topQueries: [],
        };
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GSC_CLIENT_EMAIL,
                private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });

        const searchconsole = google.searchconsole({
            version: "v1",
            auth,
        });

        const requestBody: any = {
            startDate,
            endDate,
            dimensions: ["query"],
            rowLimit: 10,
        };

        if (pageUrl) {
            requestBody.dimensionFilterGroups = [
                {
                    filters: [
                        {
                            dimension: "page",
                            operator: "equals",
                            expression: pageUrl,
                        },
                    ],
                },
            ];
        }

        const response = await searchconsole.searchanalytics.query({
            siteUrl,
            requestBody,
        });

        const rows = response.data.rows || [];

        const totals = rows.reduce(
            (acc, row) => ({
                clicks: (acc.clicks || 0) + (row.clicks || 0),
                impressions: (acc.impressions || 0) + (row.impressions || 0),
                ctr: (acc.ctr || 0) + (row.ctr || 0),
                position: (acc.position || 0) + (row.position || 0),
            }),
            { clicks: 0, impressions: 0, ctr: 0, position: 0 }
        );

        const count = rows.length || 1;

        return {
            clicks: totals.clicks || 0,
            impressions: totals.impressions || 0,
            ctr: totals.ctr ? totals.ctr / count : 0,
            position: totals.position ? totals.position / count : 0,
            topQueries: rows.map((row) => ({
                keys: row.keys || [],
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: row.ctr || 0,
                position: row.position || 0,
            })),
        };
    } catch (error) {
        console.warn("Error fetching GSC data (returning mock):", error);
        return {
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
            topQueries: [],
        };
    }
}

export async function fetchBulkGSCData(
    siteUrl: string,
    startDate: string,
    endDate: string
): Promise<Record<string, { clicks: number; impressions: number }>> {
    if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) return {};

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GSC_CLIENT_EMAIL,
                private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });

        const searchconsole = google.searchconsole({ version: "v1", auth });
        const res = await searchconsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ["page"],
                rowLimit: 500,
            },
        });

        const mapping: Record<string, { clicks: number; impressions: number }> = {};
        res.data.rows?.forEach((row) => {
            if (row.keys?.[0]) {
                mapping[row.keys[0]] = {
                    clicks: row.clicks || 0,
                    impressions: row.impressions || 0,
                };
            }
        });
        return mapping;
    } catch (error) {
        console.error("Error bulk GSC:", error);
        return {};
    }
}
