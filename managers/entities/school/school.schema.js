const schoolSchema = [
  {
    model: "text",
    path: "name",
    required: true,
  },
    {
      model: "text",
      path: "address",
      required: true,
    },
    {
      model: "text",
      path: "phone",
      required: true,
    },
];

const schoolIdSchema = [
  {
    model: "text",
    path: "id",
    required: true,
  },
];

module.exports = {
  createSchool: schoolSchema,
  getSchool: schoolIdSchema,
  updateSchool: [
    ...schoolSchema,
    ...schoolIdSchema,
  ],
  deleteSchool: schoolIdSchema,
};
