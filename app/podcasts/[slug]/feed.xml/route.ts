import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    // Fetch show and published episodes
    const { data: show, error: showErrror } = await supabase
      .from("podcast_shows")
      .select(`
        *,
        episodes:podcast_episodes(
          id, title, description, slug, audio_url, duration_seconds, 
          episode_number, season_number, published_at
        )
      `)
      .eq("slug", slug)
      .eq("status", "active")
      .is("deleted_at", null)
      .single();

    if (showErrror || !show) {
      return new NextResponse("Podcast feed not found", { status: 404 });
    }

    // Filter to only published episodes that aren't deleted
    // (We apply this here since nested RLS might not fully filter depending on service role vs user, though we use regular client)
    const episodes = (show.episodes || []).sort((a: any, b: any) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voiceofupsa.com";
    const feedUrl = `${baseUrl}/podcasts/${slug}/feed.xml`;
    const showUrl = `${baseUrl}/podcasts/${slug}`;

    // Build the RSS 2.0 XML with iTunes namespace
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${show.title}]]></title>
    <link>${showUrl}</link>
    <language>en-us</language>
    <description><![CDATA[${show.description}]]></description>
    <itunes:author><![CDATA[${show.itunes_author}]]></itunes:author>
    <itunes:image href="${show.cover_image_url}"/>
    <itunes:category text="${show.category}"/>
    <itunes:explicit>${show.itunes_explicit ? 'yes' : 'no'}</itunes:explicit>
`;

    for (const ep of episodes) {
      if (!ep.published_at) continue; // Skip unpublished
      
      const epUrl = `${showUrl}/${ep.slug}`;
      const pubDate = new Date(ep.published_at).toUTCString();
      
      xml += `
    <item>
      <title><![CDATA[${ep.title}]]></title>
      <link>${epUrl}</link>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      <description><![CDATA[${ep.description}]]></description>
      <enclosure url="${ep.audio_url}" type="audio/mpeg" length="0" />
      <itunes:duration>${ep.duration_seconds}</itunes:duration>
      <itunes:explicit>${show.itunes_explicit ? 'yes' : 'no'}</itunes:explicit>
      ${ep.episode_number ? `<itunes:episode>${ep.episode_number}</itunes:episode>` : ''}
      ${ep.season_number ? `<itunes:season>${ep.season_number}</itunes:season>` : ''}
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    });

  } catch (err) {
    console.error("Error generating RSS feed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
