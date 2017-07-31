const serverRequest = require("./serverRequest");
const statusPath = "/transitions?expand=transitions.fields";

class JiraClient {

    constructor({ host, https, auth }) {
        this._host = host;
        this._https = https;
        this._authToken = auth;
    }

    getIssue(jiraIssueKey) {
        const request = this._buildJiraRequest(this._getIssuePath(jiraIssueKey));
        return serverRequest(request).then(response => response.status >= 200 && response.status < 300
            ? Promise.resolve(response.data)
            : Promise.reject(response));
    }

    getStatusList(jiraIssueKey) {
        const request = this._buildJiraRequest(this._getIssuePath(jiraIssueKey, statusPath));
        return serverRequest(request).then(response => Promise.resolve(response.data.transitions));
    }

    findAssignableUsers(jiraIssueKey, search) {
        const request = this._buildJiraRequest(`user/assignable/search?issueKey=${jiraIssueKey}&username=${encodeURIComponent(search)}`);
        return serverRequest(request).then(response => Promise.resolve(response.data));
    }

    assignIssue(jiraIssueKey, assigneeName) {
        return this._updateIssue(jiraIssueKey, "/assignee", { name: assigneeName }, "PUT");
    }

    addComment(jiraIssueKey, comment) {
        return this._updateIssue(jiraIssueKey, "/comment", { body: comment });
    }

    updateStatus(jiraIssueKey, statusName) {
        return this.getStatusList(jiraIssueKey)
            .then(statuses => {
                const targetJiraStatus = statuses.find(s => s.name === statusName);
                if (!targetJiraStatus) {
                    return Promise.reject(new Error(`Could not find status id for ${statusName}`));
                }

                this._updateIssue(jiraIssueKey, statusPath, {
                    transition:{
                        id: targetJiraStatus.id
                    }
                }).then(() => Promise.resolve(), e => Promise.reject(e));
            });
    }

    _updateIssue(jiraIssueKey, path, data, verb = "POST") {
        const request = this._buildJiraRequest(this._getIssuePath(jiraIssueKey, path), verb, data);
        return serverRequest(request).then(response => {
            return response.status >= 200 && response.status < 300
                ? Promise.resolve(response.data) : Promise.reject(response);
        });
    }

    _getIssuePath(jiraKey, path = "") {
        return `issue/${jiraKey}${path}`;
    }

    _buildJiraRequest(path = "", method = "GET", body = null) {
        return {
            host: this._host,
            port: this._https ? 443 : 80,
            path: "/rest/api/2/" + path,
            method,
            body,
            headers: {
                'Content-Type': 'application/json',
                "Authorization": this._authToken
            }
        };
    }
}

module.exports = JiraClient;
