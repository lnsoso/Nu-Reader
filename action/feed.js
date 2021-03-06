var request = require('request'),
	FeedParser = require('feedparser'),
	util = require('../lib/util');

var db = util.mongo.db();

var posts_collection = db.collection('posts');

function fetchFeed(param,callback) {
	var meta = null,
		items = [];
	request(param.url)
		.pipe(new FeedParser())
		.on('error', function(error) {
			console.log(error);
		})
		.on('meta', function (metaInfo) {
			meta = metaInfo;
		})
		.on('readable', function () {
			var stream = this, item;
			while (item = stream.read()) {
				items.unshift({
					link:item.link,
					guid:item.guid,
					title:item.title,
					description:item.description,
					pubDate:item.pubDate
				});
			}
		})
		.on('end',function(){
			callback({meta:meta,items:items});
		});
}

function removeDuplicate(data,callback) {
	var size = data.items.length;
	var filtered = [];
	data.items.forEach(function(item){
		posts_collection.findOne({guid: item.guid}, function (err, post) {
			size--;
			if(!post) filtered.push(item);
			if(size===0) return _callback();
		});
	});
	function _callback() {
		data.items = filtered;
		callback(data);
	}
}

function updateFeed(data,callback) {
	util.savePosts(data,callback);
}

exports.fetch = fetchFeed;
exports.update = updateFeed;
exports.removeDuplicate = removeDuplicate;