const layers = {
  board: {
    /** all board are public by default */
    _default: { anyoneCan: "read", ownerCan: "audit" },
    _public: { anyoneCan: "create", ownerCan: "audit" },
    _private: { anyoneCan: "none" },
    _store: { anyoneCan: "read", noOneCan: "create" },

    school: {
      _default: { anyoneCan: "read" },
      _public: { anyoneCan: "none" },
      _private: { inherit: true },
      _store: { inherit: true },
      class: {
        _default: { inherit: true },
        _public: { inherit: true },
        _private: { inherit: true },
        _store: { inherit: true },

        student: {
            _default: { inherit: true },
            _public: { inherit: true },
            _private: { inherit: true },
            _store: { inherit: true },
        }
      },
    },
  }
};

const actions = {
  blocked: -1,
  none: 1,
  read: 2,
  create: 3,
  audit: 4,
  config: 5,
  delete: 6,
  update: 7,
};

module.exports = { layers, actions };
