const JiraClient = require("./jiraClient");
const GitLabClient = require("./gitlabClient");
const GitLabMergeRequest = require("./mergeRequest");
const serverRequest = require("./serverRequest");

const jiraClient = new JiraClient({
    host: "mendix.atlassian.net",
    https: true,
});

const gitlabClient = new GitLabClient({
});

async function handleMergeRequest(mergeRequestJSON) {
    const mergeRequest = new GitLabMergeRequest(mergeRequestJSON);
    const isWebCoreMR = mergeRequest.getLabels().includes("web-core");

    if (!isWebCoreMR || mergeRequest.isDeleted()) {
        throw new Error("Merge request is not from WebCore team or deleted");
    }

    const jiraIssueId = mergeRequest.getTitle().match(/^(?:WIP:\s*)?\[(.*?)]/)[1];
    if (!jiraIssueId || jiraIssueId === "" || jiraIssueId !== "WEBCORE-287") {
        throw new Error(`No Jira issue is mentioned in merge request (${jiraIssueId})`);
    }

    console.log(`Update found for issue ${jiraIssueId}`);

    try {
        const issue = await jiraClient.getIssue(jiraIssueId);
        await updateStatus(issue);
        await updateAssignee(issue);
    } catch (e) {
        console.log("Failed to perform an operation", e);
    }

    async function updateStatus(issue) {
        const targetStatus = determineTargetJiraStatus(mergeRequest);
        const currentStatus = issue.fields.status.name;

        if (!targetStatus) {
            console.log("Target status could not be determined");
            return;
        }

        if (currentStatus === targetStatus) {
            console.log("Status is already up-to-date");
            return;
        }

        console.log(`Status should be updated to ${targetStatus} (was ${currentStatus})`);

        try {
            await jiraClient.updateStatus(jiraIssueId, targetStatus);
            console.log(`Status updated to ${targetStatus}`);

            const updater = await gitlabClient.getUser(mergeRequest.getUpdatedById());
            const comment = `${updater.name} has changed the status to ${targetStatus}`;
            await addComment(jiraIssueId, comment);
        } catch (e) {
            console.error(`Failed to update status to ${targetStatus}, reason was ${e.message}`, e);
            throw e;
        }

        function determineTargetJiraStatus(mr) {
            const labels = mr.getLabels();
            return mr.isWIP()
                ? "In Progress"
                : labels.includes("need-review")
                    ? "Review"
                    : labels.includes("need-testing")
                        ? "Testing"
                        : "Done"
            /*mr.isMerged()
                                       ? "Done"
                                       : null;*/
        }
    }

    async function updateAssignee(issue) {
        console.log("Looking for the assignee in JIRA");

        const users = await jiraClient.findAssignableUsers(jiraIssueId, mergeRequest.getAssigneeName());

        if (users.length !== 1) {
            console.log("Could not determine the assignee in JIRA, skipping");
            return;
        }

        const jiraUser = users[0];
        if (issue.fields.assignee && issue.fields.assignee.accountId === jiraUser.accountId) {
            console.log(`Assignee did not change (${jiraUser.displayName})`);
            return;
        }

        console.log(`Assignee will be updated to ${jiraUser.displayName}`);

        try {
            await jiraClient.assignIssue(jiraIssueId, jiraUser.name);

            console.log(`Assignee updated to ${jiraUser.displayName}`);

            const updater = await gitlabClient.getUser(mergeRequest.getUpdatedById());
            const comment = `${updater.name} has assigned issue to [~${jiraUser.name}]`;
            await addComment(jiraIssueId, comment);
        } catch (e) {
            console.error(`Failed to update assignee to ${jiraUser.displayName}, reason was ${e.message}`, e);
            throw e;
        }
    }

    async function addComment(jiraIssueKey, comment) {
        try {
            await jiraClient.addComment(jiraIssueKey, comment);
            console.log(`Added comment: ${comment}`);
        } catch (e) {
            console.warn(`Failed to add comment: ${comment}`, e);
        }
    }
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
            handleMergeRequest(response.data);
        }
    });
}

setInterval(checkNewMergeRequestEvents, 3000);
