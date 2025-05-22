// igdb.js - IGDB API integration for querying games by tag/title
const https = require('https');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const IGDB_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_SECRET;

let accessToken = null;
let tokenExpires = 0;

// Ensure the log file exists
const logFilePath = path.join(__dirname, 'nohup.out');
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '');
}

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpires - 60000) {
    return accessToken;
  }
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');
  const fetch = require('node-fetch');
  const resp = await fetch(IGDB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const tokenData = await resp.json();
  if (!resp.ok) throw new Error('Failed to get IGDB token: ' + resp.status);
  accessToken = tokenData.access_token;
  tokenExpires = Date.now() + (tokenData.expires_in * 1000);
  return accessToken;
}

function searchGame(tag) {
  return new Promise(async (resolve, reject) => {
    const url = 'https://api.igdb.com/v4/games';
    const urlObj = new URL(url);
    const token = await getAccessToken();
    const query = `search "${tag}"; fields id,name,rating,cover.url,screenshots.url,videos.video_id,summary; limit 5;`;
    const headers = {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'text/plain'
    };
    const options = {
      method: 'POST',
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      headers
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('IGDB API error: ' + res.statusCode + ' ' + data + ' ' + e));
        }
      });
    });
    req.on('error', err => {
      reject(err);
    });
    req.write(query);
    req.end();
  });
}

module.exports = {
  getAccessToken,
  searchGame
};
