const JiraClient = require("./jiraClient");
const GitLabMergeRequest = require("./mergeRequest");
const serverRequest = require("./serverRequest");

const jiraClient = new JiraClient({
    host: "mendix.atlassian.net",
    https: true,
});

function handleMergeRequest(mergeRequestJSON) {
    return new Promise((resolve, reject) => {
        const mergeRequest = new GitLabMergeRequest(mergeRequestJSON);
        const isWebCoreMR = mergeRequest.getLabels().includes("web-core");

        if (!isWebCoreMR || mergeRequest.isDeleted()) {
            reject("Merge request is not from WebCore team or deleted");
            return;
        }

        const jiraIssueId = mergeRequest.getTitle().match(/^(?:WIP:\s*)?\[(.*?)]/)[1];
        if (jiraIssueId == null || jiraIssueId === "" || jiraIssueId !== "WEBCORE-287") {
            reject(`No Jira issue is mentioned in merge request (${jiraIssueId})`);
            return;
        }

        console.log(`Update found for issue ${jiraIssueId}`);

        jiraClient.getIssue(jiraIssueId)
            .then(updateStatus)
            .then(updateAssignee)
            .catch(e => {
                console.log("Failed to perform an operation", e);
            });

        function updateStatus(issue) {
            const targetStatus = determineTargetJiraStatus(mergeRequest);
            const currentStatus = issue.fields.status.name;

            if (!targetStatus) {
                console.log("Target status could not be determined");
                return issue;
            }

            if (currentStatus === targetStatus) {
                console.log("Status is already up-to-date");
                return issue;
            }

            console.log(`Status should be updated to ${targetStatus} (was ${currentStatus})`);

            return jiraClient.updateStatus(jiraIssueId, targetStatus)
                .then(() => {
                    console.log(`Status updated to ${targetStatus}`);
                    return issue;
                })
                .catch(e => {
                    console.error(`Failed to update status to ${targetStatus}, reason was ${e.message}`, e);
                    return issue;
                });

            function determineTargetJiraStatus(mr) {
                const labels = mr.getLabels();
                return mr.isWIP()
                    ? "In Progress"
                    : labels.includes("need-review")
                        ? "Review"
                        : labels.includes("need-testing")
                            ? "Testing"
                            : "Done" /*mr.isMerged()
                                ? "Done"
                                : null;*/
            }
        }

        function updateAssignee(issue) {
            console.log("Looking for the assignee in JIRA");
            jiraClient.findAssignableUsers(jiraIssueId, mergeRequest.getAssigneeName())
                .then(users => {
                    if (users.length !== 1) {
                        console.log("Could not determine the assignee in JIRA, skipping");
                        return Promise.resolve(issue);
                    }

                    const jiraUser = users[0];
                    if (!issue.fields.assignee || issue.fields.assignee.accountId !== jiraUser.accountId) {

                        console.log(`Assignee should be updated to ${jiraUser.displayName}`);
                        jiraClient.assignIssue(jiraIssueId, jiraUser.name)
                            .then(() => {
                                console.log(`Assignee updated to ${jiraUser.displayName}`);
                                return issue;
                            })
                            .catch(e => {
                                console.error(`Failed to update assignee to ${jiraUser.displayName}, reason was ${e.message}`, e);
                                return issue;
                            });

                    } else {
                        console.log(`Assignee did not change (${jiraUser.displayName})`);
                        return issue;
                    }
                });

        }
    });
}

function checkNewMergeRequestEvents() {

    const options = {
        host: "gitlabtojira.eu-4.evennode.com",
        port: 80,
        path: "/",
        method: "GET",
        headers: {
        'Content-Type': 'application/json'
        }
    };

    serverRequest(options).then(response => {
        if (response && response.data) {
            handleMergeRequest(response.data).then(handled => {
                console.log(handled ? "Update handled successfully" : "Update could not handled properly");
            });
        }
    });
}

setInterval(checkNewMergeRequestEvents, 3000);
