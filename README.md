# mongoose-crate-gcs

[![Dependency Status](https://david-dm.org/achingbrain/mongoose-crate-gcs.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate-gcs) [![devDependency Status](https://david-dm.org/achingbrain/mongoose-crate-gcs/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrainmongoose-crate-gcs#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/mongoose-crate-gcs/master.svg)](https://travis-ci.org/achingbrain/mongoose-crate-gcs) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/mongoose-crate-gcs/master.svg)](https://coveralls.io/r/achingbrain/mongoose-crate-gcs)

A StorageProvider for mongoose-crate that stores files in Google Cloud Storage.

## Usage

```javascript
const mongoose = require('mongoose')
const crate = require('mongoose-crate')
const GCS = require('mongoose-crate-gcs')
const path = require('path')

const PostSchema = new mongoose.Schema({
  title: String,
  description: String
})

PostSchema.plugin(crate, {
  storage: new GCS({
    iss: 'A Google service account email',
    bucket: 'Google Cloud Storage bucket',
    keyFile: '/path/to/keyfile', // pass either key or keyFile
    key: 'key as a string', // pass either key or keyFile
    scope: '<scope-here>', // defaults to https://www.googleapis.com/auth/devstorage.full_control
    acl: '<acl-here>', // defaults to public-read
    path: (attachment) => `/${path.basename(attachment.path)}` // where the file is stored in the bucket - defaults to this function
  }),
  fields: {
    file: {}
  }
});

const Post = mongoose.model('Post', PostSchema)
```

.. then later:

```javascript
const post = new Post()
post.attach('image', {path: '/path/to/image'}, (error) => {
	// file is now uploaded and post.file is populated e.g.:
	// post.file.url
});
```
