
class GitLabMergeRequest {

    constructor(mergeRequestJSON) {
        this._json = mergeRequestJSON;
    }

    getTitle() {
        return this._json.object_attributes.title;
    }

    getLabels() {
        return this._json.labels.map(label => label.title);
    }

    isWIP() {
        return this._json.object_attributes.work_in_progress;
    }

    isMerged() {
        return this._json.object_attributes.state === "isMerged";
    }

    getAssigneeName() {
        return this._json.assignee ? this._json.assignee.name : null
    }

    getUpdatedById() {
        return this._json.object_attributes.updated_by_id;
    }

    isDeleted() {
        return this._json.deleted_at != null;
    }
}

module.exports = GitLabMergeRequest;
