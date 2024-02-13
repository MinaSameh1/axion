const {describe,it,before} = require("node:test");
const assert               = require("node:assert");
const SchoolManager        = require("./School.manager");
const config               = require("../../../config/index.config.js");
const ValidatorsLoader     = require("../../../loaders/ValidatorsLoader");
const Oyster               = require("oyster-db");

// Setup the environment
const validatorsLoader     = new ValidatorsLoader({
  models: require("../../_common/schema.models"),
  customValidators: require("../../_common/schema.validators"),
});
const oyster               = new Oyster({
  url: config.dotEnv.OYSTER_REDIS,
  prefix: config.dotEnv.OYSTER_PREFIX,
});

describe("School", async () => {
  let schoolManager;

  const users = [
    {
      username: "mina",
      email: "super@mail.com",
      password: "12345678",
      role: "superadmin",
      _id: "user:super@mail.com",
      _label: "user",
    },
    {
      username: "mina",
      email: "admin@mail.com",
      password: "12345678",
      role: "admin",
      _id: "user:admin@mail.com",
      _label: "user",
    },
  ];

  before(async () => {
    const validators = validatorsLoader.load();

    for (const user of users) {
      await oyster.call("add_block", user);
    }

    schoolManager = new SchoolManager({
      oyster,
      validators,
      managers: {
        shark: {
          // Mock the isGranted method
          isGranted: ({ role }) => {
            return role === "superadmin";
          },
        },
        responseDispatcher: {
          dispatch: () => {},
        },
      },
    });
  });

  describe("createSchool", async () => {
    it("should create a valid school", async () => {
      const school = {
        name: "School",
        address: "1234 Main St",
        phone: "+212345678910",
      };
      const res = await schoolManager.createSchool({
        ...school,
        __token: { userId: users[0]._id },
      });

      assert.strictEqual(res.length, undefined);
      assert.strictEqual(res.error, undefined);
      assert.deepStrictEqual(
        {
          ...res,
          _id: undefined,
        },
        {
          ...school,
          _id: undefined,
          _label: "schools",
        },
      );
      return;
    });

    it("should not allow admin to create", async () => {
      const school = {
        name: "School",
        address: "1234 Main St",
        phone: "+212345678910",
      };
      const res = await schoolManager.createSchool({
        ...school,
        __token: { userId: users[1]._id },
      });

      assert.strictEqual(res.error, "Permission denied");
      return;
    });
  });
});
