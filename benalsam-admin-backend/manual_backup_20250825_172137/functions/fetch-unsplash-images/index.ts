import { corsHeaders } from "./cors.ts";
const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
console.log('UNSPLASH_ACCESS_KEY ', UNSPLASH_ACCESS_KEY);
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({
        error: 'Query is required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    if (!UNSPLASH_ACCESS_KEY) {
      return new Response(JSON.stringify({
        error: 'Unsplash Access Key is not configured in Supabase secrets.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape&lang=tr`;
    const unsplashResponse = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    console.log('unsplash', unsplashResponse);
    if (!unsplashResponse.ok) {
      console.error('Unsplash API error:', await unsplashResponse.text());
      throw new Error('Failed to fetch images from Unsplash');
    }
    const data = await unsplashResponse.json();
    const images = data.results.map((img)=>({
        id: img.id,
        description: img.alt_description,
        urls: {
          small: img.urls.small,
          regular: img.urls.regular
        },
        user: {
          name: img.user.name,
          link: img.user.links.html
        }
      }));
    return new Response(JSON.stringify({
      images
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
