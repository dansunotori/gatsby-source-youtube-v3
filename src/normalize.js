const get = require("lodash/get");
const { createRemoteFileNode } = require("gatsby-source-filesystem");
const crypto = require("crypto");
//const polyfill = require("babel-polyfill");

const digest = (str) => crypto.createHash(`md5`).update(str).digest(`hex`);

exports.createGatsbyIds = (items, createNodeId) => {
  return items.map((e) => {
    e.originalID = e.id;
    e.id = createNodeId(e.id.toString());
    return e;
  });
};

exports.normalizeRecords = (items) => {
  return (items || []).map((item) => {
    //console.log(JSON.stringify(item));

    const e = {
      id: get(item, "id"),
      publishedAt: get(item, "snippet.publishedAt"),
      title: get(item, "snippet.title"),
      description: get(item, "snippet.description"),
      videoId: get(item, "contentDetails.videoId"),
      privacyStatus: get(item, "status.privacyStatus"),
      channelId: get(item, "snippet.channelId"),
      channelTitle: get(item, "snippet.channelTitle"),
      thumbnail: get(
        item,
        "snippet.thumbnails.maxres",
        get(
          item,
          "snippet.thumbnails.standard",
          get(
            item,
            "snippet.thumbnails.high",
            get(
              item,
              "snippet.thumbnails.medium",
              get(item, "snippet.thumbnails.default")
            )
          )
        )
      ),
    };

    return e;
  });
};

exports.downloadThumbnails = async ({
  items,
  getCache,
  createNode,
  createNodeId,
}) =>
  Promise.all(
    items.map(async (item) => {
      let fileNode;
      if (item.thumbnail && item.thumbnail.url) {
        try {
          fileNode = await createRemoteFileNode({
            url: item.thumbnail.url,
            getCache,
            createNode,
            createNodeId,
          });
        } catch (error) {
          // noop
          console.error(error);
        }
      }

      if (fileNode) {
        item.localThumbnail___NODE = fileNode.id;
      }

      return item;
    })
  );

exports.createNodesFromEntities = (items, createNode) => {
  items.forEach((e) => {
    let { ...entity } = e;
    let node = {
      ...entity,
      parent: null,
      children: [],
      internal: {
        type: "YoutubeVideo",
        contentDigest: digest(JSON.stringify(entity)),
      },
    };

    createNode(node);
  });
};
