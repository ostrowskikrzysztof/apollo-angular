import {Operation} from '@apollo/client/core';
import {Options} from 'apollo-angular-link-http-common';

export type BatchOptions = {
  batchMax?: number;
  batchInterval?: number;
  batchKey?: (operation: Operation) => string;
} & Options;
