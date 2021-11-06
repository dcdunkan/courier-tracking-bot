const { Deta } = require("deta");

class DetaDB {
  constructor(project_key) {
    this.project_key = project_key;
    this.deta = new Deta(project_key);
  }

  async init() {
    // Creates/access bases.
    this.trackings = this.deta.Base("trackbot-notification-queue");
    this.users = this.deta.Base("trackbot-users");
    this.stats = this.deta.Base("index-data");

    // Puts some dummy data if the bases are empty.
    let trackings = await this.trackings.get("trackingmore");
    if (trackings == null) {
      this.trackings.putMany([
        { key: "trackingmore", trackings: [] },
        { key: "m.aftership", trackings: [] },
        { key: "aftership", trackings: [] },
      ]);
    }

    let users = await this.users.get("!");
    if (users === null) {
      this.users.put({
        key: "!",
        trackings: [],
        user_id: "",
        username: "",
      });
    }

    let stats = await this.stats.get("users");
    if (stats === null) {
      this.stats.putMany([
        { key: "users", total_users: 0, blocked_users: [] },
        { key: "trackings", total_tracked: 0, currently_tracking: 0 },
      ]);
    }
  }

  async getTrackings(source) {
    const { trackings } = await this.trackings.get(source);
    return trackings;
  }

  async getUser(userId) {
    return await this.users.get(String(userId));
  }

  async isUserBlocked(userId) {
    return ({ blocked } = await this.getUser(String(userId)));
  }

  async getUserTrackings(userId) {
    const { trackings } = await this.getUser(String(userId));
    return trackings;
  }

  async checkIfExists(tracking) {
    const all_trackings = await this.getTrackings(tracking.source);
    const user_trackings = await this.getUserTrackings(`${tracking.user_id}`);

    let all_trackings_exists = all_trackings.some(
      (e) =>
        e.user_id == tracking.user_id &&
        e.tracking_id == tracking.tracking_id &&
        e.source == tracking.source
    );

    let user_trackings_exists = user_trackings.some(
      (e) =>
        e.user_id == tracking.user_id &&
        e.tracking_id == tracking.tracking_id &&
        e.source == tracking.source
    );

    return {
      all_trackings_exists,
      all_trackings,
      user_trackings_exists,
      user_trackings,
    };
  }

  async addTracking(tracking) {
    const {
      all_trackings_exists,
      all_trackings,
      user_trackings_exists,
      user_trackings,
    } = await this.checkIfExists(tracking);

    if (!all_trackings_exists) {
      all_trackings.push(tracking);
      await this.trackings.update(
        { trackings: all_trackings },
        tracking.source
      );
    }

    if (!user_trackings_exists) {
      user_trackings.push(tracking);
      await this.users.update(
        { trackings: user_trackings },
        `${tracking.user_id}`
      );
    }

    if (all_trackings_exists || user_trackings_exists) {
      return { status: "exists" };
    }

    await this.stats.update(
      {
        currently_tracking: this.stats.util.increment(),
      },
      "trackings"
    );
    return {
      status: "added",
      all_trackings,
      user_trackings,
    };
  }

  async removeTracking(args) {
    const {
      all_trackings_exists,
      all_trackings,
      user_trackings_exists,
      user_trackings,
    } = await this.checkIfExists(args);

    if (!all_trackings_exists && !user_trackings_exists) {
      return {
        status: "not found",
      };
    }

    if (all_trackings_exists) {
      const index = all_trackings.findIndex(
        (e) =>
          e.user_id === args.user_id &&
          e.tracking_id === args.tracking_id &&
          e.source === args.source
      );
      all_trackings.splice(index, 1);
      await this.trackings.update({ trackings: all_trackings }, args.source);
    }

    // user's db
    if (user_trackings_exists) {
      const index = user_trackings.findIndex(
        (e) =>
          e.user_id === args.user_id &&
          e.tracking_id === args.tracking_id &&
          e.source === args.source
      );
      user_trackings.splice(index, 1);
      await this.users.update({ trackings: user_trackings }, `${args.user_id}`);
    }

    await this.stats.update(
      {
        currently_tracking: this.stats.util.increment(-1),
        total_tracked: this.stats.util.increment(),
      },
      "trackings"
    );

    return {
      status: "removed",
      all_trackings,
      user_trackings,
    };
  }

  async updateTracking(tracking) {
    const {
      all_trackings_exists,
      all_trackings,
      user_trackings_exists,
      user_trackings,
    } = await this.checkIfExists(tracking);

    if (all_trackings_exists) {
      const index = all_trackings.findIndex(
        (e) =>
          e.user_id === tracking.user_id &&
          e.tracking_id === tracking.tracking_id &&
          e.source === tracking.source
      );
      all_trackings.splice(index, 1, tracking);
      await this.trackings.update(
        { trackings: all_trackings },
        tracking.source
      );
    }

    if (user_trackings_exists) {
      const index = user_trackings.findIndex(
        (e) =>
          e.user_id === tracking.user_id &&
          e.tracking_id === tracking.tracking_id &&
          e.source === tracking.source
      );
      user_trackings.splice(index, 1, tracking);
      await this.users.update(
        { trackings: user_trackings },
        `${tracking.user_id}`
      );
    }
    return {
      status: "updated",
      all_trackings,
      user_trackings,
    };
  }

  async writeUser(user) {
    await this.getUser(user.id).catch(async () => {
      this.users.put({
        key: `${user.id}`,
        trackings: [],
        user_id: `${user.id}`,
        username: `${user.username}`,
        blocked: false,
      });
      await this.stats.update(
        {
          total_users: this.stats.util.increment(),
        },
        "users"
      );
    });
  }

  async userBlocked(userId) {
    this.users.update(
      {
        blocked: true,
      },
      `${userId}`
    );
  }

  async userUnblocked(userId) {
    this.users.update(
      {
        blocked: false,
      },
      `${userId}`
    );
  }
}

module.exports = { DetaDB };
