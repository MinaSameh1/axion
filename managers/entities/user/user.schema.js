module.exports = {
  createUser: [
    {
      model: "username",
      required: true,
    },
    {
      model: "email",
      path: "email",
      required: true,
    },
    {
      model: "password",
      required: true,
    }
  ],
  getUser: [
    {
      model: "id",
      required: true,
    },
  ],
};
