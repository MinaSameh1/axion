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
    this.oyster = oyster;
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.tokenManager = managers.token;
    this.managers = managers;
    this.httpExposed = ["createUser", "getUser", "loginUser"];
    this._label = "user";
  }

  async createUser({ username, email, password, res }) {
    const user = { username, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    // Create user in db, should hash password? No hashing for now
    const createdUser = await this.oyster.call("add_block", {
      ...user,
      role: "user",
      _id: user.email,
      _label: this._label,
    });

    if (createdUser.error) {
      if (createdUser.error.includes("already exists")) {
        this.managers.responseDispatcher.dispatch(res, {
          code: 409,
          message: "Email already exists",
        });
        return {
          selfHandleResponse: true,
        };
      }
      console.error("Failed to create user", createdUser.error);
      this.managers.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create user",
      });
      return {
        selfHandleResponse: true,
      };
    }

    let longToken = this.tokenManager.genLongToken({
      userId: createdUser.email,
      userKey: createdUser.key,
    });

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
      this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return {
        selfHandleResponse: true,
      };
    }

    // Compare password
    if (user.password !== password) {
      this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        message: "Invalid password",
      });
      return {
        selfHandleResponse: true,
      };
    }

    // Generate long token
    const longToken = this.tokenManager.genLongToken({
      userId: user.email,
      userKey: user.key,
    });

    // Response
    return {
      user,
      longToken,
    };
  }

  async getUser({ id, res }) {
    // Data validation
    const result = await this.validators.user.getUser({ id });
    if (result) return result;
    // Get users from db
    const user = await this.oyster.call("get_block", id);

    // Handle Not Found
    if (!user || Object.keys(user).length === 0) {
      this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return {
        selfHandleResponse: true,
      };
    }
    return user;
  }
};
