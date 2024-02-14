const getSelfHandleResponse = require("../../api/_common/getSelfResponse");

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
    this.utils              = utils;
    this.oyster             = oyster;
    this.config             = config;
    this.cortex             = cortex;
    this.validators         = validators;
    this.tokenManager       = managers.token;
    this.responseDispatcher = managers.responseDispatcher;
    this.shark              = managers.shark;
    this.httpExposed        = ["createUser", "getUser", "loginUser", "deleteUser"];
    this._label             = "user";
  }

  async #setPermission({ userId, role }) {
    const addDirectAccess = ({ nodeId, layer, action }) => {
      return this.shark.addDirectAccess({
        userId,
        nodeId,
        layer,
        action,
      });
    };

    const lookupTable = {
      admin: async () => {
        const items = [
          {
            nodeId: "board.school",
            layer: "board.school",
            action: "read",
          },
          {
            nodeId: "board.school.class",
            layer: "board.school.class",
            action: "delete",
          },
          {
            nodeId: "board.school.class.student",
            layer: "board.school.class.student",
            action: "update",
          },
        ];
        for (const item of items) {
          await addDirectAccess(item);
        }
      },
      superadmin: async () => {
        const items = [
          {
            nodeId: "board.school",
            layer: "board.school",
            action: "delete",
          },
          {
            nodeId: "board.school.class",
            layer: "board.school.class",
            action: "read",
          },
        ];
        for (const item of items) {
          await addDirectAccess(item);
        }
      },
    };

    if (lookupTable[role]) {
      await lookupTable[role]();
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

    this.#setPermission({ userId: createdUser.email, role: createdUser.role });
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
    if (!user || this.utils.isEmptyObject(user)) {
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

    const {password: _password, ...userWithoutPassword} = user;

    // Response
    return { user: userWithoutPassword, longToken };
  }

  async getUser({ id, res }) {
    // Data validation
    const result = await this.validators.user.getUser({ id });
    if (result) return result;
    // Get users from db
    const user = await this.oyster.call("get_block", id);

    // Handle Not Found
    if (!user || this.utils.isEmptyObject(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return getSelfHandleResponse();
    }
    return user;
  }

  async deleteUser({ id, res }) {

    const user = await this.oyster.call("get_block", id);

    // Handle Not found
    if (!user || this.utils.isEmptyObject(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return getSelfHandleResponse();
    }

    // Delete user from db
    const deletedUser = await this.oyster.call("delete_block", id);

    // Handle Not Found
    if (deletedUser.ok) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "User not found",
      });
      return getSelfHandleResponse();
    }

    // Response
    return { deleted: deletedUser };
  }
};
