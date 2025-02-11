"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var get = require("lodash/get");

var _require = require("gatsby-source-filesystem"),
    createRemoteFileNode = _require.createRemoteFileNode;

var crypto = require("crypto");
//const polyfill = require("babel-polyfill");

var digest = function digest(str) {
  return crypto.createHash("md5").update(str).digest("hex");
};

exports.createGatsbyIds = function (items, createNodeId) {
  return items.map(function (e) {
    e.originalID = e.id;
    e.id = createNodeId(e.id.toString());
    return e;
  });
};

exports.normalizeRecords = function (items) {
  return (items || []).map(function (item) {
    //console.log(JSON.stringify(item));

    var e = {
      id: get(item, "id"),
      publishedAt: get(item, "snippet.publishedAt"),
      title: get(item, "snippet.title"),
      description: get(item, "snippet.description"),
      videoId: get(item, "contentDetails.videoId"),
      privacyStatus: get(item, "status.privacyStatus"),
      channelId: get(item, "snippet.channelId"),
      channelTitle: get(item, "snippet.channelTitle"),
      thumbnail: get(item, "snippet.thumbnails.maxres", get(item, "snippet.thumbnails.standard", get(item, "snippet.thumbnails.high", get(item, "snippet.thumbnails.medium", get(item, "snippet.thumbnails.default")))))
    };

    return e;
  });
};

exports.updateVideoDetails = function (items, details) {
  return (items || []).map(function (item) {
    var e = item;
    var detail = details.find(function (d) {
      return d.id === e.videoId;
    });
    e.tags = detail.snippet.tags;
    e.duration = detail.contentDetails.duration;
    e.viewCount = detail.statistics.viewCount;
    e.likeCount = detail.statistics.likeCount;
    e.commentCount = detail.statistics.commentCount;
    return e;
  });
};

exports.createTagsFromVideos = function (videos) {
  var allTags = [];

  (videos || []).map(function (video) {
    (video.tags || []).map(function (tag) {
      var existingTag = allTags.find(function (t) {
        return t.tag === tag;
      });
      if (existingTag) {
        existingTag.videos.push(video.videoId);
        existingTag.numVideos += 1;
      } else {
        var newTag = {
          id: tag,
          tag: tag,
          videos: [video.videoId],
          numVideos: 1
        };
        allTags.push(newTag);
      }
    });
  });

  return allTags;
};

exports.downloadThumbnails = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref) {
    var items = _ref.items,
        getCache = _ref.getCache,
        createNode = _ref.createNode,
        createNodeId = _ref.createNodeId;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", Promise.all(items.map(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item) {
                var fileNode;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        fileNode = void 0;

                        if (!(item.thumbnail && item.thumbnail.url)) {
                          _context.next = 11;
                          break;
                        }

                        _context.prev = 2;
                        _context.next = 5;
                        return createRemoteFileNode({
                          url: item.thumbnail.url,
                          getCache: getCache,
                          createNode: createNode,
                          createNodeId: createNodeId
                        });

                      case 5:
                        fileNode = _context.sent;
                        _context.next = 11;
                        break;

                      case 8:
                        _context.prev = 8;
                        _context.t0 = _context["catch"](2);

                        // noop
                        console.error(_context.t0);

                      case 11:

                        if (fileNode) {
                          item.localThumbnail___NODE = fileNode.id;
                        }

                        return _context.abrupt("return", item);

                      case 13:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, undefined, [[2, 8]]);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }())));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x) {
    return _ref2.apply(this, arguments);
  };
}();

exports.normalizePlaylists = function (items) {
  return (items || []).map(function (item) {
    var videos = [];
    var playlistItems = get(item, "videos");
    (playlistItems || []).map(function (video) {
      videos.push(get(video, "contentDetails.videoId"));
    });
    //console.log(videos);
    var e = {
      id: get(item, "id"),
      videos: videos
    };

    return e;
  });
};

exports.createNodesFromEntities = function (items, createNode, type) {
  items.forEach(function (e) {
    var entity = _objectWithoutProperties(e, []);

    var node = _extends({}, entity, {
      parent: null,
      children: [],
      internal: {
        type: type,
        contentDigest: digest(JSON.stringify(entity))
      }
    });

    createNode(node);
  });
};