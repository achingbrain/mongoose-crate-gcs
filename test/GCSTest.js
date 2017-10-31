'use strict'

const should = require('should')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const path = require('path')
const GCS = require('../')
const describe = require('mocha').describe
const it = require('mocha').it

describe('GCS', () => {
  it('should require options', (done) => {
    (() => new GCS()).should.throw()

    done()
  })

  it('should require an email', (done) => {
    (() => new GCS({})).should.throw()

    done()
  })

  it('should require a scope', (done) => {
    (() => new GCS({
      iss: 'foo'
    })).should.throw()

    done()
  })

  it('should require a bucket', (done) => {
    (() => new GCS({
      iss: 'foo',
      scope: 'bar'
    })).should.throw()

    done()
  })

  it('should require a key', (done) => {
    (() => new GCS({
      iss: 'foo',
      scope: 'bar',
      bucket: 'baz'
    })).should.throw()

    done()
  })

  it('should set a default acl', (done) => {
    const gcs = new GCS({
      iss: 'foo',
      scope: 'bar',
      bucket: 'baz',
      key: 'qux'
    })
    gcs._options.acl.should.not.be.null

    done()
  })

  it('should accept an acl', (done) => {
    const gcs = new GCS({
      iss: 'foo',
      scope: 'bar',
      bucket: 'baz',
      key: 'qux',
      acl: 'qux'
    })
    gcs._options.acl.should.equal('qux')

    done()
  })

  it('should override path when storing a file', (done) => {
    const overridenUrl = '/baz'
    const sourceFile = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    const client = {
      putStream: sinon.stub()
    }

    const nodeGcs = function () {
      return client
    }
    nodeGcs.gapitoken = sinon.stub()
    nodeGcs.gapitoken.callsArg(1)

    client.putStream.callsArgWith(4, undefined, {request: {href: overridenUrl}})

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket',
      path: () => {
        return overridenUrl
      }
    })

    gcs.save({
      path: sourceFile,
      size: 1234,
      type: 'image/png'
    }, (error, url) => {
      should(error).not.ok

      url.should.equal(overridenUrl)

      // should have overidden url
      client.putStream.getCall(0).args[2].should.equal(overridenUrl)

      done()
    })
  })

  it('should store a file', (done) => {
    const sourceFile = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    const client = {
      putStream: sinon.stub()
    }

    const nodeGcs = function () {
      return client
    }
    nodeGcs.gapitoken = sinon.stub()
    nodeGcs.gapitoken.callsArg(1)

    client.putStream.callsArgWith(4, undefined, {request: {href: '/foo'}})

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })

    gcs.save({
      path: sourceFile,
      size: 1234,
      type: 'image/png'
    }, (error, url) => {
      should(error).not.ok

      url.should.equal('/foo')

      done()
    })
  })

  it('should remove a file', (done) => {
    const url = '/foo'
    const bucket = 'bucket'

    const client = {
      deleteFile: sinon.stub()
    }

    const nodeGcs = function () {
      return client
    }
    nodeGcs.gapitoken = sinon.stub()
    nodeGcs.gapitoken.callsArg(1)

    client.deleteFile.callsArg(2)

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: bucket
    })

    gcs.remove({
      url: url
    }, (error) => {
      should(error).not.ok

      client.deleteFile.getCall(0).args[0].should.equal(bucket)
      client.deleteFile.getCall(0).args[1].should.equal(url)

      done()
    })
  })

  it('should not remove a file when model has no url', (done) => {
    const bucket = 'bucket'

    const client = {
      deleteFile: sinon.stub()
    }

    const nodeGcs = function () {
      return client
    }
    nodeGcs.gapitoken = sinon.stub()
    nodeGcs.gapitoken.callsArg(1)

    client.deleteFile.callsArg(2)

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: bucket
    })

    gcs.remove({
      url: null
    }, (error) => {
      should(error).not.ok

      client.deleteFile.callCount.should.equal(0)

      done()
    })
  })

  it('should throw errors from GAPI creation', () => {
    const nodeGcs = {
      gapitoken: sinon.stub().callsArgWith(1, new Error('Urk!'))
    }

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    });

    (() => new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })).should.throw()
  })

  it('should defer saving an attachment until connected', (done) => {
    const nodeGcs = {
      gapitoken: sinon.stub()
    }

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
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

  it('should pass back gcs errors', (done) => {
    const error = new Error('Urk!')
    const nodeGcs = {
      gapitoken: sinon.stub()
    }

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket'
    })

    gcs.save({
      path: 'foo'
    }, (err) => {
      error.should.equal(err)
      done()
    })

    gcs._client = {
      putStream: sinon.stub().callsArgWith(4, error)
    }
    gcs.emit('connected')
  })

  it('should override add options.headers to headers putstream', (done) => {
    const sourceFile = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    const client = {
      putStream: sinon.stub()
    }

    const nodeGcs = function () {
      return client
    }
    nodeGcs.gapitoken = sinon.stub()
    nodeGcs.gapitoken.callsArg(1)

    client.putStream.callsArgWith(4, undefined, {request: {}})

    const GCS = proxyquire('../lib/GCS', {
      'node-gcs': nodeGcs
    })

    const gcs = new GCS({
      keyFile: 'foo',
      iss: 'bar',
      bucket: 'bucket',
      headers: {
        'Cache-Control': 'private'
      }
    })

    gcs.save({
      path: sourceFile,
      size: 1234,
      type: 'image/png'
    }, (error, url) => {
      should(error).not.ok
      // headers should contain Cache-Control
      client.putStream.getCall(0).args[3]['Cache-Control'].should.equal('private')
      done()
    })
  })
})
