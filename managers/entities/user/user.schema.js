// Common Schemas
const password = {
  model: "password",
  path: "password",
  required: true,
};
const email = {
  model: "email",
  path: "email",
  required: true,
};

module.exports = {
  createUser: [
    {
      model: "username",
      path: "username",
      required: true,
    },
    email,
    password,
  ],
  loginUser: [email, password],
  getUser: [
    {
      model: "id",
      required: true,
    },
  ],
};
