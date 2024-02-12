const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();

module.exports = class SchoolServer {
  constructor({ config, managers }) {
    this.config = config;
    this.schoolApi = managers.schoolApi;
  }

  /** for injecting middlewares */
  use(args) {
    app.use(args);
  }

  /** server configs */
  run() {
    app.use(cors({ origin: "*" }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/static", express.static("public"));

    /** an error handler */
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send("Something broke!");
    });

    /** a single middleware to handle all */
    app.all("/api/:moduleName/:fnName", this.schoolApi.mw);

    /**
     *  @type {number} port
     */
    const port = Number(this.config.dotEnv.SCHOOL_PORT);
    let server = http.createServer(app);
    server.listen(port, () => {
      console.log(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} is running on port: ${port}`,
      );
    });
  }
};
