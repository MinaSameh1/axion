const getSelfHandleResponse  = require('../../api/_common/getSelfResponse')

module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    oyster,
  } = {}) {
    this.oyster             = oyster;
    this.config             = config;
    this.cortex             = cortex;
    this.validators         = validators;
    this.tokenManager       = managers.token;
    this.responseDispatcher = managers.responseDispatcher;
    this.shark              = managers.shark;
    this.httpExposed        = ["createUser", "getUser", "loginUser"];
    this._label             = "user";
  }


  async #setupPermissions({ role, userId }) {
    if(role === "superadmin") {
      this.shark.addDirectAccess({ userId, nodeId: "school", action: "read" });
      this.shark.addDirectAccess({ userId, nodeId: "school", action: "create" });
      this.shark.addDirectAccess({ userId, nodeId: "school", action: "update" });
      this.shark.addDirectAccess({ userId, nodeId: "school", action: "delete" });
    } else if (role === "admin") {
      this.shark.addDirectAccess({ userId, nodeId: "school", action: "read" });
      this.shark.addDirectAccess({ userId, nodeId: "classroom", action: "read" });
      this.shark.addDirectAccess({ userId, nodeId: "classroom", action: "create" });
      this.shark.addDirectAccess({ userId, nodeId: "classroom", action: "update" });
      this.shark.addDirectAccess({ userId, nodeId: "classroom", action: "delete" });
      this.shark.addDirectAccess({ userId, nodeId: "student", action: "read" });
      this.shark.addDirectAccess({ userId, nodeId: "student", action: "create" });
      this.shark.addDirectAccess({ userId, nodeId: "student", action: "update" });
      this.shark.addDirectAccess({ userId, nodeId: "student", action: "delete" });
    }
  }

  async createUser({ username, email, password, role, res }) {
    const user = { username, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    // Create user in db, should hash password? No hashing for now
    const createdUser = await this.oyster.call("add_block", {
      ...user,
      role: role || "user",
      _id: user.email,
      _label: this._label,
    });

    if (createdUser.error) {
      if (createdUser.error.includes("already exists")) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: "Email already exists",
        });
        return getSelfHandleResponse();
      }
      console.error("Failed to create user", createdUser.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create user",
      });
      return getSelfHandleResponse();
    }
    await this.#setupPermissions({ role, userId: createdUser.email });

    let longToken = this.tokenManager.genLongToken({ userId: createdUser.email, userKey: createdUser.key });

    const { password: _password, ...userWithoutPassword } = createdUser;

    // Response
    return {
      user: userWithoutPassword,
      longToken,
    };
  }

  async loginUser({ email, password, res }) {
    // Data validation
    const result = await this.validators.user.loginUser({ email, password });
    if (result) return result;

    // Get user from db
    const user = await this.oyster.call("get_block", `${this._label}:${email}`);
    if (!user || Object.keys(user).length === 0) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return getSelfHandleResponse();
    }

    // Compare password
    if (user.password !== password) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        message: "Invalid password",
      });
      return getSelfHandleResponse();
    }

    // Generate long token
    const longToken = this.tokenManager.genLongToken({
      userId: user.email,
      userKey: user.key,
    });

    // Response
    return { user, longToken };
  }

  async getUser({ id, res }) {
    // Data validation
    const result = await this.validators.user.getUser({ id });
    if (result) return result;
    // Get users from db
    const user = await this.oyster.call("get_block", id);

    // Handle Not Found
    if (!user || Object.keys(user).length === 0) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return getSelfHandleResponse();
    }
    return user;
  }
};
