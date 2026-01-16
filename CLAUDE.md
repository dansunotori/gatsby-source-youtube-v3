# gatsby-source-youtube-v3

Gatsby source plugin to fetch YouTube channel data via the YouTube Data API v3.

## Build & Publish

```bash
npm run build      # Transpile src/ to root
npm publish --access public  # Publish to npm (requires OTP)
```

## How It Works

1. Fetches all playlists for the channel
2. Enumerates videos from each playlist (with pagination)
3. Deduplicates videos by videoId
4. Filters to keep only public + unlisted (excludes private/members-only)
5. Fetches video details (tags, duration, statistics)
6. Downloads thumbnails as local files
7. Creates Gatsby nodes: YoutubeVideo, YoutubeVideoTag, YoutubePlaylist

## Configuration

```js
// gatsby-config.js
{
  resolve: '@dansunotori/gatsby-source-youtube-v3',
  options: {
    channelId: 'YOUR_CHANNEL_ID',
    apiKey: process.env.YOUTUBE_API_KEY,
    maxVideos: 1000  // default: 50
  }
}
```

## Key Files

- `src/gatsby-node.js` - Main source logic (API calls, node creation)
- `src/normalize.js` - Data transformation and thumbnail downloading

## Notes

- Uses API key authentication (no OAuth required)
- Unlisted videos are accessible when they appear in playlists
- Rate limited to 500ms between API calls
