var path = require("path"),
	fs = require("fs"),
	GAPI = require("node-gcs").gapitoken,
	GCS = require("node-gcs"),
	check = require("check-types"),
	EventEmitter = require("events").EventEmitter,
	util = require("util");


var GCSStorageProvider = function(options) {
	EventEmitter.call(this);

	this._options = options;

	check.verify.object(this._options, "Please specify Google Cloud Storage options");
	check.verify.string(this._options.iss, "Please specify a service account email address from the Google API console");

	if(!this._options.acl) {
		this._options.acl = "public-read";
	}

	if(!this._options.scope) {
		this._options.scope = "https://www.googleapis.com/auth/devstorage.full_control";
	}

	var gapiOptions = {
		iss: this._options.iss,
		scope: this._options.scope
	};

	if(this._options.key) {
		gapiOptions.key = this._options.key;
	} else if(this._options.keyFile) {
		gapiOptions.keyFile = this._options.keyFile;
	} else {
		throw new Error("Please specify a Google Cloud Storage key or keyfile");
	}

	var gapi = new GAPI(gapiOptions, function(error) {
		if(error) {
			throw error;
		}

		this._client = new GCS(gapi);

		this.emit("connected");
	}.bind(this));
};
util.inherits(GCSStorageProvider, EventEmitter);

GCSStorageProvider.prototype.save = function(attachment, callback) {
	if(!this._client) {
		return this.on("connected", this.save.bind(this, attachment, callback));
	}

	this._client.putStream(fs.createReadStream(attachment.path), this._options.bucket, "/" + path.basename(attachment.path), {
		"Content-Length": attachment.size,
		"Content-Type": attachment.mimeType,
		"x-goog-acl": this._options.acl
	}, function(error, response) {
		callback(error, error ? undefined : response.request.href);
	});
};

GCSStorageProvider.prototype.remove = function(attachment, callback) {
	this._client.deleteFile(this._options.bucket, "/" + path.basename(attachment.url), callback);
};

module.exports = GCSStorageProvider;
