module.exports = class School {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.tokenManager = managers.token;
    this.shark = managers.shark;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = "schools";
    this.schoolExposed = ["createSchool"];
  }

  async createSchool({ name, address, phone, userId }) {
    // Permission check
    const canCreateSchool = await this.shark.isGranted(
      {
        layer: "school",
        action: "create",
        userId,
        nodeId: "board.school",
        isOwner: false,
      }
    );

    if (!canCreateSchool) {
      return { error: "Permission denied" };
    }

    const school = { name, address, phone };


    // Data validation
    let result = await this.validators.school.createSchool(school);

    if (result) return result;

    // Creation Logic

    // Response
    return {
      school: createdSchool,
    };
  }
};
