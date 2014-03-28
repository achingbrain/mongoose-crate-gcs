var should = require("should"),
	path = require("path"),
	request = require("request"),
	async = require("async"),
	GCS = require("../lib/GCS");

describe("GCS", function() {

	it("should require options", function(done) {
		(function() {
			new GCS();
		}).should.throw();

		done();
	})

	it("should require an email", function(done) {
		(function() {
			new GCS({});
		}).should.throw();

		done();
	})

	it("should require a scope", function(done) {
		(function() {
			new GCS({
				iss: "foo"
			});
		}).should.throw();

		done();
	})

	it("should require a bucket", function(done) {
		(function() {
			new GCS({
				iss: "foo",
				scope: "bar"
			});
		}).should.throw();

		done();
	})

	it("should require a key", function(done) {
		(function() {
			new GCS({
				iss: "foo",
				scope: "bar",
				bucket: "baz"
			});
		}).should.throw();

		done();
	})

	it("should set a default acl", function(done) {
		var gcs = new GCS({
			iss: "foo",
			scope: "bar",
			bucket: "baz",
			key: "qux"
		});
		gcs._options.acl.should.not.be.null;

		done();
	})

	it("should accept an acl", function(done) {
		var gcs = new GCS({
			iss: "foo",
			scope: "bar",
			bucket: "baz",
			key: "qux",
			acl: "qux"
		});
		gcs._options.acl.should.equal("qux");

		done();
	})

	it("should store and remove a file", function(done) {

		// if you want to run this test, remove the next line and add your GCS details below
		return done();

		var bucket =  "PUT_YOUR_BUCKET_HERE";
		var key = "PUT_YOUR_KEY_HERE";
		var secret = "PUT_YOUR_BUCKET_HERE";
		var region = "PUT_YOUR_REGION_HERE";
		var sourceFile = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		var gcs = new GCS({
			key: key,
			secret: secret,
			bucket: bucket,
			region: region
		});

		var gcsUrl;

		async.waterfall([function(callback) {
			// save the file
			gcs.save(sourceFile, callback);
		}, function(url, callback) {
			gcsUrl = url;

			// make sure it was uploaded
			request.head(url, callback);
		}, function(response, body, callback) {
			// resource should exist
			response.statusCode.should.equal(200);

			// remove the file
			gcs.remove({url: gcsUrl}, callback);
		}, function(message, callback) {
			// make sure it's not there any more
			request.head(gcsUrl, callback);
		}, function(response, body, callback) {
			// resource should exist
			response.statusCode.should.not.equal(200);

			// all done
			callback();
		}], function(error) {
			should(error).not.ok;

			done();
		});
	})
})
