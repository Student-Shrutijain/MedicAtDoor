/**
 * Safely parse a fetch Response as JSON.
 * Falls back with a clear error if the server returns empty or HTML
 * (e.g. Render free-tier cold start, CORS block, 502 etc.)
 */
export async function safeJson(res) {
    const text = await res.text();
    if (!text || text.trim() === '') {
        throw new Error('No response from server — backend may be starting up. Please try again in 30 seconds.');
    }
    try {
        return JSON.parse(text);
    } catch {
        // Server returned HTML (likely an error page)
        throw new Error('Server error — backend may be starting up. Please try again in 30 seconds.');
    }
}
