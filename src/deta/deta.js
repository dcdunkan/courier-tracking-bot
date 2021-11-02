const { Deta } = require("deta");

class DetaDB {
    constructor(project_key) {
        this.project_key = project_key;
        this.deta = new Deta(project_key);
    }

    async init() {
        this.trackings = this.deta.Base("trackbot-notification-queue");
        this.users = this.deta.Base("trackbot-users");

        let trackings = await this.trackings.get("trackingmore");
        if (trackings == null) {
            this.trackings.putMany([
                { key: "trackingmore", trackings: [] },
                { key: "m.aftership", trackings: [] },
                { key: "aftership", trackings: [] },
            ]);
        }

        let users = await this.users.get("!");
        if (users == null) {
            this.users.put({
                key: "!",
                trackings: [],
                user_id: "",
                username: "",
            });
        }
    }

    async getTrackings(source) {
        const { trackings } = await this.trackings.get(source);
        return trackings;
    }

    async getUser(user_id) {
        return await this.users.get(String(user_id));
    }

    async getUserTrackings(user_id) {
        const { trackings } = await this.getUser(String(user_id));
        return trackings;
    }

    async addTracking(tracking) {
        const to_track = await this.getTrackings(tracking.source);
        const trackings = await this.getUserTrackings(`${tracking.user_id}`);

        let to_track_exists = to_track.some(
            (e) =>
                e.user_id == tracking.user_id &&
                e.tracking_id == tracking.tracking_id &&
                e.source == tracking.source
        );

        let trackings_exists = trackings.some(
            (e) =>
                e.user_id == tracking.user_id &&
                e.tracking_id == tracking.tracking_id &&
                e.source == tracking.source
        );

        if (to_track_exists || trackings_exists) {
            return { status: "exists" };
        }

        to_track.push(tracking);
        trackings.push(tracking);

        await this.trackings.update({ trackings: to_track }, tracking.source);
        await this.users.update(
            { trackings: trackings },
            `${tracking.user_id}`
        );
        return {
            status: "added",
            all_trackings: to_track,
            user_trackings: trackings,
        }; // returns all the trackings.
    }

    async removeTracking(source, tracking_id, user_id) {
        let to_track = await this.getTrackings(source);
        let trackings = await this.getUserTrackings(`${user_id}`);

        let to_track_exists = to_track.some(
            (e) =>
                e.user_id === user_id &&
                e.tracking_id === tracking_id &&
                e.source === source
        );

        let trackings_exists = trackings.some(
            (e) =>
                e.user_id === user_id &&
                e.tracking_id === tracking_id &&
                e.source === source
        );

        if (!to_track_exists && !trackings_exists)
            return {
                status: "not found",
            };

        if (to_track_exists) {
            const index = to_track.findIndex(
                (e) =>
                    e.user_id === user_id &&
                    e.tracking_id === tracking_id &&
                    e.source === source
            );
            to_track.splice(index, 1);
            await this.trackings.update({ trackings: to_track }, source);
        }

        // user's db
        if (trackings_exists) {
            const index = trackings.findIndex(
                (e) =>
                    e.user_id === user_id &&
                    e.tracking_id === tracking_id &&
                    e.source === source
            );
            trackings.splice(index, 1);
            await this.users.update({ trackings: trackings }, `${user_id}`);
        }

        return {
            status: "removed",
            all_trackings: to_track,
            user_trackings: trackings,
        };
    }

    async updateTracking(tracking) {
        let to_track = await this.getTrackings(tracking.source);
        let trackings = await this.getUserTrackings(`${tracking.user_id}`);

        let to_track_exists = to_track.some(
            (e) =>
                e.user_id === tracking.user_id &&
                e.tracking_id === tracking.tracking_id &&
                e.source === tracking.source
        );

        let trackings_exists = trackings.some(
            (e) =>
                e.user_id === tracking.user_id &&
                e.tracking_id === tracking.tracking_id &&
                e.source === tracking.source
        );

        if (to_track_exists) {
            const index = to_track.findIndex(
                (e) =>
                    e.user_id === tracking.user_id &&
                    e.tracking_id === tracking.tracking_id &&
                    e.source === tracking.source
            );
            to_track.splice(index, 1, tracking);
            await this.trackings.update(
                { trackings: to_track },
                tracking.source
            );
        }

        if (trackings_exists) {
            const index = trackings.findIndex(
                (e) =>
                    e.user_id === tracking.user_id &&
                    e.tracking_id === tracking.tracking_id &&
                    e.source === tracking.source
            );
            trackings.splice(index, 1, tracking);
            await this.users.update(
                { trackings: trackings },
                `${tracking.user_id}`
            );
        }
        return {
            status: "updated",
            all_trackings: to_track,
            user_trackings: trackings,
        };
    }

    async writeUser(user) {
        await this.getUser(user.id).catch(() => {
            this.users.put({
                key: `${user.id}`,
                trackings: [],
                user_id: `${user.id}`,
                username: `${user.username}`,
            });
        });
    }
}

module.exports = { DetaDB };
