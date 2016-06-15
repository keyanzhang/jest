/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * @flow
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

import type {
  WorkerMessage,
  WorkerCallback,
} from './types';

const H = require('./constants');

const docblock = require('./lib/docblock');
const extractRequires = require('./lib/extractRequires');
const fs = require('graceful-fs');
const path = require('./fastpath');

const JSON_EXTENSION = '.json';
const PACKAGE_JSON = path.sep + 'package' + JSON_EXTENSION;

type ErrorType = {
  stack: ?string,
  message: string,
  type: string,
};

const formatError = (error: string|Error): Error => {
  if (typeof error === 'string') {
    return (({
      stack: null,
      message: error,
      type: 'Error',
    }: any): Error);
  }

  return (({
    stack: error.stack,
    message: error.message,
    type: error.type || 'Error',
  }: any): Error);
};

module.exports = (data: WorkerMessage, callback: WorkerCallback): void => {
  try {
    const filePath = data.filePath;
    const content = fs.readFileSync(filePath, 'utf-8');
    let module;
    let id;
    let dependencies;

    if (filePath.endsWith(PACKAGE_JSON)) {
      const fileData = JSON.parse(content);
      if (fileData.name) {
        id = fileData.name;
        module = [filePath, H.PACKAGE];
      }
    } else if (!filePath.endsWith(JSON_EXTENSION)) {
      const doc = docblock.parse(docblock.extract(content));
      id = doc.providesModule || doc.provides;
      dependencies = extractRequires(content);
      if (id) {
        module = [filePath, H.MODULE];
      }
    }

    callback(null, {id, module, dependencies});
  } catch (error) {
    callback(formatError(error));
  }
};
