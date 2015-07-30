var should = require('should')
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var path = require('path')
var GCS = require('../')
var describe = require('mocha').describe
var it = require('mocha').it

describe('GCS', function () {

  it('should require options', function (done) {
    (function () {
      return new GCS()
    }).should.throw()

    done()
  })

  it('should require an email', function (done) {
    (function () {
      return new GCS({})
    }).should.throw()

    done()
  })

  it('should require a scope', function (done) {
    (function () {
      return new GCS({
        iss: 'foo'
      })
    }).should.throw()

    done()
  })

  it('should require a bucket', function (done) {
    (function () {
      return new GCS({
        iss: 'foo',
        scope: 'bar'
      })
    }).should.throw()

    done()
  })

  it('should require a key', function (done) {
    (function () {
      return new GCS({
        iss: 'foo',
        scope: 'bar',
        bucket: 'baz'
      })
    }).should.throw()

    done()
  })

  it('should set a default acl', function (done) {
    var gcs = new GCS({
      iss: 'foo',
      scope: 'bar',
      bucket: 'baz',
      key: 'qux'
    })
    gcs._options.acl.should.not.be.null

    done()
  })

  it('should accept an acl', function (done) {
    var gcs = new GCS({
      iss: 'foo',
      scope: 'bar',
      bucket: 'baz',
      key: 'qux',
      acl: 'qux'
    })
    gcs._options.acl.should.equal('qux')

    done()
  })

  it('should override path when storing a file', function (done) {
    var overridenUrl = '/baz'
    var sourceFile = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    var client = {
      putStream: sinon.stub()
    }

    var node_gcs = function () {
      return client
    }
    node_gcs.gapitoken = sinon.stub()
    node_gcs.gapitoken.callsArg(1)

    client.putStream.callsArgWith(4, undefined, {request: {href: overridenUrl}})

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket',
      path: function () {
        return overridenUrl
      }
    })

    gcs.save({
      path: sourceFile,
      size: 1234,
      type: 'image/png'
    }, function (error, url) {
      should(error).not.ok

      url.should.equal(overridenUrl)

      // should have overidden url
      client.putStream.getCall(0).args[2].should.equal(overridenUrl)

      done()
    })
  })

  it('should store a file', function (done) {
    var sourceFile = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    var client = {
      putStream: sinon.stub()
    }

    var node_gcs = function () {
      return client
    }
    node_gcs.gapitoken = sinon.stub()
    node_gcs.gapitoken.callsArg(1)

    client.putStream.callsArgWith(4, undefined, {request: {href: '/foo'}})

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })

    gcs.save({
        path: sourceFile,
        size: 1234,
        type: 'image/png'
    }, function (error, url) {
      should(error).not.ok

      url.should.equal('/foo')

      done()
    })
  })

  it('should remove a file', function (done) {
    var url = '/foo'
    var bucket = 'bucket'

    var client = {
      deleteFile: sinon.stub()
    }

    var node_gcs = function () {
      return client
    }
    node_gcs.gapitoken = sinon.stub()
    node_gcs.gapitoken.callsArg(1)

    client.deleteFile.callsArg(2)

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: bucket
    })

    gcs.remove({
      url: url
    }, function (error) {
      should(error).not.ok

      client.deleteFile.getCall(0).args[0].should.equal(bucket)
      client.deleteFile.getCall(0).args[1].should.equal(url)

      done()
    })
  })

  it('should not remove a file when model has no url', function (done) {
    var bucket = 'bucket'

    var client = {
      deleteFile: sinon.stub()
    }

    var node_gcs = function () {
      return client
    }
    node_gcs.gapitoken = sinon.stub()
    node_gcs.gapitoken.callsArg(1)

    client.deleteFile.callsArg(2)

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: bucket
    })

    gcs.remove({
      url: null
    }, function (error) {
      should(error).not.ok

      client.deleteFile.callCount.should.equal(0)

      done()
    })
  })

  it('should throw errors from GAPI creation', function () {
    var node_gcs = {
      gapitoken: sinon.stub().callsArgWith(1, new Error('Urk!'))
    }

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    });

    (function () {
      return new GCS({
        keyFile: 'foo',
        iss: 'bar',
        bucket: 'bucket'
      })
    }).should.throw()
  })

  it('should defer saving an attachment until connected', function (done) {
    var node_gcs = {
      gapitoken: sinon.stub()
    }

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })

    gcs.save({
      path: 'foo'
    }, done)

    gcs._client = {
      putStream: sinon.stub().callsArgWith(4, null, {
        request: {}
      })
    }
    gcs.emit('connected')
  })

  it('should pass back gcs errors', function (done) {
    var error = new Error('Urk!')
    var node_gcs = {
      gapitoken: sinon.stub()
    }

    var GCS = proxyquire('../lib/GCS', {
      'node-gcs': node_gcs
    })

    var gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })

    gcs.save({
      path: 'foo'
    }, function (err) {
      error.should.equal(err)
      done()
    })

    gcs._client = {
      putStream: sinon.stub().callsArgWith(4, error)
    }
    gcs.emit('connected')
  })
})
