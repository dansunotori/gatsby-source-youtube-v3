const axios = require("axios");
const get = require("lodash/get");
const normalize = require("./normalize");

function getApi() {
  const rateLimit = 500;
  let lastCalled = null;

  const rateLimiter = (call) => {
    const now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit;
      const wait = lastCalled - now;
      if (wait > 0) {
        return new Promise((resolve) => setTimeout(() => resolve(call), wait));
      }
    }
    lastCalled = now;
    return call;
  };

  const api = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3/",
  });

  api.interceptors.request.use(rateLimiter);

  return api;
}

exports.sourceNodes = async (
  { actions, getCache, createNodeId },
  { channelId, apiKey, maxVideos = 50 }
) => {
  const { createNode } = actions;

  const createVideoNodesFromChannelId = async (channelId, apiKey) => {
    var api = getApi();
    let videos = [];
    let videoIDs = [];
    let videoDetails = [];
    let playlists = [];

    // =============================
    // Step 1: Download all playlists for the channel
    // =============================
    let pageSize = 50;

    // get the first page of playlists
    let playlistResp = await api.get(
      `playlists?channelId=${channelId}&part=id,snippet&maxResults=${pageSize}&key=${apiKey}`
    );
    playlists.push(...playlistResp.data.items);

    // get the next pages of playlists
    while (playlistResp.data.nextPageToken) {
      let nextPageToken = playlistResp.data.nextPageToken;
      playlistResp = await api.get(
        `playlists?channelId=${channelId}&part=id,snippet&maxResults=${pageSize}&pageToken=${nextPageToken}&key=${apiKey}`
      );
      playlists.push(...playlistResp.data.items);
    }

    console.log(`Downloaded ${playlists.length} playlist(s)`);

    // =============================
    // Step 2: Download all videos from all playlists
    // =============================
    const allPlaylistVideos = []; // raw API responses
    const seenVideoIds = new Set();

    await Promise.all(
      (playlists || []).map(async (list) => {
        list.videos = [];
        let pageSize = 50;

        // get the first page of playlist items (including status for privacy)
        let itemsResp = await api.get(
          `playlistItems?playlistId=${list.id}&part=snippet,contentDetails,status&maxResults=${pageSize}&key=${apiKey}`
        );
        list.videos.push(...itemsResp.data.items);

        // get the next pages of playlist items
        while (itemsResp.data.nextPageToken) {
          let nextPageToken = itemsResp.data.nextPageToken;
          itemsResp = await api.get(
            `playlistItems?playlistId=${list.id}&part=snippet,contentDetails,status&maxResults=${pageSize}&pageToken=${nextPageToken}&key=${apiKey}`
          );
          list.videos.push(...itemsResp.data.items);
        }

        console.log(`Downloaded ${list.videos.length} playlist item(s)`);

        // Collect videos for deduplication
        list.videos.forEach((item) => {
          allPlaylistVideos.push(item);
        });
      })
    );

    // =============================
    // Step 3: Deduplicate and filter videos
    // =============================
    const uniqueVideos = [];

    for (const item of allPlaylistVideos) {
      const videoId = get(item, "contentDetails.videoId");
      const privacyStatus = get(item, "status.privacyStatus");

      // Skip if already seen
      if (seenVideoIds.has(videoId)) {
        continue;
      }

      // Skip private videos (keep public and unlisted)
      if (privacyStatus !== "public" && privacyStatus !== "unlisted") {
        continue;
      }

      seenVideoIds.add(videoId);
      uniqueVideos.push(item);

      // Respect maxVideos limit
      if (uniqueVideos.length >= maxVideos) {
        break;
      }
    }

    videos = uniqueVideos;
    console.log(`Found ${videos.length} unique video(s) (public + unlisted)`);

    // create a proper array of videos from API results
    videos = normalize.normalizeRecords(videos);

    // create an array of all video IDs for requesting additional data
    videos.map((item) => {
      videoIDs.push(item.videoId);
    });

    // =========================
    // Step 4: Extract video details
    // =========================
    if (videos.length > 0) {
      let pageSize = Math.min(50, videos.length);
      let videoIdString = videoIDs.slice(0, pageSize).join(",");

      // get the first page of video details
      let videoResp = await api.get(
        `videos?part=snippet%2CcontentDetails%2Cstatistics&id=${videoIdString}&key=${apiKey}`
      );
      videoDetails.push(...videoResp.data.items);

      // get the next pages of video details
      while (videoDetails.length < videos.length) {
        let pageSize = Math.min(50, videos.length - videoDetails.length);
        let videoIdString = videoIDs
          .slice(videoDetails.length, videoDetails.length + pageSize)
          .join(",");

        let videoResp = await api.get(
          `videos?part=snippet%2CcontentDetails%2Cstatistics&id=${videoIdString}&key=${apiKey}`
        );
        videoDetails.push(...videoResp.data.items);
      }

      console.log(`Downloaded details of ${videoDetails.length} video(s)`);
    }

    // add video details to video nodes (tags etc)
    videos = normalize.updateVideoDetails(videos, videoDetails);

    // Normalize playlists (extract video IDs)
    playlists = normalize.normalizePlaylists(playlists);

    // Gatsby requires its own node ids
    videos = normalize.createGatsbyIds(videos, createNodeId);

    // now add thumbnails
    videos = await normalize.downloadThumbnails({
      items: videos,
      getCache,
      createNode,
      createNodeId,
    });

    let tags = normalize.createTagsFromVideos(videos);
    // Gatsby requires its own node ids
    tags = normalize.createGatsbyIds(tags, createNodeId);
    playlists = normalize.createGatsbyIds(playlists, createNodeId);

    normalize.createNodesFromEntities(videos, createNode, "YoutubeVideo");
    normalize.createNodesFromEntities(tags, createNode, "YoutubeVideoTag");
    normalize.createNodesFromEntities(playlists, createNode, "YoutubePlaylist");

    return;
  };

  try {
    if (Array.isArray(channelId)) {
      await Promise.all(
        channelId.map(async (channelIdEntry) =>
          createVideoNodesFromChannelId(channelIdEntry, apiKey)
        )
      );
    } else {
      await createVideoNodesFromChannelId(channelId, apiKey);
    }
    return;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

exports.onPreInit = () => {
  // console.log("===== gatsby-source-youtube-v3 loaded");
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  createTypes(`
    type YoutubeVideoTag implements Node {
      videos: [YoutubeVideo] @link(by: "videoId")
    }
    type YoutubeVideo implements Node {
      tags: [YoutubeVideoTag] @link(by: "tag")
    }
    type YoutubePlaylist implements Node {
      videos: [YoutubeVideo] @link(by: "videoId")
    }
  `);
};
