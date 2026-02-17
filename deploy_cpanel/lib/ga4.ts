import { BetaAnalyticsDataClient } from "@google-analytics/data";


export interface GA4Data {
    activeUsers: number;
    screenPageViews: number;
    engagementRate: number;
}

export async function fetchGA4Data(
    propertyId: string,
    startDate: string,
    endDate: string,
    pagePath?: string
): Promise<GA4Data> {
    // Mock Data Fallback
    if (!process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
        console.warn("Missing GA4 credentials, returning mock data.");
        return {
            activeUsers: 0,
            screenPageViews: 0,
            engagementRate: 0,
        };
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
            client_email: process.env.GA4_CLIENT_EMAIL,
            private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
    });

    try {
        const request: any = {
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate,
                    endDate,
                },
            ],
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
                { name: "engagementRate" },
            ],
        };

        if (pagePath) {
            request.dimensionFilter = {
                filter: {
                    fieldName: "pagePath",
                    stringFilter: {
                        matchType: "EXACT",
                        value: pagePath,
                    },
                },
            };
        }

        const [response] = await analyticsDataClient.runReport(request);

        if (response.rows && response.rows.length > 0) {
            const row = response.rows[0];
            return {
                activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
                screenPageViews: parseInt(row.metricValues?.[1]?.value || "0"),
                engagementRate: parseFloat(row.metricValues?.[2]?.value || "0"),
            };
        }

        return {
            activeUsers: 0,
            screenPageViews: 0,
            engagementRate: 0,
        };
    } catch (error) {
        console.warn("Error fetching GA4 data (returning mock):", error);
        return {
            activeUsers: 0,
            screenPageViews: 0,
            engagementRate: 0,
        };
    }
}

export async function fetchBulkGA4Data(
    propertyId: string,
    startDate: string,
    endDate: string
): Promise<Record<string, { activeUsers: number; pageViews: number }>> {
    if (!process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) return {};

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
            client_email: process.env.GA4_CLIENT_EMAIL,
            private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
    });

    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
            limit: 500,
        });

        const mapping: Record<string, { activeUsers: number; pageViews: number }> = {};
        response.rows?.forEach((row) => {
            const path = row.dimensionValues?.[0]?.value;
            if (path) {
                mapping[path] = {
                    activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
                    pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
                };
            }
        });
        return mapping;
    } catch (error) {
        console.error("Error bulk GA4:", error);
        return {};
    }
}
