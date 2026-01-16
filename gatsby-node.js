"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var axios = require("axios");
var get = require("lodash/get");
var normalize = require("./normalize");

function getApi() {
  var rateLimit = 500;
  var lastCalled = null;

  var rateLimiter = function rateLimiter(call) {
    var now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit;
      var wait = lastCalled - now;
      if (wait > 0) {
        return new Promise(function (resolve) {
          return setTimeout(function () {
            return resolve(call);
          }, wait);
        });
      }
    }
    lastCalled = now;
    return call;
  };

  var api = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3/"
  });

  api.interceptors.request.use(rateLimiter);

  return api;
}

exports.sourceNodes = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(_ref, _ref2) {
    var actions = _ref.actions,
        getCache = _ref.getCache,
        createNodeId = _ref.createNodeId;
    var channelId = _ref2.channelId,
        apiKey = _ref2.apiKey,
        _ref2$maxVideos = _ref2.maxVideos,
        maxVideos = _ref2$maxVideos === undefined ? 50 : _ref2$maxVideos;
    var createNode, createVideoNodesFromChannelId;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            createNode = actions.createNode;

            createVideoNodesFromChannelId = function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(channelId, apiKey) {
                var _playlists;

                var api, videos, videoIDs, videoDetails, playlists, pageSize, playlistResp, _playlists2, nextPageToken, allPlaylistVideos, seenVideoIds, uniqueVideos, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, videoId, privacyStatus, _pageSize, videoIdString, videoResp, _pageSize2, _videoIdString, _videoResp, tags;

                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        api = getApi();
                        videos = [];
                        videoIDs = [];
                        videoDetails = [];
                        playlists = [];

                        // =============================
                        // Step 1: Download all playlists for the channel
                        // =============================

                        pageSize = 50;

                        // get the first page of playlists

                        _context2.next = 8;
                        return api.get("playlists?channelId=" + channelId + "&part=id,snippet&maxResults=" + pageSize + "&key=" + apiKey);

                      case 8:
                        playlistResp = _context2.sent;

                        (_playlists = playlists).push.apply(_playlists, _toConsumableArray(playlistResp.data.items));

                        // get the next pages of playlists

                      case 10:
                        if (!playlistResp.data.nextPageToken) {
                          _context2.next = 18;
                          break;
                        }

                        nextPageToken = playlistResp.data.nextPageToken;
                        _context2.next = 14;
                        return api.get("playlists?channelId=" + channelId + "&part=id,snippet&maxResults=" + pageSize + "&pageToken=" + nextPageToken + "&key=" + apiKey);

                      case 14:
                        playlistResp = _context2.sent;

                        (_playlists2 = playlists).push.apply(_playlists2, _toConsumableArray(playlistResp.data.items));
                        _context2.next = 10;
                        break;

                      case 18:

                        console.log("Downloaded " + playlists.length + " playlist(s)");

                        // =============================
                        // Step 2: Download all videos from all playlists
                        // =============================
                        allPlaylistVideos = []; // raw API responses

                        seenVideoIds = new Set();
                        _context2.next = 23;
                        return Promise.all((playlists || []).map(function () {
                          var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(list) {
                            var _list$videos;

                            var pageSize, itemsResp, _list$videos2, _nextPageToken;

                            return regeneratorRuntime.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    list.videos = [];
                                    pageSize = 50;

                                    // get the first page of playlist items (including status for privacy)

                                    _context.next = 4;
                                    return api.get("playlistItems?playlistId=" + list.id + "&part=snippet,contentDetails,status&maxResults=" + pageSize + "&key=" + apiKey);

                                  case 4:
                                    itemsResp = _context.sent;

                                    (_list$videos = list.videos).push.apply(_list$videos, _toConsumableArray(itemsResp.data.items));

                                    // get the next pages of playlist items

                                  case 6:
                                    if (!itemsResp.data.nextPageToken) {
                                      _context.next = 14;
                                      break;
                                    }

                                    _nextPageToken = itemsResp.data.nextPageToken;
                                    _context.next = 10;
                                    return api.get("playlistItems?playlistId=" + list.id + "&part=snippet,contentDetails,status&maxResults=" + pageSize + "&pageToken=" + _nextPageToken + "&key=" + apiKey);

                                  case 10:
                                    itemsResp = _context.sent;

                                    (_list$videos2 = list.videos).push.apply(_list$videos2, _toConsumableArray(itemsResp.data.items));
                                    _context.next = 6;
                                    break;

                                  case 14:

                                    console.log("Downloaded " + list.videos.length + " playlist item(s)");

                                    // Collect videos for deduplication
                                    list.videos.forEach(function (item) {
                                      allPlaylistVideos.push(item);
                                    });

                                  case 16:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee, undefined);
                          }));

                          return function (_x5) {
                            return _ref5.apply(this, arguments);
                          };
                        }()));

                      case 23:

                        // =============================
                        // Step 3: Deduplicate and filter videos
                        // =============================
                        uniqueVideos = [];
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context2.prev = 27;
                        _iterator = allPlaylistVideos[Symbol.iterator]();

                      case 29:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                          _context2.next = 44;
                          break;
                        }

                        item = _step.value;
                        videoId = get(item, "contentDetails.videoId");
                        privacyStatus = get(item, "status.privacyStatus");

                        // Skip if already seen

                        if (!seenVideoIds.has(videoId)) {
                          _context2.next = 35;
                          break;
                        }

                        return _context2.abrupt("continue", 41);

                      case 35:
                        if (!(privacyStatus !== "public" && privacyStatus !== "unlisted")) {
                          _context2.next = 37;
                          break;
                        }

                        return _context2.abrupt("continue", 41);

                      case 37:

                        seenVideoIds.add(videoId);
                        uniqueVideos.push(item);

                        // Respect maxVideos limit

                        if (!(uniqueVideos.length >= maxVideos)) {
                          _context2.next = 41;
                          break;
                        }

                        return _context2.abrupt("break", 44);

                      case 41:
                        _iteratorNormalCompletion = true;
                        _context2.next = 29;
                        break;

                      case 44:
                        _context2.next = 50;
                        break;

                      case 46:
                        _context2.prev = 46;
                        _context2.t0 = _context2["catch"](27);
                        _didIteratorError = true;
                        _iteratorError = _context2.t0;

                      case 50:
                        _context2.prev = 50;
                        _context2.prev = 51;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                        }

                      case 53:
                        _context2.prev = 53;

                        if (!_didIteratorError) {
                          _context2.next = 56;
                          break;
                        }

                        throw _iteratorError;

                      case 56:
                        return _context2.finish(53);

                      case 57:
                        return _context2.finish(50);

                      case 58:

                        videos = uniqueVideos;
                        console.log("Found " + videos.length + " unique video(s) (public + unlisted)");

                        // create a proper array of videos from API results
                        videos = normalize.normalizeRecords(videos);

                        // create an array of all video IDs for requesting additional data
                        videos.map(function (item) {
                          videoIDs.push(item.videoId);
                        });

                        // =========================
                        // Step 4: Extract video details
                        // =========================

                        if (!(videos.length > 0)) {
                          _context2.next = 79;
                          break;
                        }

                        _pageSize = Math.min(50, videos.length);
                        videoIdString = videoIDs.slice(0, _pageSize).join(",");

                        // get the first page of video details

                        _context2.next = 67;
                        return api.get("videos?part=snippet%2CcontentDetails%2Cstatistics&id=" + videoIdString + "&key=" + apiKey);

                      case 67:
                        videoResp = _context2.sent;

                        videoDetails.push.apply(videoDetails, _toConsumableArray(videoResp.data.items));

                        // get the next pages of video details

                      case 69:
                        if (!(videoDetails.length < videos.length)) {
                          _context2.next = 78;
                          break;
                        }

                        _pageSize2 = Math.min(50, videos.length - videoDetails.length);
                        _videoIdString = videoIDs.slice(videoDetails.length, videoDetails.length + _pageSize2).join(",");
                        _context2.next = 74;
                        return api.get("videos?part=snippet%2CcontentDetails%2Cstatistics&id=" + _videoIdString + "&key=" + apiKey);

                      case 74:
                        _videoResp = _context2.sent;

                        videoDetails.push.apply(videoDetails, _toConsumableArray(_videoResp.data.items));
                        _context2.next = 69;
                        break;

                      case 78:

                        console.log("Downloaded details of " + videoDetails.length + " video(s)");

                      case 79:

                        // add video details to video nodes (tags etc)
                        videos = normalize.updateVideoDetails(videos, videoDetails);

                        // Normalize playlists (extract video IDs)
                        playlists = normalize.normalizePlaylists(playlists);

                        // Gatsby requires its own node ids
                        videos = normalize.createGatsbyIds(videos, createNodeId);

                        // now add thumbnails
                        _context2.next = 84;
                        return normalize.downloadThumbnails({
                          items: videos,
                          getCache: getCache,
                          createNode: createNode,
                          createNodeId: createNodeId
                        });

                      case 84:
                        videos = _context2.sent;
                        tags = normalize.createTagsFromVideos(videos);
                        // Gatsby requires its own node ids

                        tags = normalize.createGatsbyIds(tags, createNodeId);
                        playlists = normalize.createGatsbyIds(playlists, createNodeId);

                        normalize.createNodesFromEntities(videos, createNode, "YoutubeVideo");
                        normalize.createNodesFromEntities(tags, createNode, "YoutubeVideoTag");
                        normalize.createNodesFromEntities(playlists, createNode, "YoutubePlaylist");

                        return _context2.abrupt("return");

                      case 92:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined, [[27, 46, 50, 58], [51,, 53, 57]]);
              }));

              return function createVideoNodesFromChannelId(_x3, _x4) {
                return _ref4.apply(this, arguments);
              };
            }();

            _context4.prev = 2;

            if (!Array.isArray(channelId)) {
              _context4.next = 8;
              break;
            }

            _context4.next = 6;
            return Promise.all(channelId.map(function () {
              var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(channelIdEntry) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        return _context3.abrupt("return", createVideoNodesFromChannelId(channelIdEntry, apiKey));

                      case 1:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, undefined);
              }));

              return function (_x6) {
                return _ref6.apply(this, arguments);
              };
            }()));

          case 6:
            _context4.next = 10;
            break;

          case 8:
            _context4.next = 10;
            return createVideoNodesFromChannelId(channelId, apiKey);

          case 10:
            return _context4.abrupt("return");

          case 13:
            _context4.prev = 13;
            _context4.t0 = _context4["catch"](2);

            console.error(_context4.t0);
            process.exit(1);

          case 17:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[2, 13]]);
  }));

  return function (_x, _x2) {
    return _ref3.apply(this, arguments);
  };
}();

exports.onPreInit = function () {
  // console.log("===== gatsby-source-youtube-v3 loaded");
};

exports.createSchemaCustomization = function (_ref7) {
  var actions = _ref7.actions;
  var createTypes = actions.createTypes;

  createTypes("\n    type YoutubeVideoTag implements Node {\n      videos: [YoutubeVideo] @link(by: \"videoId\")\n    }\n    type YoutubeVideo implements Node {\n      tags: [YoutubeVideoTag] @link(by: \"tag\")\n    }\n    type YoutubePlaylist implements Node {\n      videos: [YoutubeVideo] @link(by: \"videoId\")\n    }\n  ");
};