# mongoose-crate-gcs

[![Dependency Status](https://david-dm.org/achingbrain/mongoose-crate-gcs.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate-gcs) [![devDependency Status](https://david-dm.org/achingbrain/mongoose-crate-gcs/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrainmongoose-crate-gcs#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/mongoose-crate-gcs/master.svg)](https://travis-ci.org/achingbrain/mongoose-crate-gcs) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/mongoose-crate-gcs/master.svg)](https://coveralls.io/r/achingbrain/mongoose-crate-gcs)

A StorageProvider for mongoose-crate that stores files in Google Cloud Storage.

## Usage

```javascript
var mongoose = require('mongoose'),
  crate = require("mongoose-crate"),
  GCS = require("mongoose-crate-gcs");

var PostSchema = new mongoose.Schema({
  title: String,
  description: String
});

PostSchema.plugin(crate, {
  storage: new GCS({
    iss: "A Google service account email",
    scope: "Google Cloud Storage scope",
    bucket: "Google Cloud Storage bucket",
    keyFile: "/path/to/keyfile",
    key: "key as a string", // pass either key or keyFile
    acl: "<acl-here>" // defaults to public-read
  }),
  fields: {
    file: {}
  }
});

var Post = mongoose.model('Post', PostSchema);
```

.. then later:

```javascript
var post = new Post();
post.attach("image", {path: "/path/to/image"}, function(error) {
	// file is now uploaded and post.file is populated e.g.:
	// post.file.url
});
```
