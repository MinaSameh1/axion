const getSelfHandleResponse = require("../../api/_common/getSelfResponse");

module.exports = class School {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    oyster,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.tokenManager = managers.token;
    this.shark = managers.shark;
    this.oyster = oyster;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = "schools";
    this.httpExposed = [
      "createSchool",
      "get=getSchool",
      "delete=deleteSchool",
      "put=updateSchool",
    ];
  }

  async #getUser({ userId }) {
    const user = await this.oyster.call("get_block", `user:${userId}`);
    if (!user || Object.keys(user).length === 0) {
      return { error: "Invalid Token" };
    }
    return user;
  }

  async #checkPermission({ userId, role, action, nodeId = "board.school" }) {
    const canDoAction = await this.shark.isGranted({
      layer: "board.school",
      action,
      userId,
      nodeId,
      role,
    });
    return canDoAction;
  }

  async createSchool({ name, address, phone, __token, res }) {
    const { userId } = __token;
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    // Permission check
    const canCreateSchool = await this.#checkPermission({
      userId,
      role: user.role,
      action: "create",
    });

    if (!canCreateSchool) {
      return { error: "Permission denied" };
    }

    const school = { name, address, phone };

    // Data validation
    let result = await this.validators.school.createSchool(school);

    if (result) return result;

    // Creation Logic
    const createdSchool = await this.oyster.call("add_block", {
      ...school,
      _label: this._label,
    });

    if (createdSchool.error) {
      if (createdSchool.error.includes("already exists")) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: "Name already exists",
        });
        return getSelfHandleResponse();
      }
      console.error("Failed to create school", createdSchool.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create school",
      });
      return getSelfHandleResponse();
    }

    // Response
    return { school: createdSchool };
  }

  async getSchool({ __token, __query, res }) {

    const { userId } = __token;

    const user = await this.#getUser({ userId });

    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    // Permission check 
    const canGetSchool = await this.#checkPermission({
      userId,
      role: user.role,
      action: "read",
    });

    if (!canGetSchool) {
      return { error: "Permission denied" };
    }

    const { id } = __query;
    // Data validation
    let result = await this.validators.school.getSchool({ id });

    if (result) return result;

    let school = {};
    if (id.includes("school:")) {
      school = await this.oyster.call("get_block", id);
    } else school = await this.oyster.call("get_block", `school:${id}`);

    // Check if school exists
    if (!school || Object.keys(school).length === 0) {
      this.responseDispatcher.dispatch(res, { code: 404, message: "School not found" });
      return getSelfHandleResponse();
    }

    // Response
    return school;
  }

  async updateSchool({ id, name, address, phone, __token, res }) {
    const { userId } = __token;
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    // Permission check
    const canUpdateSchool = await this.#checkPermission({
      userId,
      role: user.role,
      action: "update",
    });

    if (!canUpdateSchool) {
      return { error: "Permission denied" };
    }

    const school = { name, address, phone, id };

    // Data validation
    let result = await this.validators.school.updateSchool(school);

    if (result) return result;

    // Creation Logic
    const createdSchool = await this.oyster.call("update_block", {
      ...school,
      _id: id,
      _label: this._label,
    });

    if (createdSchool.error) {
      console.error("Failed to update school", createdSchool.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to update school",
      });
      return getSelfHandleResponse();
    }

    // Response
    return {
      school: createdSchool,
    };
  }

  async deleteSchool({ __token, __query, res }) {
    const { userId } = __token;
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    // Permission check
    const canDeleteSchool = await this.#checkPermission({
      userId,
      role: user.role,
      action: "delete",
    });

    if (!canDeleteSchool) {
      return { error: "Permission denied" };
    }

    // Data validation
    let result = await this.validators.school.getSchool(__query);
    if (result) return result;

    const { id } = __query;
    const school = await this.oyster.call("delete_block", id);
    if (school.error) {
      console.error("Failed to delete school", school.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to delete school",
      });
      return getSelfHandleResponse();
    }

    // Response
    return {
      school,
    };
  }
};
