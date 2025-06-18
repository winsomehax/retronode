// tests/apiUtils.test.js

// const apiUtils = require('../utils/apiUtils'); // DEBUG: Commented out
// const {
//   callGithubModelsApi,
//   callGeminiApi,
//   createFallbackRomData,
//   createFallbackRomItem
// } = apiUtils; // DEBUG: Commented out
// const axios = require('axios'); // DEBUG: Commented out, will be mocked

// Mock global fetch for callGithubModelsApi
global.fetch = jest.fn();

// Mock axios for callGeminiApi
jest.mock('axios');

describe.only('apiUtils.js - Minimal Test for Timeout Debug', () => {

  beforeEach(() => {
    fetch.mockClear();
    // If axios was mocked and then required, clear its methods too
    // const mockedAxios = require('axios');
    // if (mockedAxios.post && jest.isMockFunction(mockedAxios.post)) {
    //   mockedAxios.post.mockClear();
    // }
  });

  test('trivial test to ensure Jest runs and does not time out', () => {
    expect(true).toBe(true);
  });

  // All other describe blocks and tests are removed for this debugging step.
});
