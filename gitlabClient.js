const serverRequest = require("./serverRequest");

class GitLabClient {

    constructor({ host, https, auth }) {
        this._host = host;
        this._https = https;
        this._authToken = auth;
    }

    async getUser(user_id) {
        const request = this._buildRequest(`users/${user_id}`);
        const response = await serverRequest(request);
        return response.data;
    }

    _buildRequest(path = "", method = "GET", body = null) {
        return {
            host: this._host,
            port: this._https ? 443 : 80,
            path: `/api/v4/${path}?private_token=${encodeURIComponent(this._authToken)}`,
            method,
            body,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
}

module.exports = GitLabClient;
