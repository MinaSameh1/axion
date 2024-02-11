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
    this.responseDispatcher = managers.responseDispatcher;
    this.usersCollection = "users";
    this.httpExposed = ["createUser", "getUser"];
  }

  async createUser({ username, email, password, res }) {
    const user = { username, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    // Create user in db
    const createdUser = await this.oyster.call("add_block", {
      ...user,
      _id: user.email,
      __label: "user",
      __collection: this.usersCollection,
    });

    if (createdUser.error) {
      if (createdUser.error.includes("already exists")) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: "Email already exists",
        });
        return {
          selfHandleResponse: true,
        };
      }
      console.error("Failed to create user", createdUser.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create user",
      });
      return {
        selfHandleResponse: true,
      };
    }

    let longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
      userKey: createdUser.key,
    });

    // Response
    return {
      user: createdUser,
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
      this.responseDispatcher.dispatch(res, {
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
