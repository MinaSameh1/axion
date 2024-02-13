## Docs

- [Postman Collection](https://drive.google.com/file/d/1dKrOEzeFHzwTySAuipxoFgJR4DUxA8Ov/view?usp=sharing)

### Users

| endpoint                       | method | brief Description                                                                              |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| /api/token/v1_createShortToken | POST   | Creates an Access token (Long tokens are refresh tied to device while short are access tokens) |
| /api/user/createUser           | POST   | Creates a user with any role you want (Secuirty amirite)                                       |
| /api/user/loginUser            | POST   | Login                                                                                          |
| /api/user/getUser/             | POST   | Gets user using ID                                                                             |

### School

| endpoint                 | method | brief Description                                                                        |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| /api/school/createSchool | POST   | Creates school, must supply name, address and phone. Only super admin can create schools |
| /api/school/updateSchool | PUT    | Updates school, must supply everything along ID                                          |
| /api/school/getSchool    | GET    | Gets one school. ID is passed as a query. Admin can view only                            |
| /api/school/deleteSchool | DELETE | Deletes one school. ID is passed as a query                                              |

### Class

| endpoint               | method | brief Description                                                           |
| ---------------------- | ------ | --------------------------------------------------------------------------- |
| /api/class/createClass | POST   | Creates class, must supply name, and schoolId. Only admin can create classs |
| /api/class/updateClass | PUT    | Updates class, must supply everything along ID                              |
| /api/class/getClass    | GET    | Gets one class. ID is passed as a query                                     |
| /api/class/deleteClass | DELETE | Deletes one class. ID is passed as a query                                  |

### Student

| endpoint                   | method | brief Description                                                                          |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| /api/student/createStudent | POST   | Creates student, must supply name, and classId. Only admin can create students |
| /api/student/updateStudent | PUT    | Updates student, must supply everything along ID                                           |
| /api/student/getStudent    | GET    | Gets one student. ID is passed as a query                                                  |
| /api/student/deleteStudent | DELETE | Deletes one student. ID is passed as a query                                               |

## Resources

- [Oyster Db](https://www.npmjs.com/package/oyster-db?activeTab=code)
