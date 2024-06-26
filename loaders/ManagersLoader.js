const MiddlewaresLoader     = require('./MiddlewaresLoader');
const ApiHandler            = require("../managers/api/Api.manager");
const LiveDB                = require('../managers/live_db/LiveDb.manager');
const ResponseDispatcher    = require('../managers/response_dispatcher/ResponseDispatcher.manager');
const VirtualStack          = require('../managers/virtual_stack/VirtualStack.manager');
const ValidatorsLoader      = require('./ValidatorsLoader');
const ResourceMeshLoader    = require('./ResourceMeshLoader');
const utils                 = require('../libs/utils');

const systemArch            = require('../static_arch/main.system');
const TokenManager          = require('../managers/token/Token.manager');
const SharkFin              = require('../managers/shark_fin/SharkFin.manager');
const TimeMachine           = require('../managers/time_machine/TimeMachine.manager');

// Custom Managers
const Hasher                = require('../managers/hasher/Hasher.manager');
const User                  = require('../managers/entities/user/User.manager');
const School                = require('../managers/entities/school/School.manager');
const Class                 = require('../managers/entities/class/Class.manager');
const Student               = require('../managers/entities/student/Student.manager');

// Servers
const UserServer            = require('../managers/http/UserServer.manager');

/** 
 * load sharable modules
 * @return modules tree with instance of each module
*/
module.exports = class ManagersLoader {
    constructor({ config, cortex, cache, oyster, aeon }) {

        this.managers   = {};
        this.config     = config;
        this.cache      = cache;
        this.cortex     = cortex;
        
        this._preload();
        this.injectable = {
            utils,
            cache, 
            config,
            cortex,
            oyster,
            aeon,
            managers: this.managers, 
            validators: this.validators,
            // mongomodels: this.mongomodels,
            resourceNodes: this.resourceNodes,
        };
        
    }

    _preload(){
        const validatorsLoader    = new ValidatorsLoader({
            models: require('../managers/_common/schema.models'),
            customValidators: require('../managers/_common/schema.validators'),
        });
        const resourceMeshLoader  = new ResourceMeshLoader({})
        // const mongoLoader      = new MongoLoader({ schemaExtension: "mongoModel.js" });

        this.validators           = validatorsLoader.load();
        this.resourceNodes        = resourceMeshLoader.load();
        // this.mongomodels          = mongoLoader.load();

    }

    load() {
        this.managers.responseDispatcher = new ResponseDispatcher();
        this.managers.liveDb             = new LiveDB(this.injectable);
        const middlewaresLoader          = new MiddlewaresLoader(this.injectable);
        const mwsRepo                    = middlewaresLoader.load();
        const { layers, actions }        = systemArch;
        this.injectable.mwsRepo          = mwsRepo;
        /*****************************************CUSTOM MANAGERS*****************************************/
        this.managers.shark              = new SharkFin({ ...this.injectable, layers, actions });
        this.managers.timeMachine        = new TimeMachine(this.injectable);
        this.managers.token              = new TokenManager(this.injectable);
        this.managers.hasher             = new Hasher(this.injectable);
        // Two approaches, either create a new server for each item, or create an 
        // Api entity manager. For now follow the same structure don't add a new server
        this.managers.user               = new User({ ...this.injectable, managers: this.managers });
        this.managers.school             = new School({ ...this.injectable, managers: this.managers });
        this.managers.class              = new Class({ ...this.injectable, managers: this.managers });
        this.managers.student            = new Student({ ...this.injectable, managers: this.managers });
        /*************************************************************************************************/
        this.managers.mwsExec            = new VirtualStack({ ...{ preStack: ['__log', '__device'] }, ...this.injectable });
        this.managers.userApi            = new ApiHandler({...this.injectable,...{prop:'httpExposed'}});
        this.managers.userServer         = new UserServer({ config: this.config, managers: this.managers });
       
        return this.managers;

    }

}

