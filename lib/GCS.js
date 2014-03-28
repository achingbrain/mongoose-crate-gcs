var path = require("path"),
	fs = require("fs"),
	GAPI = require("node-gcs").gapitoken,
	GCS = require("node-gcs"),
	check = require("check-types");

var GCSStorageProvider = function(options) {
	this._options = options;

	check.verify.object(this._options, "Please specify Google Cloud Storage options");
	check.verify.string(this._options.iss, "Please specify a service account email address from the Google API console");
	check.verify.string(this._options.scope, "Please specify a Google Cloud Storage scope");
	check.verify.string(this._options.bucket, "Please specify a Google Cloud Storage bucket");

	if(!this._options.acl) {
		this._options.acl = "public-read";
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
	}.bind(this));
};

GCSStorageProvider.prototype.save = function(attachment, callback) {
	this._client.putStream(fs.createReadStream(attachment.path), this._options.bucket, path.basename(file), {
		"Content-Length": attachment.size,
		"Content-Type": attachment.mimeType,
		"x-goog-acl": this._options.acl
	}, function(error, response) {
		callback(error, response.req.url);
	});
};

GCSStorageProvider.prototype.remove = function(attachment, callback) {
	this._client.deleteFile(this._options.bucket, path.basename(attachment.url), callback);
};

module.exports = GCSStorageProvider;
