const getSelfHandleResponse = require("../../api/_common/getSelfResponse");

module.exports = class Student {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.validators         = validators;
    this.cache              = cache;
    this.shark              = managers.shark;
    this.oyster             = oyster;
    this.responseDispatcher = managers.responseDispatcher;
    this._label             = "students";
    this.httpExposed        = [
      "createStudent",
      "get=getStudent",
      "delete=deleteStudent",
      "put=updateStudent",
    ];
  }

  async #getUser({ userId }) {
    const user = await this.oyster.call("get_block", `user:${userId}`);
    if (!user || Object.keys(user).length === 0) {
      return { error: "Invalid Token" };
    }
    return user;
  }

  async #checkPermission({
    userId,
    action,
    nodeId = "board.school.class.student",
  }) {
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    const canDoAction = await this.shark.isGranted({
      layer: "board.school.class.student",
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return { error: canDoAction ? undefined : "Permission denied" };
  }

  async createStudent({ name, classId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateStudent = await this.#checkPermission({
      userId,
      action: "create",
    });

    if (canCreateStudent.error) {
      return canCreateStudent;
    }

    const toCreateStudent = { name, classId };

    // Data validation
    let result = await this.validators.student.createStudent(toCreateStudent);

    if (result) return result;

    // Creation Logic
    const created = await this.oyster.call("add_block", {
      ...toCreateStudent,
      _label: this._label,
    });

    if (created.error) {
      console.error("Failed to create student", created.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to create student",
      });
      return getSelfHandleResponse();
    }

    // Response
    return created;
  }

  async getStudent({ __token, __query, res }) {
    const { userId } = __token;

    // Permission check
    const canGetStudent = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetStudent.error) {
      return canGetStudent;
    }

    const { id } = __query;
    // Data validation
    let result = await this.validators.student.getStudent({ id });

    if (result) return result;

    let student = {};
    if (id.includes("students:")) {
      student = await this.oyster.call("get_block", id);
    } else
      student = await this.oyster.call("get_block", `${this._label}:${id}`);

    // Check if exists
    if (!student || Object.keys(student).length === 0) {
      this.responseDispatcher.dispatch(res, {
        code: 404,
        message: "student not found",
      });
      return getSelfHandleResponse();
    }

    // Response
    return student;
  }

  async updateStudent({ id, name, classId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateStudent = await this.#checkPermission({
      userId,
      action: "update",
    });

    if (canUpdateStudent.error) {
      return canUpdateStudent;
    }

    const toUpdateStudent = { name, classId };

    // Data validation
    let result = await this.validators.student.updateStudent({
      ...toUpdateStudent,
      id,
    });

    if (result) return result;

    // Creation Logic
    const updatedStudent = await this.oyster.call("update_block", {
      ...toUpdateStudent,
      _id: id,
      _label: this._label,
    });

    if (updatedStudent.error) {
      console.error("Failed to update student", updatedStudent.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to update student",
      });
      return getSelfHandleResponse();
    }

    // Response
    return updatedStudent;
  }

  async deleteStudent({ __token, __query, res }) {
    const { userId } = __token;
    // Permission check
    const canDeleteStudent = await this.#checkPermission({
      userId,
      action: "delete",
    });

    if (canDeleteStudent.error) {
      return canDeleteStudent;
    }

    // Data validation
    let result = await this.validators.student.getStudent(__query);
    if (result) return result;

    const { id } = __query;
    const deletedStudent = await this.oyster.call("delete_block", id);
    if (deletedStudent.error) {
      console.error("Failed to delete student", deletedStudent.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: "Failed to delete student",
      });
      return getSelfHandleResponse();
    }

    // Response
    return deletedStudent;
  }
};
