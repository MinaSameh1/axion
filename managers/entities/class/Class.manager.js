const getSelfHandleResponse = require("../../api/_common/getSelfResponse");

module.exports = class Class {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.validators         = validators;
    this.cache              = cache;
    this.shark              = managers.shark;
    this.oyster             = oyster;
    this.responseDispatcher = managers.responseDispatcher;
    this._label             = "classs";
    this.httpExposed        = [
      "createClass",
      "get=getClass",
      "delete=deleteClass",
      "put=updateClass",
    ];
  }

  async #getUser({ userId }) {
    const user = await this.oyster.call("get_block", `user:${userId}`);
    if (!user || Object.keys(user).length === 0) {
      return { error: "Invalid Token" };
    }
    return user;
  }

  async #checkPermission({ userId, action, nodeId = "board.school.class" }) {
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return {error: "User role not found"};
    }

    const canDoAction = await this.shark.isGranted({
      layer: "board.school.class",
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return {error: canDoAction ? undefined : "Permission denied"};
  }

  async createClass({ name, schoolId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateClass = await this.#checkPermission({
      userId,
      action: "create",
    });

    if (canCreateClass.error) {
      return canCreateClass;
    }

    const toCreateClass = { name, schoolId };

    // Data validation
    let result = await this.validators.class.createClass(toCreateClass);

    if (result) return result;

    // Creation Logic
    const created = await this.oyster.call("add_block", {
      ...toCreateClass,
      _label: this._label,
    });

    await this.oyster.call("update_relations", {
      _id: schoolId,
      _members: [created._id]
    })

    if (created.error) {
      if (created.error.includes("already exists")) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: "Name already exists",
        });
        return getSelfHandleResponse();
      }
      console.error("Failed to create class", created.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create class",
      });
      return getSelfHandleResponse();
    }

    // Response
    return created;
  }

  async getClass({ __token, __query, res }) {
    const { userId } = __token;

    // Permission check 
    const canGetClass = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetClass.error) {
      return canGetClass
    }

    const { id } = __query;
    // Data validation
    let result = await this.validators.class.getClass({ id });

    if (result) return result;

    let findClass = {};
    if (id.includes("classs:")) {
      findClass = await this.oyster.call("get_block", id);
    } else findClass = await this.oyster.call("get_block", `${this._label}:${id}`);

    // Check if exists
    if (!findClass || Object.keys(findClass).length === 0) {
      this.responseDispatcher.dispatch(res, { code: 404, message: "Class not found" });
      return getSelfHandleResponse();
    }

    // Response
    return findClass;
  }

  async updateClass({ id, name, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateClass = await this.#checkPermission({
      userId,
      action: "update",
    });

    if (canUpdateClass.error) {
      return canUpdateClass;
    }

    const toUpdateClass = { name };

    // Data validation
    let result = await this.validators.class.updateClass(toUpdateClass);

    if (result) return result;

    // Creation Logic
    const updatedClass = await this.oyster.call("update_block", {
      ...toUpdateClass,
      _id: id,
      _label: this._label,
    });

    if (updatedClass.error) {
      console.error("Failed to update class", updatedClass.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to update class",
      });
      return getSelfHandleResponse();
    }

    // Response
    return updatedClass
  }

  async deleteClass({ __token, __query, res }) {
    const { userId } = __token;
    // Permission check
    const canDeleteClass = await this.#checkPermission({
      userId,
      action: "delete",
    });

    if (canDeleteClass.error) {
      return canDeleteClass;
    }

    // Data validation
    let result = await this.validators.class.getClass(__query);
    if (result) return result;

    const { id } = __query;
    const deletedClass = await this.oyster.call("delete_block", id);
    if (deletedClass.error) {
      console.error("Failed to delete class", deletedClass.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to delete class",
      });
      return getSelfHandleResponse();
    }

    // Response
    return deletedClass;
  }
};
