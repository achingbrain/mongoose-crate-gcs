'use strict'

const path = require('path')
const fs = require('fs')
const GAPI = require('node-gcs').gapitoken
const GCS = require('node-gcs')
const check = require('check-types')
const EventEmitter = require('events').EventEmitter

class GCSStorageProvider extends EventEmitter {
  constructor (options) {
    super()

    this._options = options

    check.assert.object(this._options, 'Please specify Google Cloud Storage options')
    check.assert.string(this._options.iss, 'Please specify a service account email address from the Google API console')

    if (!this._options.acl) {
      this._options.acl = 'public-read'
    }

    if (!this._options.scope) {
      this._options.scope = 'https://www.googleapis.com/auth/devstorage.full_control'
    }

    if (typeof this._options.path !== 'function') {
      this._options.path = (attachment) => {
        return '/' + path.basename(attachment.path)
      }
    }

    const gapiOptions = {
      iss: this._options.iss,
      scope: this._options.scope
    }

    if (this._options.key) {
      gapiOptions.key = this._options.key
    } else if (this._options.keyFile) {
      gapiOptions.keyFile = this._options.keyFile
    } else {
      throw new Error('Please specify a Google Cloud Storage key or keyfile')
    }

    var gapi = new GAPI(gapiOptions, (error) => {
      if (error) {
        throw error
      }

      this._client = new GCS(gapi)

      this.emit('connected')
    })
  }

  createHeaders (attachment) {
    var headers = {
      'Content-Length': attachment.size,
      'Content-Type': attachment.type,
      'x-goog-acl': this._options.acl
    }
    if (!this._options.headers) { return headers }
    for (var header in this._options.headers) {
      headers[header] = this._options.headers[header]
    }
    return headers
  }

  save (attachment, callback) {
    if (!this._client) {
      return this.on('connected', this.save.bind(this, attachment, callback))
    }

    this._client.putStream(fs.createReadStream(attachment.path), this._options.bucket, this._options.path(attachment), this.createHeaders(attachment), function (error, response) {
      callback(error, error ? undefined : response.request.href)
    })
  }

  remove (attachment, callback) {
    if (!attachment.url) {
      return callback()
    }

    this._client.deleteFile(this._options.bucket, '/' + path.basename(attachment.url), callback)
  }
}

module.exports = GCSStorageProvider
