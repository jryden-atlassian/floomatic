"use strict";

const fs = require("fs");
const util = require("util");

const log = require("floorine");
let request = require("request");
const httplease = require('httplease');

const httpClient = new httplease.Builder()
  .withHeaders({'Cache-Control': 'no-cache'})
  .withTimeout(10 * 1000)
  .withBufferJsonResponseHandler();


const utils = require("./utils");

request = request.defaults({
  strictSSL: true
});

function basicAuthHeader(username, secret) {
  const base64auth = Buffer.from(`${username}:${secret}`).toString('base64');
  return {Authorization: `Basic ${base64auth}`};
}

async function getWorkspace(host, username, owner, secret, workspace) {
    return httpClient
      .withHeaders(basicAuthHeader(username, secret))
      .withBaseUrl(`https://${host}`)
      .withPath(`/api/workspace/${owner}/${workspace}`)
      .withMethodGet()
      .withBufferJsonResponseHandler()
      .withExpectStatus([200])
      .send()
      .catch((err) => log.error(err.message));;

}

async function del(host, username, owner, secret, workspace) {
  await httpClient
    .withHeaders(basicAuthHeader(username, secret))
    .withBaseUrl(`https://${host}`)
    .withPath(`/api/workspace/${owner}/${workspace}`)
    .withMethodDelete()
    .withDiscardBodyResponseHandler()
    .withExpectStatus([204, 404])
    .send()
    .catch((err) => log.error(err.message));
}

async function hide(host, username, owner, secret, workspace) {
  const existingWorkspace = await getWorkspace(host, username, owner, secret, workspace);
  existingWorkspace.body.perms.AnonymousUser = [];

  await httpClient
    .withHeaders(basicAuthHeader(username, secret))
    .withBaseUrl(`https://${host}`)
    .withPath(`/api/workspace/${owner}/${workspace}`)
    .withMethodPut()
    .withJsonBody(existingWorkspace.body)
    .withBufferJsonResponseHandler()
    .withExpectStatus([200])
    .send().catch((err) => log.error(err));
}

function create(host, username, owner, secret, workspace, perms, cb) {
  const err_start = util.format("Could not create workspace %s/%s: ", owner, workspace);
  const url = util.format("https://%s/%s/%s", host, owner, workspace);

  const options = {
    uri: util.format("https://%s/api/workspace", host),
    json: {
      name: workspace,
      owner: owner
    }
  };

  options.json.perms = perms;

  request.post(options, function (err, result, body) {
    if (err) {
      log.log("Error creating workspace:", err);
      return cb(err);
    }
    if (body) {
      body = body.detail || body;
    }

    if (result.statusCode === 401) {
      err = new Error(err_start + "Your credentials are wrong. see https://floobits.com/help/floorc" + "\nHTTP status " + result.statusCode + ": " + body);
    }
    if (result.statusCode === 402) {
      err = new Error(err_start + body.toString());
    }
    if (result.statusCode === 403) {
      err = new Error(err_start + "You do not have permission. see https://floobits.com/help/floorc");
    }

    if (result.statusCode === 409) {
      log.warn("This workspace already exists.");
    } else if (result.statusCode >= 400) {
      err = err || new Error(err_start + " HTTP status " + result.statusCode + ": " + body);
      err.statusCode = result.statusCode;
      return cb(err);
    }
    log.log("Created workspace", url);

    const data = utils.load_floo();
    data.url = url;
    /*eslint-disable no-sync */
    fs.writeFileSync(".floo", JSON.stringify(data, null, 4), "utf-8");
    /*eslint-enable no-sync */
    cb();
  }).auth(username, secret);
}

module.exports = {
  getWorkspace,
  create,
  del,
  hide
};
