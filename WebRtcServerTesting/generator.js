const faker = require('faker');

module.exports.getSignUpData = (userContext, events, done) => {
    userContext.vars.signUpData = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        UUID: faker.random.uuid()
    };
    userContext.vars.name = userContext.vars.signUpData.name;
    userContext.vars.email = userContext.vars.signUpData.email;
    userContext.vars.UUID = userContext.vars.signUpData.UUID;
    done();
};

module.exports.getLoginData = (userContext, events, done) => {
    userContext.vars.LoginData = {
        name: userContext.vars.name,
        email: userContext.vars.email,
        pid: userContext.vars.pid,
        UUID: userContext.vars.UUID
    }
    done();
};