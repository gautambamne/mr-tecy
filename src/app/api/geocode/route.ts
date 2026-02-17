import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        console.log("Geocode API called with URL:", request.url);

        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');
        const address = searchParams.get('address');

        if (!address && (!lat || !lon)) {
            console.log("Missing parameters: lat/lon or address required");
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        let url = '';
        // Add a delay to respect Nominatim's usage policy (max 1 req/sec)
        // await new Promise(resolve => setTimeout(resolve, 1000));

        if (address) {
            url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        } else {
            url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        }

        console.log("Fetching from Nominatim:", url);

        const response = await fetch(url, {
            headers: {
                // Use a standard browser-like User-Agent to avoid blocking
                // 'User-Agent': 'MrTecy/1.0 (mrtecy@example.com)' // Previous one
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'http://localhost:3000'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Nominatim API error: ${response.status} ${text}`);
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Handle Nominatim error responses that are 200 OK but contain error field
        if (data.error) {
            console.error("Nominatim returned application error:", data.error);
            return NextResponse.json({ error: data.error }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Geocoding route fatal error:', error);
        return NextResponse.json({
            error: 'Failed to fetch location data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
